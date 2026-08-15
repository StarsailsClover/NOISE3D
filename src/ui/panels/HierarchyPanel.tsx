import { useEditorStore } from '@core/EditorStore';
import { Scene } from '@scene/Scene';
import { SceneNode } from '@scene/SceneNode';

export function HierarchyPanel() {
  const scene = useEditorStore((s) => s.scene);
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId);
  const selectNode = useEditorStore((s) => s.selectNode);
  const removeNode = useEditorStore((s) => s.removeNode);
  const addPrimitive = useEditorStore((s) => s.addPrimitive);

  return (
    <div className="panel hierarchy-panel">
      <div className="panel-header">
        <span className="panel-title">Hierarchy</span>
        <div className="panel-actions">
          <button
            className="panel-btn"
            onClick={() => addPrimitive('cube')}
            title="Add Cube"
          >
            +
          </button>
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
}

function HierarchyItem({
  node,
  scene,
  depth,
  selectedId,
  onSelect,
  onRemove,
}: HierarchyItemProps) {
  const children = scene.getChildren(node.id);
  const isSelected = selectedId === node.id;
  const isRoot = node.id === 0;

  return (
    <div className="hierarchy-item-container">
      <div
        className={`hierarchy-item ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(node.id)}
      >
        <span className="hierarchy-icon">
          {children.length > 0 ? '\u25BE' : '\u2022'}
        </span>
        <span className="hierarchy-label">{node.name}</span>
        {!isRoot && (
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
        />
      ))}
    </div>
  );
}
