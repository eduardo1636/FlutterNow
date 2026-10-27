import React from "react";
import { ChevronDown, ChevronRight, GripVertical, Layers3 } from "lucide-react";
import { componentName, isLayout } from "../layout.js";

function Branch({ document, nodeId, selectedId, onSelect, onDropItem, depth, collapsed, toggle }) {
  const node = document.nodes[nodeId];
  const container = isLayout(node.type);
  const closed = collapsed.has(nodeId);
  return (
    <div>
      <div
        className={"fn-layer-row" + (nodeId === selectedId ? " active" : "")}
        style={{ paddingLeft: 8 + depth * 13 }}
      >
        <button
          className="fn-layer-toggle"
          aria-label={container ? (closed ? "Expandir" : "Recolher") : "Componente"}
          disabled={!container}
          onClick={() => toggle(nodeId)}
        >
          {container ? (closed ? <ChevronRight size={14} /> : <ChevronDown size={14} />) : <GripVertical size={13} />}
        </button>
        <button
          className="fn-layer-select"
          draggable
          onDragStart={e => { e.stopPropagation(); e.dataTransfer.setData("flutternow/node", nodeId); }}
          onClick={() => onSelect(nodeId)}
        >{componentName(node.type)} <small>{node.type === "text" || node.type === "heading" ? String(node.props.text || "").slice(0, 16) : ""}</small></button>
        {container && <button
          title="Soltar dentro deste container"
          className="fn-layer-target"
          onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={e => { e.preventDefault(); e.stopPropagation(); onDropItem(e, nodeId, node.children.length); }}
          aria-label={"Adicionar em " + componentName(node.type)}
        ><Layers3 size={13} /></button>}
      </div>
      {container && !closed && node.children.map(childId => (
        <Branch key={childId} document={document} nodeId={childId} selectedId={selectedId}
          onSelect={onSelect} onDropItem={onDropItem} depth={depth + 1} collapsed={collapsed} toggle={toggle} />
      ))}
    </div>
  );
}
export default function LayerTree({ document, rootId, selectedId, onSelect, onDropItem, collapsed, toggle }) {
  const root = document.nodes[rootId];
  return <div className="fn-tree" role="tree" aria-label="Árvore de componentes">
    {root.children.length ? root.children.map(id => (
      <Branch key={id} document={document} nodeId={id} selectedId={selectedId}
        onSelect={onSelect} onDropItem={onDropItem} depth={0} collapsed={collapsed} toggle={toggle} />
    )) : <span className="fn-tree-empty">Nenhum componente nesta página.</span>}
    <div className="fn-root-target" onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); onDropItem(e, rootId, root.children.length); }}>
      Solte aqui para inserir na raiz
    </div>
  </div>;
}
