import { useEditorStore } from '@core/EditorStore';
import { FileMenu } from './FileMenu';

export function Toolbar() {
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const togglePlay = useEditorStore((s) => s.togglePlay);
  const addPrimitive = useEditorStore((s) => s.addPrimitive);
  const showGrid = useEditorStore((s) => s.showGrid);
  const toggleGrid = useEditorStore((s) => s.toggleGrid);
  const sceneName = useEditorStore((s) => s.sceneName);

  return (
    <div className="main-toolbar">
      <div className="toolbar-group">
        <span className="app-title">NOISE3D</span>
        <span className="app-version">v5.0.0</span>
      </div>
      <div className="toolbar-separator" />
      <div className="toolbar-group">
        <FileMenu />
      </div>
      <div className="toolbar-separator" />
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={() => addPrimitive('cube')}>Cube</button>
        <button className="toolbar-btn" onClick={() => addPrimitive('sphere')}>Sphere</button>
        <button className="toolbar-btn" onClick={() => addPrimitive('plane')}>Plane</button>
      </div>
      <div className="toolbar-separator" />
      <div className="toolbar-group">
        <button className={`toolbar-btn ${showGrid ? 'active' : ''}`} onClick={toggleGrid}>Grid</button>
        <button className={`toolbar-btn ${isPlaying ? 'active' : ''}`} onClick={togglePlay}>
          {isPlaying ? 'Stop' : 'Play'}
        </button>
      </div>
      <div className="toolbar-spacer" />
      <div className="toolbar-group">
        <span className="scene-name">{sceneName}</span>
      </div>
    </div>
  );
}
