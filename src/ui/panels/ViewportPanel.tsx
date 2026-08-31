import { useEffect, useRef, useCallback, useState } from 'react';
import { useEditorStore } from '@core/EditorStore';
import { Renderer } from '@renderer/Renderer';
import { WebGPURenderer, isWebGPUAvailable } from '@renderer/WebGPURenderer';
import type { IRenderer } from '@renderer/RendererFactory';
import { Scene } from '@scene/Scene';
import { OrbitCamera } from '@engine/OrbitCamera';
import { GizmoInteraction } from '@engine/GizmoInteraction';
import { computeSceneBounds, primitiveMin, primitiveMax } from '@engine/primitiveBounds';
import { useOverlayStore } from '@core/OverlayStore';
import { Ray } from '@engine/Ray';
import { Vec3 } from '@math/Vec';
import { Mat4 } from '@math/Mat4';
import { ViewportCameraControls } from './ViewportCameraControls';
import { ViewportNavGizmo } from '../ViewportNavGizmo';

export function ViewportPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<IRenderer | null>(null);
  const cameraRef = useRef<OrbitCamera>(new OrbitCamera());
  const animationRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const dragModeRef = useRef<'rotate' | 'pan' | 'orbit' | 'none'>('none');
  const gizmoRef = useRef<GizmoInteraction>(new GizmoInteraction());
  const gizmoDraggingRef = useRef(false);
  const [cursor, setCursor] = useState<'default' | 'grab' | 'grabbing'>('default');
  const flyActiveRef = useRef(false);
  const keysRef = useRef<Set<string>>(new Set());
  const hoverObjRef = useRef<number | null>(null);
  const lastHoverRayRef = useRef(0);
  const keyAxisRef = useRef<'x' | 'y' | 'z' | null>(null);
  const numericBufferRef = useRef<string | null>(null);

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

    // Keyboard tracking for flythrough + mid-drag axis lock / numeric entry
    const keys = keysRef.current;
    const applyNumericExact = () => {
      const buf = numericBufferRef.current;
      if (buf === null) return;
      const nv = parseFloat(buf);
      if (Number.isNaN(nv)) return;
      const st = useEditorStore.getState();
      const selId = st.selectedNodeId;
      if (selId === null || !gizmoRef.current.isDragging) return;
      const gi = gizmoRef.current;
      const h = gi.activeHandle;
      if (!h) return;
      const axis = keyAxisRef.current ?? h.axis;
      if (st.gizmoMode === 'translate') {
        const np = gi.dragStartPos!.clone();
        np[axis] = nv;
        st.updateNodeTransform(selId, np);
      } else if (st.gizmoMode === 'scale') {
        const ns = gi.dragStartScale!.clone();
        ns[axis] = Math.max(0.01, nv);
        st.updateNodeTransform(selId, undefined, undefined, ns);
      } else {
        const nr = gi.dragStartRotation!.clone();
        nr[axis] = nv;
        st.updateNodeTransform(selId, undefined, nr);
      }
      useOverlayStore.setState({ dragReadout: `exact: ${buf} on ${axis.toUpperCase()}` });
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return;
      keys.add(e.code);
      // Mid-drag axis lock + numeric entry (Blender modal behavior)
      if (gizmoDraggingRef.current) {
        if (['x', 'y', 'z'].includes(e.key.toLowerCase())) {
          keyAxisRef.current = e.key.toLowerCase() as 'x' | 'y' | 'z';
          useOverlayStore.setState({ dragReadout: `axis locked: ${e.key.toUpperCase()}` });
        } else if (/^[0-9.\-]$/.test(e.key)) {
          numericBufferRef.current = (numericBufferRef.current ?? '') + e.key;
          useOverlayStore.setState({ dragReadout: `enter: ${numericBufferRef.current}` });
          applyNumericExact();
        } else if (e.key === 'Enter') {
          numericBufferRef.current = null;
          useOverlayStore.setState({ dragReadout: null });
          gizmoRef.current.endDrag();
          gizmoDraggingRef.current = false;
          setCursor('default');
        } else if (e.key === 'Backspace') {
          numericBufferRef.current = (numericBufferRef.current ?? '').slice(0, -1) || null;
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.code);
      if (['x', 'y', 'z'].includes(e.key.toLowerCase())) keyAxisRef.current = null;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    let lastT = performance.now();
    const renderLoop = () => {
      if (!rendererRef.current) return;
      const now = performance.now();
      const dt = Math.min((now - lastT) / 1000, 0.1);
      lastT = now;

      // Flythrough movement (per-frame)
      if (flyActiveRef.current) cam.flyTick(dt, keys);

      const r = rendererRef.current;
      r.showGrid = showGrid;
      r.cameraPos = cam.position;
      r.cameraTarget = cam.target;
      r.selectedNodeId = selectedNodeId;

      // Camera debug hook
      (window as any).__noise3d_cam = {
        pos: { x: cam.position.x, y: cam.position.y, z: cam.position.z },
        target: { x: cam.target.x, y: cam.target.y, z: cam.target.z },
        dist: cam.distance,
        flying: cam.flying,
        flySpeed: cam.flySpeed,
      };

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

      // Selection feedback fields
      (r as any).hoverNodeId = hoverObjRef.current;
      (r as any).selectedIds = stNow.selectedNodeIds;
      if (stNow.selectedNodeIds.length > 1) {
        const selNodes = stNow.selectedNodeIds
          .map((id) => scene.getNode(id))
          .filter((n): n is NonNullable<typeof n> => !!n && n.visible);
        const b = computeSceneBounds(selNodes);
        (r as any).selectionBounds = b
          ? {
              min: new Vec3(b.center.x - b.radius, b.center.y - b.radius, b.center.z - b.radius),
              max: new Vec3(b.center.x + b.radius, b.center.y + b.radius, b.center.z + b.radius),
            }
          : null;
      } else {
        (r as any).selectionBounds = null;
      }
      (r as any).groundMarker = stNow.groundMarker;

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
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
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
        hoverObj: hoverObjRef.current,
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
      raycast: (xCss: number, yCss: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return { error: 'no canvas' };
        const r = canvas.getBoundingClientRect();
        const id = raycastPick(
          useEditorStore.getState().scene,
          xCss, yCss, r.width, r.height, cameraRef.current,
        );
        return { objId: id };
      },
      project: (x: number, y: number, z: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const r = canvas.getBoundingClientRect();
        return gizmoRef.current.projectPoint(new Vec3(x, y, z), cameraRef.current, r.width, r.height);
      },
      cancel: () => {
        gizmoRef.current.cancelDrag();
        gizmoDraggingRef.current = false;
        setCursor('default');
      },
      sel: () => {
        const s = useEditorStore.getState();
        return { ids: s.selectedNodeIds, primary: s.selectedNodeId, marker: s.groundMarker };
      },
    };
    (window as any).__noise3d_gizmo = api;
    (window as any).__noise3d_store = useEditorStore;
    return () => { delete (window as any).__noise3d_gizmo; delete (window as any).__noise3d_store; };
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      lastMouseRef.current = { x, y };

      if (e.button === 0 && e.altKey) {
        // Alt+LMB: orbit around target (Unity-style), takes priority
        dragModeRef.current = 'orbit';
        isDraggingRef.current = true;
        e.preventDefault();
        return;
      }

      if (e.button === 0) {
        const st0 = useEditorStore.getState();

        // Top-most object under cursor decides selection vs gizmo priority
        const objId = raycastPick(
          scene, x, y, rect.width, rect.height,
          cameraRef.current,
        );

        // Gizmo intercept rules (Blender-like):
        //   axis/ring always win; plane quads only over empty space so
        //   clicking an object's body always selects it.
        let handle: { kind: string; axis: 'x' | 'y' | 'z' } | null = null;
        const selNode = st0.selectedNodeId !== null ? scene.getNode(st0.selectedNodeId) : undefined;
        if (selNode && selNode.type !== 'empty') {
          handle = gizmoRef.current.pickHandle(
            x, y, selNode.position, cameraRef.current,
            rect.width, rect.height, cameraRef.current.fov, st0.gizmoMode,
          ) as { kind: string; axis: 'x' | 'y' | 'z' } | null;
          if (handle && handle.kind === 'plane' && objId !== null) handle = null;
        }

        // Shift-click always selects/toggles, even over the gizmo (Blender)
        if (handle && selNode && !e.shiftKey) {
          st0.takeSnapshot(); // one undo entry per gesture
          gizmoRef.current.startDrag(
            handle as never, x, y,
            selNode.position, selNode.rotation, selNode.scale,
            cameraRef.current, rect.width, rect.height,
          );
          gizmoDraggingRef.current = true;
          setCursor('grabbing');
          e.preventDefault();
          return;
        }

        dragModeRef.current = 'none';
        isDraggingRef.current = true;
        if (objId !== null && e.shiftKey) {
          useEditorStore.getState().selectNodeMulti(objId, true);
        } else if (objId !== null || !e.shiftKey) {
          selectNode(objId);
        }
      } else if (e.button === 2) {
        // Right button: enter free-fly look mode
        cameraRef.current.beginFly();
        flyActiveRef.current = true;
        dragModeRef.current = 'none';
        isDraggingRef.current = true;
        setCursor('grabbing');
        e.preventDefault();
      } else if (e.button === 1) {
        isDraggingRef.current = true;
        dragModeRef.current = 'pan';
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

        // Mid-drag axis lock: X/Y/Z keys override the grabbed axis
        if (keyAxisRef.current && gi.activeHandle) {
          gi.activeHandle.axis = keyAxisRef.current;
          gi.activeHandle.kind = 'axis';
        }

        // Mid-drag numeric entry: typed value sets the constrained axis exactly
        if (numericBufferRef.current !== null && gi.activeHandle) {
          const nv = parseFloat(numericBufferRef.current);
          if (!Number.isNaN(nv)) {
            const p0 = gi.dragStartPos!;
            const r0 = gi.dragStartRotation!;
            const s0 = gi.dragStartScale!;
            const axis = gi.activeHandle.axis;
            if (st.gizmoMode === 'translate') {
              const np = p0.clone();
              np[axis] = nv;
              st.updateNodeTransform(selId, np);
            } else if (st.gizmoMode === 'scale') {
              const ns = s0.clone();
              ns[axis] = Math.max(0.01, nv);
              st.updateNodeTransform(selId, undefined, undefined, ns);
            } else {
              const nr = r0.clone();
              nr[axis] = nv;
              st.updateNodeTransform(selId, undefined, nr);
            }
            useOverlayStore.setState({
              dragReadout: `exact: ${numericBufferRef.current} on ${axis.toUpperCase()}`,
            });
            lastMouseRef.current = { x, y };
            return;
          }
        }

        // Shift = precision (0.1x delta)
        const precision = e.shiftKey;

        if (st.gizmoMode === 'translate') {
          let d = gi.getTranslateDelta(x, y, cam, rect.width, rect.height, snap);
          const p0 = gi.dragStartPos;
          if (d && p0) {
            if (precision) d = Vec3.scale(d, 0.1);
            st.updateNodeTransform(selId, Vec3.add(p0, d));
            useOverlayStore.setState({
              dragReadout: `Dx: ${d.x.toFixed(2)}  Dy: ${d.y.toFixed(2)}  Dz: ${d.z.toFixed(2)}`,
            });
          }
        } else if (st.gizmoMode === 'scale') {
          const m = gi.getScaleDelta(x, y, cam, rect.width, rect.height, snap);
          const s0 = gi.dragStartScale;
          if (m && s0) {
            st.updateNodeTransform(selId, undefined, undefined, new Vec3(
              Math.max(0.01, s0.x * m.x),
              Math.max(0.01, s0.y * m.y),
              Math.max(0.01, s0.z * m.z),
            ));
            useOverlayStore.setState({
              dragReadout: `Scale: ${m.x.toFixed(2)} / ${m.y.toFixed(2)} / ${m.z.toFixed(2)}`,
            });
          }
        } else {
          const ang = gi.getRotateDelta(x, y, cam, rect.width, rect.height, snap);
          const r0 = gi.dragStartRotation;
          const h = gi.activeHandle;
          if (r0 && h) {
            const rot = r0.clone();
            const deg = (ang * 180) / Math.PI;
            if (h.axis === 'x') rot.x = r0.x + ang;
            else if (h.axis === 'y') rot.y = r0.y + ang;
            else rot.z = r0.z + ang;
            st.updateNodeTransform(selId, undefined, rot);
            useOverlayStore.setState({ dragReadout: `D-angle: ${deg.toFixed(1)}°` });
          }
        }
        lastMouseRef.current = { x, y };
        return;
      }

      const dx = x - lastMouseRef.current.x;
      const dy = y - lastMouseRef.current.y;

      const cam = cameraRef.current;
      if (isDraggingRef.current && flyActiveRef.current) {
        cam.flyLook(dx, dy);
      } else if (isDraggingRef.current && dragModeRef.current === 'orbit') {
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

        // Throttled (~30Hz) object hover raycast for outline feedback.
        // Independent of gizmo-handle hover (both channels show together).
        const nowMs = performance.now();
        if (nowMs - lastHoverRayRef.current >= 33) {
          lastHoverRayRef.current = nowMs;
          hoverObjRef.current = raycastPick(
            st.scene, x, y, rect.width, rect.height, cam,
          );
        }
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
      numericBufferRef.current = null;
      keyAxisRef.current = null;
      useOverlayStore.getState().setDragReadout(null);
    }
    if (flyActiveRef.current) {
      cameraRef.current.endFly();
      flyActiveRef.current = false;
      setCursor('default');
    }
    isDraggingRef.current = false;
    dragModeRef.current = 'none';
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    const cam = cameraRef.current;
    cam.zoom(e.deltaY);
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const st = useEditorStore.getState();
      const objId = raycastPick(scene, x, y, rect.width, rect.height, cameraRef.current);
      const { openMenu } = useOverlayStore.getState();
      const cx = e.clientX;
      const cy = e.clientY;

      if (objId !== null) {
        st.selectNode(objId);
        openMenu(cx, cy, [
          { label: 'Duplicate', shortcut: 'Ctrl+D', action: () => useEditorStore.getState().duplicateNode(objId) },
          { label: 'Delete', shortcut: 'Del', danger: true, action: () => useEditorStore.getState().removeNode(objId) },
          { label: 'Focus', shortcut: 'F', action: () => useEditorStore.getState().frameSelected() },
          {
            label: st.isolatedNodeId === objId ? 'Un-isolate' : 'Isolate',
            separatorBefore: true,
            action: () => useEditorStore.getState().isolateNode(objId),
          },
        ]);
      } else {
        const types = ['cube', 'sphere', 'plane', 'cylinder', 'cone'] as const;
        openMenu(
          cx, cy,
          types.map((t) => ({
            label: 'Add ' + t.charAt(0).toUpperCase() + t.slice(1),
            action: () => useEditorStore.getState().addPrimitive(t),
          })),
        );
      }
    },
    [scene],
  );

  const frameAllNodes = useCallback(() => {
    const b = computeSceneBounds(scene.getAllNodes());
    if (b) cameraRef.current.frameAllIso(b.center, b.radius);
    else cameraRef.current.frameAllIso(new Vec3(0, 0, 0), 2);
  }, [scene]);

  // ---- Drag & drop (assets from browser + OS files) ----
  const [osDragHover, setOsDragHover] = useState(false);
  const osDragDepth = useRef(0);

  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = raycastPick(scene, x, y, rect.width, rect.height, cameraRef.current);
      if (id === null) frameAllNodes(); // double-click empty = frame all
    },
    [scene, frameAllNodes],
  );
  const handleOsDragEnter = useCallback((e: React.DragEvent) => {
    if (!Array.from(e.dataTransfer.types).includes('Files')) return;
    e.preventDefault();
    osDragDepth.current += 1;
    setOsDragHover(true);
  }, []);

  const handleOsDragLeave = useCallback((e: React.DragEvent) => {
    if (!Array.from(e.dataTransfer.types).includes('Files')) return;
    osDragDepth.current = Math.max(0, osDragDepth.current - 1);
    if (osDragDepth.current === 0) setOsDragHover(false);
  }, []);

  const handleCanvasDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      osDragDepth.current = 0;
      setOsDragHover(false);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const st = useEditorStore.getState();

      // 1) OS files (import pipelines)
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        for (const file of Array.from(e.dataTransfer.files)) {
          const lower = file.name.toLowerCase();
          if (lower.endsWith('.obj')) st.importOBJ(file);
          else if (/\.(png|jpe?g)$/.test(lower)) st.importTexture(file);
          else if (lower.endsWith('.json')) st.loadSceneFromFile(file);
        }
        return;
      }

      // 2) Asset payload from the asset browser
      const assetJson = e.dataTransfer.getData('application/x-noise3d-asset');
      if (!assetJson) return;
      try {
        const { assetId, name } = JSON.parse(assetJson);
        // Spawn at raycast hit point (lifted), else origin
        let pos: Vec3 | undefined;
        const dpr = window.devicePixelRatio || 1;
        const ray = Ray.fromScreen(
          x * dpr, y * dpr, rect.width * dpr, rect.height * dpr,
          cameraRef.current.position, cameraRef.current.target,
          cameraRef.current.fov, cameraRef.current.near, cameraRef.current.far,
          cameraRef.current.getProjectionMatrix(rect.width / rect.height),
        );
        let closestT = Infinity;
        for (const node of scene.getAllNodes()) {
          if (!node.visible || node.type === 'empty' || node.type === 'custom') continue;
          const model = Mat4.fromTRS(node.position, node.rotation, node.scale);
          const t = ray.intersectAABB(primitiveMin(node.type), primitiveMax(node.type), model);
          if (t !== null && t < closestT) {
            closestT = t;
            pos = Vec3.add(ray.origin, Vec3.scale(ray.direction, t));
          }
        }
        if (pos) pos = new Vec3(pos.x, pos.y + 0.6, pos.z);
        st.addCustomMeshNode(assetId, name, pos);
      } catch { /* bad payload */ }
    },
    [scene],
  );

  return (
    <div
      className={`viewport-container ${osDragHover ? 'os-drag-hover' : ''}`}
      onDragEnter={handleOsDragEnter}
      onDragLeave={handleOsDragLeave}
      onDragOver={handleCanvasDragOver}
      onDrop={handleCanvasDrop}
    >
      {osDragHover && <div className="os-drop-overlay">Drop OBJ / image / scene JSON</div>}
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
        onDoubleClick={handleDoubleClick}
      />
      <ViewportToolbar />
      <ViewportGizmoControls />
      <ViewportCameraControls cameraRef={cameraRef} onFrameAll={frameAllNodes} />
      {!flyActiveRef.current && <ViewportNavGizmo cameraRef={cameraRef} />}
    </div>
  );
}

/** Top-most visible mesh node under the cursor, or null. */
function raycastPick(
  scene: Scene,
  screenX: number,
  screenY: number,
  widthCss: number,
  heightCss: number,
  cam: OrbitCamera,
): number | null {
  const dpr = window.devicePixelRatio || 1;
  const sx = screenX * dpr;
  const sy = screenY * dpr;
  const w = widthCss * dpr;
  const h = heightCss * dpr;

  const projMatrix = cam.getProjectionMatrix(w / h);
  const ray = Ray.fromScreen(
    sx, sy, w, h,
    cam.position, cam.target, cam.fov, cam.near, cam.far,
    projMatrix,
  );

  let closestId: number | null = null;
  let closestT = Infinity;

  for (const node of scene.getAllNodes()) {
    if (!node.visible || node.type === 'empty' || node.type === 'custom') continue;
    const min = primitiveMin(node.type);
    const max = primitiveMax(node.type);
    const model = Mat4.fromTRS(node.position, node.rotation, node.scale);
    const t = ray.intersectAABB(min, max, model);
    if (t !== null && t < closestT) {
      closestT = t;
      closestId = node.id;
    }
  }
  return closestId;
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







