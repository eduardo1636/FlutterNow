import React from "react";
import { Palette, RotateCcw, Paintbrush, Info } from "lucide-react";
import { DEFAULT_TOKENS, TOKEN_GROUPS, TOKEN_LABELS, mergedTokens } from "./designSystem.js";

const THEMES = [
  { name: "Violeta", changes: { colorPrimary: "#6d5dfc", colorSurface: "#f7f8fc", colorText: "#151e32", colorMuted: "#64748b", colorAccent: "#e6e2ff" } },
  { name: "Oceano", changes: { colorPrimary: "#0077b6", colorSurface: "#f2faff", colorText: "#0a3248", colorMuted: "#55778b", colorAccent: "#d9effb" } },
  { name: "Noturno", changes: { colorPrimary: "#9f90ff", colorSurface: "#1d2334", colorText: "#f3f4ff", colorMuted: "#b8c0d3", colorAccent: "#343253" } },
];
export default function DesignPanel({ document, onToken, onBatch }) {
  const tokens = mergedTokens(document);
  return <div className="fn-design-editor">
    <div className="fn-design-head"><Palette size={17} /> Design System</div>
    <p className="helper">Valores reutilizáveis para todo o aplicativo. Vincule um componente ao token na aba de propriedades para refletir alterações em todas as telas.</p>
    <div className="fn-design-themes" aria-label="Temas prontos">
      {THEMES.map(theme => <button key={theme.name} onClick={() => onBatch({
        type: "batch", commands: Object.entries(theme.changes)
          .map(([key, value]) => ({ type: "setToken", key, value })),
      })}>
        <span style={{ background: theme.changes.colorPrimary }} />{theme.name}
      </button>)}
    </div>
    {TOKEN_GROUPS.map(group => <section key={group.title} className="fn-design-group">
      <h3>{group.title}</h3>
      {group.keys.map(key => <label key={key} className="property-field">
        <span>{TOKEN_LABELS[key]}</span>
        {typeof DEFAULT_TOKENS[key] === "string" ? <div className="color-field">
          <input aria-label={TOKEN_LABELS[key]} type="color" value={tokens[key]}
            onChange={event => onToken(key, event.target.value)} />
          <span>{tokens[key]}</span>
        </div> : <input type="number" min="0" max="300" value={tokens[key]}
          onChange={event => onToken(key, Math.max(0, Math.min(300, Number(event.target.value) || 0)))} />}
      </label>)}
    </section>)}
    <button className="outline wide" onClick={() => onBatch({ type: "batch",
      commands: Object.entries(DEFAULT_TOKENS).map(([key, value]) => ({type:"setToken",key,value})) })}>
      <RotateCcw size={15} /> Restaurar tokens
    </button>
    <div className="hint-box"><Info size={17} />
      Os temas alteram apenas tokens. Elementos com cores fixas não mudam até serem vinculados a esses tokens.
    </div>
    <div className="fn-design-preview">
      <Paintbrush size={16} /><span>Prévia de cores</span>
      <div className="fn-design-swatch" style={{ background: tokens.colorSurface, color: tokens.colorText }}>
        <div style={{ background: tokens.colorPrimary, color: "#fff", borderRadius: tokens.radiusMedium, padding: tokens.spacingMedium }}>Botão de exemplo</div>
        <p style={{ margin: "10px 0 0", color: tokens.colorMuted }}>Texto secundário</p>
      </div>
    </div>
  </div>;
}
