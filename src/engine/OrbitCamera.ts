import { Vec3 } from '@math/Vec';
import { Mat4 } from '@math/Mat4';

export type ViewPreset = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'iso';
export type ProjectionMode = 'perspective' | 'orthographic';

interface CameraTransition {
  fromTarget: Vec3;
  fromDistance: number;
  fromAzimuth: number;
  fromElevation: number;
  toTarget: Vec3;
  toDistance: number;
  toAzimuth: number;
  toElevation: number;
  startTime: number;
  duration: number;
  active: boolean;
}

export class OrbitCamera {
  public target: Vec3 = new Vec3(0, 0, 0);
  public distance: number = 10;
  public azimuth: number = (45 * Math.PI) / 180;
  public elevation: number = (35.26 * Math.PI) / 180;
  public minDistance: number = 0.1;
  public maxDistance: number = 2000;
  public minElevation: number = -Math.PI / 2 + 0.001;
  public maxElevation: number = Math.PI / 2 - 0.001;
  public panSpeed: number = 0.0015;
  public rotateSpeed: number = 0.004;
  public zoomSpeed: number = 0.0008;
  public projectionMode: ProjectionMode = 'perspective';
  public orthoZoom: number = 10;
  public fov: number = (60 * Math.PI) / 180;
  public near: number = 0.1;
  public far: number = 2000;

  // ---- Free-fly state (RMB flythrough) ----
  public flying = false;
  public flySpeed = 6; // world units / second (wheel adjusts)
  private eye = new Vec3(0, 0, 10);
  private yaw = 0;
  private pitch = 0;

  private flyForward(): Vec3 {
    const cp = Math.cos(this.pitch);
    return new Vec3(Math.sin(this.yaw) * cp, Math.sin(this.pitch), Math.cos(this.yaw) * cp);
  }

  beginFly(): void {
    if (this.flying) return;
    this.flying = true;
    this.transition.active = false;
    const pos = this.orbitPosition();
    this.eye = pos.clone();
    const dir = Vec3.normalize(Vec3.sub(this.target, pos));
    this.pitch = Math.asin(Math.max(-1, Math.min(1, dir.y)));
    this.yaw = Math.atan2(dir.x, dir.z);
  }

  endFly(): void {
    if (!this.flying) return;
    this.flying = false;
    const fwd = this.flyForward();
    // Keep looking the same way: place orbit target ahead of the eye.
    this.target = Vec3.add(this.eye, Vec3.scale(fwd, Math.max(this.distance, 4)));
    // Re-derive orbit angles from forward direction so view doesn't jump.
    this.elevation = Math.max(this.minElevation, Math.min(this.maxElevation, this.pitch));
    this.azimuth = this.yaw - Math.PI;
  }

  flyLook(dx: number, dy: number): void {
    this.yaw -= dx * 0.0032;
    this.pitch -= dy * 0.0032;
    this.pitch = Math.max(-1.55, Math.min(1.55, this.pitch));
  }

  /** Move per pressed keys over dt seconds. */
  flyTick(dt: number, keys: Set<string>): void {
    if (!this.flying) return;
    const f = this.flyForward();
    const right = Vec3.normalize(Vec3.cross(f, new Vec3(0, 1, 0)));
    let move = new Vec3();
    if (keys.has('KeyW') || keys.has('ArrowUp')) move = Vec3.add(move, f);
    if (keys.has('KeyS') || keys.has('ArrowDown')) move = Vec3.sub(move, f);
    if (keys.has('KeyD') || keys.has('ArrowRight')) move = Vec3.add(move, right);
    if (keys.has('KeyA') || keys.has('ArrowLeft')) move = Vec3.sub(move, right);
    if (keys.has('KeyE')) move = Vec3.add(move, new Vec3(0, 1, 0));
    if (keys.has('KeyQ')) move = Vec3.add(move, new Vec3(0, -1, 0));

    if (move.lengthSq() > 1e-9) {
      const speed = this.flySpeed * (keys.has('ShiftLeft') || keys.has('ShiftRight') ? 3 : 1);
      this.eye = Vec3.add(this.eye, Vec3.scale(Vec3.normalize(move), speed * dt));
    }
  }

  private transition: CameraTransition = {
    fromTarget: new Vec3(), fromDistance: 0, fromAzimuth: 0, fromElevation: 0,
    toTarget: new Vec3(), toDistance: 0, toAzimuth: 0, toElevation: 0,
    startTime: 0, duration: 0, active: false,
  };

  get position(): Vec3 {
    if (this.flying) return this.eye.clone();
    return this.orbitPosition();
  }

  private orbitPosition(): Vec3 {
    const t = this.getCurrentTransitionT();
    const azim = t < 1 ? lerp(this.transition.fromAzimuth, this.transition.toAzimuth, t) : this.azimuth;
    const elev = t < 1 ? lerp(this.transition.fromElevation, this.transition.toElevation, t) : this.elevation;
    const dist = t < 1 ? lerp(this.transition.fromDistance, this.transition.toDistance, t) : this.distance;
    const tgt = t < 1 ? Vec3.lerp(this.transition.fromTarget, this.transition.toTarget, t) : this.target;
    const ce = Math.cos(elev);
    return new Vec3(
      tgt.x + dist * ce * Math.cos(azim),
      tgt.y + dist * Math.sin(elev),
      tgt.z + dist * ce * Math.sin(azim),
    );
  }

