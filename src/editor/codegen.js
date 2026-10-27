function escapeText(t) { return JSON.stringify(String(t ?? "")); }
export function generateCode(project) {
  const parts = project.nodes.map(node => {
    const p = node.props;
    if (node.type === "heading") return "      <h2 style={{ fontSize: " + Number(p.fontSize) + ", color: " + escapeText(p.color) + ", textAlign: " + escapeText(p.align) + " }}>" + "{"+escapeText(p.text)+"}" + "</h2>";
    if (node.type === "text") return "      <p style={{ fontSize: " + Number(p.fontSize) + ", color: " + escapeText(p.color) + ", textAlign: " + escapeText(p.align) + " }}>" + "{"+escapeText(p.text)+"}" + "</p>";
    if (node.type === "button") return "      <button type=\"button\" style={{ background: " + escapeText(p.background) + ", color: " + escapeText(p.color) + ", borderRadius: " + Number(p.radius) + ", padding: 14, border: 'none', width: '100%' }}>" + "{"+escapeText(p.text)+"}" + "</button>";
    if (node.type === "input") return "      <input placeholder={" + escapeText(p.text) + "} style={{ width: '100%', padding: 12, borderRadius: " + Number(p.radius) + ", border: '1px solid #ddd' }} />";
    if (node.type === "card") return "      <div style={{ background: " + escapeText(p.background) + ", color: " + escapeText(p.color) + ", padding: 20, borderRadius: " + Number(p.radius) + " }}>" + "{"+escapeText(p.text)+"}" + "</div>";
    if (node.type === "image") return "      <img src={" + escapeText(p.text) + "} alt=\"Imagem\" style={{ width: '100%', borderRadius: " + Number(p.radius) + " }} />";
    if (node.type === "divider") return "      <hr style={{ border: 0, borderTop: " + escapeText("1px solid " + p.background) + " }} />";
    if (node.type === "spacer") return "      <div style={{ height: " + Number(p.height) + " }} />";
    return "";
  });
  return "import React from 'react';\n\nexport default function App() {\n  return (\n    <main style={{ maxWidth: 960, minHeight: '100vh', margin: '0 auto', boxSizing: 'border-box', background: " + escapeText(project.page.background) + ", padding: " + Number(project.page.padding) + ", display: 'flex', flexDirection: 'column', gap: " + Number(project.page.gap) + " }}>\n" + parts.join("\n") + "\n    </main>\n  );\n}\n";
}
