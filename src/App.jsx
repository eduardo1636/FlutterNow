import React, { useEffect, useMemo, useRef, useState } from "react";
import { Blocks, Smartphone, Tablet, Monitor, Save, Download, Code2, Eye, Undo2, Redo2, Trash2, Copy, Plus, GripVertical, ChevronUp, ChevronDown, Layers, SlidersHorizontal, MousePointer2, FileJson, Upload, Sparkles } from "lucide-react";

const STORAGE = "flutternow-project-v1";
const components = [
  { type: "heading", name: "Título", category: "Texto", defaults: { text: "Seu título aqui", fontSize: 28, color: "#151e32", align: "left" } },
  { type: "text", name: "Parágrafo", category: "Texto", defaults: { text: "Escreva uma descrição para sua página.", fontSize: 15, color: "#64748b", align: "left" } },
  { type: "button", name: "Botão", category: "Controles", defaults: { text: "Continuar", background: "#6d5dfc", color: "#ffffff", radius: 12, fontSize: 15 } },
  { type: "input", name: "Campo de texto", category: "Controles", defaults: { text: "Digite aqui...", radius: 10, background: "#ffffff", color: "#475569" } },
  { type: "card", name: "Cartão", category: "Layout", defaults: { text: "Um cartão informativo", background: "#f1f5ff", color: "#253457", radius: 16, fontSize: 16 } },
  { type: "image", name: "Imagem", category: "Mídia", defaults: { text: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900", radius: 14 } },
  { type: "divider", name: "Divisor", category: "Layout", defaults: { background: "#dce3ef" } },
  { type: "spacer", name: "Espaçamento", category: "Layout", defaults: { height: 24 } }
];
const starter = [
  { id: "welcome-title", type: "heading", props: { text: "Crie algo incrível.", fontSize: 30, color: "#161f38", align: "left" } },
  { id: "welcome-body", type: "text", props: { text: "Arraste componentes para este espaço e personalize cada detalhe.", fontSize: 15, color: "#64748b", align: "left" } },
  { id: "welcome-card", type: "card", props: { text: "✨ Sua próxima grande ideia começa aqui.", background: "#eeedff", color: "#4d43ad", radius: 16, fontSize: 16 } },
  { id: "welcome-button", type: "button", props: { text: "Começar agora", background: "#6d5dfc", color: "#ffffff", radius: 12, fontSize: 15 } }
];
const initial = { name: "Meu aplicativo", nodes: starter, page: { background: "#ffffff", padding: 22, gap: 16 } };
function newId() { return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random(); }
function readProject() { try { const data = JSON.parse(localStorage.getItem(STORAGE)); if (data && Array.isArray(data.nodes) && data.page) return data; } catch {} return initial; }
function renderNode(node) {
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
function escapeText(t) { return JSON.stringify(String(t ?? "")); }
function styleObject(props) { return JSON.stringify(props); }
function generateCode(project) {
  const parts = project.nodes.map(node => {
    const p = node.props;
    if (node.type === "heading") return "      <h2 style={{ fontSize: " + Number(p.fontSize) + ", color: " + escapeText(p.color) + ", textAlign: " + escapeText(p.align) + " }}>" + "{"+escapeText(p.text)+"}" + "</h2>";
    if (node.type === "text") return "      <p style={{ fontSize: " + Number(p.fontSize) + ", color: " + escapeText(p.color) + ", textAlign: " + escapeText(p.align) + " }}>" + "{"+escapeText(p.text)+"}" + "</p>";
    if (node.type === "button") return "      <button type=\"button\" style={{ background: " + escapeText(p.background) + ", color: " + escapeText(p.color) + ", borderRadius: " + Number(p.radius) + ", padding: 14, border: 'none', width: '100%' }}>" + "{"+escapeText(p.text)+"}" + "</button>";
    if (node.type === "input") return "      <input placeholder={" + escapeText(p.text) + "} style={{ width: '100%', padding: 12, borderRadius: " + Number(p.radius) + ", border: '1px solid #ddd' }} />";
    if (node.type === "card") return "      <div style={{ background: " + escapeText(p.background) + ", color: " + escapeText(p.color) + ", padding: 20, borderRadius: " + Number(p.radius) + " }}>" + "{"+escapeText(p.text)+"}" + "</div>";
    if (node.type === "image") return "      <img src={" + escapeText(p.text) + "} alt=\"Imagem\" style={{ width: '100%', borderRadius: " + Number(p.radius) + " }} />";
    if (node.type === "divider") return "      <hr style={{ border: 0, borderTop: '1px solid " + p.background + "' }} />";
    if (node.type === "spacer") return "      <div style={{ height: " + Number(p.height) + " }} />";
    return "";
  });
  return "import React from 'react';\n\nexport default function App() {\n  return (\n    <main style={{ maxWidth: 960, minHeight: '100vh', margin: '0 auto', boxSizing: 'border-box', background: " + escapeText(project.page.background) + ", padding: " + Number(project.page.padding) + ", display: 'flex', flexDirection: 'column', gap: " + Number(project.page.gap) + " }}>\n" + parts.join("\n") + "\n    </main>\n  );\n}\n";
}
function downloadFile(filename, text, mime) { const url = URL.createObjectURL(new Blob([text], { type: mime })); const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
const fieldLabels = { text: "Conteúdo / URL", background: "Cor de fundo", color: "Cor do texto", radius: "Arredondamento", fontSize: "Tamanho da fonte", height: "Altura", align: "Alinhamento" };
export default function App() {
  const [project, setProject] = useState(readProject);
  const [selected, setSelected] = useState(null);
  const [device, setDevice] = useState("mobile");
  const [tab, setTab] = useState("editor");
  const [notice, setNotice] = useState("");
  const history = useRef([]);
  const future = useRef([]);
  const importRef = useRef(null);
  const selectedNode = project.nodes.find(n => n.id === selected);
  const source = useMemo(() => generateCode(project), [project]);
  useEffect(() => { localStorage.setItem(STORAGE, JSON.stringify(project)); }, [project]);
  function commit(mutator) {
    history.current.push(structuredClone(project));
    if (history.current.length > 60) history.current.shift();
    future.current = [];
    setProject(current => mutator(structuredClone(current)));
  }
  function add(type, index = project.nodes.length) {
    const definition = components.find(c => c.type === type);
    if (!definition) return;
    const id = newId();
    commit(current => { current.nodes.splice(index, 0, { id, type, props: { ...definition.defaults } }); return current; });
    setSelected(id); setTab("editor");
  }
  function updateProp(key, value) { if (!selectedNode) return; commit(current => { const node = current.nodes.find(n => n.id === selected); if (node) node.props[key] = value; return current; }); }
  function updatePage(key, value) { commit(current => { current.page[key] = value; return current; }); }
  function move(index, delta) { const next = index + delta; if (next < 0 || next >= project.nodes.length) return; commit(current => { const [item] = current.nodes.splice(index, 1); current.nodes.splice(next, 0, item); return current; }); }
  function remove(id) { commit(current => { current.nodes = current.nodes.filter(n => n.id !== id); return current; }); setSelected(null); }
  function duplicate() { if (!selectedNode) return; const id = newId(); commit(current => { const index = current.nodes.findIndex(n => n.id === selected); current.nodes.splice(index + 1, 0, { ...structuredClone(selectedNode), id }); return current; }); setSelected(id); }
  function undo() { if (!history.current.length) return; future.current.push(structuredClone(project)); setProject(history.current.pop()); setSelected(null); }
  function redo() { if (!future.current.length) return; history.current.push(structuredClone(project)); setProject(future.current.pop()); setSelected(null); }
  function importProject(event) {
    const file = event.target.files?.[0]; if (!file) return;
    file.text().then(value => {
      try {
        const data = JSON.parse(value);
        if (!data || !Array.isArray(data.nodes) || !data.page || typeof data.name !== "string" || data.nodes.some(n => !components.some(c => c.type === n.type) || !n.props || typeof n.id !== "string")) throw Error("Formato incompatível");
        commit(() => ({ name: data.name, nodes: data.nodes, page: data.page })); setSelected(null); setNotice("Projeto importado!");
      } catch { setNotice("Arquivo inválido."); }
      event.target.value = "";
    });
  }
  function onDrop(event, index) {
    event.preventDefault();
    const type = event.dataTransfer.getData("flutternow/type");
    const id = event.dataTransfer.getData("flutternow/node");
    if (type) add(type, index);
    else if (id) {
      const from = project.nodes.findIndex(node => node.id === id);
      if (from < 0) return;
      commit(current => { const [node] = current.nodes.splice(from, 1); current.nodes.splice(index > from ? index - 1 : index, 0, node); return current; });
    }
  }
  function DropZone({ index }) { return <div className="drop-zone" onDragOver={e => e.preventDefault()} onDrop={e => onDrop(e, index)} aria-label="Solte um componente aqui"><span>+ Soltar aqui</span></div>; }
  const categories = [...new Set(components.map(c => c.category))];
  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-logo"><Blocks size={19}/></div><span>Flutter<span className="brand-accent">Now</span></span><span className="version">BETA</span></div>
      <div className="project-name"><input aria-label="Nome do projeto" value={project.name} onChange={e => setProject(v => ({ ...v, name: e.target.value }))}/><span className="saved"><Save size={13}/> Salvo automaticamente</span></div>
      <div className="top-actions">
        <button title="Desfazer" disabled={!history.current.length} onClick={undo}><Undo2 size={17}/></button>
        <button title="Refazer" disabled={!future.current.length} onClick={redo}><Redo2 size={17}/></button>
        <span className="top-separator"/>
        <button onClick={() => { downloadFile("flutternow-project.json", JSON.stringify(project, null, 2), "application/json"); setNotice("Projeto exportado!"); }}><FileJson size={16}/> <span>Projeto</span></button>
        <button className="primary" onClick={() => { downloadFile("App.jsx", source, "text/javascript"); setNotice("Código React exportado!"); }}><Download size={16}/> Exportar código</button>
      </div>
    </header>
    <div className="workspace">
      <aside className="sidebar components-panel">
        <div className="panel-heading"><span><Blocks size={16}/> Componentes</span></div>
        <div className="sidebar-scroller">
          <p className="helper">Arraste para a tela ou clique para adicionar.</p>
          {categories.map(category => <section className="component-group" key={category}><h3>{category}</h3><div className="component-list">{components.filter(c => c.category === category).map(c => <button className="component-item" key={c.type} draggable onDragStart={e => e.dataTransfer.setData("flutternow/type", c.type)} onClick={() => add(c.type)}><span className="component-icon"><Plus size={15}/></span>{c.name}<GripVertical className="component-grip" size={14}/></button>)}</div></section>)}
          <div className="import-panel"><button className="outline wide" onClick={() => importRef.current?.click()}><Upload size={16}/> Importar projeto JSON</button><input ref={importRef} type="file" hidden accept=".json,application/json" onChange={importProject}/></div>
        </div>
      </aside>
      <section className="center-area">
        <div className="canvas-toolbar">
          <div className="device-picker"><button className={device === "mobile" ? "active" : ""} title="Celular" onClick={() => setDevice("mobile")}><Smartphone size={17}/></button><button className={device === "tablet" ? "active" : ""} title="Tablet" onClick={() => setDevice("tablet")}><Tablet size={17}/></button><button className={device === "desktop" ? "active" : ""} title="Desktop" onClick={() => setDevice("desktop")}><Monitor size={17}/></button></div>
          <span className="resolution">{device === "mobile" ? "390 × 844" : device === "tablet" ? "768 × 1024" : "100%"} • Visualização</span>
          <div className="mode-picker"><button className={tab === "editor" ? "active" : ""} onClick={() => setTab("editor")}><MousePointer2 size={15}/> Editor</button><button className={tab === "code" ? "active" : ""} onClick={() => setTab("code")}><Code2 size={15}/> Código</button></div>
        </div>
        {tab === "editor" ? <div className="canvas-scroller">
          <div className={"device-shell " + device}>
            <div className="device-bar"><span/><span/><span/></div>
            <div className="canvas-page" style={{ background: project.page.background, padding: project.page.padding, gap: 0 }} onClick={() => setSelected(null)}>
              <DropZone index={0}/>
              {project.nodes.map((node, index) => <React.Fragment key={node.id}><div className={"rendered-node " + (selected === node.id ? "selected" : "")} style={{ marginBottom: project.page.gap }} draggable onDragStart={e => { e.stopPropagation(); e.dataTransfer.setData("flutternow/node", node.id); }} onClick={e => { e.stopPropagation(); setSelected(node.id); }}><span className="node-tag">{components.find(c => c.type === node.type)?.name}</span>{renderNode(node)}</div><DropZone index={index + 1}/></React.Fragment>)}
              {!project.nodes.length && <div className="empty-canvas">Arraste um componente para começar ✨</div>}
            </div>
          </div>
          <div className="canvas-tip"><Sparkles size={14}/> Selecione um elemento para editar suas propriedades</div>
        </div> : <div className="code-panel"><div className="code-heading"><span>src/App.jsx</span><button onClick={() => navigator.clipboard.writeText(source).then(() => setNotice("Código copiado!"))}><Copy size={15}/> Copiar</button></div><pre><code>{source}</code></pre></div>}
      </section>
      <aside className="sidebar properties-panel">
        <div className="panel-heading"><span><SlidersHorizontal size={16}/> Propriedades</span></div>
        <div className="sidebar-scroller">
          {selectedNode ? <>
            <div className="inspector-title"><span>{components.find(c => c.type === selectedNode.type)?.name}</span><span className="muted">Elemento</span></div>
            {Object.entries(selectedNode.props).map(([key, val]) => <label className="property-field" key={key}><span>{fieldLabels[key] || key}</span>{key === "align" ? <select value={val} onChange={e => updateProp(key, e.target.value)}><option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option></select> : typeof val === "number" ? <input type="number" min="0" max="300" value={val} onChange={e => updateProp(key, Number(e.target.value))}/> : (key === "color" || key === "background") ? <div className="color-field"><input aria-label={fieldLabels[key]} type="color" value={val} onChange={e => updateProp(key, e.target.value)}/><span>{val}</span></div> : <textarea rows={key === "text" ? 3 : 1} value={val} onChange={e => updateProp(key, e.target.value)}/>}</label>)}
            <div className="node-actions"><button onClick={duplicate}><Copy size={15}/> Duplicar</button><button className="danger" onClick={() => remove(selected)}><Trash2 size={15}/> Excluir</button></div>
            <div className="node-actions"><button onClick={() => move(project.nodes.findIndex(n => n.id === selected), -1)}><ChevronUp size={15}/> Subir</button><button onClick={() => move(project.nodes.findIndex(n => n.id === selected), 1)}><ChevronDown size={15}/> Descer</button></div>
          </> : <>
            <div className="inspector-title"><span>Configurações da página</span><span className="muted">Global</span></div>
            <label className="property-field"><span>Cor de fundo</span><div className="color-field"><input type="color" value={project.page.background} onChange={e => updatePage("background", e.target.value)}/><span>{project.page.background}</span></div></label>
            <label className="property-field"><span>Margens internas (px)</span><input type="number" min="0" max="120" value={project.page.padding} onChange={e => updatePage("padding", Number(e.target.value))}/></label>
            <label className="property-field"><span>Espaço entre elementos (px)</span><input type="number" min="0" max="120" value={project.page.gap} onChange={e => updatePage("gap", Number(e.target.value))}/></label>
            <div className="hint-box"><Layers size={17}/> Clique em qualquer elemento na prévia para alterar suas propriedades.</div>
          </>}
          <div className="layers-heading"><Layers size={15}/> Camadas ({project.nodes.length})</div>
          <div className="layers-list">{project.nodes.map(node => <button key={node.id} className={selected === node.id ? "layer active" : "layer"} onClick={() => setSelected(node.id)}><span>{components.find(c => c.type === node.type)?.name}</span><small>{String(node.props.text || "").slice(0, 20)}</small></button>)}</div>
        </div>
      </aside>
    </div>
    {notice && <div role="status" className="toast" onClick={() => setNotice("")}>{notice} <button aria-label="Fechar aviso" onClick={() => setNotice("")}>×</button></div>}
  </div>;
}
