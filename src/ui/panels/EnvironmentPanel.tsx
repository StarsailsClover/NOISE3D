import { useEditorStore } from '@core/EditorStore';

export function EnvironmentPanel() {
  const terrain = useEditorStore((s) => s.terrain);
  const environment = useEditorStore((s) => s.environment);
  const addTerrain = useEditorStore((s) => s.addTerrain);
  const removeTerrain = useEditorStore((s) => s.removeTerrain);
  const generateProceduralTerrain = useEditorStore((s) => s.generateProceduralTerrain);
  const updateEnvironment = useEditorStore((s) => s.updateEnvironment);
  const flattenTerrain = useEditorStore((s) => s.flattenTerrain);

  return (
    <div className="panel environment-panel">
      <div className="panel-header">
        <span className="panel-title">Environment</span>
        <div className="panel-actions">
          {!terrain && (
            <button className="panel-btn" onClick={addTerrain} title="Add Terrain">Add</button>
          )}
          {terrain && (
            <button className="panel-btn" onClick={removeTerrain} title="Remove Terrain">Del</button>
          )}
        </div>
      </div>
      <div className="panel-body">
        {terrain ? (
          <div className="inspector-section">
            <label className="inspector-label">Terrain</label>
            <div className="env-button-row">
              <button className="env-btn" onClick={() => generateProceduralTerrain(42)}>
                Generate
              </button>
              <button className="env-btn" onClick={() => flattenTerrain(0, 0, terrain.brushStrength)}>
                Flatten
              </button>
            </div>

            <label className="inspector-sublabel">Brush Strength</label>
            <div className="inspector-slider-row">
              <input
                className="inspector-slider"
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={terrain.brushStrength}
                onChange={(e) => {
                  const t = { ...terrain, brushStrength: parseFloat(e.target.value) };
                  useEditorStore.setState({ terrain: t });
                }}
              />
              <span className="inspector-slider-value">{terrain.brushStrength.toFixed(1)}</span>
            </div>
          </div>
        ) : (
          <div className="env-empty">No terrain in scene</div>
        )}

        <div className="inspector-section">
          <label className="inspector-label">Sky</label>
          <select
            className="env-select"
            value={environment.skyType}
            onChange={(e) => updateEnvironment({ skyType: e.target.value as any })}
          >
            <option value="gradient">Gradient</option>
            <option value="solid">Solid</option>
            <option value="procedural">Procedural</option>
          </select>

          <label className="inspector-sublabel">Top Color</label>
          <input
            className="inspector-color"
            type="color"
            value={rgbToHex(environment.skyTopColor)}
            onChange={(e) => updateEnvironment({ skyTopColor: hexToRgb(e.target.value) })}
          />

          <label className="inspector-sublabel">Bottom Color</label>
          <input
            className="inspector-color"
            type="color"
            value={rgbToHex(environment.skyBottomColor)}
            onChange={(e) => updateEnvironment({ skyBottomColor: hexToRgb(e.target.value) })}
          />
        </div>

        <div className="inspector-section">
          <label className="inspector-label">Fog</label>
          <label className="inspector-checkbox-row">
            <input
              type="checkbox"
              checked={environment.fogEnabled}
              onChange={(e) => updateEnvironment({ fogEnabled: e.target.checked })}
            />
            <span className="inspector-checkbox-label">Enable Fog</span>
          </label>

          <label className="inspector-sublabel">Density</label>
          <div className="inspector-slider-row">
            <input
              className="inspector-slider"
              type="range"
              min="0"
              max="0.2"
              step="0.005"
              value={environment.fogDensity}
              onChange={(e) => updateEnvironment({ fogDensity: parseFloat(e.target.value) })}
            />
            <span className="inspector-slider-value">{environment.fogDensity.toFixed(3)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function rgbToHex(rgb: [number, number, number]): string {
  const to2 = (n: number) =>
    Math.round(Math.max(0, Math.min(1, n)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${to2(rgb[0])}${to2(rgb[1])}${to2(rgb[2])}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  if (!m) return [1, 1, 1];
  return [
    parseInt(m[1], 16) / 255,
    parseInt(m[2], 16) / 255,
    parseInt(m[3], 16) / 255,
  ];
}
