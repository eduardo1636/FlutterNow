import { describe, expect, it } from "vitest";
import fixture from "./fixtures/legacy-v01.json";
import {
  assertDocument, createDocument, migrateLegacy, parseDocumentJSON,
  serializeDocument, toLegacyProjection, SCHEMA_VERSION,
  CURRENT_STORAGE_KEY, LEGACY_STORAGE_KEY, LEGACY_BACKUP_KEY,
} from "../src/core/document";
import { applyCommand } from "../src/core/commands";
import { createSession, reduceSession, HISTORY_LIMIT } from "../src/core/session";
import { loadStoredDocument, saveStoredDocument } from "../src/core/persistence";

const makeNode = (id, type = "text") => ({
  id, type,
  props: type === "text" ? { text: id, fontSize: 15, color: "#64748b", align: "left" } : {},
  styles: { base: {} },
  children: [],
});
const rootOf = doc => doc.pages[0].rootId;
const insert = (doc, parentId, index, node) =>
  applyCommand(doc, { type: "insert", parentId, index, node });
const fixtureTree = () => {
  let doc = createDocument(), root = rootOf(doc);
  doc = insert(doc, root, 0, makeNode("layout1", "column"));
  doc = insert(doc, "layout1", 0, makeNode("layout2", "row"));
  doc = insert(doc, "layout2", 0, makeNode("nestedText"));
  return doc;
};

describe("F01: modelo de documentos", () => {
  it("migra a fixture antiga e mantém conteúdo, ordem e aparência da página", () => {
    const v1 = migrateLegacy(fixture);
    expect(v1.schemaVersion).toBe(SCHEMA_VERSION);
    expect(toLegacyProjection(v1)).toEqual(fixture);
    expect(parseDocumentJSON(serializeDocument(v1))).toEqual(v1);
    expect(assertDocument(v1)).toBe(v1);
  });

  it("aceita import JSON legado e atual; rejeita versões desconhecidas", () => {
    const migrated = parseDocumentJSON(JSON.stringify(fixture));
    expect(migrated.pages).toHaveLength(1);
    const serialized = serializeDocument(migrated);
    expect(parseDocumentJSON(serialized)).toEqual(migrated);
    const future = JSON.parse(serialized);
    future.schemaVersion = 99;
    expect(() => parseDocumentJSON(JSON.stringify(future))).toThrow(/Versão/);
  });

  it("previne múltiplos pais, nós órfãos e ciclos no JSON", () => {
    const tree = fixtureTree();
    const orphan = structuredClone(tree);
    orphan.nodes.lost = makeNode("lost");
    expect(() => assertDocument(orphan)).toThrow(/órfãos/);
    const manyParents = structuredClone(tree);
    manyParents.nodes.layout1.children.push("nestedText");
    expect(() => assertDocument(manyParents)).toThrow(/pais duplicados/);
    const cycle = structuredClone(tree);
    cycle.nodes.layout2.children.push("layout1");
    expect(() => assertDocument(cycle)).toThrow(/pais duplicados|ciclo|Raiz/);
  });

  it("rejeita documento v1 com props obrigatórias ausentes", () => {
    const doc = fixtureTree();
    doc.nodes.nestedText.props = {};
    expect(() => assertDocument(doc)).toThrow(/Propriedade obrigatória/);
  });

  it("não permite nomes especiais em IDs do mapa", () => {
    const doc = createDocument();
    const value = structuredClone(doc);
    Object.defineProperty(value.nodes, "__proto__", { value: makeNode("__proto__"), enumerable: true, configurable: true });
    expect(() => assertDocument(value)).toThrow();
  });

  it("armazena estilos responsivos por breakpoint", () => {
    const doc = fixtureTree();
    const changed = applyCommand(doc, {type:"setStyle",nodeId:"nestedText",breakpoint:"tablet",key:"fontSize",value:24});
    expect(changed.nodes.nestedText.styles.tablet.fontSize).toBe(24);
    expect(doc.nodes.nestedText.styles.tablet).toBeUndefined();
    expect(applyCommand(changed,{type:"setStyle",nodeId:"nestedText",breakpoint:"tablet",key:"fontSize",value:null})
      .nodes.nestedText.styles.tablet).toEqual({});
  });
});

