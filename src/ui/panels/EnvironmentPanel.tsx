import { useEditorStore } from '@core/EditorStore';
import { Slider, Dropdown, Toggle, ColorSwatch } from '../widgets';

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
            <Slider
              className="inspector-slider"
              value={terrain.brushStrength}
              min={0.1}
              max={2}
              step={0.1}
              format={(v) => v.toFixed(1)}
              onChange={(v) => {
                const t = { ...terrain, brushStrength: v };
                useEditorStore.setState({ terrain: t });
              }}
            />
          </div>
        ) : (
          <div className="env-empty">No terrain in scene</div>
        )}

        <div className="inspector-section">
          <label className="inspector-label">Sky</label>
          <Dropdown
            className="env-select"
            value={environment.skyType}
            options={[
              { value: 'gradient', label: 'Gradient' },
              { value: 'solid', label: 'Solid' },
              { value: 'procedural', label: 'Procedural' },
            ]}
            onChange={(v) => updateEnvironment({ skyType: v })}
          />

          <label className="inspector-sublabel">Top Color</label>
          <ColorSwatch
            className="inspector-color"
            value={rgbToHex(environment.skyTopColor)}
            onChange={(hex) => updateEnvironment({ skyTopColor: hexToRgb(hex) })}
          />

          <label className="inspector-sublabel">Bottom Color</label>
          <ColorSwatch
            className="inspector-color"
            value={rgbToHex(environment.skyBottomColor)}
            onChange={(hex) => updateEnvironment({ skyBottomColor: hexToRgb(hex) })}
          />
        </div>

        <div className="inspector-section">
          <label className="inspector-label">Fog</label>
          <Toggle
            checked={environment.fogEnabled}
            label="Enable Fog"
            onChange={(v) => updateEnvironment({ fogEnabled: v })}
          />

          <label className="inspector-sublabel">Density</label>
          <Slider
            className="inspector-slider"
            value={environment.fogDensity}
            min={0}
            max={0.2}
            step={0.005}
            format={(v) => v.toFixed(3)}
            onChange={(v) => updateEnvironment({ fogDensity: v })}
          />
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

