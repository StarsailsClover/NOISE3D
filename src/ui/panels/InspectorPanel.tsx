import { useState } from 'react';
import { useEditorStore } from '@core/EditorStore';
import { Vec3, Color } from '@math/Vec';
import { MATERIAL_PRESETS } from '@renderer/Material';
import { BUILTIN_COMPONENT_TYPES, getComponentDisplayName, getComponentPropertyLabels, type ComponentData } from '@scene/Component';

export function InspectorPanel() {
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId);
  const scene = useEditorStore((s) => s.scene);
  const updateNodeTransform = useEditorStore((s) => s.updateNodeTransform);
  const renameNode = useEditorStore((s) => s.renameNode);
  const setMaterial = useEditorStore((s) => s.setMaterial);
  const materials = useEditorStore((s) => s.materials);
  const addComponent = useEditorStore((s) => s.addComponent);
  const removeComponent = useEditorStore((s) => s.removeComponent);
  const updateComponent = useEditorStore((s) => s.updateComponent);
  const createPrefabFromNode = useEditorStore((s) => s.createPrefabFromNode);
  const [componentSelectKey, setComponentSelectKey] = useState(0);
  const componentsRevision = useEditorStore((s) => s.components);

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
          <>
            <div className="inspector-section">
              <label className="inspector-label">Material Presets</label>
              <div className="material-presets">
                {MATERIAL_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    className="material-preset-btn"
                    onClick={() =>
                      setMaterial(node.id, {
                        baseColor: preset.material.baseColor.clone(),
                        metallic: preset.material.metallic,
                        roughness: preset.material.roughness,
                        emissive: preset.material.emissive.clone(),
                        emissiveIntensity: preset.material.emissiveIntensity,
                      })
                    }
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="inspector-section">
              <label className="inspector-label">Surface</label>

              <label className="inspector-sublabel">Base Color</label>
              <input
                className="inspector-color"
                type="color"
                value={material.baseColor.toHex()}
                onChange={(e) => {
                  const newColor = Color.fromString(e.target.value);
                  setMaterial(node.id, { baseColor: newColor });
                }}
              />

              <label className="inspector-sublabel">Metallic</label>
              <div className="inspector-slider-row">
                <input
                  className="inspector-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={material.metallic}
                  onChange={(e) =>
                    setMaterial(node.id, { metallic: parseFloat(e.target.value) })
                  }
                />
                <span className="inspector-slider-value">
                  {material.metallic.toFixed(2)}
                </span>
              </div>

              <label className="inspector-sublabel">Roughness</label>
              <div className="inspector-slider-row">
                <input
                  className="inspector-slider"
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.01"
                  value={material.roughness}
                  onChange={(e) =>
                    setMaterial(node.id, { roughness: parseFloat(e.target.value) })
                  }
                />
                <span className="inspector-slider-value">
                  {material.roughness.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="inspector-section">
              <label className="inspector-label">Emission</label>

              <label className="inspector-sublabel">Emissive Color</label>
              <input
                className="inspector-color"
                type="color"
                value={material.emissive.toHex()}
                onChange={(e) => {
                  const newColor = Color.fromString(e.target.value);
                  setMaterial(node.id, { emissive: newColor });
                }}
              />

              <label className="inspector-sublabel">Emissive Intensity</label>
              <div className="inspector-slider-row">
                <input
                  className="inspector-slider"
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={material.emissiveIntensity}
                  onChange={(e) =>
                    setMaterial(node.id, { emissiveIntensity: parseFloat(e.target.value) })
                  }
                />
                <span className="inspector-slider-value">
                  {material.emissiveIntensity.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="inspector-section">
              <label className="inspector-label">Texture UV</label>

              <label className="inspector-sublabel">Tiling</label>
              <div className="inspector-vec3">
                <input
                  className="inspector-number"
                  type="number"
                  step="0.1"
                  value={material.textureTiling[0].toFixed(2)}
                  onChange={(e) =>
                    setMaterial(node.id, {
                      textureTiling: [parseFloat(e.target.value) || 1, material.textureTiling[1]],
                    })
                  }
                />
                <input
                  className="inspector-number"
                  type="number"
                  step="0.1"
                  value={material.textureTiling[1].toFixed(2)}
                  onChange={(e) =>
                    setMaterial(node.id, {
                      textureTiling: [material.textureTiling[0], parseFloat(e.target.value) || 1],
                    })
                  }
                />
              </div>

              <label className="inspector-sublabel">Offset</label>
              <div className="inspector-vec3">
                <input
                  className="inspector-number"
                  type="number"
                  step="0.1"
                  value={material.textureOffset[0].toFixed(2)}
                  onChange={(e) =>
                    setMaterial(node.id, {
                      textureOffset: [parseFloat(e.target.value) || 0, material.textureOffset[1]],
                    })
                  }
                />
                <input
                  className="inspector-number"
                  type="number"
                  step="0.1"
                  value={material.textureOffset[1].toFixed(2)}
                  onChange={(e) =>
                    setMaterial(node.id, {
                      textureOffset: [material.textureOffset[0], parseFloat(e.target.value) || 0],
                    })
                  }
                />
              </div>
            </div>

            <div className="inspector-section">
              <label className="inspector-label">Render Options</label>
              <label className="inspector-checkbox-row">
                <input
                  type="checkbox"
                  checked={material.doubleSided}
                  onChange={(e) =>
                    setMaterial(node.id, { doubleSided: e.target.checked })
                  }
                />
                <span className="inspector-checkbox-label">Double Sided</span>
              </label>
            </div>
          </>
        )}

        <div className="inspector-section">
          <label className="inspector-label">Components</label>
          {node.components.length > 0 && componentsRevision && (
            <div className="component-list">
              {node.components.map((comp) => (
                <ComponentEditor
                  key={comp.id}
                  nodeId={node.id}
                  component={comp}
                  onRemove={removeComponent}
                  onUpdate={updateComponent}
                />
              ))}
            </div>
          )}
          <div className="component-add-row">
            <select
              key={componentSelectKey}
              className="component-type-select"
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  addComponent(node.id, e.target.value as any);
                  setComponentSelectKey((k) => k + 1);
                }
              }}
            >
              <option value="">Add Component...</option>
              {BUILTIN_COMPONENT_TYPES.map((t) => (
                <option key={t} value={t}>{getComponentDisplayName(t)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="inspector-section">
          <button
            className="toolbar-btn"
            onClick={() => createPrefabFromNode(node.id)}
            title="Save as Prefab"
          >
            Save as Prefab
          </button>
        </div>
      </div>
    </div>
  );
}

function ComponentEditor({ nodeId, component, onRemove, onUpdate }: {
  nodeId: number;
  component: ComponentData;
  onRemove: (nodeId: number, componentId: string) => void;
  onUpdate: (nodeId: number, componentId: string, properties: Record<string, any>) => void;
}) {
  const labels = getComponentPropertyLabels(component.type);

  return (
    <div className="component-item">
      <div className="component-header">
        <span className="component-name">{getComponentDisplayName(component.type)}</span>
        <button
          className="component-remove-btn"
          onClick={() => onRemove(nodeId, component.id)}
          title="Remove"
        >
          x
        </button>
      </div>
      <div className="component-properties">
        {Object.entries(component.properties).map(([key, value]) => (
          <div key={key} className="component-property">
            <label className="inspector-sublabel">{labels[key] ?? key}</label>
            {typeof value === 'boolean' ? (
              <label className="inspector-checkbox-row">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => onUpdate(nodeId, component.id, { [key]: e.target.checked })}
                />
                <span className="inspector-checkbox-label">{value ? 'Yes' : 'No'}</span>
              </label>
            ) : typeof value === 'number' ? (
              <input
                className="inspector-number"
                type="number"
                step="0.1"
                value={value}
                onChange={(e) => onUpdate(nodeId, component.id, { [key]: parseFloat(e.target.value) || 0 })}
              />
            ) : typeof value === 'string' && value.length > 30 ? (
              <textarea
                className="component-textarea"
                value={value}
                rows={4}
                onChange={(e) => onUpdate(nodeId, component.id, { [key]: e.target.value })}
              />
            ) : Array.isArray(value) ? (
              <input
                className="inspector-input"
                type="text"
                value={value.join(', ')}
                onChange={(e) => onUpdate(nodeId, component.id, { [key]: e.target.value.split(',').map((v) => parseFloat(v.trim()) || 0) })}
              />
            ) : (
              <input
                className="inspector-input"
                type="text"
                value={value}
                onChange={(e) => onUpdate(nodeId, component.id, { [key]: e.target.value })}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