  rotate(deltaX: number, deltaY: number): void {
    if (this.flying) return;
    this.cancelTransition();
    this.azimuth -= deltaX * this.rotateSpeed;
    this.elevation += deltaY * this.rotateSpeed;
    if (this.azimuth < -Math.PI) this.azimuth += Math.PI * 2;
    if (this.azimuth > Math.PI) this.azimuth -= Math.PI * 2;
    this.elevation = Math.max(this.minElevation, Math.min(this.maxElevation, this.elevation));
  }

  pan(deltaX: number, deltaY: number, _vw: number, vh: number): void {
    if (this.flying) return;
    this.cancelTransition();
    const right = this.right;
    const up = this.up;
    const scale = this.projectionMode === 'perspective'
      ? this.distance / vh
      : this.orthoZoom / vh;
    const panX = -deltaX * scale * this.panSpeed * 100;
    const panY = deltaY * scale * this.panSpeed * 100;
    this.target = new Vec3(
      this.target.x + right.x * panX + up.x * panY,
      this.target.y + right.y * panX + up.y * panY,
      this.target.z + right.z * panX + up.z * panY,
    );
  }

  zoom(delta: number): void {
    this.cancelTransition();
    if (this.flying) {
      // Wheel adjusts fly speed while in flythrough
      this.flySpeed *= delta < 0 ? 1.15 : 0.87;
      this.flySpeed = Math.max(0.5, Math.min(200, this.flySpeed));
      return;
    }
    if (this.projectionMode === 'orthographic') {
      this.orthoZoom += delta * this.zoomSpeed * this.orthoZoom;
      this.orthoZoom = Math.max(0.5, Math.min(500, this.orthoZoom));
    } else {
      this.distance += delta * this.zoomSpeed * this.distance;
      this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
    }
  }

  /**
   * Zoom toward a specific screen point so the world point under the cursor stays fixed.
   * screenX/screenY are CSS pixels relative to canvas top-left.
   */
  zoomToCursor(delta: number, screenX: number, screenY: number, viewportWidth: number, viewportHeight: number): void {
    this.cancelTransition();

    // Compute the world point under the cursor by intersecting the pick ray
    // with a plane through the current target perpendicular to the view direction.
    const dpr = window.devicePixelRatio || 1;
    const sx = screenX * dpr;
    const sy = screenY * dpr;
    const w = viewportWidth * dpr;
    const h = viewportHeight * dpr;

    const ndcX = (2 * sx) / w - 1;
    const ndcY = 1 - (2 * sy) / h;

    const pos = this.position;
    const view = Mat4.lookAt(pos, this.target, new Vec3(0, 1, 0));
    const aspect = w / h;
    const proj = this.getProjectionMatrix(aspect);
    const viewInv = view.invert();
    const projInv = proj.invert();

    const nearPoint = transformPoint(projInv, ndcX, ndcY, -1);
    const farPoint = transformPoint(projInv, ndcX, ndcY, 1);
    const nearWorld = transformPoint(viewInv, nearPoint.x, nearPoint.y, nearPoint.z);
    const farWorld = transformPoint(viewInv, farPoint.x, farPoint.y, farPoint.z);

    const rayDir = Vec3.normalize(Vec3.sub(farWorld, nearWorld));

    // Plane through target, normal = view forward (from camera pos to target)
    const planeNormal = Vec3.normalize(Vec3.sub(this.target, pos));
    const denom = Vec3.dot(rayDir, planeNormal);
    let worldHit: Vec3;
    if (Math.abs(denom) > 1e-9) {
      const t = Vec3.dot(Vec3.sub(this.target, nearWorld), planeNormal) / denom;
      worldHit = new Vec3(
        nearWorld.x + rayDir.x * t,
        nearWorld.y + rayDir.y * t,
        nearWorld.z + rayDir.z * t,
      );
    } else {
      worldHit = this.target.clone();
    }

    // Apply zoom
    if (this.projectionMode === 'orthographic') {
      this.orthoZoom += delta * this.zoomSpeed * this.orthoZoom;
      this.orthoZoom = Math.max(0.5, Math.min(500, this.orthoZoom));
    } else {
      this.distance += delta * this.zoomSpeed * this.distance;
      this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
    }

    // Shift target so the world point under cursor stays in the same screen position
    const newPos = this.position;
    const newPlaneNormal = Vec3.normalize(Vec3.sub(this.target, newPos));
    const denom2 = Vec3.dot(rayDir, newPlaneNormal);
    if (Math.abs(denom2) > 1e-9) {
      const t2 = Vec3.dot(Vec3.sub(worldHit, nearWorld), newPlaneNormal) / denom2;
      const newHit = new Vec3(
        nearWorld.x + rayDir.x * t2,
        nearWorld.y + rayDir.y * t2,
        nearWorld.z + rayDir.z * t2,
      );
      this.target = Vec3.add(this.target, Vec3.sub(worldHit, newHit));
    }
  }

