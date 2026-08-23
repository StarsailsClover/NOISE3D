import { Vec3 } from '@math/Vec';
import { Mat4 } from '@math/Mat4';
import type { OrbitCamera } from '@engine/OrbitCamera';
import type { GizmoMode } from '@engine/GizmoRenderer';

export type GizmoAxis = 'x' | 'y' | 'z';

export interface GizmoHandle {
  kind: 'axis' | 'plane' | 'ring';
  axis: GizmoAxis;
}

const AXES: Record<GizmoAxis, Vec3> = {
  x: new Vec3(1, 0, 0),
  y: new Vec3(0, 1, 0),
  z: new Vec3(0, 0, 1),
};

export const TRANSLATE_SNAP = 0.5;
export const ROTATE_SNAP_DEG = 15;
export const SCALE_SNAP = 0.1;

interface DragState {
  handle: GizmoHandle;
  startScreenX: number;
  startScreenY: number;
  startPos: Vec3;
  startRotation: Vec3;
  startScale: Vec3;
  hitPoint: Vec3;
}

export class GizmoInteraction {
  private dragState: DragState | null = null;
  private hover: GizmoHandle | null = null;

  /** Desired world-space gizmo arm length so arms measure ~90px on screen. */
  public worldScale: number = 1;

  get isDragging(): boolean {
    return this.dragState !== null;
  }

  get activeHandle(): GizmoHandle | null {
    return this.dragState?.handle ?? null;
  }

  get hoverHandle(): GizmoHandle | null {
    return this.dragState ? this.dragState.handle : this.hover;
  }

  get dragStartPos(): Vec3 | null {
    return this.dragState?.startPos ?? null;
  }

  get dragStartRotation(): Vec3 | null {
    return this.dragState?.startRotation ?? null;
  }

  get dragStartScale(): Vec3 | null {
    return this.dragState?.startScale ?? null;
  }

  /** World-space arm length so the gizmo appears ~90 css px tall. */
  computeWorldScale(cam: OrbitCamera, nodePos: Vec3, viewportHeightCss: number, fov: number): number {
    const dist = Math.max(Vec3.sub(cam.position, nodePos).length(), 0.1);
    const pxPerWorld = viewportHeightCss / (2 * dist * Math.tan(fov / 2));
    return 45 / Math.max(pxPerWorld, 1e-6);
  }

  /**
   * Pick the gizmo part under the cursor.
   * Priority: rings (rotate) > plane handles > axes.
   */
  pickHandle(
    screenXCss: number,
    screenYCss: number,
    nodePos: Vec3,
    cam: OrbitCamera,
    viewportWCss: number,
    viewportHCss: number,
    fov: number,
    mode: GizmoMode,
  ): GizmoHandle | null {
    this.worldScale = this.computeWorldScale(cam, nodePos, viewportHCss, fov);
    const s = this.worldScale;

    const center = this.projectPoint(nodePos, cam, viewportWCss, viewportHCss);
    if (!center) return null;
    const mx = screenXCss - center.x;
    const my = screenYCss - center.y;

    if (mode === 'rotate') {
      // Convert world-space ring radius to css px for picking
      const camDist = Math.max(Vec3.sub(cam.position, nodePos).length(), 0.1);
      const pxPerWorld = viewportHCss / (2 * camDist * Math.tan(fov / 2));
      const ringPx = s * pxPerWorld; // == arm length in px (~45)
      const dist = Math.hypot(mx, my);
      if (Math.abs(dist - ringPx) < 10 || Math.abs(dist - ringPx * 1.28) < 10) {
        return { kind: 'ring', axis: angleToAxis(Math.atan2(-my, mx)) };
      }
      return null;
    }

    // Plane handles first (they sit near the center)
    const planePairs: [GizmoAxis, GizmoAxis][] = [['x', 'y'], ['x', 'z'], ['y', 'z']];
    const quadT = s * 0.30;
    for (const [a, b] of planePairs) {
      const ua = AXES[a];
      const ub = AXES[b];
      const corners = [
        new Vec3(nodePos.x, nodePos.y, nodePos.z),
        new Vec3(nodePos.x + ua.x * quadT, nodePos.y + ua.y * quadT, nodePos.z + ua.z * quadT),
        new Vec3(
          nodePos.x + (ua.x + ub.x) * quadT,
          nodePos.y + (ua.y + ub.y) * quadT,
          nodePos.z + (ua.z + ub.z) * quadT,
        ),
        new Vec3(nodePos.x + ub.x * quadT, nodePos.y + ub.y * quadT, nodePos.z + ub.z * quadT),
      ];
      const scr = corners.map((p) => this.projectPoint(p, cam, viewportWCss, viewportHCss));
      if (scr.some((p) => p === null)) continue;
      if (pointInQuad(screenXCss, screenYCss, scr as { x: number; y: number }[])) {
        // Name plane by its two axes; report primary axis as the first one.
        const primary: GizmoAxis = a === 'x' || b === 'x' ? 'x' : 'y';
        void primary;
        return { kind: 'plane', axis: a };
      }
    }

    // Axes
    let best: GizmoHandle | null = null;
    let bestDist = 10;
    for (const ax of ['x', 'y', 'z'] as GizmoAxis[]) {
      const dir = AXES[ax];
      const end = new Vec3(nodePos.x + dir.x * s, nodePos.y + dir.y * s, nodePos.z + dir.z * s);
      const endScr = this.projectPoint(end, cam, viewportWCss, viewportHCss);
      if (!endScr) continue;
      const d = pointToSegmentDist(screenXCss, screenYCss, center.x, center.y, endScr.x, endScr.y);
      if (d < bestDist) {
        bestDist = d;
        best = { kind: 'axis', axis: ax };
      }
    }
    return best;
  }

