import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Blocks, Smartphone, Tablet, Monitor, Save, Download, Code2, Eye, Undo2, Redo2,
  Trash2, Copy, Plus, GripVertical, ChevronUp, ChevronDown, Layers, SlidersHorizontal,
  MousePointer2, FileJson, Upload, Sparkles, ZoomIn, ZoomOut, Palette, FolderTree,
} from "lucide-react";

import { components, fieldLabels, newId } from "./editor/project.js";
import { createSession, reduceSession } from "./core/session";
import { loadStoredDocument, saveStoredDocument } from "./core/persistence";
import { parseDocumentJSON, serializeDocument, toLegacyProjection } from "./core/document";
import { generateCode } from "./editor/codegen.js";
import { downloadFile } from "./editor/download.js";
import {
  createWidget, isLayout, componentName, findParentInfo, containsNode,
} from "./editor/layout.js";
import CanvasTree from "./editor/canvas/CanvasTree.jsx";
import LayerTree from "./editor/canvas/LayerTree.jsx";
import DesignPanel from "./editor/DesignPanel.jsx";
import ResponsiveInspector from "./editor/ResponsiveInspector.jsx";
import { mergedTokens, hasStyleOverrides, hasCustomizedTokens } from "./editor/designSystem.js";

const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
const isEditingInput = (target) =>
  target instanceof HTMLElement &&
  (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable);

function ancestorsOf(document, selectedId, rootId) {
  const result = [];
  let cursor = selectedId;
  let attempts = 0;
  while (cursor && cursor !== rootId && attempts++ < 32) {
    result.unshift(cursor);
    cursor = findParentInfo(document, cursor)?.id;
  }
  return result;
}

