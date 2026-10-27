import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createDocument, assertDocument, parseDocumentJSON, serializeDocument } from "../src/core/document";
import { applyCommand } from "../src/core/commands";
import { createSession, reduceSession } from "../src/core/session";
import { createWidget, getLayoutCSS, getLayoutValues } from "../src/editor/layout.js";
import { renderNode } from "../src/editor/PreviewNode.jsx";
import {
  DEFAULT_TOKENS, effectiveStyle, hasCustomizedTokens, hasStyleOverrides,
  mergedTokens, reactStyle, resolveToken, validateStyleEntry,
} from "../src/editor/designSystem.js";

function createDesignDocument() {
  let doc = createDocument();
  const root = doc.pages[0].rootId;
  doc = applyCommand(doc, { type: "insert", parentId: root, index: 0,
    node: createWidget("f03-container", "container") });
  doc = applyCommand(doc, { type: "insert", parentId: "f03-container", index: 0,
    node: createWidget("f03-button", "button") });
  return doc;
}
const style = (nodeId, breakpoint, key, value) => ({type:"setStyle",nodeId,breakpoint,key,value});

describe("F03: design tokens e compatibilidade", () => {
  it("documentos antigos da F01 sem tokens continuam válidos e round-trip", () => {
    const legacy = createDesignDocument();
    delete legacy.tokens;
    expect(assertDocument(legacy)).toBe(legacy);
    const next = parseDocumentJSON(serializeDocument(legacy));
    expect(next.tokens).toBeUndefined();
    expect(mergedTokens(next)).toEqual(DEFAULT_TOKENS);
  });

  it("altera a cor primária de todos os nós vinculados", () => {
    let doc = createDesignDocument();
    doc = applyCommand(doc, style("f03-button", "base", "background", "token:colorPrimary"));
    doc = applyCommand(doc, style("f03-container", "base", "background", "token:colorPrimary"));
    doc = applyCommand(doc, {type:"setToken", key:"colorPrimary", value:"#0055aa"});
    expect(reactStyle(doc.nodes["f03-button"], "mobile", doc).backgroundColor).toBe("#0055aa");
    expect(getLayoutCSS(doc.nodes["f03-container"], "mobile", doc).backgroundColor).toBe("#0055aa");
    expect(hasCustomizedTokens(doc)).toBe(true);
    expect(resolveToken("token:colorPrimary", doc)).toBe("#0055aa");
  });

  it("herda base -> tablet -> desktop, com possibilidade de remover override", () => {
    let doc = createDesignDocument();
    doc = applyCommand(doc, style("f03-container", "base", "padding", 12));
    doc = applyCommand(doc, style("f03-container", "tablet", "padding", 20));
    doc = applyCommand(doc, style("f03-container", "desktop", "padding", 32));
    expect(getLayoutValues(doc.nodes["f03-container"], "mobile", doc).padding).toBe(12);
    expect(getLayoutValues(doc.nodes["f03-container"], "tablet", doc).padding).toBe(20);
    expect(getLayoutValues(doc.nodes["f03-container"], "desktop", doc).padding).toBe(32);
    doc = applyCommand(doc, style("f03-container", "desktop", "padding", null));
    expect(getLayoutValues(doc.nodes["f03-container"], "desktop", doc).padding).toBe(20);
    expect(getLayoutValues(doc.nodes["f03-container"], "tablet", doc).padding).toBe(20);
  });

  it("não altera base quando editando outro dispositivo", () => {
    const initial = createDesignDocument();
    const next = applyCommand(initial, style("f03-button", "tablet", "fontSize", 24));
    expect(effectiveStyle(initial.nodes["f03-button"], "tablet").fontSize).toBeUndefined();
    expect(effectiveStyle(next.nodes["f03-button"], "tablet").fontSize).toBe(24);
    expect(effectiveStyle(next.nodes["f03-button"], "mobile").fontSize).toBeUndefined();
  });

  it("valida cores, tokens, medidas e enums antes de salvar", () => {
    const doc = createDesignDocument();
    expect(() => applyCommand(doc, {type:"setToken",key:"colorPrimary",value:"not-a-color"})).toThrow();
    expect(() => applyCommand(doc, {type:"setToken",key:"unknown",value:16})).toThrow();
    expect(() => applyCommand(doc, style("f03-button","base","background","url(javascript:evil)"))).toThrow();
    expect(() => applyCommand(doc, style("f03-button","tablet","padding",-100))).toThrow();
    expect(() => applyCommand(doc, style("f03-button","base","fontSize","token:colorPrimary"))).toThrow();
    expect(() => applyCommand(doc, style("f03-button","base","flexWrap","yes"))).toThrow();
    expect(validateStyleEntry("background","token:colorPrimary")).toBe(true);
    expect(validateStyleEntry("fontSize","token:fontBase")).toBe(true);
    expect(validateStyleEntry("background","token:fontBase")).toBe(false);
    expect(hasStyleOverrides(doc)).toBe(true); // container F02 já tem configurações base
  });

  it("undo/redo para tokens e overrides responsivos", () => {
    let session = createSession(createDesignDocument());
    session = reduceSession(session, {type:"commit",command:{type:"setToken",key:"colorPrimary",value:"#224466"}});
    session = reduceSession(session, {type:"commit",command:style("f03-button","desktop","radius",20)});
    expect(session.present.tokens.colorPrimary).toBe("#224466");
    expect(session.present.nodes["f03-button"].styles.desktop.radius).toBe(20);
    session = reduceSession(session, {type:"undo"});
    expect(session.present.nodes["f03-button"].styles.desktop).toBeUndefined();
    session = reduceSession(session, {type:"undo"});
    expect(session.present.tokens.colorPrimary).toBe(DEFAULT_TOKENS.colorPrimary);
    session = reduceSession(session, {type:"redo"});
    expect(session.present.tokens.colorPrimary).toBe("#224466");
  });

  it("renderização React incorpora overrides em folha", () => {
    const node = createWidget("button", "button");
    node.styles.base = { background:"token:colorPrimary", radius:22 };
    const html = renderToStaticMarkup(renderNode(node, reactStyle(node,"mobile",DEFAULT_TOKENS)));
    expect(html).toContain("background-color:#6d5dfc");
    expect(html).toContain("border-radius:22px");
  });
});
