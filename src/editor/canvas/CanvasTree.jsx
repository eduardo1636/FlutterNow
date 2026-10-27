import React, { useState } from "react";
import { GripVertical, Plus } from "lucide-react";
import { renderNode } from "../PreviewNode.jsx";
import { componentName, getLayoutCSS, isLayout } from "../layout.js";

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

function Children({ document, parentId, selectedId, onSelect, onDropItem, preview, depth }) {
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

export function EditableNode({ document, nodeId, selectedId, onSelect, onDropItem, preview, depth }) {
  const node = document.nodes[nodeId];
  const layout = isLayout(node.type);
  return (
    <div
      className={"fn-item" + (selectedId === nodeId && !preview ? " is-selected" : "") + (layout ? " is-layout" : "")}
      data-node-id={nodeId}
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
        <div className={"fn-layout fn-layout-" + node.type} style={getLayoutCSS(node)}>
          <Children
            document={document}
            parentId={nodeId}
            selectedId={selectedId}
            onSelect={onSelect}
            onDropItem={onDropItem}
            preview={preview}
            depth={depth}
          />
        </div>
      ) : (
        renderNode(node)
      )}
    </div>
  );
}

export default function CanvasTree({ document, page, selectedId, onSelect, onDropItem, preview }) {
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
        />
      </div>
    </div>
  );
}
