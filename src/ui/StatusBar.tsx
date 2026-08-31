import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '@core/EditorStore';
import { useOverlayStore } from '@core/OverlayStore';

// GitHub@NDBlockConnect | BlockConnect@StarsailsClover

export function StatusBar() {
  const sceneName = useEditorStore((s) => s.sceneName);
  const dirty = useEditorStore((s) => s.dirty);
  const gizmoMode = useEditorStore((s) => s.gizmoMode);
  const scene = useEditorStore((s) => s.scene);
  const dragReadout = useOverlayStore((s) => s.dragReadout);
  const [fps, setFps] = useState(0);
  const [flying, setFlying] = useState(false);
  const frames = useRef(0);
  const last = useRef(performance.now());

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      frames.current += 1;
      const now = performance.now();
      if (now - last.current >= 500) {
        setFps(Math.round((frames.current * 1000) / (now - last.current)));
        frames.current = 0;
        last.current = now;
        const cam = (window as any).__noise3d_cam;
        setFlying(!!cam?.flying);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const nodeCount = scene.getAllNodes().length;
  const lightCount = scene.lights.length;

  const hints = flying
    ? 'Fly: WASD Move | Q/E Down-Up | Shift Fast | Wheel Speed | RMB Release Exit'
    : gizmoMode === 'translate'
      ? 'LMB Select/Drag Gizmo | Shift+LMB Add-Select | RMB Fly (hold) | Alt+LMB Orbit | MMB Pan | Wheel Zoom'
      : gizmoMode === 'rotate'
        ? 'LMB Select/Drag Rings | Shift+LMB Add-Select | RMB Fly (hold) | Alt+LMB Orbit | MMB Pan | Ctrl Snap 15°'
        : 'LMB Select/Drag Handles | Shift+LMB Add-Select | RMB Fly (hold) | Alt+LMB Orbit | MMB Pan | Ctrl Snap 0.1';

  return (
    <div className="status-bar">
      {dragReadout ? (
        <span className="transform-readout">{dragReadout}</span>
      ) : (
        <span className="status-hints">{hints}</span>
      )}
      <span className="status-center">
        <span className="status-scene">{sceneName}</span>
        {dirty && <span className="status-dirty" title="Unsaved changes">•</span>}
      </span>
      <span className="status-right">
        <span className="status-stat">Nodes {nodeCount}</span>
        <span className="status-sep">|</span>
        <span className="status-stat">Lights {lightCount}</span>
        <span className="status-sep">|</span>
        <span
          className={`status-fps ${fps > 0 && fps < 30 ? 'bad' : fps < 45 ? 'warn' : ''}`}
        >
          FPS {fps || '—'}
        </span>
      </span>
    </div>
  );
}
