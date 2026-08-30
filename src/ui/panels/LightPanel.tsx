import { useEditorStore } from '@core/EditorStore';
import { NumberField } from '../fields/NumberField';
import { Vec3 } from '@math/Vec';
import { Slider, ColorSwatch } from '../widgets';

export function LightPanel() {
  const lights = useEditorStore((s) => s.scene.lights);
  const selectedLightId = useEditorStore((s) => s.selectedLightId);
  const addLight = useEditorStore((s) => s.addLight);
  const removeLight = useEditorStore((s) => s.removeLight);
  const selectLight = useEditorStore((s) => s.selectLight);
  const updateLight = useEditorStore((s) => s.updateLight);

  return (
    <div className="panel light-panel">
      <div className="panel-header">
        <span className="panel-title">Lighting</span>
        <div className="panel-actions">
          <button
            className="panel-btn"
            onClick={() => addLight('directional')}
            title="Add Directional Light"
          >
            Sun
          </button>
          <button
            className="panel-btn"
            onClick={() => addLight('point')}
            title="Add Point Light"
          >
            Point
          </button>
          <button
            className="panel-btn"
            onClick={() => addLight('spot')}
            title="Add Spot Light"
          >
            Spot
          </button>
        </div>
      </div>
      <div className="panel-body">
        {lights.length === 0 ? (
          <div className="light-empty">No lights in scene</div>
        ) : (
          lights.map((light) => (
            <div
              key={light.id}
              className={`light-item ${selectedLightId === light.id ? 'selected' : ''}`}
              onClick={() => selectLight(light.id)}
            >
              <span className={`light-type-icon light-${light.type}`}>
                {light.type === 'directional' ? 'SUN' : light.type === 'point' ? 'PNT' : 'SPT'}
              </span>
              <span className="light-label">{light.name}</span>
              <button
                className="light-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  updateLight(light.id, { enabled: !light.enabled });
                }}
              >
                {light.enabled ? 'ON' : 'OFF'}
              </button>
              <button
                className="light-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  removeLight(light.id);
                }}
              >
                x
              </button>
            </div>
          ))
        )}

        {selectedLightId !== null && (() => {
          const light = lights.find((l) => l.id === selectedLightId);
          if (!light) return null;
          return (
            <div className="light-inspector">
              <div className="inspector-section">
                <label className="inspector-label">Name</label>
                <input
                  className="inspector-input"
                  type="text"
                  value={light.name}
                  onChange={(e) => updateLight(light.id, { name: e.target.value })}
                />
              </div>

              <div className="inspector-section">
                <label className="inspector-label">Position</label>
                <div className="inspector-vec3">
                  {(['x', 'y', 'z'] as const).map((ax) => (
                    <NumberField
                      key={ax}
                      className="inspector-number"
                      value={light.position[ax]}
                      step={0.5}
                      title={ax.toUpperCase()}
                      onCommit={(v) =>
                        updateLight(light.id, {
                          position: new Vec3(
                            ax === 'x' ? v : light.position.x,
                            ax === 'y' ? v : light.position.y,
                            ax === 'z' ? v : light.position.z,
                          ),
                        })
                      }
                    />
                  ))}
                </div>
              </div>

              {light.type !== 'point' && (
                <div className="inspector-section">
                  <label className="inspector-label">Direction</label>
                  <div className="inspector-vec3">
                    {(['x', 'y', 'z'] as const).map((ax) => (
                      <NumberField
                        key={ax}
                        className="inspector-number"
                        value={light.direction[ax]}
                        step={0.1}
                        title={ax.toUpperCase()}
                        onCommit={(v) =>
                          updateLight(light.id, {
                            direction: new Vec3(
                              ax === 'x' ? v : light.direction.x,
                              ax === 'y' ? v : light.direction.y,
                              ax === 'z' ? v : light.direction.z,
                            ),
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="inspector-section">
                <label className="inspector-label">Color</label>
                <ColorSwatch
                  className="inspector-color"
                  value={light.color.toHex()}
                  onChange={(hex) => {
                    const m = hex.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
                    if (m) {
                      updateLight(light.id, {
                        color: {
                          r: parseInt(m[1], 16) / 255,
                          g: parseInt(m[2], 16) / 255,
                          b: parseInt(m[3], 16) / 255,
                          a: light.color.a,
                          toHex: light.color.toHex.bind(light.color),
                          clone: light.color.clone.bind(light.color),
                          toArray: light.color.toArray.bind(light.color),
                        } as any,
                      });
                    }
                  }}
                />
              </div>

              <div className="inspector-section">
                <label className="inspector-label">Intensity</label>
                <Slider
                  className="inspector-slider"
                  value={light.intensity}
                  min={0}
                  max={50}
                  step={0.5}
                  format={(v) => v.toFixed(1)}
                  onChange={(v) => updateLight(light.id, { intensity: v })}
                />
              </div>

              {light.type !== 'directional' && (
                <div className="inspector-section">
                  <label className="inspector-label">Range</label>
                  <Slider
                    className="inspector-slider"
                    value={light.range}
                    min={1}
                    max={100}
                    step={1}
                    format={(v) => v.toFixed(0)}
                    onChange={(v) => updateLight(light.id, { range: v })}
                  />
                </div>
              )}

              {light.type === 'spot' && (
                <>
                  <div className="inspector-section">
                    <label className="inspector-label">Inner Cone</label>
                    <Slider
                      className="inspector-slider"
                      value={light.innerConeAngle}
                      min={0}
                      max={Math.PI / 2}
                      step={0.01}
                      format={(v) => `${(v * 180 / Math.PI).toFixed(0)}deg`}
                      onChange={(v) => updateLight(light.id, { innerConeAngle: v })}
                    />
                  </div>
                  <div className="inspector-section">
                    <label className="inspector-label">Outer Cone</label>
                    <Slider
                      className="inspector-slider"
                      value={light.outerConeAngle}
                      min={0}
                      max={Math.PI / 2}
                      step={0.01}
                      format={(v) => `${(v * 180 / Math.PI).toFixed(0)}deg`}
                      onChange={(v) => updateLight(light.id, { outerConeAngle: v })}
                    />
                  </div>
                </>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}


