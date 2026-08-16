import { useEditorStore } from '@core/EditorStore';
import { FileMenu } from './FileMenu';

export function Toolbar() {
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const togglePlay = useEditorStore((s) => s.togglePlay);
  const addPrimitive = useEditorStore((s) => s.addPrimitive);
  const showGrid = useEditorStore((s) => s.showGrid);
  const toggleGrid = useEditorStore((s) => s.toggleGrid);
  const sceneName = useEditorStore((s) => s.sceneName);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const undoRevision = useEditorStore((s) => s.undoRevision);
  const canUndo = useEditorStore((s) => s.canUndo());
  const canRedo = useEditorStore((s) => s.canRedo());
  const duplicateNode = useEditorStore((s) => s.duplicateNode);
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId);
  void undoRevision;
  const editorMode = useEditorStore((s) => s.editorMode);
  const toggleEditorMode = useEditorStore((s) => s.toggleEditorMode);
  const tickAnimation = useEditorStore((s) => s.tickAnimation);
  const isPlayingAnim = useEditorStore((s) => s.isPlayingAnim);
  return (
    <div className="main-toolbar">
      <div className="toolbar-group">
        <span className="app-title">NOISE3D</span>
        <span className="app-version">v9.0.0</span>
      </div>
      <div className="toolbar-separator" />
      <div className="toolbar-group">
        <FileMenu />
      </div>
      <div className="toolbar-separator" />
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">Undo</button>
        <button className="toolbar-btn" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)">Redo</button>
        <button className="toolbar-btn" onClick={() => selectedNodeId && duplicateNode(selectedNodeId)} disabled={selectedNodeId === null} title="Duplicate (Ctrl+D)">Duplicate</button>
      </div>
      <div className="toolbar-separator" />
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={() => addPrimitive('cube')}>Cube</button>
        <button className="toolbar-btn" onClick={() => addPrimitive('sphere')}>Sphere</button>
        <button className="toolbar-btn" onClick={() => addPrimitive('plane')}>Plane</button>
      </div>
      <div className="toolbar-separator" />
      <div className="toolbar-group">
        <button
          className={`toolbar-btn ${editorMode === '2D' ? 'active' : ''}`}
          onClick={toggleEditorMode}
          title="Toggle 2D/3D Mode"
        >
          {editorMode}
        </button>
        <button className={`toolbar-btn ${showGrid ? 'active' : ''}`} onClick={toggleGrid}>Grid</button>
        <button
          className={`toolbar-btn ${isPlaying ? 'active' : ''}`}
          onClick={() => {
            togglePlay();
            if (!isPlaying) {
              let lastTime = performance.now();
              const loop = () => {
                const now = performance.now();
                const dt = (now - lastTime) / 1000;
                lastTime = now;
                tickAnimation(dt);
                if (useEditorStore.getState().isPlaying) {
                  requestAnimationFrame(loop);
                }
              };
              if (isPlayingAnim) requestAnimationFrame(loop);
            }
          }}
        >
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
