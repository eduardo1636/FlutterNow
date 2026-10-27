import { initial, parseProjectJSON, newId, components } from "../editor/project.js";
import { DEFAULT_TOKENS, tokenIsValid, validateStyleEntry } from "../editor/designSystem.js";

/** Versioned document, shared by editor commands, persistence and future exporters. */
export const SCHEMA_VERSION = 1;
export const CURRENT_STORAGE_KEY = "flutternow-project-v2";
export const LEGACY_STORAGE_KEY = "flutternow-project-v1";
export const LEGACY_BACKUP_KEY = "flutternow-backup-v01";
export const MAX_NODES = 2000;
export const MAX_DEPTH = 32;
export const CONTAINER_TYPES = new Set(["column", "row", "container"]);
export const COMPONENT_TYPES = new Set([
  "heading", "text", "button", "input", "card", "image", "divider",
  "spacer", ...CONTAINER_TYPES,
]);
const ID_RE = /^[\w-]{1,128}$/;
const MAX_STRING = 5000;

export type PropValue = string | number | boolean;
export type StyleValue = PropValue;
export type WidgetStyles = {
  base: Record<string, StyleValue>;
  tablet?: Record<string, StyleValue>;
  desktop?: Record<string, StyleValue>;
};
export interface WidgetNode {
  id: string;
  type: string;
  props: Record<string, PropValue>;
  styles: WidgetStyles;
  children: string[];
}
export interface PageStyle {
  background: string;
  padding: number;
  gap: number;
}
export interface ProjectPage {
  id: string;
  name: string;
  route: string;
  rootId: string;
  style: PageStyle;
}
export interface ProjectDocument {
  schemaVersion: 1;
  id: string;
  name: string;
  activePageId: string;
  pages: ProjectPage[];
  nodes: Record<string, WidgetNode>;
  /** Optional for legacy schemaVersion=1 documents; filled by first token edit. */
  tokens?: Record<string, PropValue>;
}
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function checkId(id: unknown): asserts id is string {
  assert(typeof id === "string" && ID_RE.test(id) && !["__proto__", "constructor", "prototype"].includes(id), "Identificador inválido");
}
function safeValue(value: unknown): value is PropValue {
  return typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value)) ||
    (typeof value === "string" && value.length <= MAX_STRING);
}
function safeMap(input: unknown, label: string): asserts input is Record<string, PropValue> {
  assert(record(input), label + " inválido");
  assert(Object.keys(input).length <= 100, label + " grande demais");
  for (const [key, value] of Object.entries(input)) {
    assert(key.length > 0 && key.length <= 100 && key !== "__proto__" &&
      key !== "constructor" && key !== "prototype" && safeValue(value), label + " inválido");
  }
}
function validateStyles(input: unknown, label: string): void {
  safeMap(input, label);
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    assert(validateStyleEntry(key, value), "Estilo não permitido: " + key);
  }
}
function validatePageStyle(input: unknown): asserts input is PageStyle {
  assert(record(input), "Estilo da página inválido");
  assert(typeof input.background === "string" && /^#[0-9a-fA-F]{6}$/.test(input.background),
    "Cor da página inválida");
  for (const k of ["padding", "gap"]) {
    assert(typeof input[k] === "number" && Number.isFinite(input[k]) &&
      input[k] >= 0 && input[k] <= 300, "Dimensão de página inválida");
  }
}
export function validateDocument(raw: unknown): asserts raw is ProjectDocument {
  assert(record(raw) && raw.schemaVersion === SCHEMA_VERSION, "Versão de projeto não suportada");
  checkId(raw.id);
  assert(typeof raw.name === "string" && raw.name.length <= 200, "Nome do projeto inválido");
  checkId(raw.activePageId);
  assert(Array.isArray(raw.pages) && raw.pages.length >= 1 && raw.pages.length <= 100,
    "Páginas inválidas");
  assert(record(raw.nodes) && Object.keys(raw.nodes).length <= MAX_NODES, "Nós inválidos");
  if (raw.tokens !== undefined) {
    assert(record(raw.tokens), "Tokens inválidos");
    assert(Object.keys(raw.tokens).length <= Object.keys(DEFAULT_TOKENS).length, "Tokens inválidos");
    for (const [key, value] of Object.entries(raw.tokens)) {
      assert(tokenIsValid(key, value), "Token de design inválido: " + key);
    }
  }
  const nodes = raw.nodes as Record<string, unknown>;
  const allIds = Object.keys(nodes);
  const pageIds = new Set<string>(), roots = new Set<string>(), routes = new Set<string>();
  for (const page of raw.pages) {
    assert(record(page), "Página inválida");
    checkId(page.id); checkId(page.rootId);
    assert(!pageIds.has(page.id) && !roots.has(page.rootId), "Página duplicada");
    assert(typeof page.name === "string" && page.name.length <= 200 &&
      typeof page.route === "string" && page.route.startsWith("/") &&
      page.route.length <= 200 && !routes.has(page.route), "Rota inválida");
    validatePageStyle(page.style);
    assert(Object.prototype.hasOwnProperty.call(nodes, page.rootId), "Raiz inexistente");
    pageIds.add(page.id); roots.add(page.rootId); routes.add(page.route);
  }
  assert(pageIds.has(raw.activePageId), "Página ativa inexistente");
  for (const [id, value] of Object.entries(nodes)) {
    checkId(id);
    assert(record(value) && value.id === id &&
      typeof value.type === "string" && COMPONENT_TYPES.has(value.type), "Nó inválido");
    safeMap(value.props, "Propriedades");
    const definition = (components as unknown as Array<{
      type: string; defaults: Record<string, PropValue>
    }>).find(component => component.type === value.type);
    if (definition) {
      for (const [key, defaultValue] of Object.entries(definition.defaults)) {
        assert(Object.prototype.hasOwnProperty.call(value.props, key) &&
          typeof value.props[key] === typeof defaultValue,
          "Propriedade obrigatória incompatível: " + key);
      }
    }
    assert(record(value.styles), "Estilos inválidos");
    for (const key of Object.keys(value.styles)) {
      assert(["base", "tablet", "desktop"].includes(key), "Breakpoint desconhecido");
    }
    validateStyles(value.styles.base, "Estilo base");
    if (value.styles.tablet !== undefined) validateStyles(value.styles.tablet, "Estilo tablet");
    if (value.styles.desktop !== undefined) validateStyles(value.styles.desktop, "Estilo desktop");
    assert(Array.isArray(value.children) && value.children.length <= MAX_NODES,
      "Filhos inválidos");
    if (!CONTAINER_TYPES.has(value.type)) {
      assert(value.children.length === 0, "Componente folha não pode conter filhos");
    }
    for (const child of value.children) checkId(child);
  }
  const parents = new Map<string, string>();
  for (const node of Object.values(nodes)) {
    const n = node as WidgetNode;
    const childrenHere = new Set<string>();
    for (const child of n.children) {
      assert(Object.prototype.hasOwnProperty.call(nodes, child), "Filho inexistente");
      assert(!childrenHere.has(child) && !parents.has(child), "Nó com pais duplicados");
      childrenHere.add(child);
      parents.set(child, n.id);
    }
  }
  for (const rootId of roots) {
    const root = nodes[rootId] as WidgetNode;
    assert(root.type === "column" && !parents.has(rootId), "Raiz deve ser coluna sem pai");
  }
  const visited = new Set<string>();
  function walk(id: string, depth: number): void {
    assert(depth <= MAX_DEPTH && !visited.has(id), "Ciclo ou profundidade excessiva");
    visited.add(id);
    for (const child of (nodes[id] as WidgetNode).children) walk(child, depth + 1);
  }
  for (const root of roots) walk(root, 0);
  assert(visited.size === allIds.length, "Nós órfãos ou ciclos detectados");
}
export function assertDocument(raw: unknown): ProjectDocument {
  validateDocument(raw);
  return raw;
}
export function cloneDocument(document: ProjectDocument): ProjectDocument {
  return structuredClone(document);
}
export function migrateLegacy(raw: unknown): ProjectDocument {
  const legacy = parseProjectJSON(JSON.stringify(raw));
  const rootId = "root-" + newId();
  const pageId = "page-" + newId();
  const nodes: Record<string, WidgetNode> = Object.create(null);
  nodes[rootId] = { id: rootId, type: "column", props: {}, styles: { base: {} },
    children: legacy.nodes.map((node: { id: string }) => node.id) };
  for (const node of legacy.nodes) {
    nodes[node.id] = { id: node.id, type: node.type,
      props: { ...node.props }, styles: { base: {} }, children: [] };
  }
  return assertDocument({
    schemaVersion: SCHEMA_VERSION,
    id: "project-" + newId(),
    name: legacy.name,
    activePageId: pageId,
    pages: [{ id: pageId, name: "Página inicial", route: "/", rootId,
      style: { ...legacy.page } }],
    nodes,
    tokens: { ...DEFAULT_TOKENS },
  });
}
export function createDocument(): ProjectDocument {
  return migrateLegacy(initial);
}
export function parseDocumentJSON(text: string): ProjectDocument {
  const value: unknown = JSON.parse(text);
  if (record(value) && "schemaVersion" in value) {
    return assertDocument(value);
  }
  return migrateLegacy(value);
}
export function serializeDocument(document: ProjectDocument): string {
  validateDocument(document);
  return JSON.stringify(document, null, 2);
}
/** Compatibility projection, only top-level nodes are rendered until F02. */
export function toLegacyProjection(document: ProjectDocument) {
  validateDocument(document);
  const page = document.pages.find(p => p.id === document.activePageId)!;
  const root = document.nodes[page.rootId];
  return {
    name: document.name,
    page: { ...page.style },
    nodes: root.children.map(id => {
      const { id: nodeId, type, props } = document.nodes[id];
      return { id: nodeId, type, props: { ...props } };
    }),
  };
}
/** Snapshot of canonical document from current app schema for import compatibility. */
export function nodeFromLegacy(id: string, type: string, props: Record<string, PropValue>): WidgetNode {
  checkId(id);
  assert(COMPONENT_TYPES.has(type), "Componente não suportado");
  return { id, type, props: { ...props }, styles: { base: {} }, children: [] };
}
