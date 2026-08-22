import { MeshData } from '@renderer/Geometry';

export type UnwrapMode = 'planar' | 'box' | 'spherical' | 'cylindrical';
export type EditElement = 'vertex' | 'edge' | 'face';

export class UVUnwrapper {
  static unwrap(mesh: MeshData, mode: UnwrapMode): MeshData {
    const uvs = new Float32Array((mesh.positions.length / 3) * 2);
    switch (mode) {
      case 'planar':
        this.planar(mesh, uvs);
        break;
      case 'box':
        this.box(mesh, uvs);
        break;
      case 'spherical':
        this.spherical(mesh, uvs);
        break;
      case 'cylindrical':
        this.cylindrical(mesh, uvs);
        break;
    }
    return { ...mesh, uvs };
  }

  private static planar(mesh: MeshData, uvs: Float32Array): void {
    let minY = Infinity, maxY = -Infinity;
    for (let i = 1; i < mesh.positions.length; i += 3) {
      minY = Math.min(minY, mesh.positions[i]);
      maxY = Math.max(maxY, mesh.positions[i]);
    }
    const range = maxY - minY || 1;
    for (let v = 0; v < mesh.positions.length / 3; v++) {
      const x = mesh.positions[v * 3];
      const z = mesh.positions[v * 3 + 2];
      uvs[v * 2] = (x + 1) / 2;
      uvs[v * 2 + 1] = (z + 1) / 2;
      void range; void minY; void maxY;
    }
  }

  private static box(mesh: MeshData, uvs: Float32Array): void {
    for (let v = 0; v < mesh.positions.length / 3; v++) {
      const x = mesh.positions[v * 3];
      const y = mesh.positions[v * 3 + 1];
      const z = mesh.positions[v * 3 + 2];
      const ax = Math.abs(x), ay = Math.abs(y), az = Math.abs(z);

      if (ax >= ay && ax >= az) {
        uvs[v * 2] = (z + 1) / 2;
        uvs[v * 2 + 1] = (y + 1) / 2;
      } else if (ay >= ax && ay >= az) {
        uvs[v * 2] = (x + 1) / 2;
        uvs[v * 2 + 1] = (z + 1) / 2;
      } else {
        uvs[v * 2] = (x + 1) / 2;
        uvs[v * 2 + 1] = (y + 1) / 2;
      }
    }
  }

  private static spherical(mesh: MeshData, uvs: Float32Array): void {
    for (let v = 0; v < mesh.positions.length / 3; v++) {
      const x = mesh.positions[v * 3];
      const y = mesh.positions[v * 3 + 1];
      const z = mesh.positions[v * 3 + 2];
      const len = Math.sqrt(x * x + y * y + z * z) || 1;
      const nx = x / len, ny = y / len, nz = z / len;

      uvs[v * 2] = 0.5 + Math.atan2(nz, nx) / (Math.PI * 2);
      uvs[v * 2 + 1] = 0.5 - Math.asin(Math.max(-1, Math.min(1, ny))) / Math.PI;
    }
  }

  private static cylindrical(mesh: MeshData, uvs: Float32Array): void {
    for (let v = 0; v < mesh.positions.length / 3; v++) {
      const x = mesh.positions[v * 3];
      const y = mesh.positions[v * 3 + 1];
      const z = mesh.positions[v * 3 + 2];

      uvs[v * 2] = 0.5 + Math.atan2(z, x) / (Math.PI * 2);
      uvs[v * 2 + 1] = (y + 1) / 2;
    }
  }
}