  setHover(h: GizmoHandle | null): void {
    this.hover = h;
  }

  /** True while pointer is over any interactive gizmo part. */
  get isHovering(): boolean {
    return this.hover !== null || this.isDragging;
  }

  startDrag(
    handle: GizmoHandle,
    screenXCss: number,
    screenYCss: number,
    startPos: Vec3,
    startRotation: Vec3,
    startScale: Vec3,
    cam: OrbitCamera,
    viewportWCss: number,
    viewportHCss: number,
  ): void {
    const hit =
      this.screenToWorldOnPlane(screenXCss, screenYCss, viewportWCss, viewportHCss, startPos, cam) ??
      startPos.clone();
    this.dragState = {
      handle,
      startScreenX: screenXCss,
      startScreenY: screenYCss,
      startPos: startPos.clone(),
      startRotation: startRotation.clone(),
      startScale: startScale.clone(),
      hitPoint: hit,
    };
  }

  /** Translate delta masked by the dragged handle. Ctrl snaps to TRANSLATE_SNAP grid. */
  getTranslateDelta(
    screenXCss: number,
    screenYCss: number,
    cam: OrbitCamera,
    viewportWCss: number,
    viewportHCss: number,
    snap: boolean,
  ): Vec3 | null {
    if (!this.dragState) return null;
    const hit = this.screenToWorldOnPlane(screenXCss, screenYCss, viewportWCss, viewportHCss, this.dragState.startPos, cam);
    if (!hit) return null;
    let delta = Vec3.sub(hit, this.dragState.hitPoint);

    const h = this.dragState.handle;
    if (h.kind === 'axis') {
      const dir = AXES[h.axis];
      const mag = Vec3.dot(delta, dir);
      delta = Vec3.scale(dir, mag);
    } else if (h.kind === 'plane') {
      const pair = planePairFor(h.axis);
      const du = Vec3.dot(delta, AXES[pair[0]]);
      const dv = Vec3.dot(delta, AXES[pair[1]]);
      delta = Vec3.add(Vec3.scale(AXES[pair[0]], du), Vec3.scale(AXES[pair[1]], dv));
    }

    if (snap) {
      delta = new Vec3(
        Math.round(delta.x / TRANSLATE_SNAP) * TRANSLATE_SNAP,
        Math.round(delta.y / TRANSLATE_SNAP) * TRANSLATE_SNAP,
        Math.round(delta.z / TRANSLATE_SNAP) * TRANSLATE_SNAP,
      );
    }
    return delta;
  }

