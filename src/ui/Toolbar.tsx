import { useEditorStore } from '@core/EditorStore';
import { FileMenu } from './FileMenu';
import { getPreferredBackend } from '@renderer/RendererFactory';
import { WorkspaceTabs } from './WorkspaceTabs';

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
  const physicsEnabled = useEditorStore((s) => s.physicsEnabled);
  const togglePhysics = useEditorStore((s) => s.togglePhysics);
  const physicsDebug = useEditorStore((s) => s.physicsDebug);
  const togglePhysicsDebug = useEditorStore((s) => s.togglePhysicsDebug);
  const backend = getPreferredBackend();
  return (
    <div className="main-toolbar">
      <div className="toolbar-group">
        <span className="app-title">NOISE3D</span>
        <span className="app-version">v26.1-19.0.RC</span>
        <span className="backend-badge">{backend.toUpperCase()}</span>
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
          className={`toolbar-btn ${physicsEnabled ? 'active' : ''}`}
          onClick={togglePhysics}
          title="Toggle Physics Simulation"
        >
          Phys
        </button>
        <button
          className={`toolbar-btn ${physicsDebug ? 'active' : ''}`}
          onClick={togglePhysicsDebug}
          title="Toggle Physics Debug Visualization"
        >
          PhysDebug
        </button>
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
              if (isPlayingAnim || useEditorStore.getState().physicsEnabled) requestAnimationFrame(loop);
            }
          }}
        >
          {isPlaying ? 'Stop' : 'Play'}
        </button>
      </div>
      <div className="toolbar-spacer" />
      <WorkspaceTabs />
      <div className="toolbar-spacer" />
      <div className="toolbar-group">
        <span className="scene-name">{sceneName}</span>
      </div>
    </div>
  );
}
