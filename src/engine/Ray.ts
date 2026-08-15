import { Vec3 } from '@math/Vec';
import { Mat4 } from '@math/Mat4';

export class Ray {
  constructor(
    public origin: Vec3 = new Vec3(),
    public direction: Vec3 = new Vec3(0, 0, -1),
  ) {}

  static fromScreen(
    screenX: number,
    screenY: number,
    viewportWidth: number,
    viewportHeight: number,
    cameraPos: Vec3,
    cameraTarget: Vec3,
    fov: number,
    near: number,
    far: number,
  ): Ray {
    const ndcX = (2 * screenX) / viewportWidth - 1;
    const ndcY = 1 - (2 * screenY) / viewportHeight;

    const view = Mat4.lookAt(cameraPos, cameraTarget, new Vec3(0, 1, 0));
    const aspect = viewportWidth / viewportHeight;
    const proj = Mat4.perspective(fov, aspect, near, far);

    const viewInv = view.invert();
    const projInv = proj.invert();

    const nearPoint = transformPoint(projInv, ndcX, ndcY, -1);
    const farPoint = transformPoint(projInv, ndcX, ndcY, 1);

    const nearWorld = transformPoint(viewInv, nearPoint.x, nearPoint.y, nearPoint.z);
    const farWorld = transformPoint(viewInv, farPoint.x, farPoint.y, farPoint.z);

    const dir = Vec3.normalize(Vec3.sub(farWorld, nearWorld));
    return new Ray(cameraPos, dir);
  }

  intersectAABB(
    min: Vec3,
    max: Vec3,
    modelMatrix: Mat4,
  ): number | null {
    const localOrigin = transformPoint(modelMatrix.invert(), this.origin.x, this.origin.y, this.origin.z);
    const localDir = transformDir(modelMatrix.invert(), this.direction);

    let tmin = -Infinity;
    let tmax = Infinity;

    for (const [_axis, originVal, dirVal, minVal, maxVal] of [
      [0, localOrigin.x, localDir.x, min.x, max.x],
      [1, localOrigin.y, localDir.y, min.y, max.y],
      [2, localOrigin.z, localDir.z, min.z, max.z],
    ] as const) {
      if (Math.abs(dirVal) < 1e-9) {
        if (originVal < minVal || originVal > maxVal) return null;
      } else {
        const t1 = (minVal - originVal) / dirVal;
        const t2 = (maxVal - originVal) / dirVal;
        const tn = Math.min(t1, t2);
        const tf = Math.max(t1, t2);
        tmin = Math.max(tmin, tn);
        tmax = Math.min(tmax, tf);
        if (tmin > tmax) return null;
      }
    }

    return tmin >= 0 ? tmin : tmax >= 0 ? tmax : null;
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

function transformDir(m: Mat4, v: Vec3): Vec3 {
  const d = m.data;
  return new Vec3(
    d[0] * v.x + d[4] * v.y + d[8] * v.z,
    d[1] * v.x + d[5] * v.y + d[9] * v.z,
    d[2] * v.x + d[6] * v.y + d[10] * v.z,
  );
}
