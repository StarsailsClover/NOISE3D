import { describe, it, expect } from 'vitest';
import { Mat4 } from '@math/Mat4';
import { Vec3 } from '@math/Vec';

describe('Mat4.invert roundtrip', () => {
  it('perspective inverse maps NDC point back', () => {
    const proj = Mat4.perspective((60 * Math.PI) / 180, 16 / 9, 0.1, 2000);
    const inv = proj.invert();
    // Point at z=-1 NDC, some x/y
    const p = new Vec3(0.3, -0.4, -1);
    const clip = mulPoint(proj, p.x, p.y, p.z);
    const back = mulPoint(inv, clip.x, clip.y, clip.z);
    expect(Math.abs(back.x - p.x)).toBeLessThan(1e-4);
    expect(Math.abs(back.y - p.y)).toBeLessThan(1e-4);
    expect(Math.abs(back.z - p.z)).toBeLessThan(1e-4);
  });

  it('lookAt inverse maps eye to origin', () => {
    const eye = new Vec3(6.123724356957946, 5, 6.123724356957945);
    const view = Mat4.lookAt(eye, new Vec3(0, 0, 0), new Vec3(0, 1, 0));
    const inv = view.invert();
    const e = mulPoint(inv, 0, 0, 0); // origin through inverse = eye position
    expect(Math.abs(e.x - eye.x)).toBeLessThan(1e-3);
    expect(Math.abs(e.y - eye.y)).toBeLessThan(1e-3);
    expect(Math.abs(e.z - eye.z)).toBeLessThan(1e-3);
  });

  it('full view-proj inverse unprojects center pixel to origin ray', () => {
    const eye = new Vec3(6.123724356957946, 5, 6.123724356957945);
    const target = new Vec3(0, 0, 0);
    const view = Mat4.lookAt(eye, target, new Vec3(0, 1, 0));
    const proj = Mat4.perspective((60 * Math.PI) / 180, 1.6, 0.1, 2000);
    const inv = Mat4.multiply(proj, view).invert();

    const n = unproject(inv, 0, 0, -1);   // near plane center
    const f = unproject(inv, 0, 0, 1);    // far plane center
    const dir = Vec3.normalize(Vec3.sub(f, n));

    // Direction must head from eye toward target
    const expected = Vec3.normalize(Vec3.sub(target, eye));
    expect(Math.abs(dir.x - expected.x)).toBeLessThan(1e-4);
    expect(Math.abs(dir.y - expected.y)).toBeLessThan(1e-4);
    expect(Math.abs(dir.z - expected.z)).toBeLessThan(1e-4);

    // Origin lies ~on this ray
    const toOrigin = Vec3.sub(new Vec3(0, 0, 0), eye);
    const along = Vec3.dot(toOrigin, dir);
    const closest = Vec3.add(eye, Vec3.scale(dir, along));
    expect(closest.length()).toBeLessThan(0.01);
  });
});

function mulPoint(m: Mat4, x: number, y: number, z: number) {
  const d = m.data;
  const w = d[3] * x + d[7] * y + d[11] * z + d[15];
  const iw = w !== 0 ? 1 / w : 1;
  return {
    x: (d[0] * x + d[4] * y + d[8] * z + d[12]) * iw,
    y: (d[1] * x + d[5] * y + d[9] * z + d[13]) * iw,
    z: (d[2] * x + d[6] * y + d[10] * z + d[14]) * iw,
    w,
  };
}

function unproject(invVP: Mat4, ndcX: number, ndcY: number, ndcZ: number) {
  const p = mulPoint(invVP, ndcX, ndcY, ndcZ);
  return new Vec3(p.x, p.y, p.z);
}