  /** Scale multipliers masked by handle. Ctrl snaps ratio to SCALE_SNAP steps. */
  getScaleDelta(
    screenXCss: number,
    screenYCss: number,
    cam: OrbitCamera,
    viewportWCss: number,
    viewportHCss: number,
    snap: boolean,
  ): Vec3 | null {
    if (!this.dragState) return null;
    const hit = this.screenToWorldOnPlane(screenXCss, screenYCss, viewportWCss, viewportHCss, this.dragState.startPos, cam);
    if (!hit) return null;

    const h = this.dragState.handle;
    const axisDir = h.kind === 'plane' ? null : AXES[h.axis];
    const startDist = Vec3.sub(this.dragState.hitPoint, this.dragState.startPos);
    const curDist = Vec3.sub(hit, this.dragState.startPos);

    let ratio = 1;
    if (axisDir) {
      const s0 = Vec3.dot(startDist, axisDir);
      const s1 = Vec3.dot(curDist, axisDir);
      ratio = Math.abs(s0) > 0.001 ? s1 / s0 : 1;
    } else {
      const l0 = startDist.length();
      const l1 = curDist.length();
      ratio = l0 > 0.001 ? l1 / l0 : 1;
    }
    if (snap) {
      ratio = Math.max(0.05, Math.round(ratio / SCALE_SNAP) * SCALE_SNAP);
    }
    ratio = Math.max(0.01, ratio);

    if (h.kind === 'axis') {
      if (h.axis === 'x') return new Vec3(ratio, 1, 1);
      if (h.axis === 'y') return new Vec3(1, ratio, 1);
      return new Vec3(1, 1, ratio);
    }
    return new Vec3(ratio, ratio, ratio);
  }

  /** Signed rotation delta (radians) around the picked axis. Ctrl snaps to ROTATE_SNAP_DEG. */
  getRotateDelta(
    screenXCss: number,
    screenYCss: number,
    cam: OrbitCamera,
    viewportWCss: number,
    viewportHCss: number,
    snap: boolean,
  ): number {
    if (!this.dragState) return 0;
    const center = this.projectPoint(this.dragState.startPos, cam, viewportWCss, viewportHCss);
    if (!center) return 0;

    const startAngle = Math.atan2(this.dragState.startScreenY - center.y, this.dragState.startScreenX - center.x);
    const curAngle = Math.atan2(screenYCsslToCenter(screenYCss, center.y), screenXCsslToCenter(screenXCss, center.x));

    let delta = curAngle - startAngle;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    delta = -delta;

    if (snap) {
      const step = (ROTATE_SNAP_DEG * Math.PI) / 180;
      delta = Math.round(delta / step) * step;
    }
    return delta;
  }

  endDrag(): void {
    this.dragState = null;
  }

  cancelDrag(): void {
    this.dragState = null;
  }

  projectPoint(
    worldPos: Vec3,
    cam: OrbitCamera,
    viewportWCss: number,
    viewportHCss: number,
  ): { x: number; y: number } | null {
    return this.worldToScreen(worldPos, cam, viewportWCss, viewportHCss);
  }

  private worldToScreen(
    worldPos: Vec3,
    cam: OrbitCamera,
    viewportWidthCss: number,
    viewportHeightCss: number,
  ): { x: number; y: number } | null {
    const view = Mat4.lookAt(cam.position, cam.target, new Vec3(0, 1, 0));
    const aspect = viewportWidthCss / Math.max(1, viewportHeightCss);
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
      x: ((ndcX + 1) * 0.5) * viewportWidthCss,
      y: ((1 - ndcY) * 0.5) * viewportHeightCss,
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

function screenYCsslToCenter(sy: number, centerY: number): number {
  return sy - centerY;
}
function screenXCsslToCenter(sx: number, centerX: number): number {
  return sx - centerX;
}

function planePairFor(primary: GizmoAxis): [GizmoAxis, GizmoAxis] {
  if (primary === 'x') return ['x', 'y'];
  if (primary === 'y') return ['y', 'z'];
  return ['x', 'z'];
}

function angleToAxis(angleRad: number): GizmoAxis {
  const deg = ((angleRad * 180) / Math.PI + 360) % 180;
  if (deg < 30 || deg >= 150) return 'z';
  if (deg < 60) return 'y';
  if (deg < 120) return 'z';
  return 'y';
}

function pointInQuad(px: number, py: number, q: { x: number; y: number }[]): boolean {
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const a = q[i];
    const b = q[(i + 1) % 4];
    const cross = (b.x - a.x) * (py - a.y) - (b.y - a.y) * (px - a.x);
    if (Math.abs(cross) < 1e-9) continue;
    const s = Math.sign(cross);
    if (sign === 0) sign = s;
    else if (s !== sign) return false;
  }
  return true;
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

