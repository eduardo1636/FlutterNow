import { describe, expect, it } from "vitest";
import {
  createDocument, assertDocument, serializeDocument, parseDocumentJSON,
} from "../src/core/document";
import { applyCommand } from "../src/core/commands";
import { createSession, reduceSession } from "../src/core/session";
import {
  createWidget, isLayout, getLayoutCSS, getLayoutValues, findParentInfo, containsNode,
} from "../src/editor/layout.js";

function createScenario() {
  let doc = createDocument();
  const root = doc.pages[0].rootId;
  doc = applyCommand(doc, { type: "insert", parentId: root, index: 0,
    node: createWidget("main-container", "container") });
  doc = applyCommand(doc, { type: "insert", parentId: "main-container", index: 0,
    node: createWidget("flex-row", "row") });
  doc = applyCommand(doc, { type: "insert", parentId: "flex-row", index: 0,
    node: createWidget("left-col", "column") });
  doc = applyCommand(doc, { type: "insert", parentId: "flex-row", index: 1,
    node: createWidget("right-col", "column") });
  doc = applyCommand(doc, { type: "insert", parentId: "left-col", index: 0,
    node: createWidget("text-left", "heading") });
  doc = applyCommand(doc, { type: "insert", parentId: "right-col", index: 0,
    node: createWidget("text-right", "text") });
  return doc;
}

describe("F02 — layouts", () => {
  it("oferece opções de linha/coluna/container com estilos consistentes", () => {
    for (const type of ["column", "row", "container"]) {
      const node = createWidget("test-"+type, type);
      expect(isLayout(type)).toBe(true);
      expect(node.styles.base.padding).toBeGreaterThanOrEqual(0);
      expect(node.children).toEqual([]);
      const style = getLayoutCSS(node);
      expect(style.display).toBe("flex");
      expect(style.flexDirection).toBe(type === "row" ? "row" : "column");
    }
  });

  it("não classifica elementos folha como containers", () => {
    expect(isLayout("button")).toBe(false);
    expect(createWidget("title", "heading").props.text).toBeTruthy();
    expect(() => createWidget("unknown", "not-registered")).toThrow();
  });

  it("insere e valida hierarquias com vários níveis", () => {
    const doc = createScenario();
    assertDocument(doc);
    expect(doc.nodes["flex-row"].children).toEqual(["left-col","right-col"]);
    expect(doc.nodes["left-col"].children).toEqual(["text-left"]);
    expect(findParentInfo(doc, "text-left")).toEqual({ id: "left-col", index: 0 });
    expect(containsNode(doc, "main-container", "text-left")).toBe(true);
    expect(containsNode(doc, "left-col", "text-right")).toBe(false);
    expect(parseDocumentJSON(serializeDocument(doc))).toEqual(doc);
  });

  it("move de uma coluna à outra e não permite mover para descendente", () => {
    const doc = createScenario();
    const moved = applyCommand(doc, { type: "move", nodeId:"text-left", parentId:"right-col", index:1 });
    expect(moved.nodes["left-col"].children).toHaveLength(0);
    expect(moved.nodes["right-col"].children).toEqual(["text-right","text-left"]);
    expect(doc.nodes["left-col"].children).toEqual(["text-left"]);
    expect(() => applyCommand(moved, { type:"move",nodeId:"main-container",parentId:"left-col",index:0 }))
      .toThrow(/ciclo/);
    assertDocument(moved);
  });

  it("duplica uma subárvore com IDs novos para todos os descendentes", () => {
    const doc = createScenario();
    const copy = applyCommand(doc, { type:"duplicate", nodeId:"flex-row", newId:"flex-row-copy" });
    const original = copy.nodes["flex-row"];
    const duplicated = copy.nodes["flex-row-copy"];
    expect(duplicated.children).toHaveLength(2);
    expect(duplicated.children[0]).not.toBe(original.children[0]);
    expect(copy.nodes[duplicated.children[0]].children[0]).not.toBe("text-left");
    assertDocument(copy);
  });

  it("altera o estilo de um container sem afetar dados anteriores", () => {
    const doc=createScenario();
    const updated=applyCommand(doc, { type:"setStyle",nodeId:"main-container",
      breakpoint:"base",key:"background",value:"#232323" });
    expect(getLayoutValues(updated.nodes["main-container"]).background).toBe("#232323");
    expect(getLayoutValues(doc.nodes["main-container"]).background).not.toBe("#232323");
  });

  it("desfaz movimentação aninhada em uma única operação", () => {
    let session = createSession(createScenario());
    session = reduceSession(session,{type:"commit",command:{ type:"move",nodeId:"text-left",
      parentId:"right-col",index:1 }});
    expect(session.present.nodes["right-col"].children).toContain("text-left");
    session = reduceSession(session,{type:"undo"});
    expect(session.present.nodes["left-col"].children).toContain("text-left");
    session = reduceSession(session,{type:"redo"});
    expect(session.present.nodes["right-col"].children).toContain("text-left");
  });
});