describe("F01: engine de comandos", () => {
  it("insere em árvore de três níveis e move entre dois containers", () => {
    let doc = fixtureTree();
    const before = structuredClone(doc);
    doc = insert(doc, rootOf(doc), 1, makeNode("anotherContainer", "column"));
    doc = applyCommand(doc, {type:"move",nodeId:"nestedText",parentId:"anotherContainer",index:0});
    expect(doc.nodes.layout2.children).toEqual([]);
    expect(doc.nodes.anotherContainer.children).toEqual(["nestedText"]);
    expect(before.nodes.layout2.children).toEqual(["nestedText"]);
    assertDocument(doc);
  });

  it("reordena dois nós irmãos com índice pré-remoção", () => {
    let doc = createDocument(), root = rootOf(doc);
    doc = insert(doc,root,0,makeNode("one"));
    doc = insert(doc,root,1,makeNode("two"));
    doc = insert(doc,root,2,makeNode("three"));
    const moved = applyCommand(doc,{type:"move",nodeId:"one",parentId:root,index:2});
    expect(moved.nodes[root].children.slice(0,3)).toEqual(["two","one","three"]);
  });

  it("impede ciclos e deixa o documento anterior intacto", () => {
    const doc = fixtureTree(), snapshot = structuredClone(doc);
    expect(() => applyCommand(doc, {type:"move",nodeId:"layout1",parentId:"layout2",index:0}))
      .toThrow(/ciclo/);
    expect(doc).toEqual(snapshot);
  });

  it("exclui subárvore completa e preserva demais componentes", () => {
    const doc=fixtureTree(),root=rootOf(doc),before=doc.nodes[root].children.length;
    const changed=applyCommand(doc,{type:"remove",nodeId:"layout1"});
    expect(changed.nodes.layout1).toBeUndefined();
    expect(changed.nodes.layout2).toBeUndefined();
    expect(changed.nodes.nestedText).toBeUndefined();
    expect(changed.nodes[root].children).toHaveLength(before-1);
    expect(doc.nodes.nestedText).toBeDefined();
  });

  it("duplica todos os descendentes com IDs independentes", () => {
    const doc=fixtureTree();
    const changed=applyCommand(doc,{type:"duplicate",nodeId:"layout1",newId:"layout1-copy"});
    const copiedRowId=changed.nodes["layout1-copy"].children[0];
    const copiedTextId=changed.nodes[copiedRowId].children[0];
    expect(copiedRowId).not.toBe("layout2");
    expect(copiedTextId).not.toBe("nestedText");
    expect(changed.nodes[copiedTextId].props.text).toBe("nestedText");
    assertDocument(changed);
  });

  it("rejeita IDs reservados antes de adicionar ou duplicar elementos", () => {
    const doc = fixtureTree(), root = rootOf(doc);
    expect(() => insert(doc, root, 0, makeNode("__proto__"))).toThrow(/Identificador/);
    expect(() => applyCommand(doc, { type: "duplicate", nodeId: "layout1", newId: "constructor" }))
      .toThrow(/Identificador/);
    expect(Object.prototype.hasOwnProperty.call(doc.nodes, "__proto__")).toBe(false);
  });

  it("rejeita índice fora do intervalo e componente folha com filhos", () => {
    const doc=fixtureTree();
    expect(()=>insert(doc,"nestedText",0,makeNode("error"))).toThrow(/não aceita/);
    expect(()=>insert(doc,rootOf(doc),900,makeNode("error"))).toThrow(/Posição/);
  });

  it("executa lote atomicamente e não corrompe estado quando uma ação falha", () => {
    const doc=createDocument(),root=rootOf(doc);
    const batch={type:"batch",commands:[
      {type:"insert",parentId:root,index:0,node:makeNode("valid")},
      {type:"insert",parentId:"missing",index:0,node:makeNode("invalid")},
    ]};
    expect(()=>applyCommand(doc,batch)).toThrow(/não encontrado/);
    expect(doc.nodes.valid).toBeUndefined();
  });

  it("altera propriedades e configurações sem mutar a origem", () => {
    let doc=fixtureTree();
    const original=doc;
    doc=applyCommand(doc,{type:"setProp",nodeId:"nestedText",key:"text",value:"Alterado"});
    doc=applyCommand(doc,{type:"setPageStyle",pageId:doc.activePageId,key:"gap",value:12});
    doc=applyCommand(doc,{type:"setName",value:"Novo projeto"});
    expect(original.name).not.toBe(doc.name);
    expect(original.nodes.nestedText.props.text).toBe("nestedText");
    expect(doc.nodes.nestedText.props.text).toBe("Alterado");
    expect(doc.pages[0].style.gap).toBe(12);
  });
});

