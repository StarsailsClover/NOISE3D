import { useEffect, useState } from 'react';
import { useEditorStore } from '@core/EditorStore';

type ViewMode = 'material' | 'wireframe' | 'solid' | 'rendered';

const VIEW_MODES: { id: ViewMode; title: string; label: string }[] = [
  { id: 'material', title: 'Material Preview', label: 'Mat' },
  { id: 'wireframe', title: 'Wireframe', label: 'Wire' },
  { id: 'solid', title: 'Solid (Unlit)', label: 'Solid' },
  { id: 'rendered', title: 'Rendered', label: 'Render' },
];

interface ViewportCameraControlsProps {
  cameraRef: React.MutableRefObject<any>;
  onFrameAll: () => void;
}

export function ViewportCameraControls({ cameraRef, onFrameAll }: ViewportCameraControlsProps) {
  const setCameraPos = useEditorStore((s) => s.setCameraPos);
  const setCameraTarget = useEditorStore((s) => s.setCameraTarget);
  const [projectionMode, setProjectionMode] = useState<'perspective' | 'orthographic'>('perspective');
  const sceneViewMode = useEditorStore((s) => s.sceneViewMode);
  const setSceneViewMode = useEditorStore((s) => s.setSceneViewMode);

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
    // Reframe to scene bounds AND swing to isometric in one transition.
    onFrameAll();
    updateStore();
  };

  useEffect(() => {
    const handleViewPreset = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setView(detail);
    };
    const handleToggleProjection = () => {
      toggleProjection();
    };
    const handleFrameAll = () => {
      frameAll();
    };

    window.addEventListener('viewport-view-preset', handleViewPreset);
    window.addEventListener('viewport-toggle-projection', handleToggleProjection);
    window.addEventListener('viewport-frame-all', handleFrameAll);
    return () => {
      window.removeEventListener('viewport-view-preset', handleViewPreset);
      window.removeEventListener('viewport-toggle-projection', handleToggleProjection);
      window.removeEventListener('viewport-frame-all', handleFrameAll);
    };
  }, []);

  return (
    <div className="viewport-camera-controls">
      <button className="cam-btn" onClick={() => setView('front')} title="Front (Numpad 1)">F</button>
      <button className="cam-btn" onClick={() => setView('right')} title="Right (Numpad 3)">R</button>
      <button className="cam-btn" onClick={() => setView('top')} title="Top (Numpad 7)">T</button>
      <div className="cam-separator" />
      <button className="cam-btn" onClick={frameAll} title="Isometric - frames all content">ISO</button>
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
      <button className="cam-btn" onClick={frameAll} title="Frame All (Home)">Home</button>
      <div className="cam-separator" />
      <div className="viewport-viewmode-controls">
        {VIEW_MODES.map((vm) => (
          <button
            key={vm.id}
            className={`cam-btn ${sceneViewMode === vm.id ? 'active' : ''}`}
            onClick={() => setSceneViewMode(vm.id)}
            title={vm.title}
          >
            {vm.label}
          </button>
        ))}
      </div>
    </div>
  );
}
