import { useState } from 'react';
import { useEditorStore } from '@core/EditorStore';
import { useOverlayStore } from '@core/OverlayStore';
import { Scene } from '@scene/Scene';
import { SceneNode } from '@scene/SceneNode';

export function HierarchyPanel() {
  const scene = useEditorStore((s) => s.scene);
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId);
  const selectNode = useEditorStore((s) => s.selectNode);
  const removeNode = useEditorStore((s) => s.removeNode);
  const addPrimitive = useEditorStore((s) => s.addPrimitive);
  const moveNode = useEditorStore((s) => s.moveNode);
  const duplicateNode = useEditorStore((s) => s.duplicateNode);
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  return (
    <div className="panel hierarchy-panel">
      <div className="panel-header">
        <span className="panel-title">Hierarchy</span>
        <div className="panel-actions">
          <button className="panel-btn" onClick={() => addPrimitive('cube')} title="Add Cube">+</button>
        </div>
      </div>
      <div className="panel-body">
        <HierarchyItem
          node={scene.root}
          scene={scene}
          depth={0}
          selectedId={selectedNodeId}
          onSelect={selectNode}
          onRemove={removeNode}
          onDuplicate={duplicateNode}
          onMove={moveNode}
          dragId={dragId}
          setDragId={setDragId}
          dragOverId={dragOverId}
          setDragOverId={setDragOverId}
        />
      </div>
    </div>
  );
}

interface HierarchyItemProps {
  node: SceneNode;
  scene: Scene;
  depth: number;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onRemove: (id: number) => void;
  onDuplicate: (id: number) => void;
  onMove: (id: number, newParentId: number) => void;
  dragId: number | null;
  setDragId: (id: number | null) => void;
  dragOverId: number | null;
  setDragOverId: (id: number | null) => void;
}

function HierarchyItem({
  node,
  scene,
  depth,
  selectedId,
  onSelect,
  onRemove,
  onDuplicate,
  onMove,
  dragId,
  setDragId,
  dragOverId,
  setDragOverId,
}: HierarchyItemProps) {
  const children = scene.getChildren(node.id);
  const isSelected = selectedId === node.id;
  const isRoot = node.id === 0;
  const isDragOver = dragOverId === node.id;
  const isDragging = dragId === node.id;

  return (
    <div className="hierarchy-item-container">
      <div
        className={`hierarchy-item ${isSelected ? 'selected' : ''} ${isDragOver ? 'drag-over' : ''} ${isDragging ? 'dragging' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(node.id)}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isRoot) return;
          onSelect(node.id);
          const st = useEditorStore.getState();
          useOverlayStore.getState().openMenu(e.clientX, e.clientY, [
            {
              label: 'Rename',
              action: () => {
                st.selectNode(node.id);
                setTimeout(() => {
                  const input = document.querySelector<HTMLInputElement>(
                    '[data-panel-id="inspector"] .inspector-input',
                  );
                  input?.focus();
                  input?.select();
                }, 30);
              },
            },
            { label: 'Duplicate', shortcut: 'Ctrl+D', action: () => st.duplicateNode(node.id) },
            {
              label: 'Move to Root',
              action: () => node.parentId !== 0 && st.moveNode(node.id, 0),
            },
            {
              label: 'Delete',
              shortcut: 'Del',
              danger: true,
              separatorBefore: true,
              action: () => st.removeNode(node.id),
            },
          ]);
        }}
        draggable={!isRoot}
        onDragStart={() => !isRoot && setDragId(node.id)}
        onDragEnd={() => {
          setDragId(null);
          setDragOverId(null);
        }}
        onDragOver={(e) => {
          if (dragId !== null && dragId !== node.id) {
            e.preventDefault();
            setDragOverId(node.id);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (dragId !== null && dragId !== node.id && !isRoot) {
            onMove(dragId, node.id);
          } else if (dragId !== null && isRoot) {
            onMove(dragId, 0);
          }
          setDragId(null);
          setDragOverId(null);
        }}
      >
        <span className="hierarchy-icon">
          {children.length > 0 ? '\u25BE' : '\u2022'}
        </span>
        <span className="hierarchy-label">{node.name}</span>
        {!isRoot && (
          <div className="hierarchy-actions">
            <button
              className="hierarchy-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(node.id);
              }}
              title="Duplicate"
            >
              +
            </button>
            <button
              className="hierarchy-delete"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(node.id);
              }}
              title="Delete"
            >
              x
            </button>
          </div>
        )}
      </div>
      {children.map((child) => (
        <HierarchyItem
          key={child.id}
          node={child}
          scene={scene}
          depth={depth + 1}
          selectedId={selectedId}
          onSelect={onSelect}
          onRemove={onRemove}
          onDuplicate={onDuplicate}
          onMove={onMove}
          dragId={dragId}
          setDragId={setDragId}
          dragOverId={dragOverId}
          setDragOverId={setDragOverId}
        />
      ))}
    </div>
  );
}


