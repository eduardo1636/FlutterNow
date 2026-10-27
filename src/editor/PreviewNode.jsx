export function renderNode(node) {
  const p = node.props;
  if (node.type === "heading") return <h2 style={{ fontSize: p.fontSize, color: p.color, textAlign: p.align, margin: 0, lineHeight: 1.25 }}>{p.text}</h2>;
  if (node.type === "text") return <p style={{ fontSize: p.fontSize, color: p.color, textAlign: p.align, margin: 0, lineHeight: 1.6 }}>{p.text}</p>;
  if (node.type === "button") return <button type="button" style={{ background: p.background, color: p.color, borderRadius: p.radius, fontSize: p.fontSize, padding: "13px 18px", border: "none", fontWeight: 650, width: "100%", cursor: "default" }}>{p.text}</button>;
  if (node.type === "input") return <input value="" placeholder={p.text} readOnly style={{ width: "100%", border: "1px solid #e2e8f0", padding: 13, borderRadius: p.radius, background: p.background, color: p.color, boxSizing: "border-box" }}/>;
  if (node.type === "card") return <div style={{ background: p.background, color: p.color, borderRadius: p.radius, fontSize: p.fontSize, padding: 20, lineHeight: 1.5 }}>{p.text}</div>;
  if (node.type === "image") return <img alt="Imagem do projeto" src={p.text} style={{ display: "block", width: "100%", maxHeight: 240, objectFit: "cover", borderRadius: p.radius }} onError={event => { event.currentTarget.style.opacity = "0.2"; }}/>;
  if (node.type === "divider") return <div style={{ height: 1, background: p.background }}/>;
  if (node.type === "spacer") return <div style={{ height: p.height }}/>;
  return null;
}
