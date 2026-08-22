import { MeshData } from '@renderer/Geometry';

export interface TerrainData {
  id: number;
  name: string;
  size: number;
  segments: number;
  heights: Float32Array;
  brushSize: number;
  brushStrength: number;
}

let terrainIdCounter = 1;

export function createTerrain(size = 20, segments = 32): TerrainData {
  return {
    id: terrainIdCounter++,
    name: 'Terrain',
    size,
    segments,
    heights: new Float32Array((segments + 1) * (segments + 1)),
    brushSize: 2.0,
    brushStrength: 0.5,
  };
}

export function resetTerrainIdCounter(): void {
  terrainIdCounter = 1;
}

export function getHeightIndex(terrain: TerrainData, ix: number, iz: number): number {
  return iz * (terrain.segments + 1) + ix;
}

export function raiseTerrain(
  terrain: TerrainData,
  worldX: number,
  worldZ: number,
  radius: number,
  strength: number,
): void {
  const half = terrain.size / 2;
  const seg = terrain.segments;
  const step = terrain.size / seg;

  const minIx = Math.max(0, Math.floor((worldX + half - radius) / step));
  const maxIx = Math.min(seg, Math.ceil((worldX + half + radius) / step));
  const minIz = Math.max(0, Math.floor((worldZ + half - radius) / step));
  const maxIz = Math.min(seg, Math.ceil((worldZ + half + radius) / step));

  for (let iz = minIz; iz <= maxIz; iz++) {
    for (let ix = minIx; ix <= maxIx; ix++) {
      const x = ix * step - half;
      const z = iz * step - half;
      const dist = Math.sqrt((x - worldX) ** 2 + (z - worldZ) ** 2);
      if (dist > radius) continue;
      const falloff = 1 - dist / radius;
      const idx = getHeightIndex(terrain, ix, iz);
      terrain.heights[idx] += strength * falloff;
    }
  }
}

export function smoothTerrain(
  terrain: TerrainData,
  worldX: number,
  worldZ: number,
  radius: number,
  strength: number,
): void {
  const seg = terrain.segments;
  const original = new Float32Array(terrain.heights);

  const half = terrain.size / 2;
  const step = terrain.size / seg;
  const minIx = Math.max(0, Math.floor((worldX + half - radius) / step));
  const maxIx = Math.min(seg, Math.ceil((worldX + half + radius) / step));
  const minIz = Math.max(0, Math.floor((worldZ + half - radius) / step));
  const maxIz = Math.min(seg, Math.ceil((worldZ + half + radius) / step));

  for (let iz = minIz; iz <= maxIz; iz++) {
    for (let ix = minIx; ix <= maxIx; ix++) {
      const x = ix * step - half;
      const z = iz * step - half;
      const dist = Math.sqrt((x - worldX) ** 2 + (z - worldZ) ** 2);
      if (dist > radius) continue;
      const falloff = (1 - dist / radius) * strength;

      let sum = 0;
      let count = 0;
      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = ix + dx;
          const nz = iz + dz;
          if (nx < 0 || nx > seg || nz < 0 || nz > seg) continue;
          sum += original[getHeightIndex(terrain, nx, nz)];
          count++;
        }
      }
      const avg = count > 0 ? sum / count : original[getHeightIndex(terrain, ix, iz)];
      const idx = getHeightIndex(terrain, ix, iz);
      terrain.heights[idx] = original[idx] + (avg - original[idx]) * falloff;
    }
  }
}

export function flattenTerrain(
  terrain: TerrainData,
  worldX: number,
  worldZ: number,
  radius: number,
  targetHeight: number,
  strength: number,
): void {
  const half = terrain.size / 2;
  const seg = terrain.segments;
  const step = terrain.size / seg;

  const minIx = Math.max(0, Math.floor((worldX + half - radius) / step));
  const maxIx = Math.min(seg, Math.ceil((worldX + half + radius) / step));
  const minIz = Math.max(0, Math.floor((worldZ + half - radius) / step));
  const maxIz = Math.min(seg, Math.ceil((worldZ + half + radius) / step));

  for (let iz = minIz; iz <= maxIz; iz++) {
    for (let ix = minIx; ix <= maxIx; ix++) {
      const x = ix * step - half;
      const z = iz * step - half;
      const dist = Math.sqrt((x - worldX) ** 2 + (z - worldZ) ** 2);
      if (dist > radius) continue;
      const falloff = (1 - dist / radius) * strength;
      const idx = getHeightIndex(terrain, ix, iz);
      terrain.heights[idx] += (targetHeight - terrain.heights[idx]) * falloff;
    }
  }
}

export function generateProceduralHeights(terrain: TerrainData, seed = 42, scale = 4, amplitude = 3): void {
  // Simple value noise with hash-based pseudo random
  const seg = terrain.segments;
  const hash = (x: number, y: number): number => {
    let h = x * 374761393 + y * 668265263 + seed * 144665;
    h = (h ^ (h >> 13)) * 1274126177;
    return ((h ^ (h >> 16)) & 0xffff) / 0xffff;
  };
  const smoothNoise = (x: number, y: number): number => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const a = hash(ix, iy);
    const b = hash(ix + 1, iy);
    const c = hash(ix, iy + 1);
    const d = hash(ix + 1, iy + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };

  for (let iz = 0; iz <= seg; iz++) {
    for (let ix = 0; ix <= seg; ix++) {
      let height = 0;
      let freq = scale;
      let amp = amplitude;
      for (let octave = 0; octave < 4; octave++) {
        height += smoothNoise((ix / seg) * freq, (iz / seg) * freq) * amp;
        freq *= 2;
        amp *= 0.5;
      }
      terrain.heights[getHeightIndex(terrain, ix, iz)] = height;
    }
  }
}

export function buildTerrainMesh(terrain: TerrainData): MeshData {
  const seg = terrain.segments;
  const half = terrain.size / 2;
  const step = terrain.size / seg;

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let iz = 0; iz <= seg; iz++) {
    for (let ix = 0; ix <= seg; ix++) {
      const x = ix * step - half;
      const z = iz * step - half;
      positions.push(x, terrain.heights[getHeightIndex(terrain, ix, iz)], z);
      uvs.push(ix / seg, iz / seg);
    }
  }

  // Compute normals from cross products
  for (let iz = 0; iz <= seg; iz++) {
    for (let ix = 0; ix <= seg; ix++) {
      const l = ix > 0 ? getHeightIndex(terrain, ix - 1, iz) : getHeightIndex(terrain, ix, iz);
      const r = ix < seg ? getHeightIndex(terrain, ix + 1, iz) : getHeightIndex(terrain, ix, iz);
      const d = iz > 0 ? getHeightIndex(terrain, ix, iz - 1) : getHeightIndex(terrain, ix, iz);
      const u = iz < seg ? getHeightIndex(terrain, ix, iz + 1) : getHeightIndex(terrain, ix, iz);

      const hl = terrain.heights[l];
      const hr = terrain.heights[r];
      const hd = terrain.heights[d];
      const hu = terrain.heights[u];

      const nx = hl - hr;
      const ny = 2 * step;
      const nz = hd - hu;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      normals.push(nx / len, ny / len, nz / len);
    }
  }

  for (let iz = 0; iz < seg; iz++) {
    for (let ix = 0; ix < seg; ix++) {
      const a = getHeightIndex(terrain, ix, iz);
      const b = getHeightIndex(terrain, ix, iz + 1);
      const c = getHeightIndex(terrain, ix + 1, iz);
      const d = getHeightIndex(terrain, ix + 1, iz + 1);
      indices.push(a, b, c, c, b, d);
    }
  }

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
