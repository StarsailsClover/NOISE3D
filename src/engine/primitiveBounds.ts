import { Vec3 } from '@math/Vec';

export function primitiveMin(type: string): Vec3 {
  switch (type) {
    case 'plane': return new Vec3(-1, 0, -1);
    default: return new Vec3(-1, -1, -1);
  }
}

export function primitiveMax(type: string): Vec3 {
  switch (type) {
    case 'plane': return new Vec3(1, 0, 1);
    default: return new Vec3(1, 1, 1);
  }
}

export interface BoundsResult {
  center: Vec3;
  radius: number;
}

/** Axis-aligned bounding box over all visible mesh nodes. */
export function computeSceneBounds(nodes: { visible: boolean; type: string; position: Vec3; scale: Vec3 }[]): BoundsResult | null {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  let any = false;

  for (const n of nodes) {
    if (!n.visible || n.type === 'empty' || n.type === 'custom') continue;
    const mn = primitiveMin(n.type);
    const mx = primitiveMax(n.type);
    const p = n.position;
    const s = n.scale;
    const x0 = p.x + mn.x * s.x, x1 = p.x + mx.x * s.x;
    const y0 = p.y + mn.y * s.y, y1 = p.y + mx.y * s.y;
    const z0 = p.z + mn.z * s.z, z1 = p.z + mx.z * s.z;
    minX = Math.min(minX, x0, x1); maxX = Math.max(maxX, x0, x1);
    minY = Math.min(minY, y0, y1); maxY = Math.max(maxY, y0, y1);
    minZ = Math.min(minZ, z0, z1); maxZ = Math.max(maxZ, z0, z1);
    any = true;
  }
  if (!any) return null;

  const center = new Vec3((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);
  const radius = Math.max(
    Math.hypot(maxX - minX, maxY - minY, maxZ - minZ) / 2,
    0.8,
  );
  return { center, radius };
}
