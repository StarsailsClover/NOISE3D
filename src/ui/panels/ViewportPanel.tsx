import { useEffect, useRef, useCallback, useState } from 'react';
import { useEditorStore } from '@core/EditorStore';
import { Renderer } from '@renderer/Renderer';
import { WebGPURenderer, isWebGPUAvailable } from '@renderer/WebGPURenderer';
import type { IRenderer } from '@renderer/RendererFactory';
import { Scene } from '@scene/Scene';
import { OrbitCamera } from '@engine/OrbitCamera';
import { GizmoInteraction } from '@engine/GizmoInteraction';
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
  const gizmoRef = useRef<GizmoInteraction>(new GizmoInteraction());
  const gizmoDraggingRef = useRef(false);
  const [cursor, setCursor] = useState<'default' | 'grab' | 'grabbing'>('default');

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
      r.showGrid = showGrid;
      r.cameraPos = cam.position;
      r.cameraTarget = cam.target;
      r.selectedNodeId = selectedNodeId;

      const aspect = canvas.width / Math.max(1, canvas.height);
      r.projectionMatrix = cam.getProjectionMatrix(aspect);

      // Gizmo overlay description
      const stNow = useEditorStore.getState();
      const gNode = stNow.selectedNodeId !== null ? scene.getNode(stNow.selectedNodeId) : undefined;
      if (gNode && gNode.type !== 'empty') {
        const rectCss = canvas.getBoundingClientRect();
        const ws = gizmoRef.current.computeWorldScale(cam, gNode.position, rectCss.height, cam.fov);
        gizmoRef.current.worldScale = ws;
        (r as any).gizmoVisual = {
          position: gNode.position,
          mode: stNow.gizmoMode,
          hover: gizmoRef.current.hoverHandle as never,
          active: gizmoRef.current.activeHandle as never,
          worldScale: ws,
        };
      } else {
        (r as any).gizmoVisual = null;
      }

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

  // Test/debug hooks: gizmo state + world->screen projection (css px)
  useEffect(() => {
    const api = {
      state: () => ({
        hover: gizmoRef.current.hoverHandle,
        active: gizmoRef.current.activeHandle,
        dragging: gizmoRef.current.isDragging,
      }),
      pick: (xCss: number, yCss: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return { error: 'no canvas' };
        const st = useEditorStore.getState();
        const node = st.selectedNodeId !== null ? st.scene.getNode(st.selectedNodeId) : undefined;
        if (!node) return { error: 'no node' };
        const r = canvas.getBoundingClientRect();
        const h = gizmoRef.current.pickHandle(
          xCss, yCss, node.position, cameraRef.current,
          r.width, r.height, cameraRef.current.fov, st.gizmoMode,
        );
        return { handle: h, ws: gizmoRef.current.worldScale, mode: st.gizmoMode };
      },
      project: (x: number, y: number, z: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const r = canvas.getBoundingClientRect();
        return gizmoRef.current.projectPoint(new Vec3(x, y, z), cameraRef.current, r.width, r.height);
      },
    };
    (window as any).__noise3d_gizmo = api;
    return () => { delete (window as any).__noise3d_gizmo; };
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      lastMouseRef.current = { x, y };

      if (e.button === 0) {
        // Gizmo handles take priority over object picking
        const st0 = useEditorStore.getState();
        const node = st0.selectedNodeId !== null ? scene.getNode(st0.selectedNodeId) : undefined;
        if (node && node.type !== 'empty') {
          const cam = cameraRef.current;
          const handle = gizmoRef.current.pickHandle(
            x, y, node.position, cam, rect.width, rect.height, cam.fov, st0.gizmoMode,
          );
          if (handle) {
            st0.takeSnapshot(); // one undo entry per gesture
            gizmoRef.current.startDrag(
              handle, x, y,
              node.position, node.rotation, node.scale,
              cam, rect.width, rect.height,
            );
            gizmoDraggingRef.current = true;
            setCursor('grabbing');
            e.preventDefault();
            return;
          }
        }
        dragModeRef.current = 'none';
        isDraggingRef.current = true;
        pickObject(x, y, rect.width, rect.height);
      } else if (e.button === 1 || e.button === 2) {
        isDraggingRef.current = true;
        dragModeRef.current = e.button === 1 ? 'pan' : 'rotate';
        e.preventDefault();
      }
    },
    [scene],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // --- Gizmo drag applies transform ---
      if (gizmoDraggingRef.current && gizmoRef.current.isDragging) {
        const st = useEditorStore.getState();
        const snap = e.ctrlKey || e.metaKey;
        const selId = st.selectedNodeId;
        if (selId === null) return;
        const cam = cameraRef.current;
        const gi = gizmoRef.current;

        if (st.gizmoMode === 'translate') {
          const d = gi.getTranslateDelta(x, y, cam, rect.width, rect.height, snap);
          const p0 = gi.dragStartPos;
          if (d && p0) st.updateNodeTransform(selId, Vec3.add(p0, d));
        } else if (st.gizmoMode === 'scale') {
          const m = gi.getScaleDelta(x, y, cam, rect.width, rect.height, snap);
          const s0 = gi.dragStartScale;
          if (m && s0) {
            st.updateNodeTransform(selId, undefined, undefined, new Vec3(
              Math.max(0.01, s0.x * m.x),
              Math.max(0.01, s0.y * m.y),
              Math.max(0.01, s0.z * m.z),
            ));
          }
        } else {
          const ang = gi.getRotateDelta(x, y, cam, rect.width, rect.height, snap);
          const r0 = gi.dragStartRotation;
          const h = gi.activeHandle;
          if (r0 && h) {
            const rot = r0.clone();
            if (h.axis === 'x') rot.x = r0.x + ang;
            else if (h.axis === 'y') rot.y = r0.y + ang;
            else rot.z = r0.z + ang;
            st.updateNodeTransform(selId, undefined, rot);
          }
        }
        lastMouseRef.current = { x, y };
        return;
      }

      const dx = x - lastMouseRef.current.x;
      const dy = y - lastMouseRef.current.y;

      const cam = cameraRef.current;
      if (isDraggingRef.current && dragModeRef.current === 'rotate') {
        cam.rotate(dx, dy);
      } else if (isDraggingRef.current && dragModeRef.current === 'pan') {
        cam.pan(dx, dy, rect.width, rect.height);
      } else {
        // Hover detection over selected node's gizmo
        const st = useEditorStore.getState();
        const node = st.selectedNodeId !== null ? st.scene.getNode(st.selectedNodeId) : undefined;
        let handle: { kind: string; axis: 'x' | 'y' | 'z' } | null = null;
        if (node && node.type !== 'empty') {
          handle = gizmoRef.current.pickHandle(
            x, y, node.position, cam, rect.width, rect.height, cam.fov, st.gizmoMode,
          ) as { kind: string; axis: 'x' | 'y' | 'z' } | null;
        }
        gizmoRef.current.setHover(handle as never);
        const nextCursor = handle ? 'grab' : 'default';
        setCursor((c) => (c === nextCursor || c === 'grabbing' ? c : nextCursor));
      }

      lastMouseRef.current = { x, y };
    },
    [scene],
  );

  const handleMouseUp = useCallback(() => {
    if (gizmoDraggingRef.current) {
      gizmoRef.current.endDrag();
      gizmoDraggingRef.current = false;
      setCursor('default');
    }
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

      const aspect = w / h;
      const projMatrix = cam.getProjectionMatrix(aspect);

      const ray = Ray.fromScreen(
        sx, sy, w, h,
        cam.position, cam.target, cam.fov, cam.near, cam.far,
        projMatrix,
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
        style={{ cursor }}
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
