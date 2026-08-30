import { useEffect, useState } from 'react';
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
  const reorderNode = useEditorStore((s) => s.reorderNode);
  const duplicateNode = useEditorStore((s) => s.duplicateNode);
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [dropZone, setDropZone] = useState<'above' | 'inside' | 'below' | null>(null);
  const [search, setSearch] = useState('');
  const [flashId, setFlashId] = useState<number | null>(null);

  // Scroll selected item into view + 300ms flash
  useEffect(() => {
    if (selectedNodeId === null) return;
    const el = document.querySelector(`[data-node-id="${selectedNodeId}"]`);
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
      setFlashId(selectedNodeId);
      const t = setTimeout(() => setFlashId(null), 320);
      return () => clearTimeout(t);
    }
  }, [selectedNodeId, scene]);

  return (
    <div className="panel hierarchy-panel">
      <div className="panel-header">
        <span className="panel-title">Hierarchy</span>
        <div className="panel-actions">
          <button className="panel-btn" onClick={() => addPrimitive('cube')} title="Add Cube">+</button>
        </div>
      </div>
      <div className="hierarchy-search">
        <input
          className="hierarchy-search-input"
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="hierarchy-search-clear" onClick={() => setSearch('')}>x</button>
        )}
      </div>
      <div className="panel-body">
        <HierarchyItem
          node={scene.root}
          scene={scene}
          depth={0}
          filter={search.trim().toLowerCase()}
          selectedId={selectedNodeId}
          onSelect={selectNode}
          onRemove={removeNode}
          onDuplicate={duplicateNode}
          onMove={moveNode}
        onReorder={reorderNode}
        flashId={flashId}
        dropZone={dropZone}
        setDropZone={setDropZone}
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
  filter: string;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onRemove: (id: number) => void;
  onDuplicate: (id: number) => void;
  onMove: (id: number, newParentId: number) => void;
  onReorder: (id: number, parentId: number, index: number) => void;
  flashId: number | null;
  dropZone: 'above' | 'inside' | 'below' | null;
  setDropZone: (z: 'above' | 'inside' | 'below' | null) => void;
  dragId: number | null;
  setDragId: (id: number | null) => void;
  dragOverId: number | null;
  setDragOverId: (id: number | null) => void;
}

function HierarchyItem({
  node,
  scene,
  depth,
  filter,
  selectedId,
  onSelect,
  onRemove,
  onDuplicate,
  onMove,
  dragId,
  setDragId,
  dragOverId,
  setDragOverId,
  onReorder,
  flashId,
  dropZone,
  setDropZone,
}: HierarchyItemProps) {
  const children = scene.getChildren(node.id);
  const isSelected = selectedId === node.id;
  const isRoot = node.id === 0;
  const isDragOver = dragOverId === node.id;
  const isDragging = dragId === node.id;
  const zoneHere = isDragOver ? dropZone : null;

  // Live search filter: show node if it or any descendant matches
  const matchesHere = !filter || node.name.toLowerCase().includes(filter);
  const childMatches = (n: SceneNode): boolean => {
    if (n.name.toLowerCase().includes(filter)) return true;
    return scene.getChildren(n.id).some(childMatches);
  };
  if (filter && !matchesHere && !scene.getChildren(node.id).some(childMatches)) {
    return null;
  }

  return (
    <div className="hierarchy-item-container">
      <div
        data-node-id={node.id}
        className={`hierarchy-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${flashId === node.id ? 'hierarchy-flash' : ''} ${zoneHere === 'above' ? 'drop-above' : ''} ${zoneHere === 'below' ? 'drop-below' : ''} ${zoneHere === 'inside' ? 'drop-inside' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => {
          onSelect(node.id);
          useEditorStore.getState().pingGroundMarker(node.id);
        }}
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
        onDragStart={(e) => {
          if (isRoot) return;
          setDragId(node.id);
          e.dataTransfer.setData('text/x-noise3d-node', String(node.id));
          e.dataTransfer.effectAllowed = 'move';
        }}
        onDragEnd={() => {
          setDragId(null);
          setDragOverId(null);
          setDropZone(null);
        }}
        onDragOver={(e) => {
          if (dragId === null || dragId === node.id) return;
          if (!scene.canReparent(dragId, node.id)) {
            e.dataTransfer.dropEffect = 'none';
            setDropZone(null);
            return;
          }
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          const r = e.currentTarget.getBoundingClientRect();
          const ry = e.clientY - r.top;
          let zone: 'above' | 'inside' | 'below';
          if (isRoot || children.length > 0) zone = 'inside';
          else if (ry < r.height * 0.3) zone = 'above';
          else if (ry > r.height * 0.7) zone = 'below';
          else zone = 'inside';
          setDragOverId(node.id);
          setDropZone(zone);
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (dragId !== null && dragId !== node.id) {
            const targetParent = isRoot ? 0 : node.id;
            if (dropZone === 'above' || dropZone === 'below') {
              // Reorder as sibling next to this node
              const parent = node.parentId ?? 0;
              const siblings = scene.getChildren(parent).map((n) => n.id);
              const idx = siblings.indexOf(node.id);
              onReorder(dragId, parent, dropZone === 'above' ? idx : idx + 1);
            } else if (!isRoot) {
              onMove(dragId, targetParent);
            } else {
              onMove(dragId, 0);
            }
          }
          setDragId(null);
          setDragOverId(null);
          setDropZone(null);
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
          filter={filter}
          selectedId={selectedId}
          onSelect={onSelect}
          onRemove={onRemove}
          onDuplicate={onDuplicate}
          onMove={onMove}
          dragId={dragId}
          setDragId={setDragId}
          dragOverId={dragOverId}
          setDragOverId={setDragOverId}
          onReorder={onReorder}
          flashId={flashId}
          dropZone={dropZone}
          setDropZone={setDropZone}
        />
      ))}
    </div>
  );
}






