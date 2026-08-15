import { useEffect, useRef } from 'react';
import { useEditorStore } from '@core/EditorStore';
import { Renderer } from '@renderer/Renderer';
import { Scene } from '@scene/Scene';

export function ViewportPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const animationRef = useRef<number>(0);

  const scene = useEditorStore((s) => s.scene);
  const showGrid = useEditorStore((s) => s.showGrid);
  const cameraPos = useEditorStore((s) => s.cameraPos);
  const cameraTarget = useEditorStore((s) => s.cameraTarget);
  const materials = useEditorStore((s) => s.materials);
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer(canvas);
    } catch (e) {
      console.error('Failed to initialize WebGL2 renderer:', e);
      return;
    }
    rendererRef.current = renderer;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    };
    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);

    const renderLoop = () => {
      if (!rendererRef.current) return;
      const r = rendererRef.current;
      r.showGrid = showGrid;
      r.cameraPos = cameraPos;
      r.cameraTarget = cameraTarget;
      r.selectedNodeId = selectedNodeId;

      for (const [id, mat] of materials) {
        r.setMaterial(id, mat);
      }

      r.render(scene as Scene, canvas.width, canvas.height);
      animationRef.current = requestAnimationFrame(renderLoop);
    };
    animationRef.current = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animationRef.current);
      resizeObserver.disconnect();
      renderer.dispose();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.showGrid = showGrid;
      rendererRef.current.cameraPos = cameraPos;
      rendererRef.current.cameraTarget = cameraTarget;
      for (const [id, mat] of materials) {
        rendererRef.current.setMaterial(id, mat);
      }
      rendererRef.current.selectedNodeId = selectedNodeId;
    }
  }, [showGrid, cameraPos, cameraTarget, materials, selectedNodeId, scene]);

  return (
    <div className="viewport-container">
      <canvas ref={canvasRef} className="viewport-canvas" />
      <ViewportToolbar />
    </div>
  );
}

function ViewportToolbar() {
  const showGrid = useEditorStore((s) => s.showGrid);
  const toggleGrid = useEditorStore((s) => s.toggleGrid);
  const addPrimitive = useEditorStore((s) => s.addPrimitive);

  return (
    <div className="viewport-toolbar">
      <button
        className="toolbar-btn"
        onClick={() => addPrimitive('cube')}
        title="Add Cube"
      >
        Cube
      </button>
      <button
        className="toolbar-btn"
        onClick={() => addPrimitive('sphere')}
        title="Add Sphere"
      >
        Sphere
      </button>
      <button
        className="toolbar-btn"
        onClick={() => addPrimitive('plane')}
        title="Add Plane"
      >
        Plane
      </button>
      <button
        className="toolbar-btn"
        onClick={() => addPrimitive('cylinder')}
        title="Add Cylinder"
      >
        Cylinder
      </button>
      <button
        className="toolbar-btn"
        onClick={() => addPrimitive('cone')}
        title="Add Cone"
      >
        Cone
      </button>
      <div className="toolbar-separator" />
      <button
        className={`toolbar-btn ${showGrid ? 'active' : ''}`}
        onClick={toggleGrid}
        title="Toggle Grid"
      >
        Grid
      </button>
    </div>
  );
}
