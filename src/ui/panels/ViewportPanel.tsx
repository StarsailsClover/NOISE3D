import { useEffect, useRef, useCallback } from 'react';
import { useEditorStore } from '@core/EditorStore';
import { Renderer } from '@renderer/Renderer';
import { Scene } from '@scene/Scene';
import { OrbitCamera } from '@engine/OrbitCamera';
import { Ray } from '@engine/Ray';
import { Vec3 } from '@math/Vec';
import { Mat4 } from '@math/Mat4';

export function ViewportPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const cameraRef = useRef<OrbitCamera>(new OrbitCamera());
  const animationRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const dragModeRef = useRef<'rotate' | 'pan' | 'none'>('none');

  const scene = useEditorStore((s) => s.scene);
  const showGrid = useEditorStore((s) => s.showGrid);
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId);
  const materials = useEditorStore((s) => s.materials);
  const selectNode = useEditorStore((s) => s.selectNode);
  const frameSelectedTrigger = useEditorStore((s) => s.frameSelectedTrigger);

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

    const cam = cameraRef.current;
    cam.distance = 10;
    cam.azimuth = Math.PI / 4;
    cam.elevation = Math.PI / 6;

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
      r.cameraPos = cam.position;
      r.cameraTarget = cam.target;
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
      const cam = cameraRef.current;
      rendererRef.current.showGrid = showGrid;
      rendererRef.current.cameraPos = cam.position;
      rendererRef.current.cameraTarget = cam.target;
      rendererRef.current.selectedNodeId = selectedNodeId;
      for (const [id, mat] of materials) {
        rendererRef.current.setMaterial(id, mat);
      }
    }
  }, [showGrid, selectedNodeId, materials, scene]);

  useEffect(() => {
    if (frameSelectedTrigger === 0) return;
    const cam = cameraRef.current;
    if (selectedNodeId !== null) {
      const node = scene.getNode(selectedNodeId);
      if (node) {
        const radius = Math.max(
          node.scale.x, node.scale.y, node.scale.z,
        ) * 1.5;
        cam.frame(node.position, Math.max(radius, 1));
      }
    } else {
      cam.frame(new Vec3(0, 0, 0), 2);
    }
  }, [frameSelectedTrigger, selectedNodeId, scene]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      isDraggingRef.current = true;
      lastMouseRef.current = { x, y };

      if (e.button === 0) {
        dragModeRef.current = 'none';
        pickObject(x, y, rect.width, rect.height);
      } else if (e.button === 1 || e.button === 2) {
        dragModeRef.current = e.button === 1 ? 'pan' : 'rotate';
        e.preventDefault();
      }
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDraggingRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const dx = x - lastMouseRef.current.x;
      const dy = y - lastMouseRef.current.y;
      lastMouseRef.current = { x, y };

      const cam = cameraRef.current;
      if (dragModeRef.current === 'rotate') {
        cam.rotate(dx, dy);
      } else if (dragModeRef.current === 'pan') {
        cam.pan(dx, dy, rect.width, rect.height);
      }
    },
    [],
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    dragModeRef.current = 'none';
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    const cam = cameraRef.current;
    cam.zoom(e.deltaY);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const pickObject = useCallback(
    (screenX: number, screenY: number, width: number, height: number) => {
      const r = rendererRef.current;
      if (!r) return;
      const cam = cameraRef.current;
      const dpr = window.devicePixelRatio || 1;
      const sx = screenX * dpr;
      const sy = screenY * dpr;
      const w = width * dpr;
      const h = height * dpr;

      const ray = Ray.fromScreen(
        sx, sy, w, h,
        cam.position, cam.target, r.fov, r.near, r.far,
      );

      const nodes = scene.getAllNodes();
      let closestId: number | null = null;
      let closestT = Infinity;

      for (const node of nodes) {
        if (!node.visible || node.type === 'empty') continue;
        const min = getPrimitiveMin(node.type);
        const max = getPrimitiveMax(node.type);
        const model = Mat4.fromTRS(node.position, node.rotation, node.scale);
        const t = ray.intersectAABB(min, max, model);
        if (t !== null && t < closestT) {
          closestT = t;
          closestId = node.id;
        }
      }

      selectNode(closestId);
    },
    [scene, selectNode],
  );

  return (
    <div className="viewport-container">
      <canvas
        ref={canvasRef}
        className="viewport-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
      />
      <ViewportToolbar />
      <ViewportGizmoControls />
    </div>
  );
}

function getPrimitiveMin(type: string): Vec3 {
  switch (type) {
    case 'plane':
      return new Vec3(-1, 0, -1);
    case 'sphere':
      return new Vec3(-1, -1, -1);
    default:
      return new Vec3(-1, -1, -1);
  }
}

function getPrimitiveMax(type: string): Vec3 {
  switch (type) {
    case 'plane':
      return new Vec3(1, 0, 1);
    case 'sphere':
      return new Vec3(1, 1, 1);
    default:
      return new Vec3(1, 1, 1);
  }
}

function ViewportToolbar() {
  const showGrid = useEditorStore((s) => s.showGrid);
  const toggleGrid = useEditorStore((s) => s.toggleGrid);
  const addPrimitive = useEditorStore((s) => s.addPrimitive);
  const frameSelected = useEditorStore((s) => s.frameSelected);

  return (
    <div className="viewport-toolbar">
      <button className="toolbar-btn" onClick={() => addPrimitive('cube')}>Cube</button>
      <button className="toolbar-btn" onClick={() => addPrimitive('sphere')}>Sphere</button>
      <button className="toolbar-btn" onClick={() => addPrimitive('plane')}>Plane</button>
      <button className="toolbar-btn" onClick={() => addPrimitive('cylinder')}>Cylinder</button>
      <button className="toolbar-btn" onClick={() => addPrimitive('cone')}>Cone</button>
      <div className="toolbar-separator" />
      <button className="toolbar-btn" onClick={frameSelected} title="Frame Selected (F)">Frame</button>
      <button className={`toolbar-btn ${showGrid ? 'active' : ''}`} onClick={toggleGrid}>Grid</button>
    </div>
  );
}

function ViewportGizmoControls() {
  const gizmoMode = useEditorStore((s) => s.gizmoMode);
  const setGizmoMode = useEditorStore((s) => s.setGizmoMode);

  return (
    <div className="viewport-gizmo-controls">
      <button
        className={`gizmo-btn ${gizmoMode === 'translate' ? 'active' : ''}`}
        onClick={() => setGizmoMode('translate')}
        title="Translate (W)"
      >
        Move
      </button>
      <button
        className={`gizmo-btn ${gizmoMode === 'rotate' ? 'active' : ''}`}
        onClick={() => setGizmoMode('rotate')}
        title="Rotate (E)"
      >
        Rotate
      </button>
      <button
        className={`gizmo-btn ${gizmoMode === 'scale' ? 'active' : ''}`}
        onClick={() => setGizmoMode('scale')}
        title="Scale (R)"
      >
        Scale
      </button>
    </div>
  );
}
