import { Vec3 } from '@math/Vec';
import { Mat4 } from '@math/Mat4';
import type { OrbitCamera } from '@engine/OrbitCamera';
import type { GizmoMode } from '@engine/GizmoRenderer';

export type GizmoAxis = 'x' | 'y' | 'z' | null;

interface DragState {
  axis: GizmoAxis;
  startScreenX: number;
  startScreenY: number;
  startValue: Vec3;
  hitPoint: Vec3;
}

export class GizmoInteraction {
  private dragState: DragState | null = null;
  private gizmoSize: number = 1.0;

  get isDragging(): boolean {
    return this.dragState !== null;
  }

  get currentAxis(): GizmoAxis {
    return this.dragState?.axis ?? null;
  }

  get dragStartValue(): Vec3 | null {
    return this.dragState?.startValue ?? null;
  }

  /**
   * Returns the screen-space gizmo size in pixels, scaled to maintain constant visual size.
   */
  getGizmoScreenSize(cam: OrbitCamera): number {
    const dist = cam.distance;
    const baseSize = 80; // base pixel size at distance 1
    return (baseSize * this.gizmoSize) / Math.max(dist, 0.1);
  }

  /**
   * Pick which gizmo axis the mouse is over.
   * Returns the axis name or null if not hovering any axis.
   */
  pickAxis(
    screenX: number,
    screenY: number,
    nodePos: Vec3,
    cam: OrbitCamera,
    viewportWidth: number,
    viewportHeight: number,
    mode: GizmoMode,
  ): GizmoAxis {
    const dpr = window.devicePixelRatio || 1;
    const sx = screenX * dpr;
    const sy = screenY * dpr;
    const w = viewportWidth * dpr;
    const h = viewportHeight * dpr;

    // Project the node position to screen
    const nodeScreen = this.worldToScreen(nodePos, cam, w, h);
    if (!nodeScreen) return null;

    const screenSize = this.getGizmoScreenSize(cam);
    const dx = sx - nodeScreen.x;
    const dy = sy - nodeScreen.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // For translate/scale: check if mouse is near an axis line
    // For rotate: check if mouse is near a ring
    const threshold = 12; // pixel threshold

    if (mode === 'rotate') {
      // Ring radius in screen pixels
      const ringRadius = screenSize;
      if (Math.abs(dist - ringRadius) < threshold * 1.5) {
        // Determine which ring by angle
        const angle = Math.atan2(dy, dx);
        // X axis ring is around the X axis (red) - detected by vertical screen angle
        // Simplified: pick nearest axis by screen-space angle
        const deg = (angle * 180) / Math.PI;
        if (Math.abs(deg) < 45 || Math.abs(deg) > 135) return 'x';
        if (deg >= 45 && deg < 135) return 'y';
        return 'z';
      }
      return null;
    }

    // For translate/scale: project axis endpoints to screen and check proximity
    const axes: { name: GizmoAxis; dir: Vec3 }[] = [
      { name: 'x', dir: new Vec3(1, 0, 0) },
      { name: 'y', dir: new Vec3(0, 1, 0) },
      { name: 'z', dir: new Vec3(0, 0, 1) },
    ];

    let bestAxis: GizmoAxis = null;
    let bestDist = threshold;

    for (const ax of axes) {
      const worldEnd = new Vec3(
        nodePos.x + ax.dir.x * this.gizmoSize,
        nodePos.y + ax.dir.y * this.gizmoSize,
        nodePos.z + ax.dir.z * this.gizmoSize,
      );
      const endScreen = this.worldToScreen(worldEnd, cam, w, h);
      if (!endScreen) continue;

      // Distance from mouse to the line segment (nodeScreen -> endScreen)
      const lineDist = pointToSegmentDist(sx, sy, nodeScreen.x, nodeScreen.y, endScreen.x, endScreen.y);
      if (lineDist < bestDist) {
        bestDist = lineDist;
        bestAxis = ax.name;
      }
    }

    return bestAxis;
  }

