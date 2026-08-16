import { useEditorStore } from '@core/EditorStore';

export function RenderSettingsPanel() {
  const exposure = useEditorStore((s) => s.postExposure);
  const bloomThreshold = useEditorStore((s) => s.postBloomThreshold);
  const bloomIntensity = useEditorStore((s) => s.postBloomIntensity);
  const setPostSetting = useEditorStore((s) => s.setPostSetting);

  return (
    <div className="panel render-settings-panel">
      <div className="panel-header">
        <span className="panel-title">Render Settings</span>
      </div>
      <div className="panel-body">
        <div className="inspector-section">
          <label className="inspector-label">Exposure</label>
          <div className="inspector-slider-row">
            <input
              className="inspector-slider"
              type="range"
              min="0.1"
              max="3"
              step="0.05"
              value={exposure}
              onChange={(e) => setPostSetting('postExposure', parseFloat(e.target.value))}
            />
            <span className="inspector-slider-value">{exposure.toFixed(2)}</span>
          </div>

          <label className="inspector-sublabel">Bloom Threshold</label>
          <div className="inspector-slider-row">
            <input
              className="inspector-slider"
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={bloomThreshold}
              onChange={(e) => setPostSetting('postBloomThreshold', parseFloat(e.target.value))}
            />
            <span className="inspector-slider-value">{bloomThreshold.toFixed(2)}</span>
          </div>

          <label className="inspector-sublabel">Bloom Intensity</label>
          <div className="inspector-slider-row">
            <input
              className="inspector-slider"
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={bloomIntensity}
              onChange={(e) => setPostSetting('postBloomIntensity', parseFloat(e.target.value))}
            />
            <span className="inspector-slider-value">{bloomIntensity.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
