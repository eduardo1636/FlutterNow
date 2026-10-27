const STORAGE = "flutternow-project-v1";
export const components = [
  { type: "heading", name: "Título", category: "Texto", defaults: { text: "Seu título aqui", fontSize: 28, color: "#151e32", align: "left" } },
  { type: "text", name: "Parágrafo", category: "Texto", defaults: { text: "Escreva uma descrição para sua página.", fontSize: 15, color: "#64748b", align: "left" } },
  { type: "button", name: "Botão", category: "Controles", defaults: { text: "Continuar", background: "#6d5dfc", color: "#ffffff", radius: 12, fontSize: 15 } },
  { type: "input", name: "Campo de texto", category: "Controles", defaults: { text: "Digite aqui...", radius: 10, background: "#ffffff", color: "#475569" } },
  { type: "card", name: "Cartão", category: "Layout", defaults: { text: "Um cartão informativo", background: "#f1f5ff", color: "#253457", radius: 16, fontSize: 16 } },
  { type: "image", name: "Imagem", category: "Mídia", defaults: { text: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900", radius: 14 } },
  { type: "divider", name: "Divisor", category: "Layout", defaults: { background: "#dce3ef" } },
  { type: "spacer", name: "Espaçamento", category: "Layout", defaults: { height: 24 } }
];
export const starter = [
  { id: "welcome-title", type: "heading", props: { text: "Crie algo incrível.", fontSize: 30, color: "#161f38", align: "left" } },
  { id: "welcome-body", type: "text", props: { text: "Arraste componentes para este espaço e personalize cada detalhe.", fontSize: 15, color: "#64748b", align: "left" } },
  { id: "welcome-card", type: "card", props: { text: "✨ Sua próxima grande ideia começa aqui.", background: "#eeedff", color: "#4d43ad", radius: 16, fontSize: 16 } },
  { id: "welcome-button", type: "button", props: { text: "Começar agora", background: "#6d5dfc", color: "#ffffff", radius: 12, fontSize: 15 } }
];
export const initial = { name: "Meu aplicativo", nodes: starter, page: { background: "#ffffff", padding: 22, gap: 16 } };
export function newId() { return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random(); }
export function readProject() { try { const raw = localStorage.getItem(STORAGE); return raw ? parseProjectJSON(raw) : initial; } catch { return initial; } }


/**
 * Legacy v0.1 document reader. F01 will migrate this to a versioned schema.
 * Reject malformed imports rather than rendering arbitrary structures.
 */
export function parseProjectJSON(raw) {
  const data = JSON.parse(raw);
  if (!data || typeof data !== "object" || Array.isArray(data) ||
      typeof data.name !== "string" || !Array.isArray(data.nodes) ||
      !data.page || typeof data.page !== "object" || Array.isArray(data.page)) {
    throw new Error("Formato de projeto inválido");
  }
  if (typeof data.page.background !== "string" ||
      !Number.isFinite(data.page.padding) || !Number.isFinite(data.page.gap) ||
      data.nodes.length > 1500) throw new Error("Configurações inválidas");
  const ids = new Set();
  for (const node of data.nodes) {
    if (!node || typeof node.id !== "string" || !node.id || ids.has(node.id) ||
        !components.some(c => c.type === node.type) ||
        !node.props || typeof node.props !== "object" || Array.isArray(node.props)) {
      throw new Error("Componente inválido");
    }
    const definition = components.find(c => c.type === node.type);
    for (const [key, sample] of Object.entries(definition.defaults)) {
      if (typeof node.props[key] !== typeof sample ||
          (typeof sample === "number" && !Number.isFinite(node.props[key]))) {
        throw new Error("Propriedade inválida: " + key);
      }
    }
    ids.add(node.id);
  }
  return {
    name: data.name,
    page: { background: data.page.background, padding: data.page.padding, gap: data.page.gap },
    nodes: data.nodes.map(node => ({
      id: node.id,
      type: node.type,
      props: Object.fromEntries(Object.keys(components.find(c => c.type === node.type).defaults)
        .map(key => [key, node.props[key]]))
    }))
  };
}

export const fieldLabels = { text: "Conteúdo / URL", background: "Cor de fundo", color: "Cor do texto", radius: "Arredondamento", fontSize: "Tamanho da fonte", height: "Altura", align: "Alinhamento" };