  frame(target: Vec3, radius: number): void {
    const dist = Math.max(radius * 2.2, 1);
    this.startTransition(target, dist, this.azimuth, this.elevation, 0.35);
  }

  setView(preset: ViewPreset): void {
    const presets: Record<ViewPreset, { azim: number; elev: number }> = {
      front: { azim: -Math.PI / 2, elev: 0 },
      back: { azim: Math.PI / 2, elev: 0 },
      left: { azim: Math.PI, elev: 0 },
      right: { azim: 0, elev: 0 },
      top: { azim: 0, elev: Math.PI / 2 - 0.001 },
      bottom: { azim: 0, elev: -Math.PI / 2 + 0.001 },
      iso: { azim: (45 * Math.PI) / 180, elev: (35.264 * Math.PI) / 180 },
    };
    const p = presets[preset];
    this.startTransition(this.target.clone(), this.distance, p.azim, p.elev, 0.3);
  }

  /**
   * Frame the given bounds and swing to the isometric angle in one smooth
   * transition. Used by Home/ISO so the view actually centers scene content
   * instead of rotating around wherever the target currently sits.
   */
  frameAllIso(center: Vec3, radius: number): void {
    this.startTransition(
      center.clone(),
      Math.max(radius * 2.4, 2),
      (45 * Math.PI) / 180,
      (35.264 * Math.PI) / 180,
      0.35,
    );
  }

  toggleProjection(): void {
    this.projectionMode = this.projectionMode === 'perspective' ? 'orthographic' : 'perspective';
  }

  getProjectionMatrix(aspect: number): Mat4 {
    if (this.projectionMode === 'orthographic') {
      const halfH = this.orthoZoom;
      const halfW = halfH * aspect;
      return Mat4.orthographic(-halfW, halfW, -halfH, halfH, this.near, this.far);
    }
    return Mat4.perspective(this.fov, aspect, this.near, this.far);
  }

  getViewMatrix(): Mat4 {
    if (this.flying) {
      const fwd = this.flyForward();
      return Mat4.lookAt(this.eye, Vec3.add(this.eye, fwd), new Vec3(0, 1, 0));
    }
    return Mat4.lookAt(this.position, this.target, new Vec3(0, 1, 0));
  }

  serialize(): object {
    return {
      target: this.target.toArray(),
      distance: this.distance,
      azimuth: this.azimuth,
      elevation: this.elevation,
      projectionMode: this.projectionMode,
      orthoZoom: this.orthoZoom,
    };
  }

  deserialize(data: any): void {
    if (data.target) this.target = Vec3.fromArray(data.target);
    if (data.distance !== undefined) this.distance = data.distance;
    if (data.azimuth !== undefined) this.azimuth = data.azimuth;
    if (data.elevation !== undefined) this.elevation = data.elevation;
    if (data.projectionMode) this.projectionMode = data.projectionMode;
    if (data.orthoZoom !== undefined) this.orthoZoom = data.orthoZoom;
  }

  private startTransition(toTarget: Vec3, toDistance: number, toAzimuth: number, toElevation: number, duration: number): void {
    let fromAz = this.azimuth;
    let toAz = toAzimuth;
    while (toAz - fromAz > Math.PI) toAz -= Math.PI * 2;
    while (toAz - fromAz < -Math.PI) toAz += Math.PI * 2;
    this.transition = {
      fromTarget: this.target.clone(),
      fromDistance: this.distance,
      fromAzimuth: fromAz,
      fromElevation: this.elevation,
      toTarget: toTarget.clone(),
      toDistance,
      toAzimuth: toAz,
      toElevation: toElevation,
      startTime: performance.now(),
      duration: duration * 1000,
      active: true,
    };
  }

  private getCurrentTransitionT(): number {
    if (!this.transition.active) return 1;
    const elapsed = performance.now() - this.transition.startTime;
    const t = Math.min(elapsed / this.transition.duration, 1);
    const eased = t * t * (3 - 2 * t);
    if (t >= 1) {
      this.target = this.transition.toTarget.clone();
      this.distance = this.transition.toDistance;
      this.azimuth = this.transition.toAzimuth;
      this.elevation = this.transition.toElevation;
      this.transition.active = false;
      return 1;
    }
    return eased;
  }

  private cancelTransition(): void {
    if (this.transition.active) {
      this.getCurrentTransitionT();
      this.transition.active = false;
    }
  }

  private get forward(): Vec3 {
    return Vec3.normalize(Vec3.sub(this.target, this.position));
  }

  private get right(): Vec3 {
    const fwd = this.forward;
    return Vec3.normalize(Vec3.cross(fwd, new Vec3(0, 1, 0)));
  }

  private get up(): Vec3 {
    return Vec3.cross(this.right, this.forward);
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
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