  /**
   * Begin dragging on a gizmo axis.
   */
  startDrag(
    axis: GizmoAxis,
    screenX: number,
    screenY: number,
    startPos: Vec3,
    cam: OrbitCamera,
    viewportWidth: number,
    viewportHeight: number,
  ): void {
    const dpr = window.devicePixelRatio || 1;
    // Compute the world hit point on the gizmo axis plane
    const hitPoint = this.screenToWorldOnPlane(
      screenX * dpr, screenY * dpr,
      viewportWidth * dpr, viewportHeight * dpr,
      startPos, cam,
    ) ?? startPos.clone();
    this.dragState = {
      axis,
      startScreenX: screenX,
      startScreenY: screenY,
      startValue: startPos.clone(),
      hitPoint,
    };
  }

  /**
   * Compute the drag delta for translate mode.
   */
  getTranslateDelta(
    screenX: number,
    screenY: number,
    cam: OrbitCamera,
    viewportWidth: number,
    viewportHeight: number,
  ): Vec3 | null {
    if (!this.dragState) return null;
    const dpr = window.devicePixelRatio || 1;
    const sx = screenX * dpr;
    const sy = screenY * dpr;
    const w = viewportWidth * dpr;
    const h = viewportHeight * dpr;

    // Project the current mouse position onto the plane through the start point
    // perpendicular to the camera forward direction
    const newHit = this.screenToWorldOnPlane(sx, sy, w, h, this.dragState.startValue, cam);
    if (!newHit) return null;

    const delta = Vec3.sub(newHit, this.dragState.hitPoint);

    // Mask to only the dragged axis
    if (this.dragState.axis === 'x') return new Vec3(delta.x, 0, 0);
    if (this.dragState.axis === 'y') return new Vec3(0, delta.y, 0);
    if (this.dragState.axis === 'z') return new Vec3(0, 0, delta.z);
    return delta;
  }

  /**
   * Compute the drag delta for scale mode.
   */
  getScaleDelta(
    screenX: number,
    screenY: number,
    cam: OrbitCamera,
    viewportWidth: number,
    viewportHeight: number,
  ): Vec3 | null {
    if (!this.dragState) return null;
    const dpr = window.devicePixelRatio || 1;
    const sx = screenX * dpr;
    const sy = screenY * dpr;
    const w = viewportWidth * dpr;
    const h = viewportHeight * dpr;

    const newHit = this.screenToWorldOnPlane(sx, sy, w, h, this.dragState.startValue, cam);
    if (!newHit) return null;

    const startDist = Vec3.sub(this.dragState.hitPoint, this.dragState.startValue);
    const currentDist = Vec3.sub(newHit, this.dragState.startValue);

    let ratio: number;
    if (this.dragState.axis === 'x') {
      ratio = Math.abs(startDist.x) > 0.001 ? currentDist.x / startDist.x : 1;
    } else if (this.dragState.axis === 'y') {
      ratio = Math.abs(startDist.y) > 0.001 ? currentDist.y / startDist.y : 1;
    } else if (this.dragState.axis === 'z') {
      ratio = Math.abs(startDist.z) > 0.001 ? currentDist.z / startDist.z : 1;
    } else {
      ratio = 1;
    }

    if (this.dragState.axis === 'x') return new Vec3(ratio, 1, 1);
    if (this.dragState.axis === 'y') return new Vec3(1, ratio, 1);
    if (this.dragState.axis === 'z') return new Vec3(1, 1, ratio);
    return new Vec3(ratio, ratio, ratio);
  }