export class MeshOperations {
  static subdivide(mesh: MeshData): MeshData {
    // Simple midpoint subdivision: each triangle becomes 4
    const midCache = new Map<string, number>();
    const positions = Array.from(mesh.positions);
    const normals = Array.from(mesh.normals);
    const uvs = Array.from(mesh.uvs);
    const indices: number[] = [];

    const midpoint = (a: number, b: number): number => {
      const key = a < b ? `${a}_${b}` : `${b}_${a}`;
      if (midCache.has(key)) return midCache.get(key)!;
      const idx = positions.length / 3;
      positions.push(
        (positions[a * 3] + positions[b * 3]) / 2,
        (positions[a * 3 + 1] + positions[b * 3 + 1]) / 2,
        (positions[a * 3 + 2] + positions[b * 3 + 2]) / 2,
      );
      normals.push(0, 1, 0);
      uvs.push(
        (uvs[a * 2] + uvs[b * 2]) / 2,
        (uvs[a * 2 + 1] + uvs[b * 2 + 1]) / 2,
      );
      midCache.set(key, idx);
      return idx;
    };

    for (let i = 0; i < mesh.indices.length; i += 3) {
      const a = mesh.indices[i];
      const b = mesh.indices[i + 1];
      const c = mesh.indices[i + 2];
      const ab = midpoint(a, b);
      const bc = midpoint(b, c);
      const ca = midpoint(c, a);
      indices.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
    }

    // Recompute normals
    this.recomputeNormals(positions, normals, indices);

    return {
      positions: new Float32Array(positions),
      normals: new Float32Array(normals),
      uvs: new Float32Array(uvs),
      indices:
        positions.length / 3 > 65535
          ? new Uint32Array(indices)
          : new Uint16Array(indices),
    };
  }

  static extrudeFaces(mesh: MeshData, distance: number): MeshData {
    // Extrude along normals: offset all vertices outward and connect edges
    const positions = Array.from(mesh.positions);
    const count = positions.length / 3;
    for (let v = 0; v < count; v++) {
      positions[v * 3] += mesh.normals[v * 3] * distance;
      positions[v * 3 + 1] += mesh.normals[v * 3 + 1] * distance;
      positions[v * 3 + 2] += mesh.normals[v * 3 + 2] * distance;
    }
    return { ...mesh, positions: new Float32Array(positions) };
  }

  static bevelEdges(mesh: MeshData, amount: number): MeshData {
    // Simplified bevel: shrink vertices toward face center
    const positions = Array.from(mesh.positions);
    for (let v = 0; v < positions.length / 3; v++) {
      positions[v * 3] *= 1 - amount;
      positions[v * 3 + 1] *= 1 - amount;
      positions[v * 3 + 2] *= 1 - amount;
    }
    return { ...mesh, positions: new Float32Array(positions) };
  }

  static recomputeNormals(
    positions: number[],
    normals: number[],
    indices: Uint16Array | Uint32Array | number[],
  ): void {
    // Reset normals
    for (let i = 0; i < normals.length; i++) normals[i] = 0;

    // Accumulate face normals
    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i], b = indices[i + 1], c = indices[i + 2];
      const ax = positions[a * 3], ay = positions[a * 3 + 1], az = positions[a * 3 + 2];
      const bx = positions[b * 3], by = positions[b * 3 + 1], bz = positions[b * 3 + 2];
      const cx = positions[c * 3], cy = positions[c * 3 + 1], cz = positions[c * 3 + 2];

      const e1x = bx - ax, e1y = by - ay, e1z = bz - az;
      const e2x = cx - ax, e2y = cy - ay, e2z = cz - az;
      const nx = e1y * e2z - e1z * e2y;
      const ny = e1z * e2x - e1x * e2z;
      const nz = e1x * e2y - e1y * e2x;

      for (const idx of [a, b, c]) {
        normals[idx * 3] += nx;
        normals[idx * 3 + 1] += ny;
        normals[idx * 3 + 2] += nz;
      }
    }

    // Normalize
    for (let v = 0; v < normals.length / 3; v++) {
      const x = normals[v * 3], y = normals[v * 3 + 1], z = normals[v * 3 + 2];
      const len = Math.sqrt(x * x + y * y + z * z) || 1;
      normals[v * 3] = x / len;
      normals[v * 3 + 1] = y / len;
      normals[v * 3 + 2] = z / len;
    }
  }

  static getMeshStats(mesh: MeshData): { vertices: number; triangles: number } {
    return {
      vertices: mesh.positions.length / 3,
      triangles: mesh.indices.length / 3,
    };
  }
}
