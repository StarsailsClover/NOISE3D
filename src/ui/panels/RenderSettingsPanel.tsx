import { useEditorStore } from '@core/EditorStore';
import { Slider } from '../widgets';

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
          <Slider
            className="inspector-slider"
            value={exposure}
            min={0.1}
            max={3}
            step={0.05}
            onChange={(v) => setPostSetting('postExposure', v)}
          />

          <label className="inspector-sublabel">Bloom Threshold</label>
          <Slider
            className="inspector-slider"
            value={bloomThreshold}
            min={0.5}
            max={3}
            step={0.05}
            onChange={(v) => setPostSetting('postBloomThreshold', v)}
          />

          <label className="inspector-sublabel">Bloom Intensity</label>
          <Slider
            className="inspector-slider"
            value={bloomIntensity}
            min={0}
            max={2}
            step={0.05}
            onChange={(v) => setPostSetting('postBloomIntensity', v)}
          />
        </div>
      </div>
    </div>
  );
}

