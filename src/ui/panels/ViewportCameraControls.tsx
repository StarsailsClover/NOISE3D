import { useEffect, useState } from 'react';
import { useEditorStore } from '@core/EditorStore';

interface ViewportCameraControlsProps {
  cameraRef: React.MutableRefObject<any>;
}

export function ViewportCameraControls({ cameraRef }: ViewportCameraControlsProps) {
  const setCameraPos = useEditorStore((s) => s.setCameraPos);
  const setCameraTarget = useEditorStore((s) => s.setCameraTarget);
  const [projectionMode, setProjectionMode] = useState<'perspective' | 'orthographic'>('perspective');

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
    setProjectionMode(cam.projectionMode);
    updateStore();
  };

  const frameAll = () => {
    const cam = cameraRef.current;
    if (!cam) return;
    cam.setView('iso');
    updateStore();
  };

  // Listen for custom events from keyboard shortcuts
  useEffect(() => {
    const handleViewPreset = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setView(detail);
    };
    const handleToggleProjection = () => {
      toggleProjection();
    };

    window.addEventListener('viewport-view-preset', handleViewPreset);
    window.addEventListener('viewport-toggle-projection', handleToggleProjection);
    return () => {
      window.removeEventListener('viewport-view-preset', handleViewPreset);
      window.removeEventListener('viewport-toggle-projection', handleToggleProjection);
    };
  }, []);

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
        className={`cam-btn ${projectionMode === 'orthographic' ? 'active' : ''}`}
        onClick={toggleProjection}
        title="Perspective/Orthographic (Numpad 5)"
      >
        {projectionMode === 'orthographic' ? 'ORTHO' : 'PERSP'}
      </button>
      <button className="cam-btn" onClick={frameAll} title="Frame All">Home</button>
    </div>
  );
}