  /**
   * Compute the rotation delta in radians.
   */
  getRotateDelta(
    screenX: number,
    screenY: number,
    cam: OrbitCamera,
    viewportWidth: number,
    viewportHeight: number,
  ): number {
    if (!this.dragState) return 0;
    const dpr = window.devicePixelRatio || 1;
    const w = viewportWidth * dpr;
    const h = viewportHeight * dpr;

    // Project the node center to screen
    const center = this.worldToScreen(this.dragState.startValue, cam, w, h);
    if (!center) return 0;

    const sx = screenX * dpr;
    const sy = screenY * dpr;

    // Compute angles from center to start and current mouse positions
    const startAngle = Math.atan2(
      (this.dragState.startScreenY * dpr) - center.y,
      (this.dragState.startScreenX * dpr) - center.x,
    );
    const currentAngle = Math.atan2(sy - center.y, sx - center.x);

    let delta = currentAngle - startAngle;
    // Normalize to [-PI, PI]
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;

    // Snap to 15-degree increments with Ctrl
    // (snapping handled by caller)

    // Negate for intuitive rotation direction
    return -delta;
  }

  endDrag(): void {
    this.dragState = null;
  }

  private worldToScreen(
    worldPos: Vec3,
    cam: OrbitCamera,
    viewportWidth: number,
    viewportHeight: number,
  ): { x: number; y: number } | null {
    const view = Mat4.lookAt(cam.position, cam.target, new Vec3(0, 1, 0));
    const aspect = viewportWidth / Math.max(1, viewportHeight);
    const proj = cam.getProjectionMatrix(aspect);
    const vp = Mat4.multiply(proj, view);

    const d = vp.data;
    const x = worldPos.x;
    const y = worldPos.y;
    const z = worldPos.z;
    const w = d[3] * x + d[7] * y + d[11] * z + d[15];

    if (Math.abs(w) < 1e-9) return null;
    const invW = 1 / w;
    const ndcX = (d[0] * x + d[4] * y + d[8] * z + d[12]) * invW;
    const ndcY = (d[1] * x + d[5] * y + d[9] * z + d[13]) * invW;

    return {
      x: ((ndcX + 1) * 0.5) * viewportWidth,
      y: ((1 - ndcY) * 0.5) * viewportHeight,
    };
  }

  private screenToWorldOnPlane(
    sx: number,
    sy: number,
    w: number,
    h: number,
    planePoint: Vec3,
    cam: OrbitCamera,
  ): Vec3 | null {
    const ndcX = (2 * sx) / w - 1;
    const ndcY = 1 - (2 * sy) / h;

    const view = Mat4.lookAt(cam.position, cam.target, new Vec3(0, 1, 0));
    const aspect = w / Math.max(1, h);
    const proj = cam.getProjectionMatrix(aspect);
    const viewInv = view.invert();
    const projInv = proj.invert();

    const nearPoint = transformPoint(projInv, ndcX, ndcY, -1);
    const farPoint = transformPoint(projInv, ndcX, ndcY, 1);
    const nearWorld = transformPoint(viewInv, nearPoint.x, nearPoint.y, nearPoint.z);
    const farWorld = transformPoint(viewInv, farPoint.x, farPoint.y, farPoint.z);

    const rayDir = Vec3.normalize(Vec3.sub(farWorld, nearWorld));
    const planeNormal = Vec3.normalize(Vec3.sub(cam.target, cam.position));
    const denom = Vec3.dot(rayDir, planeNormal);
    if (Math.abs(denom) < 1e-9) return null;

    const t = Vec3.dot(Vec3.sub(planePoint, nearWorld), planeNormal) / denom;
    return new Vec3(
      nearWorld.x + rayDir.x * t,
      nearWorld.y + rayDir.y * t,
      nearWorld.z + rayDir.z * t,
    );
  }
}

function transformPoint(m: Mat4, x: number, y: number, z: number): Vec3 {
  const d = m.data;
  const w = d[3] * x + d[7] * y + d[11] * z + d[15];
  const invW = w !== 0 ? 1 / w : 1;
  return new Vec3(
    (d[0] * x + d[4] * y + d[8] * z + d[12]) * invW,
    (d[1] * x + d[5] * y + d[9] * z + d[13]) * invW,
    (d[2] * x + d[6] * y + d[10] * z + d[14]) * invW,
  );
}

function pointToSegmentDist(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-9) {
    return Math.sqrt((px - ax) * (px - ax) + (py - ay) * (py - ay));
  }
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy));
}
