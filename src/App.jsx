import React, { useEffect, useMemo, useRef, useState } from "react";
import { Blocks, Smartphone, Tablet, Monitor, Save, Download, Code2, Undo2, Redo2, Trash2, Copy, Plus, GripVertical, ChevronUp, ChevronDown, Layers, SlidersHorizontal, MousePointer2, FileJson, Upload, Sparkles } from "lucide-react";

import { components, fieldLabels, newId } from "./editor/project.js";
import { createSession, reduceSession } from "./core/session";
import { loadStoredDocument, saveStoredDocument } from "./core/persistence";
import { parseDocumentJSON, serializeDocument, toLegacyProjection, nodeFromLegacy, CONTAINER_TYPES } from "./core/document";
import { renderNode } from "./editor/PreviewNode.jsx";
import { generateCode } from "./editor/codegen.js";
import { downloadFile } from "./editor/download.js";

export default function App() {
  const [bootstrap] = useState(() => loadStoredDocument(localStorage));
  const [session, setSession] = useState(() => createSession(bootstrap.document));
  const [storageLocked, setStorageLocked] = useState(bootstrap.locked);
  const [saveFailed, setSaveFailed] = useState(bootstrap.locked);
  const document = session.present;
  const project = useMemo(() => toLegacyProjection(document), [document]);
  const activePage = document.pages.find(page => page.id === document.activePageId);
  const rootId = activePage.rootId;
  const hasNestedNodes = document.pages.length > 1 || Object.values(document.nodes).some(node =>
    CONTAINER_TYPES.has(node.type) && node.id !== rootId);
  const [selected, setSelected] = useState(null);
  const [device, setDevice] = useState("mobile");
  const [tab, setTab] = useState("editor");
  const [notice, setNotice] = useState(bootstrap.warning || "");
  const importRef = useRef(null);
  const selectedNode = project.nodes.find(n => n.id === selected);
  const source = useMemo(() => generateCode(project), [project]);
  useEffect(() => {
    if (storageLocked) return;
    try { saveStoredDocument(localStorage, document); setSaveFailed(false); }
    catch { setSaveFailed(true); setNotice("Falha ao salvar! Exporte um backup JSON do projeto."); }
  }, [document, storageLocked]);
  function commit(command) {
    setSession(current => reduceSession(current, { type: "commit", command }));
  }
  function add(type, index = project.nodes.length) {
    const definition = components.find(c => c.type === type);
    if (!definition) return;
    const id = newId();
    commit({ type: "insert", parentId: rootId, index,
      node: nodeFromLegacy(id, type, definition.defaults) });
    setSelected(id); setTab("editor");
  }
  function updateProp(key, value) {
    if (selectedNode) commit({ type: "setProp", nodeId: selected, key, value });
  }
  function updatePage(key, value) {
    const valid = key === "background" ? value : Math.max(0, Math.min(300, Number(value) || 0));
    commit({ type: "setPageStyle", pageId: document.activePageId, key, value: valid });
  }
  function move(index, delta) {
    const next = index + delta;
    if (next < 0 || next >= project.nodes.length) return;
    commit({ type: "move", nodeId: project.nodes[index].id, parentId: rootId,
      index: delta > 0 ? next + 1 : next });
  }
  function remove(id) {
    commit({ type: "remove", nodeId: id });
    setSelected(null);
  }
  function duplicate() {
    if (!selectedNode) return;
    const id = newId();
    commit({ type: "duplicate", nodeId: selected, newId: id });
    setSelected(id);
  }
  function undo() {
    setSession(current => reduceSession(current, { type: "undo" }));
    setSelected(null);
  }
  function redo() {
    setSession(current => reduceSession(current, { type: "redo" }));
    setSelected(null);
  }
  function importProject(event) {
    const file = event.target.files?.[0]; if (!file) return;
    file.text().then(value => {
      try {
        const data = parseDocumentJSON(value);
        setStorageLocked(false);
        commit({ type: "replace", document: data });
        setSelected(null);
        setNotice("Projeto importado!");
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
      commit({ type: "move", nodeId: id, parentId: rootId, index });
    }
  }
  function DropZone({ index }) { return <div className="drop-zone" onDragOver={e => e.preventDefault()} onDrop={e => onDrop(e, index)} aria-label="Solte um componente aqui"><span>+ Soltar aqui</span></div>; }
  const categories = [...new Set(components.map(c => c.category))];
  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-logo"><Blocks size={19}/></div><span>Flutter<span className="brand-accent">Now</span></span><span className="version">BETA</span></div>
      <div className="project-name"><input aria-label="Nome do projeto" value={project.name} maxLength={200} onChange={e => commit({ type: "setName", value: e.target.value })}/><span className="saved"><Save size={13}/> {storageLocked ? "Modo protegido — importe um backup" : saveFailed ? "Falha ao salvar — faça backup" : "Salvo automaticamente"}</span></div>
      <div className="top-actions">
        <button title="Desfazer" disabled={!session.past.length} onClick={undo}><Undo2 size={17}/></button>
        <button title="Refazer" disabled={!session.future.length} onClick={redo}><Redo2 size={17}/></button>
        <span className="top-separator"/>
        <button onClick={() => { downloadFile("flutternow-project-v1.json", serializeDocument(document), "application/json"); setNotice("Projeto exportado!"); }}><FileJson size={16}/> <span>Projeto</span></button>
        <button className="primary" disabled={hasNestedNodes} title={hasNestedNodes ? "Exportação de páginas e containers será implementada no gerador completo" : "Exportar componente React"} onClick={() => { downloadFile("App.jsx", source, "text/javascript"); setNotice("Código React exportado!"); }}><Download size={16}/> Exportar código</button>
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
        {hasNestedNodes && <div role="status" className="compat-warning">Este projeto contém páginas ou containers aninhados. A versão F01 apresenta apenas os elementos do primeiro nível da página ativa. O conteúdo completo está preservado no JSON; a edição visual aninhada virá na F02.</div>}
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
        </div> : <div className="code-panel"><div className="code-heading"><span>src/App.jsx</span>{!hasNestedNodes && <button onClick={() => navigator.clipboard.writeText(source).then(() => setNotice("Código copiado!"))}><Copy size={15}/> Copiar</button>}</div>{hasNestedNodes ? <div className="code-unavailable">A geração completa de código React para projetos com páginas ou containers aninhados chegará na F07. Exporte o JSON para manter todas as informações.</div> : <pre><code>{source}</code></pre>}</div>}
      </section>
      <aside className="sidebar properties-panel">
        <div className="panel-heading"><span><SlidersHorizontal size={16}/> Propriedades</span></div>
        <div className="sidebar-scroller">
          {selectedNode ? <>
            <div className="inspector-title"><span>{components.find(c => c.type === selectedNode.type)?.name}</span><span className="muted">Elemento</span></div>
            {Object.entries(selectedNode.props).map(([key, val]) => <label className="property-field" key={key}><span>{fieldLabels[key] || key}</span>{key === "align" ? <select value={val} onChange={e => updateProp(key, e.target.value)}><option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option></select> : typeof val === "number" ? <input type="number" min="0" max="300" value={val} onChange={e => updateProp(key, Number(e.target.value))}/> : (key === "color" || key === "background") ? <div className="color-field"><input aria-label={fieldLabels[key]} type="color" value={val} onChange={e => updateProp(key, e.target.value)}/><span>{val}</span></div> : <textarea rows={key === "text" ? 3 : 1} maxLength={5000} value={val} onChange={e => updateProp(key, e.target.value)}/>}</label>)}
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
