export interface MeshData {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  indices: Uint16Array | Uint32Array;
}

export class GeometryGenerator {
  static createCube(): MeshData {
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const faces = [
      { dir: [0, 0, 1], corners: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]] },
      { dir: [0, 0, -1], corners: [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]] },
      { dir: [0, 1, 0], corners: [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]] },
      { dir: [0, -1, 0], corners: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]] },
      { dir: [1, 0, 0], corners: [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]] },
      { dir: [-1, 0, 0], corners: [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]] },
    ];

    const faceUVs = [[0, 0], [1, 0], [1, 1], [0, 1]];

    for (const face of faces) {
      const idx = positions.length / 3;
      for (const c of face.corners) {
        positions.push(c[0], c[1], c[2]);
        normals.push(face.dir[0], face.dir[1], face.dir[2]);
      }
      for (const uv of faceUVs) {
        uvs.push(uv[0], uv[1]);
      }
      indices.push(idx, idx + 1, idx + 2, idx, idx + 2, idx + 3);
    }

    return this.toMeshData(positions, normals, uvs, indices);
  }

  static createPlane(segments = 1): MeshData {
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const segSize = 1 / segments;
    for (let y = 0; y <= segments; y++) {
      for (let x = 0; x <= segments; x++) {
        positions.push(x * segSize * 2 - 1, 0, y * segSize * 2 - 1);
        normals.push(0, 1, 0);
        uvs.push(x * segSize, y * segSize);
      }
    }

    for (let y = 0; y < segments; y++) {
      for (let x = 0; x < segments; x++) {
        const a = x + y * (segments + 1);
        const b = a + segments + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }

    return this.toMeshData(positions, normals, uvs, indices);
  }

  static createSphere(segments = 24, rings = 16): MeshData {
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let y = 0; y <= rings; y++) {
      const phi = (y / rings) * Math.PI;
      const v = y / rings;
      for (let x = 0; x <= segments; x++) {
        const theta = (x / segments) * Math.PI * 2;
        const u = x / segments;
        const px = -Math.cos(theta) * Math.sin(phi);
        const py = Math.cos(phi);
        const pz = Math.sin(theta) * Math.sin(phi);
        positions.push(px, py, pz);
        normals.push(px, py, pz);
        uvs.push(u, v);
      }
    }

    for (let y = 0; y < rings; y++) {
      for (let x = 0; x < segments; x++) {
        const a = x + y * (segments + 1);
        const b = a + segments + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }

    return this.toMeshData(positions, normals, uvs, indices);
  }

  static createCylinder(segments = 24, height = 2, radius = 1): MeshData {
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const halfH = height / 2;

    for (let x = 0; x <= segments; x++) {
      const theta = (x / segments) * Math.PI * 2;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      const u = x / segments;

      positions.push(cos * radius, -halfH, sin * radius);
      normals.push(cos, 0, sin);
      uvs.push(u, 0);

      positions.push(cos * radius, halfH, sin * radius);
      normals.push(cos, 0, sin);
      uvs.push(u, 1);
    }

    for (let x = 0; x < segments; x++) {
      const a = x * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }

    const capCenterTop = positions.length / 3;
    positions.push(0, halfH, 0);
    normals.push(0, 1, 0);
    uvs.push(0.5, 0.5);

    const capCenterBot = positions.length / 3;
    positions.push(0, -halfH, 0);
    normals.push(0, -1, 0);
    uvs.push(0.5, 0.5);

    for (let x = 0; x < segments; x++) {
      const theta = (x / segments) * Math.PI * 2;
      const nextTheta = ((x + 1) / segments) * Math.PI * 2;
      const i = positions.length / 3;

      positions.push(Math.cos(theta) * radius, halfH, Math.sin(theta) * radius);
      normals.push(0, 1, 0);
      uvs.push(0.5 + Math.cos(theta) * 0.5, 0.5 + Math.sin(theta) * 0.5);

      positions.push(Math.cos(nextTheta) * radius, halfH, Math.sin(nextTheta) * radius);
      normals.push(0, 1, 0);
      uvs.push(0.5 + Math.cos(nextTheta) * 0.5, 0.5 + Math.sin(nextTheta) * 0.5);

      indices.push(capCenterTop, i, i + 1);
    }

    for (let x = 0; x < segments; x++) {
      const theta = (x / segments) * Math.PI * 2;
      const nextTheta = ((x + 1) / segments) * Math.PI * 2;
      const i = positions.length / 3;

      positions.push(Math.cos(theta) * radius, -halfH, Math.sin(theta) * radius);
      normals.push(0, -1, 0);
      uvs.push(0.5 + Math.cos(theta) * 0.5, 0.5 + Math.sin(theta) * 0.5);

      positions.push(Math.cos(nextTheta) * radius, -halfH, Math.sin(nextTheta) * radius);
      normals.push(0, -1, 0);
      uvs.push(0.5 + Math.cos(nextTheta) * 0.5, 0.5 + Math.sin(nextTheta) * 0.5);

      indices.push(capCenterBot, i + 1, i);
    }

    return this.toMeshData(positions, normals, uvs, indices);
  }

  static createCone(segments = 24, height = 2, radius = 1): MeshData {
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const halfH = height / 2;

    for (let x = 0; x <= segments; x++) {
      const theta = (x / segments) * Math.PI * 2;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      const u = x / segments;

      positions.push(cos * radius, -halfH, sin * radius);
      normals.push(cos, 0.3, sin);
      uvs.push(u, 0);

      positions.push(0, halfH, 0);
      normals.push(cos, 0.3, sin);
      uvs.push(u, 1);
    }

    for (let x = 0; x < segments; x++) {
      const a = x * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }

    const capCenter = positions.length / 3;
    positions.push(0, -halfH, 0);
    normals.push(0, -1, 0);
    uvs.push(0.5, 0.5);

    for (let x = 0; x < segments; x++) {
      const theta = (x / segments) * Math.PI * 2;
      const nextTheta = ((x + 1) / segments) * Math.PI * 2;
      const i = positions.length / 3;

      positions.push(Math.cos(theta) * radius, -halfH, Math.sin(theta) * radius);
      normals.push(0, -1, 0);
      uvs.push(0.5 + Math.cos(theta) * 0.5, 0.5 + Math.sin(theta) * 0.5);

      positions.push(Math.cos(nextTheta) * radius, -halfH, Math.sin(nextTheta) * radius);
      normals.push(0, -1, 0);
      uvs.push(0.5 + Math.cos(nextTheta) * 0.5, 0.5 + Math.sin(nextTheta) * 0.5);

      indices.push(capCenter, i + 1, i);
    }

    return this.toMeshData(positions, normals, uvs, indices);
  }

  private static toMeshData(
    positions: number[],
    normals: number[],
    uvs: number[],
    indices: number[],
  ): MeshData {
    const indexArray =
      positions.length / 3 > 65535
        ? new Uint32Array(indices)
        : new Uint16Array(indices);

    return {
      positions: new Float32Array(positions),
      normals: new Float32Array(normals),
      uvs: new Float32Array(uvs),
      indices: indexArray,
    };
  }
}
