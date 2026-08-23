import { Vec3 } from './Vec';

export type Mat4Data = Float32Array;

export class Mat4 {
  data: Mat4Data;

  constructor(data?: Float32Array) {
    if (data) {
      this.data = new Float32Array(data);
    } else {
      this.data = Mat4.identity().data;
    }
  }

  static get IDENTITY(): Mat4 {
    return Mat4.identity();
  }

  static identity(): Mat4 {
    const m = new Float32Array(16);
    m[0] = 1;
    m[5] = 1;
    m[10] = 1;
    m[15] = 1;
    return new Mat4(m);
  }

  static perspective(
    fovY: number,
    aspect: number,
    near: number,
    far: number,
  ): Mat4 {
    const f = 1 / Math.tan(fovY / 2);
    const nf = 1 / (near - far);
    const m = new Float32Array(16);
    m[0] = f / aspect;
    m[5] = f;
    m[10] = (far + near) * nf;
    m[11] = -1;
    m[14] = 2 * far * near * nf;
    return new Mat4(m);
  }

  static orthographic(
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far: number,
  ): Mat4 {
    const lr = 1 / (left - right);
    const bt = 1 / (bottom - top);
    const nf = 1 / (near - far);
    const m = new Float32Array(16);
    m[0] = -2 * lr;
    m[5] = -2 * bt;
    m[10] = 2 * nf;
    m[12] = (left + right) * lr;
    m[13] = (top + bottom) * bt;
    m[14] = (far + near) * nf;
    m[15] = 1;
    return new Mat4(m);
  }

  static lookAt(eye: Vec3, target: Vec3, up: Vec3): Mat4 {
    const z = Vec3.normalize(Vec3.sub(eye, target)); // backward
    const x = Vec3.normalize(Vec3.cross(up, z));     // right
    const y = Vec3.cross(z, x);                      // true up

    // Column-major view matrix: rotation stored TRANSPOSED (rows = basis
    // vectors) so that V maps world -> camera: V·eye == origin.
    const m = new Float32Array(16);
    m[0] = x.x; m[4] = x.y; m[8]  = x.z;
    m[1] = y.x; m[5] = y.y; m[9]  = y.z;
    m[2] = z.x; m[6] = z.y; m[10] = z.z;
    m[3] = 0;   m[7] = 0;   m[11] = 0;
    m[12] = -Vec3.dot(x, eye);
    m[13] = -Vec3.dot(y, eye);
    m[14] = -Vec3.dot(z, eye);
    m[15] = 1;
    return new Mat4(m);
  }

  static translation(x: number, y: number, z: number): Mat4 {
    const m = Mat4.identity().data;
    m[12] = x;
    m[13] = y;
    m[14] = z;
    return new Mat4(m);
  }

  static scaling(x: number, y: number, z: number): Mat4 {
    const m = new Float32Array(16);
    m[0] = x;
    m[5] = y;
    m[10] = z;
    m[15] = 1;
    return new Mat4(m);
  }

  static rotationX(angle: number): Mat4 {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const m = Mat4.identity().data;
    m[5] = c;
    m[6] = s;
    m[9] = -s;
    m[10] = c;
    return new Mat4(m);
  }

  static rotationY(angle: number): Mat4 {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const m = Mat4.identity().data;
    m[0] = c;
    m[2] = -s;
    m[8] = s;
    m[10] = c;
    return new Mat4(m);
  }

  static rotationZ(angle: number): Mat4 {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const m = Mat4.identity().data;
    m[0] = c;
    m[1] = s;
    m[4] = -s;
    m[5] = c;
    return new Mat4(m);
  }

  static multiply(a: Mat4, b: Mat4): Mat4 {
    const o = new Float32Array(16);
    // Column-major: out(col c, row r) = Σ_k A(r,k) * B(k,c)
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 4; r++) {
        let s = 0;
        for (let k = 0; k < 4; k++) s += a.data[k * 4 + r] * b.data[c * 4 + k];
        o[c * 4 + r] = s;
      }
    }
    return new Mat4(o);
  }

  static fromTRS(
    position: Vec3,
    rotation: Vec3,
    scale: Vec3,
  ): Mat4 {
    const t = Mat4.translation(position.x, position.y, position.z);
    const rx = Mat4.rotationX(rotation.x);
    const ry = Mat4.rotationY(rotation.y);
    const rz = Mat4.rotationZ(rotation.z);
    const s = Mat4.scaling(scale.x, scale.y, scale.z);
    return Mat4.multiply(Mat4.multiply(Mat4.multiply(t, rx), Mat4.multiply(ry, rz)), s);
  }

  invert(): Mat4 {
    const m = this.data;
    const out = new Float32Array(16);
    const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3];
    const a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7];
    const a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
    const a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];

    const b00 = a00 * a11 - a01 * a10;
    const b01 = a00 * a12 - a02 * a10;
    const b02 = a00 * a13 - a03 * a10;
    const b03 = a01 * a12 - a02 * a11;
    const b04 = a01 * a13 - a03 * a11;
    const b05 = a02 * a13 - a03 * a12;
    const b06 = a20 * a31 - a21 * a30;
    const b07 = a20 * a32 - a22 * a30;
    const b08 = a20 * a33 - a23 * a30;
    const b09 = a21 * a32 - a22 * a31;
    const b10 = a21 * a33 - a23 * a31;
    const b11 = a22 * a33 - a23 * a32;

    let det =
      b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (Math.abs(det) < 1e-9) {
      return Mat4.identity();
    }
    det = 1 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

    return new Mat4(out);
  }

  clone(): Mat4 {
    return new Mat4(new Float32Array(this.data));
  }
}
