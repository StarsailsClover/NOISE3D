import { useEditorStore } from '@core/EditorStore';

interface ViewportCameraControlsProps {
  cameraRef: React.MutableRefObject<any>;
}

export function ViewportCameraControls({ cameraRef }: ViewportCameraControlsProps) {
  const setCameraPos = useEditorStore((s) => s.setCameraPos);
  const setCameraTarget = useEditorStore((s) => s.setCameraTarget);

  const updateStore = () => {
    const cam = cameraRef.current;
    if (!cam) return;
    setCameraPos(cam.position);
    setCameraTarget(cam.target);
  };

  const setView = (preset: string) => {
    const cam = cameraRef.current;
    if (!cam) return;
    cam.setView(preset);
    updateStore();
  };

  const toggleProjection = () => {
    const cam = cameraRef.current;
    if (!cam) return;
    cam.toggleProjection();
    updateStore();
  };

  const getProjectionMode = () => {
    const cam = cameraRef.current;
    return cam?.projectionMode ?? 'perspective';
  };

  const frameAll = () => {
    const cam = cameraRef.current;
    if (!cam) return;
    cam.setView('iso');
    updateStore();
  };

  return (
    <div className="viewport-camera-controls">
      <button className="cam-btn" onClick={() => setView('front')} title="Front (Numpad 1)">F</button>
      <button className="cam-btn" onClick={() => setView('right')} title="Right (Numpad 3)">R</button>
      <button className="cam-btn" onClick={() => setView('top')} title="Top (Numpad 7)">T</button>
      <div className="cam-separator" />
      <button className="cam-btn" onClick={() => setView('iso')} title="Isometric">ISO</button>
      <button className="cam-btn" onClick={() => setView('back')} title="Back">Bk</button>
      <button className="cam-btn" onClick={() => setView('left')} title="Left">L</button>
      <button className="cam-btn" onClick={() => setView('bottom')} title="Bottom">Bt</button>
      <div className="cam-separator" />
      <button
        className={`cam-btn ${getProjectionMode() === 'orthographic' ? 'active' : ''}`}
        onClick={toggleProjection}
        title="Perspective/Orthographic (Numpad 5)"
      >
        {getProjectionMode() === 'orthographic' ? 'ORTHO' : 'PERSP'}
      </button>
      <button className="cam-btn" onClick={frameAll} title="Frame All">Home</button>
    </div>
  );
}
