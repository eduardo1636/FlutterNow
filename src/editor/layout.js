import { components } from "./project.js";

export const LAYOUT_TYPES = ["container", "row", "column"];
export const DEFAULT_LAYOUT_STYLES = {
  container: { gap: 12, padding: 18, background: "#f5f6ff", radius: 14, minHeight: 96 },
  row: { gap: 12, padding: 12, background: "#f8fafc", radius: 12, minHeight: 70 },
  column: { gap: 12, padding: 12, background: "#f8fafc", radius: 12, minHeight: 70 },
};
export function isLayout(type) {
  return LAYOUT_TYPES.includes(type);
}
export function componentName(type) {
  return components.find((entry) => entry.type === type)?.name ?? type;
}
export function createWidget(id, type) {
  const entry = components.find((item) => item.type === type);
  if (!entry) throw new Error("Componente desconhecido");
  return {
    id,
    type,
    props: { ...entry.defaults },
    styles: { base: isLayout(type) ? { ...DEFAULT_LAYOUT_STYLES[type] } : {} },
    children: [],
  };
}
export function getLayoutValues(node) {
  return { ...(DEFAULT_LAYOUT_STYLES[node.type] ?? {}), ...node.styles.base };
}
export function getLayoutCSS(node) {
  const style = getLayoutValues(node);
  return {
    display: "flex",
    flexDirection: node.type === "row" ? "row" : "column",
    gap: Number(style.gap) || 0,
    padding: Number(style.padding) || 0,
    backgroundColor: String(style.background || "transparent"),
    borderRadius: Number(style.radius) || 0,
    minHeight: Number(style.minHeight) || 0,
  };
}
export function findParentInfo(document, nodeId) {
  for (const parent of Object.values(document.nodes)) {
    const index = parent.children.indexOf(nodeId);
    if (index >= 0) return { id: parent.id, index };
  }
  return null;
}
export function containsNode(document, parentId, childId) {
  const parent = document.nodes[parentId];
  return Boolean(parent && (parentId === childId ||
    parent.children.some((id) => containsNode(document, id, childId))));
}
