import {
  assertDocument, cloneDocument, CONTAINER_TYPES, MAX_NODES,
  type ProjectDocument, type ProjectPage, type PropValue, type WidgetNode,
} from "./document";
import { newId } from "../editor/project.js";

/** Commands are deterministic except duplicate (where IDs are generated once before validation).
 * The document is never mutated when a command fails.
 */
export type Command =
  | { type: "insert"; parentId: string; index: number; node: WidgetNode }
  | { type: "move"; nodeId: string; parentId: string; index: number }
  | { type: "remove"; nodeId: string }
  | { type: "duplicate"; nodeId: string; newId: string }
  | { type: "setProp"; nodeId: string; key: string; value: PropValue }
  | { type: "setStyle"; nodeId: string; breakpoint: "base" | "tablet" | "desktop"; key: string; value: PropValue | null }
  | { type: "setPageStyle"; pageId: string; key: "background" | "padding" | "gap"; value: string | number }
  | { type: "setName"; value: string }
  | { type: "replace"; document: ProjectDocument }
  | { type: "batch"; commands: Command[] };

function requireNode(document: ProjectDocument, id: string): WidgetNode {
  const node = Object.prototype.hasOwnProperty.call(document.nodes, id) ? document.nodes[id] : undefined;
  if (!node) throw new Error("Componente não encontrado: " + id);
  return node;
}
function requireParent(document: ProjectDocument, id: string): WidgetNode {
  const node = requireNode(document, id);
  if (!CONTAINER_TYPES.has(node.type)) throw new Error("Este componente não aceita filhos");
  return node;
}
function rootIds(document: ProjectDocument): Set<string> {
  return new Set(document.pages.map(page => page.rootId));
}
function findParent(document: ProjectDocument, nodeId: string): WidgetNode {
  const parent = Object.values(document.nodes).find(n => n.children.includes(nodeId));
  if (!parent) throw new Error("Componente não tem pai");
  return parent;
}
function checkIndex(index: number, length: number): void {
  if (!Number.isInteger(index) || index < 0 || index > length) {
    throw new Error("Posição de inserção inválida");
  }
}
function subtree(document: ProjectDocument, rootId: string): string[] {
  const found: string[] = [];
  function visit(id: string) {
    found.push(id);
    for (const child of requireNode(document, id).children) visit(child);
  }
  visit(rootId);
  return found;
}
function checkKey(key: string): void {
  if (!/^[a-zA-Z][\w-]{0,99}$/.test(key) ||
      ["__proto__", "constructor", "prototype"].includes(key)) {
    throw new Error("Nome de propriedade inválido");
  }
}
function safeValue(value: unknown): boolean {
  return (typeof value === "number" && Number.isFinite(value)) ||
    typeof value === "boolean" ||
    (typeof value === "string" && value.length <= 5000);
}
function applyMutable(document: ProjectDocument, command: Command): ProjectDocument {
  switch (command.type) {
    case "replace":
      return cloneDocument(assertDocument(command.document));
    case "batch":
      if (command.commands.length > 100) throw new Error("Lote de comandos muito grande");
      for (const child of command.commands) document = applyMutable(document, child);
      return document;
    case "insert": {
      const parent = requireParent(document, command.parentId);
      checkIndex(command.index, parent.children.length);
      const node = structuredClone(command.node);
      if (Object.prototype.hasOwnProperty.call(document.nodes, node.id)) throw new Error("ID duplicado");
      if (node.children.length !== 0) throw new Error("Inserção inicial exige nó sem filhos");
      if (Object.keys(document.nodes).length >= MAX_NODES) throw new Error("Limite de componentes excedido");
      document.nodes[node.id] = node;
      parent.children.splice(command.index, 0, node.id);
      return document;
    }
    case "move": {
      if (rootIds(document).has(command.nodeId)) throw new Error("Raiz da página não pode ser movida");
      const node = requireNode(document, command.nodeId);
      const dest = requireParent(document, command.parentId);
      checkIndex(command.index, dest.children.length);
      if (node.id === dest.id || subtree(document, node.id).includes(dest.id)) {
        throw new Error("Movimento criaria ciclo");
      }
      const source = findParent(document, node.id);
      const from = source.children.indexOf(node.id);
      source.children.splice(from, 1);
      const targetIndex = source.id === dest.id && command.index > from
        ? command.index - 1 : command.index;
      dest.children.splice(targetIndex, 0, node.id);
      return document;
    }
    case "remove": {
      if (rootIds(document).has(command.nodeId)) throw new Error("Raiz não pode ser removida");
      const parent = findParent(document, command.nodeId);
      parent.children.splice(parent.children.indexOf(command.nodeId), 1);
      for (const id of subtree(document, command.nodeId)) delete document.nodes[id];
      return document;
    }
    case "duplicate": {
      if (rootIds(document).has(command.nodeId)) throw new Error("Raiz não pode ser duplicada");
      if (command.newId in document.nodes) throw new Error("ID duplicado");
      const parent = findParent(document, command.nodeId);
      const oldIds = subtree(document, command.nodeId);
      if (oldIds.length + Object.keys(document.nodes).length > MAX_NODES) {
        throw new Error("Limite de componentes excedido");
      }
      const mapping = new Map<string, string>();
      mapping.set(command.nodeId, command.newId);
      for (const id of oldIds.slice(1)) {
        let next = newId();
        while (next in document.nodes || [...mapping.values()].includes(next)) next = newId();
        mapping.set(id, next);
      }
      const copies: WidgetNode[] = oldIds.map(id => {
        const copy = structuredClone(requireNode(document, id));
        copy.id = mapping.get(id)!;
        copy.children = copy.children.map(child => mapping.get(child)!);
        return copy;
      });
      for (const copy of copies) document.nodes[copy.id] = copy;
      const from = parent.children.indexOf(command.nodeId);
      parent.children.splice(from + 1, 0, command.newId);
      return document;
    }
    case "setProp": {
      checkKey(command.key);
      if (!safeValue(command.value)) throw new Error("Propriedade inválida");
      const node = requireNode(document, command.nodeId);
      if (!Object.prototype.hasOwnProperty.call(node.props, command.key)) {
        throw new Error("Propriedade não reconhecida");
      }
      if (typeof node.props[command.key] !== typeof command.value) {
        throw new Error("Tipo incompatível");
      }
      node.props[command.key] = command.value;
      return document;
    }
    case "setStyle": {
      checkKey(command.key);
      if (command.value !== null && !safeValue(command.value)) throw new Error("Valor de estilo inválido");
      const node = requireNode(document, command.nodeId);
      const style = node.styles[command.breakpoint] ?? {};
      if (command.value === null) delete style[command.key];
      else style[command.key] = command.value;
      node.styles[command.breakpoint] = style;
      return document;
    }
    case "setPageStyle": {
      const page = document.pages.find(p => p.id === command.pageId);
      if (!page) throw new Error("Página inexistente");
      if (command.key === "background") {
        if (typeof command.value !== "string") throw new Error("Cor inválida");
        page.style.background = command.value;
      } else {
        if (typeof command.value !== "number") throw new Error("Dimensão inválida");
        page.style[command.key] = command.value;
      }
      return document;
    }
    case "setName":
      document.name = command.value;
      return document;
    default:
      throw new Error("Comando não suportado");
  }
}
export function applyCommand(document: ProjectDocument, command: Command): ProjectDocument {
  assertDocument(document);
  const next = applyMutable(cloneDocument(document), command);
  assertDocument(next);
  return next;
}
/** Non-mutating helper used by UI when moving between two adjacent slots. */
export function getParentId(document: ProjectDocument, nodeId: string): string {
  return findParent(document, nodeId).id;
}