export default function App() {
  const [bootstrap] = useState(() => loadStoredDocument(localStorage));
  const [session, setSession] = useState(() => createSession(bootstrap.document));
  const sessionRef = useRef(session);
  const [storageLocked, setStorageLocked] = useState(bootstrap.locked);
  const [saveFailed, setSaveFailed] = useState(bootstrap.locked);
  const [selected, setSelected] = useState(null);
  const [device, setDevice] = useState("mobile");
  const [mode, setMode] = useState("editor");
  const [sideTab, setSideTab] = useState("components");
  const [zoom, setZoom] = useState(100);
  const [collapsed, setCollapsed] = useState(new Set());
  const [notice, setNotice] = useState(bootstrap.warning || "");
  const importRef = useRef(null);

  const document = session.present;
  const activePage = document.pages.find(page => page.id === document.activePageId);
  const rootId = activePage.rootId;
  const selectedNode = selected ? document.nodes[selected] : null;
  const parentInfo = selectedNode ? findParentInfo(document, selected) : null;
  const tokens = useMemo(() => mergedTokens(document), [document]);
  const hasNestedNodes = document.pages.length > 1 ||
    Object.values(document.nodes).some(node => isLayout(node.type) && node.id !== rootId);
  const requiresModernExporter = hasNestedNodes || hasStyleOverrides(document) || hasCustomizedTokens(document);
  const source = useMemo(() => requiresModernExporter ? null : generateCode(toLegacyProjection(document)),
    [document, requiresModernExporter]);
  const ancestors = selected ? ancestorsOf(document, selected, rootId) : [];

  useEffect(() => {
    if (storageLocked) return;
    try {
      saveStoredDocument(localStorage, document);
      setSaveFailed(false);
    } catch {
      setSaveFailed(true);
      setNotice("O navegador não conseguiu salvar. Exporte um backup JSON.");
    }
  }, [document, storageLocked]);

  function dispatch(action) {
    try {
      const next = reduceSession(sessionRef.current, action);
      sessionRef.current = next;
      setSession(next);
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Operação inválida");
      return false;
    }
  }
  function commit(command) {
    return dispatch({ type: "commit", command });
  }
  function select(id) {
    setSelected(id);
  }
  function add(type, parentId, index) {
    const target = parentId || (selectedNode && isLayout(selectedNode.type) ? selected : rootId);
    const parent = document.nodes[target];
    if (!parent || !isLayout(parent.type)) {
      setNotice("Escolha uma coluna, linha ou container para adicionar elementos.");
      return;
    }
    const insertionIndex = index ?? parent.children.length;
    const id = newId();
    if (commit({ type: "insert", parentId: target, index: insertionIndex, node: createWidget(id, type) })) {
      setSelected(id);
      setMode("editor");
    }
  }
  function updateProp(key, value) {
    if (selectedNode) commit({ type: "setProp", nodeId: selected, key, value });
  }
  function updateStyle(key, value) {
    if (selectedNode) commit({ type: "setStyle", nodeId: selected,
      breakpoint: device === "mobile" ? "base" : device, key, value });
  }
  function resetStyles() {
    if (!selectedNode) return;
    const breakpoint = device === "mobile" ? "base" : device;
    const existing = selectedNode.styles[breakpoint] || {};
    const commands = Object.keys(existing).map(key => ({ type: "setStyle",
      nodeId: selected, breakpoint, key, value: null }));
    if (commands.length) commit({ type: "batch", commands });
  }
  function updateToken(key, value) {
    commit({ type: "setToken", key, value });
  }
  function updatePage(key, value) {
    const normalized = key === "background" ? value : clamp(value, 0, 300);
    commit({ type: "setPageStyle", pageId: document.activePageId, key, value: normalized });
  }
  function moveSelected(delta) {
    if (!parentInfo) return;
    const parent = document.nodes[parentInfo.id];
    const next = parentInfo.index + delta;
    if (next < 0 || next >= parent.children.length) return;
    const index = delta > 0 ? next + 1 : next;
    commit({ type: "move", nodeId: selected, parentId: parentInfo.id, index });
  }
  function moveToParent(target) {
    if (!selectedNode || !document.nodes[target]) return;
    if (commit({ type: "move", nodeId: selected, parentId: target,
      index: document.nodes[target].children.length })) setSideTab("layers");
  }
  function removeSelected() {
    if (selectedNode && commit({ type: "remove", nodeId: selected })) setSelected(null);
  }
  function duplicate() {
    if (!selectedNode) return;
    const id = newId();
    if (commit({ type: "duplicate", nodeId: selected, newId: id })) setSelected(id);
  }
  function undo() {
    if (dispatch({ type: "undo" })) setSelected(null);
  }
  function redo() {
    if (dispatch({ type: "redo" })) setSelected(null);
  }
  function importProject(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    file.text().then(value => {
      try {
        const imported = parseDocumentJSON(value);
        const fresh = createSession(imported);
        sessionRef.current = fresh;
        setSession(fresh);
        setStorageLocked(false);
        setSelected(null);
        setNotice("Projeto importado com sucesso.");
        setSideTab("layers");
      } catch {
        setNotice("Arquivo de projeto inválido. Seu projeto atual foi preservado.");
      }
    }).catch(() => setNotice("Não foi possível ler o arquivo.")).finally(() => {
      event.target.value = "";
    });
  }
  function onDropItem(event, parentId, index) {
    const type = event.dataTransfer.getData("flutternow/type");
    const nodeId = event.dataTransfer.getData("flutternow/node");
    if (type) {
      add(type, parentId, index);
    } else if (nodeId && document.nodes[nodeId]) {
      if (commit({ type: "move", nodeId, parentId, index })) {
        setSelected(nodeId);
        setSideTab("layers");
      }
    }
  }
  function toggleCollapsed(id) {
    setCollapsed(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  useEffect(() => {
    function onKeyDown(event) {
      if (isEditingInput(event.target)) return;
      const mod = event.ctrlKey || event.metaKey;
      if (mod && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo(); else undo();
      } else if (mod && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      } else if (event.key === "Escape") {
        setSelected(null);
      } else if ((event.key === "Delete" || event.key === "Backspace") && selected) {
        event.preventDefault();
        removeSelected();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const categories = [...new Set(components.map(c => c.category))];
  const availableParents = Object.values(document.nodes).filter(n =>
    isLayout(n.type) && containsNode(document, rootId, n.id) &&
    (!selectedNode || !containsNode(document, selected, n.id)));
  const layout = selectedNode && isLayout(selectedNode.type);
  const sizeLabel = device === "mobile" ? "390 px" : device === "tablet" ? "768 px" : "Tela ampla";

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-logo"><Blocks size={19} /></div>
          <span>Flutter<span className="brand-accent">Now</span></span><span className="version">F02</span>
        </div>
        <div className="project-name">
          <input aria-label="Nome do projeto" maxLength={200} value={document.name}
            onChange={event => commit({ type: "setName", value: event.target.value })} />
          <span className="saved"><Save size={13} />
            {storageLocked ? "Modo protegido — importe JSON" :
              saveFailed ? "Falha no salvamento — faça backup" : "Salvo automaticamente"}
          </span>
        </div>
        <div className="top-actions">
          <button title="Desfazer" disabled={!session.past.length} onClick={undo}><Undo2 size={17} /></button>
          <button title="Refazer" disabled={!session.future.length} onClick={redo}><Redo2 size={17} /></button>
          <span className="top-separator" />
          <button onClick={() => {
            downloadFile("flutternow-projeto.json", serializeDocument(document), "application/json");
            setNotice("Backup JSON exportado.");
          }}><FileJson size={16} /> <span>Projeto</span></button>
          <button className="primary" disabled={Boolean(requiresModernExporter)} title={requiresModernExporter ?
            "Exportador de layouts aninhados estará disponível em etapa posterior" : "Exportar componente React"}
            onClick={() => { if (source) downloadFile("App.jsx", source, "text/javascript"); }}>
            <Download size={16} /> Exportar código
          </button>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar components-panel">
          <div className="panel-heading fn-panel-tabs">
            <button className={sideTab === "components" ? "current" : ""} onClick={() => setSideTab("components")}>
              <Blocks size={15} /> Componentes
            </button>
            <button className={sideTab === "layers" ? "current" : ""} onClick={() => setSideTab("layers")}>
              <FolderTree size={15} /> Árvore
            </button>
            <button className={sideTab === "design" ? "current" : ""} onClick={() => setSideTab("design")}>
              <Palette size={15} /> Design
            </button>
          </div>
          <div className="sidebar-scroller">
            {sideTab === "components" ? <>
              <p className="helper">Arraste para qualquer container ou clique para adicionar ao elemento selecionado.</p>
              {categories.map(category => (
                <section className="component-group" key={category}>
                  <h3>{category}</h3>
                  <div className="component-list">{components.filter(c => c.category === category).map(component => (
                    <button className="component-item" key={component.type} draggable
                      onDragStart={event => {
                        event.dataTransfer.effectAllowed = "copy";
                        event.dataTransfer.setData("flutternow/type", component.type);
                      }} onClick={() => add(component.type)}>
                      <span className="component-icon"><Plus size={15} /></span>
                      {component.name}<GripVertical className="component-grip" size={14} />
                    </button>
                  ))}</div>
                </section>
              ))}
              <div className="import-panel">
                <button className="outline wide" onClick={() => importRef.current?.click()}>
                  <Upload size={16} /> Importar projeto JSON
                </button>
                <input ref={importRef} type="file" hidden accept=".json,application/json" onChange={importProject} />
              </div>
            </> : sideTab === "layers" ? <>
              <p className="helper">Clique para selecionar. Arraste componentes para reorganizar. Solte sobre o ícone de um container para movê-lo para dentro.</p>
              <LayerTree document={document} rootId={rootId} selectedId={selected} onSelect={select}
                onDropItem={onDropItem} collapsed={collapsed} toggle={toggleCollapsed} />
            </> : <DesignPanel document={document} onToken={updateToken} onBatch={commit} />}
          </div>
        </aside>

        <section className="center-area">
          <div className="canvas-toolbar">
            <div className="device-picker">
              <button title="Celular" className={device === "mobile" ? "active" : ""} onClick={() => setDevice("mobile")}><Smartphone size={17} /></button>
              <button title="Tablet" className={device === "tablet" ? "active" : ""} onClick={() => setDevice("tablet")}><Tablet size={17} /></button>
              <button title="Desktop" className={device === "desktop" ? "active" : ""} onClick={() => setDevice("desktop")}><Monitor size={17} /></button>
            </div>
            <span className="resolution">{sizeLabel}</span>
            <div className="fn-zoom-control">
              <button title="Diminuir zoom" onClick={() => setZoom(z => clamp(z - 10, 50, 150))}><ZoomOut size={14} /></button>
              <span>{zoom}%</span>
              <button title="Aumentar zoom" onClick={() => setZoom(z => clamp(z + 10, 50, 150))}><ZoomIn size={14} /></button>
            </div>
            <div className="mode-picker">
              <button className={mode === "editor" ? "active" : ""} onClick={() => setMode("editor")}><MousePointer2 size={15} /> Editor</button>
              <button className={mode === "preview" ? "active" : ""} onClick={() => setMode("preview")}><Eye size={15} /> Prévia</button>
              <button className={mode === "code" ? "active" : ""} onClick={() => setMode("code")}><Code2 size={15} /> Código</button>
            </div>
          </div>
          {mode !== "code" ? (
            <div className="canvas-scroller fn-canvas-scroller">
              <div className="fn-zoom-stage" style={{
                transform: "scale(" + zoom / 100 + ")",
                transformOrigin: "top center",
                width: device === "desktop" ? "100%" : device === "tablet" ? 768 : 390,
              }}>
                <div className={"device-shell " + device}>
                  <div className="device-bar"><span /><span /><span /></div>
                  <CanvasTree document={document} page={activePage} selectedId={selected}
                    onSelect={select} onDropItem={onDropItem} preview={mode === "preview"}
                    device={device} tokens={tokens} />
                </div>
              </div>
              <div className="canvas-tip"><Sparkles size={14} />
                {mode === "preview" ? "Prévia visual do layout; ações interativas serão adicionadas mais tarde." :
                  "Selecione um elemento para editar. Arraste para aninhar e reordenar."}
              </div>
            </div>
          ) : (
            <div className="code-panel">
              <div className="code-heading"><span>src/App.jsx</span>
                {!requiresModernExporter && <button onClick={() => navigator.clipboard.writeText(source).then(() => setNotice("Código copiado!")).catch(() => setNotice("Não foi possível copiar."))}><Copy size={15} /> Copiar</button>}
              </div>
              {requiresModernExporter ?
                <div className="code-unavailable">O documento completo está disponível no botão <strong>Projeto</strong>.
                  O gerador React atual não contempla todos os recursos de layout, responsividade e tokens; a exportação completa estará na F07.</div> :
                <pre><code>{source}</code></pre>}
            </div>
          )}
        </section>

        <aside className="sidebar properties-panel">
          <div className="panel-heading"><span><SlidersHorizontal size={16} /> Propriedades</span></div>
          <div className="sidebar-scroller">
            {selectedNode ? <>
              <div className="fn-breadcrumbs"><button onClick={() => setSelected(null)}>Raiz</button>
                {ancestors.map(id => <React.Fragment key={id}>
                  <span>›</span><button className={id === selected ? "active" : ""}
                    onClick={() => setSelected(id)}>{componentName(document.nodes[id].type)}</button>
                </React.Fragment>)}
              </div>
              <div className="inspector-title"><span>{componentName(selectedNode.type)}</span><span className="muted">Elemento</span></div>
              {layout && <div className="hint-box"><Layers size={17} /> Contém {selectedNode.children.length} componente(s). Use os estilos responsivos abaixo para ajustar o layout.</div>}
              {!layout && Object.entries(selectedNode.props).map(([key, value]) => (
                <label className="property-field" key={key}>
                  <span>{fieldLabels[key] || key}</span>
                  {key === "align" ? (
                    <select value={value} onChange={event => updateProp(key, event.target.value)}>
                      <option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option>
                    </select>
                  ) : typeof value === "number" ? (
                    <input type="number" min="0" max="300" value={value}
                      onChange={event => updateProp(key, clamp(event.target.value, 0, 300))} />
                  ) : key === "color" || key === "background" ? (
                    <div className="color-field"><input type="color" value={value}
                      onChange={event => updateProp(key, event.target.value)} /><span>{value}</span></div>
                  ) : (
                    <textarea rows={key === "text" ? 3 : 1} maxLength={5000}
                      value={value} onChange={event => updateProp(key, event.target.value)} />
                  )}
                </label>
              ))}
              <ResponsiveInspector node={selectedNode} device={device} tokens={tokens}
                onStyle={updateStyle} onReset={resetStyles} />
              {parentInfo && <label className="property-field"><span>Container pai</span>
                <select value={parentInfo.id} onChange={event => moveToParent(event.target.value)}>
                  {availableParents.map(n => <option key={n.id} value={n.id}>{n.id === rootId ? "Raiz da página" : componentName(n.type) + " • " + n.id.slice(0, 8)}</option>)}
                </select>
              </label>}
              <div className="node-actions">
                <button onClick={duplicate}><Copy size={15} /> Duplicar</button>
                <button className="danger" onClick={removeSelected}><Trash2 size={15} /> Excluir</button>
              </div>
              <div className="node-actions">
                <button disabled={!parentInfo || parentInfo.index === 0} onClick={() => moveSelected(-1)}><ChevronUp size={15} /> Subir</button>
                <button disabled={!parentInfo || parentInfo.index === document.nodes[parentInfo.id].children.length - 1}
                  onClick={() => moveSelected(1)}><ChevronDown size={15} /> Descer</button>
              </div>
            </> : <>
              <div className="inspector-title"><span>Configurações da página</span><span className="muted">Global</span></div>
              <label className="property-field"><span>Cor de fundo</span>
                <div className="color-field"><input type="color" value={activePage.style.background}
                  onChange={event => updatePage("background", event.target.value)} />
                  <span>{activePage.style.background}</span></div>
              </label>
              <label className="property-field"><span>Margens da página (px)</span>
                <input type="number" min="0" max="300" value={activePage.style.padding}
                  onChange={event => updatePage("padding", event.target.value)} /></label>
              <label className="property-field"><span>Espaçamento da raiz (px)</span>
                <input type="number" min="0" max="300" value={activePage.style.gap}
                  onChange={event => updatePage("gap", event.target.value)} /></label>
              <div className="hint-box"><Layers size={17} /> Selecione elementos no canvas ou na árvore para personalizá-los.</div>
            </>}
            <div className="layers-heading"><Layers size={15} /> Estrutura ({Object.keys(document.nodes).length - document.pages.length} nós)</div>
            <LayerTree document={document} rootId={rootId} selectedId={selected} onSelect={select}
              onDropItem={onDropItem} collapsed={collapsed} toggle={toggleCollapsed} />
          </div>
        </aside>
      </div>
      {notice && <div role="status" className="toast">{notice}
        <button aria-label="Fechar aviso" onClick={() => setNotice("")}>×</button></div>}
    </div>
  );
}
