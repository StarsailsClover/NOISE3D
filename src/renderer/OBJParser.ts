import { MeshData } from '@renderer/Geometry';

export class OBJParser {
  static parse(text: string): MeshData {
    const indices: number[] = [];

    const tempPositions: number[][] = [];
    const tempNormals: number[][] = [];
    const tempUVs: number[][] = [];
    const normalMap = new Map<string, number>();
    const outPositions: number[] = [];
    const outNormals: number[] = [];
    const outUVs: number[] = [];

    const lines = text.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || trimmed.length === 0) continue;

      const parts = trimmed.split(/\s+/);
      const cmd = parts[0];

      if (cmd === 'v') {
        tempPositions.push([
          parseFloat(parts[1]),
          parseFloat(parts[2]),
          parseFloat(parts[3]),
        ]);
      } else if (cmd === 'vn') {
        tempNormals.push([
          parseFloat(parts[1]),
          parseFloat(parts[2]),
          parseFloat(parts[3]),
        ]);
      } else if (cmd === 'vt') {
        tempUVs.push([
          parseFloat(parts[1]),
          parseFloat(parts[2]),
        ]);
      } else if (cmd === 'f') {
        const faceVerts = parts.slice(1);
        if (faceVerts.length < 3) continue;

        const triangulated = this.triangulateFace(faceVerts);
        for (const fv of triangulated) {
          const key = fv;
          if (normalMap.has(key)) {
            indices.push(normalMap.get(key)!);
            continue;
          }

          const [vi, ti, ni] = fv.split('/').map((s) => (s ? parseInt(s) : 0));
          const idx = outPositions.length / 3;

          if (vi > 0 && vi <= tempPositions.length) {
            const p = tempPositions[vi - 1];
            outPositions.push(p[0], p[1], p[2]);
          } else {
            outPositions.push(0, 0, 0);
          }

          if (ni > 0 && ni <= tempNormals.length) {
            const n = tempNormals[ni - 1];
            outNormals.push(n[0], n[1], n[2]);
          } else {
            outNormals.push(0, 1, 0);
          }

          if (ti > 0 && ti <= tempUVs.length) {
            const uv = tempUVs[ti - 1];
            outUVs.push(uv[0], uv[1]);
          } else {
            outUVs.push(0, 0);
          }

          normalMap.set(key, idx);
          indices.push(idx);
        }
      }
    }

    if (outPositions.length === 0) {
      return GeometryGenerator.createCube();
    }

    for (let i = 0; i < outNormals.length; i += 3) {
      const x = outNormals[i];
      const y = outNormals[i + 1];
      const z = outNormals[i + 2];
      const len = Math.sqrt(x * x + y * y + z * z);
      if (len > 0.001) {
        outNormals[i] = x / len;
        outNormals[i + 1] = y / len;
        outNormals[i + 2] = z / len;
      }
    }

    const indexArray =
      outPositions.length / 3 > 65535
        ? new Uint32Array(indices)
        : new Uint16Array(indices);

    return {
      positions: new Float32Array(outPositions),
      normals: new Float32Array(outNormals),
      uvs: new Float32Array(outUVs),
      indices: indexArray,
    };
  }

  private static triangulateFace(verts: string[]): string[] {
    if (verts.length === 3) return verts;
    if (verts.length === 4) {
      return [verts[0], verts[1], verts[2], verts[0], verts[2], verts[3]];
    }
    const result: string[] = [];
    for (let i = 1; i < verts.length - 1; i++) {
      result.push(verts[0], verts[i], verts[i + 1]);
    }
    return result;
  }
}

import { GeometryGenerator } from '@renderer/Geometry';
