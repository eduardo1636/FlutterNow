import React, { useState } from "react";
import { GripVertical, Plus } from "lucide-react";
import { renderNode } from "../PreviewNode.jsx";
import { componentName, getLayoutCSS, isLayout } from "../layout.js";
import { reactStyle } from "../designSystem.js";

function DropSlot({ parentId, index, onDropItem, preview, horizontal = false }) {
  const [active, setActive] = useState(false);
  if (preview) return null;
  return (
    <div
      role="presentation"
      className={"fn-drop-slot" + (active ? " is-active" : "") + (horizontal ? " horizontal" : "")}
      data-parent-id={parentId}
      data-index={index}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = "move";
        setActive(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setActive(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setActive(false);
        onDropItem(event, parentId, index);
      }}
    >
      <span><Plus size={12} /> Soltar aqui</span>
    </div>
  );
}

function Children({ document, parentId, selectedId, onSelect, onDropItem, preview, depth, device, tokens }) {
  const parent = document.nodes[parentId];
  const row = parent.type === "row";
  return (
    <>
      <DropSlot parentId={parentId} index={0} onDropItem={onDropItem} preview={preview} horizontal={row} />
      {parent.children.map((id, index) => (
        <React.Fragment key={id}>
          <EditableNode
            document={document}
            nodeId={id}
            selectedId={selectedId}
            onSelect={onSelect}
            onDropItem={onDropItem}
            preview={preview}
            depth={depth + 1}
            device={device}
            tokens={tokens}
            inRow={row}
          />
          <DropSlot parentId={parentId} index={index + 1} onDropItem={onDropItem} preview={preview} horizontal={row} />
        </React.Fragment>
      ))}
      {!preview && !parent.children.length && (
        <div className="fn-empty-layout">Arraste componentes para dentro</div>
      )}
    </>
  );
}

export function EditableNode({ document, nodeId, selectedId, onSelect, onDropItem, preview, depth, device, tokens, inRow = false }) {
  const node = document.nodes[nodeId];
  const layout = isLayout(node.type);
  const customStyle = reactStyle(node, device, tokens);
  const wrapperStyle = customStyle.width ? { width: customStyle.width,
    ...(inRow ? { flex: `0 0 ${customStyle.width}` } : {}) } : undefined;
  return (
    <div
      className={"fn-item" + (selectedId === nodeId && !preview ? " is-selected" : "") + (layout ? " is-layout" : "")}
      data-node-id={nodeId}
      style={wrapperStyle}
      draggable={!preview}
      onDragStart={(event) => {
        if (preview) return;
        event.stopPropagation();
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("flutternow/node", nodeId);
      }}
      onClick={(event) => {
        if (!preview) {
          event.stopPropagation();
          onSelect(nodeId);
        }
      }}
    >
      {!preview && <span className="fn-item-tag"><GripVertical size={12} /> {componentName(node.type)}</span>}
      {layout ? (
        <div className={"fn-layout fn-layout-" + node.type} style={getLayoutCSS(node, device, tokens)}>
          <Children
            document={document}
            parentId={nodeId}
            selectedId={selectedId}
            onSelect={onSelect}
            onDropItem={onDropItem}
            preview={preview}
            depth={depth}
            device={device}
            tokens={tokens}
          />
        </div>
      ) : (
        renderNode(node, customStyle)
      )}
    </div>
  );
}

export default function CanvasTree({ document, page, selectedId, onSelect, onDropItem, preview, device, tokens }) {
  return (
    <div
      className={"fn-canvas-root" + (preview ? " fn-canvas-preview" : "")}
      style={{ background: page.style.background, padding: page.style.padding }}
      onClick={() => onSelect(null)}
    >
      <div className="fn-layout fn-layout-root" style={{ gap: page.style.gap }}>
        <Children
          document={document}
          parentId={page.rootId}
          selectedId={selectedId}
          onSelect={onSelect}
          onDropItem={onDropItem}
          preview={preview}
          depth={0}
          device={device}
          tokens={tokens}
        />
      </div>
    </div>
  );
}
