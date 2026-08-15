import { useEditorStore } from '@core/EditorStore';
import { Vec3 } from '@math/Vec';

export function InspectorPanel() {
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId);
  const scene = useEditorStore((s) => s.scene);
  const updateNodeTransform = useEditorStore((s) => s.updateNodeTransform);
  const renameNode = useEditorStore((s) => s.renameNode);
  const setMaterial = useEditorStore((s) => s.setMaterial);
  const materials = useEditorStore((s) => s.materials);

  if (selectedNodeId === null) {
    return (
      <div className="panel inspector-panel">
        <div className="panel-header">
          <span className="panel-title">Inspector</span>
        </div>
        <div className="panel-body">
          <div className="inspector-empty">No object selected</div>
        </div>
      </div>
    );
  }

  const node = scene.getNode(selectedNodeId);
  if (!node) {
    return (
      <div className="panel inspector-panel">
        <div className="panel-header">
          <span className="panel-title">Inspector</span>
        </div>
        <div className="panel-body">
          <div className="inspector-empty">Object not found</div>
        </div>
      </div>
    );
  }

  const material = materials.get(node.id);

  return (
    <div className="panel inspector-panel">
      <div className="panel-header">
        <span className="panel-title">Inspector</span>
      </div>
      <div className="panel-body">
        <div className="inspector-section">
          <label className="inspector-label">Name</label>
          <input
            className="inspector-input"
            type="text"
            value={node.name}
            onChange={(e) => renameNode(node.id, e.target.value)}
          />
        </div>

        <div className="inspector-section">
          <label className="inspector-label">Position</label>
          <div className="inspector-vec3">
            <input
              className="inspector-number"
              type="number"
              step="0.1"
              value={node.position.x}
              onChange={(e) =>
                updateNodeTransform(
                  node.id,
                  new Vec3(parseFloat(e.target.value) || 0, node.position.y, node.position.z),
                )
              }
            />
            <input
              className="inspector-number"
              type="number"
              step="0.1"
              value={node.position.y}
              onChange={(e) =>
                updateNodeTransform(
                  node.id,
                  new Vec3(node.position.x, parseFloat(e.target.value) || 0, node.position.z),
                )
              }
            />
            <input
              className="inspector-number"
              type="number"
              step="0.1"
              value={node.position.z}
              onChange={(e) =>
                updateNodeTransform(
                  node.id,
                  new Vec3(node.position.x, node.position.y, parseFloat(e.target.value) || 0),
                )
              }
            />
          </div>
        </div>

        <div className="inspector-section">
          <label className="inspector-label">Rotation</label>
          <div className="inspector-vec3">
            <input
              className="inspector-number"
              type="number"
              step="0.1"
              value={node.rotation.x.toFixed(2)}
              onChange={(e) =>
                updateNodeTransform(
                  node.id,
                  undefined,
                  new Vec3(parseFloat(e.target.value) || 0, node.rotation.y, node.rotation.z),
                )
              }
            />
            <input
              className="inspector-number"
              type="number"
              step="0.1"
              value={node.rotation.y.toFixed(2)}
              onChange={(e) =>
                updateNodeTransform(
                  node.id,
                  undefined,
                  new Vec3(node.rotation.x, parseFloat(e.target.value) || 0, node.rotation.z),
                )
              }
            />
            <input
              className="inspector-number"
              type="number"
              step="0.1"
              value={node.rotation.z.toFixed(2)}
              onChange={(e) =>
                updateNodeTransform(
                  node.id,
                  undefined,
                  new Vec3(node.rotation.x, node.rotation.y, parseFloat(e.target.value) || 0),
                )
              }
            />
          </div>
        </div>

        <div className="inspector-section">
          <label className="inspector-label">Scale</label>
          <div className="inspector-vec3">
            <input
              className="inspector-number"
              type="number"
              step="0.1"
              value={node.scale.x.toFixed(2)}
              onChange={(e) =>
                updateNodeTransform(
                  node.id,
                  undefined,
                  undefined,
                  new Vec3(parseFloat(e.target.value) || 0.01, node.scale.y, node.scale.z),
                )
              }
            />
            <input
              className="inspector-number"
              type="number"
              step="0.1"
              value={node.scale.y.toFixed(2)}
              onChange={(e) =>
                updateNodeTransform(
                  node.id,
                  undefined,
                  undefined,
                  new Vec3(node.scale.x, parseFloat(e.target.value) || 0.01, node.scale.z),
                )
              }
            />
            <input
              className="inspector-number"
              type="number"
              step="0.1"
              value={node.scale.z.toFixed(2)}
              onChange={(e) =>
                updateNodeTransform(
                  node.id,
                  undefined,
                  undefined,
                  new Vec3(node.scale.x, node.scale.y, parseFloat(e.target.value) || 0.01),
                )
              }
            />
          </div>
        </div>

        {material && (
          <div className="inspector-section">
            <label className="inspector-label">Material</label>
            <label className="inspector-sublabel">Base Color</label>
            <input
              className="inspector-color"
              type="color"
              value={material.baseColor.toHex()}
              onChange={(e) =>
                setMaterial(node.id, {
                  baseColor: (() => {
                    const m = e.target.value.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
                    if (!m) return material.baseColor;
                    return {
                      r: parseInt(m[1], 16) / 255,
                      g: parseInt(m[2], 16) / 255,
                      b: parseInt(m[3], 16) / 255,
                      a: material.baseColor.a,
                      toHex: material.baseColor.toHex.bind(material.baseColor),
                      clone: material.baseColor.clone.bind(material.baseColor),
                      toArray: material.baseColor.toArray.bind(material.baseColor),
                    } as any;
                  })(),
                })
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
