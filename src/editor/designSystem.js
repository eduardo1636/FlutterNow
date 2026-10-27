/** F03 — tokens controlados por documento (compatíveis com documentos v1 antigos). */
export const DEFAULT_TOKENS = Object.freeze({
  colorPrimary: "#6d5dfc",
  colorSurface: "#f7f8fc",
  colorText: "#151e32",
  colorMuted: "#64748b",
  colorAccent: "#e6e2ff",
  spacingSmall: 8,
  spacingMedium: 16,
  spacingLarge: 24,
  radiusMedium: 12,
  fontBase: 16,
});

export const TOKEN_GROUPS = [
  { title: "Cores", keys: ["colorPrimary", "colorSurface", "colorText", "colorMuted", "colorAccent"] },
  { title: "Espaçamento", keys: ["spacingSmall", "spacingMedium", "spacingLarge"] },
  { title: "Bordas e tipografia", keys: ["radiusMedium", "fontBase"] },
];
export const TOKEN_LABELS = {
  colorPrimary: "Primária",
  colorSurface: "Superfície",
  colorText: "Texto",
  colorMuted: "Texto secundário",
  colorAccent: "Destaque",
  spacingSmall: "Pequeno",
  spacingMedium: "Médio",
  spacingLarge: "Grande",
  radiusMedium: "Raio padrão",
  fontBase: "Fonte base",
};
export const COLOR_TOKEN_KEYS = Object.keys(DEFAULT_TOKENS).filter(key => key.startsWith("color"));
export const SPACING_TOKEN_KEYS = Object.keys(DEFAULT_TOKENS).filter(key => key.startsWith("spacing"));
export const TOKEN_REF_PREFIX = "token:";

const ENUMS = Object.freeze({
  textAlign: ["left", "center", "right"],
  justifyContent: ["flex-start", "center", "flex-end", "space-between", "space-around"],
  alignItems: ["stretch", "flex-start", "center", "flex-end"],
  flexWrap: ["nowrap", "wrap"],
});
export const STYLE_FIELDS = [
  { key: "background", label: "Cor de fundo", type: "color" },
  { key: "color", label: "Cor do texto", type: "color" },
  { key: "borderColor", label: "Cor da borda", type: "color" },
  { key: "padding", label: "Padding", type: "number" },
  { key: "gap", label: "Espaçamento interno", type: "number" },
  { key: "radius", label: "Arredondamento", type: "number" },
  { key: "minHeight", label: "Altura mínima", type: "number" },
  { key: "widthPercent", label: "Largura (%)", type: "number" },
  { key: "fontSize", label: "Fonte (px)", type: "number" },
  { key: "marginTop", label: "Margem superior", type: "number" },
  { key: "marginBottom", label: "Margem inferior", type: "number" },
  { key: "borderWidth", label: "Largura da borda", type: "number" },
  { key: "textAlign", label: "Alinhamento do texto", type: "select", options: ENUMS.textAlign },
  { key: "justifyContent", label: "Justificar conteúdo", type: "select", options: ENUMS.justifyContent },
  { key: "alignItems", label: "Alinhar itens", type: "select", options: ENUMS.alignItems },
  { key: "flexWrap", label: "Quebra de linha", type: "select", options: ENUMS.flexWrap },
];
export const STYLE_FIELD_MAP = Object.fromEntries(STYLE_FIELDS.map(item => [item.key, item]));
const COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

export function mergedTokens(documentOrTokens) {
  // Documentos legados F01 não têm 'tokens'. Não misturar campos do documento
  // (nodes, pages, id) com o mapa de tokens.
  const isDocument = documentOrTokens && typeof documentOrTokens === "object" &&
    ("schemaVersion" in documentOrTokens || "nodes" in documentOrTokens);
  const tokens = isDocument ? documentOrTokens.tokens || {} : documentOrTokens || {};
  return { ...DEFAULT_TOKENS, ...tokens };
}
export function tokenIsValid(key, value) {
  if (!Object.prototype.hasOwnProperty.call(DEFAULT_TOKENS, key)) return false;
  const standard = DEFAULT_TOKENS[key];
  return typeof standard === "string"
    ? typeof value === "string" && COLOR_REGEX.test(value)
    : typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 300;
}
export function validTokenRef(value, tokens = DEFAULT_TOKENS) {
  if (typeof value !== "string" || !value.startsWith(TOKEN_REF_PREFIX)) return false;
  const name = value.slice(TOKEN_REF_PREFIX.length);
  return Object.prototype.hasOwnProperty.call(DEFAULT_TOKENS, name) &&
    tokenIsValid(name, mergedTokens(tokens)[name]);
}
export function resolveToken(value, tokens) {
  if (typeof value !== "string" || !value.startsWith(TOKEN_REF_PREFIX)) return value;
  if (!validTokenRef(value, tokens)) return undefined;
  return mergedTokens(tokens)[value.slice(TOKEN_REF_PREFIX.length)];
}
export function validateStyleEntry(key, value) {
  const field = STYLE_FIELD_MAP[key];
  if (!field) return false;
  if (value === null) return true; // a remoção de override é uma operação de comando
  if (validTokenRef(value)) {
    const tokenValue = DEFAULT_TOKENS[value.slice(TOKEN_REF_PREFIX.length)];
    return (field.type === "color" && typeof tokenValue === "string") ||
      (field.type === "number" && typeof tokenValue === "number");
  }
  if (field.type === "color") return typeof value === "string" && COLOR_REGEX.test(value);
  if (field.type === "number") {
    return typeof value === "number" && Number.isFinite(value) &&
      value >= 0 && value <= (key === "widthPercent" ? 100 : 1200);
  }
  return typeof value === "string" && field.options.includes(value);
}
export function breakpointCascade(node, device = "mobile") {
  const styles = node.styles || {};
  const base = styles.base || {};
  const tablet = device === "tablet" || device === "desktop" ? styles.tablet || {} : {};
  const desktop = device === "desktop" ? styles.desktop || {} : {};
  return { ...base, ...tablet, ...desktop };
}
export function effectiveStyle(node, device = "mobile", tokens = DEFAULT_TOKENS) {
  const raw = breakpointCascade(node, device);
  const result = {};
  for (const [key, value] of Object.entries(raw)) {
    const resolved = resolveToken(value, tokens);
    if (resolved !== undefined && STYLE_FIELD_MAP[key] && validateStyleEntry(key, value)) {
      result[key] = resolved;
    }
  }
  return result;
}
export function reactStyle(node, device = "mobile", tokens = DEFAULT_TOKENS) {
  const effective = effectiveStyle(node, device, tokens);
  const style = {};
  const simple = ["padding", "gap", "minHeight", "fontSize", "marginTop", "marginBottom",
    "textAlign", "justifyContent", "alignItems", "flexWrap", "borderColor", "borderWidth", "color"];
  for (const key of simple) if (effective[key] !== undefined) style[key] = effective[key];
  if (effective.background !== undefined) style.backgroundColor = effective.background;
  if (effective.radius !== undefined) style.borderRadius = effective.radius;
  if (effective.widthPercent !== undefined) style.width = effective.widthPercent + "%";
  if (effective.borderWidth !== undefined && effective.borderWidth > 0) style.borderStyle = "solid";
  return style;
}
export function hasStyleOverrides(document) {
  return Object.values(document.nodes).some(node =>
    Object.values(node.styles || {}).some(value => Object.keys(value || {}).length > 0));
}
export function hasCustomizedTokens(document) {
  return Object.entries(mergedTokens(document)).some(([key, value]) => value !== DEFAULT_TOKENS[key]);
}
