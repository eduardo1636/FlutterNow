import React from "react";
import { Link2, RotateCcw, Smartphone, Tablet, Monitor } from "lucide-react";
import {
  COLOR_TOKEN_KEYS, DEFAULT_TOKENS, STYLE_FIELD_MAP,
  TOKEN_LABELS, TOKEN_REF_PREFIX, effectiveStyle,
  mergedTokens, resolveToken,
} from "./designSystem.js";
import { DEFAULT_LAYOUT_STYLES, isLayout } from "./layout.js";

const BASE_FIELDS = ["background", "color", "padding", "radius", "widthPercent",
  "marginTop", "marginBottom", "borderColor", "borderWidth"];
const LAYOUT_FIELDS = ["background", "padding", "gap", "radius", "minHeight",
  "widthPercent", "justifyContent", "alignItems", "flexWrap", "borderColor", "borderWidth"];
const TEXT_FIELDS = ["background", "color", "fontSize", "textAlign", "marginTop", "marginBottom", "widthPercent"];
const LABELS = { mobile: "Celular", tablet: "Tablet", desktop: "Computador" };

export default function ResponsiveInspector({ node, device, tokens: projectTokens, onStyle, onReset }) {
  const tokens = mergedTokens(projectTokens);
  const styles = node.styles?.[device === "mobile" ? "base" : device] || {};
  const current = effectiveStyle(node, device, tokens);
  const fields = isLayout(node.type) ? LAYOUT_FIELDS :
    ["heading", "text"].includes(node.type) ? TEXT_FIELDS : BASE_FIELDS;
  const fallback = DEFAULT_LAYOUT_STYLES[node.type] || {};
  function resolvedValue(key) {
    if (current[key] !== undefined) return current[key];
    if (fallback[key] !== undefined) return fallback[key];
    if (key === "background") return node.props?.background || "#ffffff";
    if (key === "color") return node.props?.color || tokens.colorText;
    if (key === "borderColor") return "#d1d5db";
    if (key === "fontSize") return node.props?.fontSize || tokens.fontBase;
    if (key === "textAlign") return node.props?.align || "left";
    if (key === "justifyContent") return "flex-start";
    if (key === "alignItems") return "stretch";
    if (key === "flexWrap") return "nowrap";
    if (key === "widthPercent") return 100;
    return 0;
  }
  const hasLocal = Object.keys(styles).length > 0;
  return (
    <section className="fn-responsive-inspector">
      <div className="fn-inspector-section-head">
        <span>Estilos responsivos</span>
        <span className="fn-device-label">
          {device === "mobile" ? <Smartphone size={13} /> : device === "tablet" ?
            <Tablet size={13} /> : <Monitor size={13} />}
          {LABELS[device]}
        </span>
      </div>
      <p className="fn-inspector-help">
        {device === "mobile" ? "Estilos base: herdados por tablet e desktop." :
          device === "tablet" ? "O tablet herda do celular. Só os campos alterados sobrescrevem a base." :
            "O desktop herda do tablet e do celular. Só os campos alterados sobrescrevem a base."}
      </p>
      <div className="fn-breakpoint-hint">Troque o dispositivo na barra acima para editar outro breakpoint.</div>
      {fields.map(key => {
        const field = STYLE_FIELD_MAP[key];
        const raw = styles[key];
        const own = raw !== undefined;
        const value = resolvedValue(key);
        const ref = typeof raw === "string" && raw.startsWith(TOKEN_REF_PREFIX) ? raw : "";
        const permittedTokens = field.type === "color" ? COLOR_TOKEN_KEYS :
          field.type === "number" ? Object.keys(DEFAULT_TOKENS).filter(k => typeof DEFAULT_TOKENS[k] === "number") : [];
        return <div key={key} className={"fn-responsive-property" + (own ? " modified" : "")}>
          <div className="fn-property-header">
            <span>{field.label}{own && <b className="fn-override-mark" title="Valor definido neste dispositivo"> ●</b>}</span>
            {own && <button title="Remover personalização deste breakpoint" type="button"
              onClick={() => onStyle(key, null)}><RotateCcw size={13} /></button>}
          </div>
          {field.type === "color" ? <div className="color-field">
            <input aria-label={field.label} type="color"
              value={typeof value === "string" && /^#[\da-fA-F]{6}$/.test(value) ? value : "#ffffff"}
              onChange={event => onStyle(key, event.target.value)} />
            <span>{value}</span>
          </div> : field.type === "number" ? <input type="number" min="0"
              max={key === "widthPercent" ? "100" : "1200"} value={Number(value) || 0}
              onChange={event => onStyle(key, Math.max(0,
                Math.min(key === "widthPercent" ? 100 : 1200, Number(event.target.value) || 0)))} />
            : <select value={String(value)} onChange={event => onStyle(key, event.target.value)}>
              {field.options.map(option => <option key={option} value={option}>{option}</option>)}
            </select>}
          {permittedTokens.length > 0 && <label className="fn-token-link">
            <Link2 size={12} />
            <select aria-label={"Token: " + field.label} value={ref}
              onChange={event => onStyle(key, event.target.value || null)}>
              <option value="">Valor independente</option>
              {permittedTokens.map(tokenKey => <option key={tokenKey} value={TOKEN_REF_PREFIX + tokenKey}>
                {TOKEN_LABELS[tokenKey]} ({resolveToken(TOKEN_REF_PREFIX + tokenKey, tokens)})
              </option>)}
            </select>
          </label>}
        </div>;
      })}
      {hasLocal && <button className="outline wide" onClick={onReset}><RotateCcw size={14} /> Limpar overrides deste dispositivo</button>}
    </section>
  );
}
