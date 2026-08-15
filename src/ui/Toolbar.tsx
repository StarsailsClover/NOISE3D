import { useEditorStore } from '@core/EditorStore';

export function Toolbar() {
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const togglePlay = useEditorStore((s) => s.togglePlay);
  const addPrimitive = useEditorStore((s) => s.addPrimitive);
  const showGrid = useEditorStore((s) => s.showGrid);
  const toggleGrid = useEditorStore((s) => s.toggleGrid);

  return (
    <div className="main-toolbar">
      <div className="toolbar-group">
        <span className="app-title">NOISE3D</span>
        <span className="app-version">v3.0.0</span>
      </div>
      <div className="toolbar-separator" />
      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={() => addPrimitive('cube')}
        >
          Add Cube
        </button>
        <button
          className="toolbar-btn"
          onClick={() => addPrimitive('sphere')}
        >
          Add Sphere
        </button>
        <button
          className="toolbar-btn"
          onClick={() => addPrimitive('plane')}
        >
          Add Plane
        </button>
      </div>
      <div className="toolbar-separator" />
      <div className="toolbar-group">
        <button
          className={`toolbar-btn ${showGrid ? 'active' : ''}`}
          onClick={toggleGrid}
        >
          Grid
        </button>
        <button
          className={`toolbar-btn ${isPlaying ? 'active' : ''}`}
          onClick={togglePlay}
        >
          {isPlaying ? 'Stop' : 'Play'}
        </button>
      </div>
    </div>
  );
}
