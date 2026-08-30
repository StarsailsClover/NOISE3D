import { useState } from 'react';
import { useEditorStore } from '@core/EditorStore';
import { Vec3, Color } from '@math/Vec';
import { MATERIAL_PRESETS } from '@renderer/Material';
import { NumberField } from '../fields/NumberField';
import { Slider, Toggle, ColorSwatch } from '../widgets';
import { BUILTIN_COMPONENT_TYPES, getComponentDisplayName, getComponentPropertyLabels, type ComponentData } from '@scene/Component';

export function InspectorPanel() {
  const undoRevision = useEditorStore((s) => s.undoRevision);
  void undoRevision;


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
          <Vec3Row
            value={node.position}
            onCommit={(p) => updateNodeTransform(node.id, p)}
          />
        </div>

        <div className="inspector-section">
          <label className="inspector-label">Rotation</label>
          <Vec3Row
            value={node.rotation}
            onCommit={(r) => updateNodeTransform(node.id, undefined, r)}
          />
        </div>

        <div className="inspector-section">
          <label className="inspector-label">Scale</label>
          <Vec3Row
            value={node.scale}
            min={0.01}
            onCommit={(s) => updateNodeTransform(node.id, undefined, undefined, s)}
          />
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
              <ColorSwatch
                className="inspector-color"
                value={material.baseColor.toHex()}
                onChange={(hex) => setMaterial(node.id, { baseColor: Color.fromString(hex) })}
              />

              <label className="inspector-sublabel">Metallic</label>
              <Slider
                className="inspector-slider"
                value={material.metallic}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => setMaterial(node.id, { metallic: v })}
              />

              <label className="inspector-sublabel">Roughness</label>
              <Slider
                className="inspector-slider"
                value={material.roughness}
                min={0.05}
                max={1}
                step={0.01}
                onChange={(v) => setMaterial(node.id, { roughness: v })}
              />
            </div>

            <div className="inspector-section">
              <label className="inspector-label">Emission</label>

              <label className="inspector-sublabel">Emissive Color</label>
              <ColorSwatch
                className="inspector-color"
                value={material.emissive.toHex()}
                onChange={(hex) => setMaterial(node.id, { emissive: Color.fromString(hex) })}
              />

              <label className="inspector-sublabel">Emissive Intensity</label>
              <Slider
                className="inspector-slider"
                value={material.emissiveIntensity}
                min={0}
                max={5}
                step={0.1}
                format={(v) => v.toFixed(1)}
                onChange={(v) => setMaterial(node.id, { emissiveIntensity: v })}
              />
            </div>

            <div className="inspector-section">
              <label className="inspector-label">Texture UV</label>

              <label className="inspector-sublabel">Tiling</label>
              <div className="inspector-vec3">
                <NumberField
                  className="inspector-number"
                  value={material.textureTiling[0]}
                  step={0.1}
                  min={0.01}
                  onCommit={(v) =>
                    setMaterial(node.id, { textureTiling: [v, material.textureTiling[1]] })
                  }
                />
                <NumberField
                  className="inspector-number"
                  value={material.textureTiling[1]}
                  step={0.1}
                  min={0.01}
                  onCommit={(v) =>
                    setMaterial(node.id, { textureTiling: [material.textureTiling[0], v] })
                  }
                />
              </div>

              <label className="inspector-sublabel">Offset</label>
              <div className="inspector-vec3">
                <NumberField
                  className="inspector-number"
                  value={material.textureOffset[0]}
                  step={0.05}
                  onCommit={(v) =>
                    setMaterial(node.id, { textureOffset: [v, material.textureOffset[1]] })
                  }
                />
                <NumberField
                  className="inspector-number"
                  value={material.textureOffset[1]}
                  step={0.05}
                  onCommit={(v) =>
                    setMaterial(node.id, { textureOffset: [material.textureOffset[0], v] })
                  }
                />
              </div>
            </div>

            <div className="inspector-section">
              <label className="inspector-label">Render Options</label>
              <Toggle
                checked={material.doubleSided}
                label="Double Sided"
                onChange={(v) => setMaterial(node.id, { doubleSided: v })}
              />
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
              <Toggle
                checked={value}
                label={value ? 'Yes' : 'No'}
                onChange={(v) => onUpdate(nodeId, component.id, { [key]: v })}
              />
            ) : typeof value === 'number' ? (
              <NumberField
                className="inspector-number"
                value={value}
                step={0.1}
                onCommit={(v) => onUpdate(nodeId, component.id, { [key]: v })}
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

function Vec3Row({
  value,
  onCommit,
  min,
}: {
  value: Vec3;
  onCommit: (v: Vec3) => void;
  min?: number;
}) {
  return (
    <div className="inspector-vec3">
      {(['x', 'y', 'z'] as const).map((ax) => (
        <NumberField
          key={ax}
          className="inspector-number"
          value={value[ax]}
          step={0.1}
          min={min}
          title={ax.toUpperCase()}
          onDragStart={() => useEditorStore.getState().takeSnapshot()}
          onCommit={(nv) =>
            onCommit(
              new Vec3(
                ax === 'x' ? nv : value.x,
                ax === 'y' ? nv : value.y,
                ax === 'z' ? nv : value.z,
              ),
            )
          }
        />
      ))}
    </div>
  );
}

