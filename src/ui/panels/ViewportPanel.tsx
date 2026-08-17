import { useEffect, useRef, useCallback } from 'react';
import { useEditorStore } from '@core/EditorStore';
import { Renderer } from '@renderer/Renderer';
import { WebGPURenderer, isWebGPUAvailable } from '@renderer/WebGPURenderer';
import type { IRenderer } from '@renderer/RendererFactory';
import { Scene } from '@scene/Scene';
import { OrbitCamera } from '@engine/OrbitCamera';
import { Ray } from '@engine/Ray';
import { Vec3 } from '@math/Vec';
import { Mat4 } from '@math/Mat4';
import { ViewportCameraControls } from './ViewportCameraControls';

export function ViewportPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<IRenderer | null>(null);
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
  const setRenderCanvas = useEditorStore((s) => s.setRenderCanvas);
  const postExposure = useEditorStore((s) => s.postExposure);
  const postBloomThreshold = useEditorStore((s) => s.postBloomThreshold);
  const postBloomIntensity = useEditorStore((s) => s.postBloomIntensity);
  const cameraState = useEditorStore((s) => s.cameraState);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: IRenderer;
    try {
      renderer = new Renderer(canvas) as unknown as IRenderer;
    } catch (e) {
      console.error('Failed to initialize renderer:', e);
      return;
    }
    rendererRef.current = renderer;
    setRenderCanvas(canvas);

    if (isWebGPUAvailable()) {
      const gpuRenderer = new WebGPURenderer(canvas);
      gpuRenderer.ready.then(() => {
        const old = rendererRef.current as any;
        const gpu = gpuRenderer as any;
        gpu.cameraPos = old.cameraPos;
        gpu.cameraTarget = old.cameraTarget;
        gpu.fov = old.fov;
        gpu.near = old.near;
        gpu.far = old.far;
        gpu.ambient = old.ambient;
        gpu.showGrid = old.showGrid;
        gpu.selectedNodeId = old.selectedNodeId;
        gpu.postExposure = old.postExposure;
        gpu.postBloomThreshold = old.postBloomThreshold;
        gpu.postBloomIntensity = old.postBloomIntensity;
        rendererRef.current = gpuRenderer as unknown as IRenderer;
        useEditorStore.getState().log('info', 'WebGPU backend activated');
      }).catch(() => {
        useEditorStore.getState().log('info', 'Using WebGL2 backend (WebGPU unavailable)');
      });
    }

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
      const store = useEditorStore.getState();
      r.showGrid = store.showGrid;
      r.cameraPos = cam.position;
      r.cameraTarget = cam.target;
      r.selectedNodeId = store.selectedNodeId;

      for (const [id, mat] of store.materials) {
        r.setMaterial(id, mat);
      }

      r.render(store.scene as Scene, canvas.width, canvas.height);

      // Sync camera state to store periodically for save/serialization
      syncCount++;
      if (syncCount >= 30) {
        syncCount = 0;
        store.setCameraState(cam.serialize());
      }

      animationRef.current = requestAnimationFrame(renderLoop);
    };
    let syncCount = 0;
    animationRef.current = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animationRef.current);
      resizeObserver.disconnect();
      renderer.dispose();
      rendererRef.current = null;
      setRenderCanvas(null);
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
    if (rendererRef.current) {
      rendererRef.current.postExposure = postExposure;
      rendererRef.current.postBloomThreshold = postBloomThreshold;
      rendererRef.current.postBloomIntensity = postBloomIntensity;
    }
  }, [postExposure, postBloomThreshold, postBloomIntensity]);

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

  // Restore camera state when loaded from scene file
  useEffect(() => {
    if (!cameraState) return;
    cameraRef.current.deserialize(cameraState);
  }, [cameraState]);

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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cam = cameraRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cam.zoomToCursor(e.deltaY, x, y, rect.width, rect.height);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Numpad camera shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const cam = cameraRef.current;
      if (!cam) return;

      // Numpad 1: Front
      if (e.code === 'Numpad1') {
        e.preventDefault();
        cam.setView('front');
        return;
      }
      // Numpad 3: Right
      if (e.code === 'Numpad3') {
        e.preventDefault();
        cam.setView('right');
        return;
      }
      // Numpad 7: Top
      if (e.code === 'Numpad7') {
        e.preventDefault();
        cam.setView('top');
        return;
      }
      // Numpad 5: Toggle ortho/perspective
      if (e.code === 'Numpad5') {
        e.preventDefault();
        cam.toggleProjection();
        return;
      }
      // Numpad . : Frame selected
      if (e.code === 'NumpadDecimal') {
        e.preventDefault();
        useEditorStore.getState().frameSelected();
        return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
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
      <ViewportCameraControls cameraRef={cameraRef} />
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