describe("F01: sessões undo/redo e storage", () => {
  it("faz desfazer/refazer de inserção, edição e remoção", () => {
    let session=createSession(fixtureTree());
    session=reduceSession(session,{type:"commit",command:{type:"setProp",nodeId:"nestedText",key:"text",value:"Versão nova"}});
    session=reduceSession(session,{type:"commit",command:{type:"remove",nodeId:"nestedText"}});
    expect(session.present.nodes.nestedText).toBeUndefined();
    session=reduceSession(session,{type:"undo"});
    expect(session.present.nodes.nestedText.props.text).toBe("Versão nova");
    session=reduceSession(session,{type:"undo"});
    expect(session.present.nodes.nestedText.props.text).toBe("nestedText");
    session=reduceSession(session,{type:"redo"});
    expect(session.present.nodes.nestedText.props.text).toBe("Versão nova");
  });

  it("nova ação apaga redo; histórico não passa do limite", () => {
    let session=createSession(createDocument());
    for(let i=0;i<HISTORY_LIMIT+6;i++)session=reduceSession(session,{type:"commit",command:{type:"setName",value:"Nome "+i}});
    expect(session.past.length).toBe(HISTORY_LIMIT);
    session=reduceSession(session,{type:"undo"});
    session=reduceSession(session,{type:"commit",command:{type:"setName",value:"Novo ramo"}});
    expect(session.future).toHaveLength(0);
  });

  it("cria backup do legado, migra sem apagar chave original e salva v1", () => {
    const data=new Map([[LEGACY_STORAGE_KEY,JSON.stringify(fixture)]]);
    const storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>{data.set(key,value)}};
    const bootstrap=loadStoredDocument(storage);
    expect(bootstrap.locked).toBe(false);
    expect(toLegacyProjection(bootstrap.document)).toEqual(fixture);
    expect(data.get(LEGACY_BACKUP_KEY)).toBe(JSON.stringify(fixture));
    expect(data.get(LEGACY_STORAGE_KEY)).toBe(JSON.stringify(fixture));
    saveStoredDocument(storage,bootstrap.document);
    expect(JSON.parse(data.get(CURRENT_STORAGE_KEY)).schemaVersion).toBe(1);
    const resumed=loadStoredDocument(storage);
    expect(resumed.document).toEqual(bootstrap.document);
  });

  it("não apaga projeto atual corrompido e trava salvamento", () => {
    const bad="{defeituoso";
    const data=new Map([[CURRENT_STORAGE_KEY,bad]]);
    const storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>{data.set(key,value)}};
    const state=loadStoredDocument(storage);
    expect(state.locked).toBe(true);
    expect(data.get(CURRENT_STORAGE_KEY)).toBe(bad);
  });
});
