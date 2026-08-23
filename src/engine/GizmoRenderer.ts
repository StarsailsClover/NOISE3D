import { Mat4 } from '@math/Mat4';
import { Vec3 } from '@math/Vec';

export type GizmoMode = 'translate' | 'rotate' | 'scale';

export class GizmoRenderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram | null = null;

  constructor(gl: WebGL2RenderingContext, lineVS: string, lineFS: string) {
    this.gl = gl;
    this.program = this.createProgram(lineVS, lineFS);
  }

  private createProgram(vsSource: string, fsSource: string): WebGLProgram | null {
    const gl = this.gl;
    const vs = this.compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = this.compileShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return null;

    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Gizmo program link error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    return program;
  }

  private compileShader(type: number, source: string): WebGLShader | null {
    const gl = this.gl;
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Gizmo shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  renderTranslate(
    position: Vec3,
    view: Mat4,
    projection: Mat4,
    axis: 'x' | 'y' | 'z' | null = null,
  ): void {
    const gl = this.gl;
    if (!this.program) return;
    gl.useProgram(this.program);

    const uModel = gl.getUniformLocation(this.program, 'uModel');
    const uView = gl.getUniformLocation(this.program, 'uView');
    const uProj = gl.getUniformLocation(this.program, 'uProjection');
    const uColor = gl.getUniformLocation(this.program, 'uColor');

    gl.uniformMatrix4fv(uView, false, view.data);
    gl.uniformMatrix4fv(uProj, false, projection.data);

    const size = 1.0;
    const axes: { dir: Vec3; color: [number, number, number, number]; name: string }[] = [
      { dir: new Vec3(1, 0, 0), color: [1, 0.2, 0.2, 1], name: 'x' },
      { dir: new Vec3(0, 1, 0), color: [0.2, 1, 0.2, 1], name: 'y' },
      { dir: new Vec3(0, 0, 1), color: [0.2, 0.4, 1, 1], name: 'z' },
    ];

    for (const ax of axes) {
      const isHover = axis === ax.name;
      const lineColor: [number, number, number, number] = isHover
        ? [1, 1, 0, 1]
        : ax.color;

      const endX = position.x + ax.dir.x * size;
      const endY = position.y + ax.dir.y * size;
      const endZ = position.z + ax.dir.z * size;

      const verts = new Float32Array([
        position.x, position.y, position.z,
        endX, endY, endZ,
      ]);

      const vbo = gl.createBuffer();
      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

      const model = Mat4.identity();
      gl.uniformMatrix4fv(uModel, false, model.data);
      gl.uniform4f(uColor, ...lineColor);
      gl.drawArrays(gl.LINES, 0, 2);

      gl.bindVertexArray(null);
      gl.deleteBuffer(vbo);
      gl.deleteVertexArray(vao);
    }
  }

  renderScale(
    position: Vec3,
    view: Mat4,
    projection: Mat4,
    axis: 'x' | 'y' | 'z' | null = null,
  ): void {
    this.renderTranslate(position, view, projection, axis);
  }

  renderRotate(
    position: Vec3,
    view: Mat4,
    projection: Mat4,
    axis: 'x' | 'y' | 'z' | null = null,
  ): void {
    const gl = this.gl;
    if (!this.program) return;
    gl.useProgram(this.program);

    const uModel = gl.getUniformLocation(this.program, 'uModel');
    const uView = gl.getUniformLocation(this.program, 'uView');
    const uProj = gl.getUniformLocation(this.program, 'uProjection');
    const uColor = gl.getUniformLocation(this.program, 'uColor');

    gl.uniformMatrix4fv(uView, false, view.data);
    gl.uniformMatrix4fv(uProj, false, projection.data);

    const segments = 64;
    const radius = 1.0;
    const axes: { rotAxis: Vec3; color: [number, number, number, number]; name: string }[] = [
      { rotAxis: new Vec3(1, 0, 0), color: [1, 0.2, 0.2, 1], name: 'x' },
      { rotAxis: new Vec3(0, 1, 0), color: [0.2, 1, 0.2, 1], name: 'y' },
      { rotAxis: new Vec3(0, 0, 1), color: [0.2, 0.4, 1, 1], name: 'z' },
    ];

    for (const ax of axes) {
      const isHover = axis === ax.name;
      const ringColor: [number, number, number, number] = isHover
        ? [1, 1, 0, 1]
        : ax.color;

      const verts: number[] = [];
      const normal = ax.rotAxis;
      let u: Vec3;
      if (Math.abs(normal.y) < 0.9) {
        u = Vec3.normalize(Vec3.cross(normal, new Vec3(0, 1, 0)));
      } else {
        u = Vec3.normalize(Vec3.cross(normal, new Vec3(1, 0, 0)));
      }
      const v = Vec3.cross(normal, u);

      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const ca = Math.cos(angle);
        const sa = Math.sin(angle);
        verts.push(
          position.x + (u.x * ca + v.x * sa) * radius,
          position.y + (u.y * ca + v.y * sa) * radius,
          position.z + (u.z * ca + v.z * sa) * radius,
        );
      }

      const vbo = gl.createBuffer();
      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

      const model = Mat4.identity();
      gl.uniformMatrix4fv(uModel, false, model.data);
      gl.uniform4f(uColor, ...ringColor);
      gl.drawArrays(gl.LINE_STRIP, 0, verts.length / 3);

      gl.bindVertexArray(null);
      gl.deleteBuffer(vbo);
      gl.deleteVertexArray(vao);
    }
  }

  renderSelectionBox(
    min: Vec3,
    max: Vec3,
    modelMatrix: Mat4,
    view: Mat4,
    projection: Mat4,
  ): void {
    const gl = this.gl;
    if (!this.program) return;
    gl.useProgram(this.program);

    const uModel = gl.getUniformLocation(this.program, 'uModel');
    const uView = gl.getUniformLocation(this.program, 'uView');
    const uProj = gl.getUniformLocation(this.program, 'uProjection');
    const uColor = gl.getUniformLocation(this.program, 'uColor');

    gl.uniformMatrix4fv(uModel, false, modelMatrix.data);
    gl.uniformMatrix4fv(uView, false, view.data);
    gl.uniformMatrix4fv(uProj, false, projection.data);
    gl.uniform4f(uColor, 1, 0.6, 0, 1);

    const corners = [
      [min.x, min.y, min.z], [max.x, min.y, min.z],
      [max.x, min.y, min.z], [max.x, max.y, min.z],
      [max.x, max.y, min.z], [min.x, max.y, min.z],
      [min.x, max.y, min.z], [min.x, min.y, min.z],
      [min.x, min.y, max.z], [max.x, min.y, max.z],
      [max.x, min.y, max.z], [max.x, max.y, max.z],
      [max.x, max.y, max.z], [min.x, max.y, max.z],
      [min.x, max.y, max.z], [min.x, min.y, max.z],
      [min.x, min.y, min.z], [min.x, min.y, max.z],
      [max.x, min.y, min.z], [max.x, min.y, max.z],
      [max.x, max.y, min.z], [max.x, max.y, max.z],
      [min.x, max.y, min.z], [min.x, max.y, max.z],
    ];

    const verts = new Float32Array(corners.flat());
    const vbo = gl.createBuffer();
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINES, 0, verts.length / 3);
    gl.bindVertexArray(null);
    gl.deleteBuffer(vbo);
    gl.deleteVertexArray(vao);
  }

  dispose(): void {
    if (this.program) this.gl.deleteProgram(this.program);
  }

  /**
   * Consolidated gizmo overlay: axes, plane handles (translate), rings + outer
   * camera-facing ring (rotate), with hover/active highlighting and a
   * caller-computed world scale for constant on-screen size.
   */
  renderGizmo(
    position: Vec3,
    view: Mat4,
    projection: Mat4,
    mode: GizmoMode,
    hover: { kind: string; axis: 'x' | 'y' | 'z' } | null,
    active: { kind: string; axis: 'x' | 'y' | 'z' } | null,
    scale: number,
  ): void {
    const gl = this.gl;
    if (!this.program) return;
    gl.useProgram(this.program);

    const uModel = gl.getUniformLocation(this.program, 'uModel');
    const uView = gl.getUniformLocation(this.program, 'uView');
    const uProj = gl.getUniformLocation(this.program, 'uProjection');
    const uColor = gl.getUniformLocation(this.program, 'uColor');

    gl.uniformMatrix4fv(uModel, false, Mat4.identity().data);
    gl.uniformMatrix4fv(uView, false, view.data);
    gl.uniformMatrix4fv(uProj, false, projection.data);

    const isHot = (kind: string, axis: 'x' | 'y' | 'z') =>
      (active && active.kind === kind && active.axis === axis) ||
      (hover && hover.kind === kind && hover.axis === axis);
    const colFor = (
      base: [number, number, number, number],
      kind: string,
      axis: 'x' | 'y' | 'z',
    ): [number, number, number, number] => {
      if (active && active.kind === kind && active.axis === axis) return [1, 1, 0.15, 1];
      if (isHot(kind, axis)) return [1, Math.max(base[1], 0.85), Math.min(base[2] + 0.35, 1), 1];
      return base;
    };

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Plane quads first (behind axes), translate mode only
    if (mode !== 'rotate') {
      const q = scale * 0.42;
      const planes: { u: Vec3; v: Vec3; axis: 'x' | 'y' | 'z'; base: [number, number, number, number] }[] = [
        { u: new Vec3(1, 0, 0), v: new Vec3(0, 1, 0), axis: 'x', base: [1, 0.2, 0.2, 0.22] },
        { u: new Vec3(1, 0, 0), v: new Vec3(0, 0, 1), axis: 'y', base: [0.2, 1, 0.2, 0.22] },
        { u: new Vec3(0, 1, 0), v: new Vec3(0, 0, 1), axis: 'z', base: [0.2, 0.4, 1, 0.22] },
      ];
      for (const p of planes) {
        const c: [number, number, number, number] = isHot('plane', p.axis)
          ? [1, 1, 0.2, 0.55]
          : p.base;
        const p0 = position;
        const pu = Vec3.add(position, Vec3.scale(p.u, q));
        const pv = Vec3.add(position, Vec3.scale(p.v, q));
        const puv = Vec3.add(Vec3.add(position, Vec3.scale(p.u, q)), Vec3.scale(p.v, q));
        const tri = new Float32Array([
          p0.x, p0.y, p0.z, pu.x, pu.y, pu.z, puv.x, puv.y, puv.z,
          p0.x, p0.y, p0.z, puv.x, puv.y, puv.z, pv.x, pv.y, pv.z,
        ]);
        this.drawRaw(tri, gl.TRIANGLES, c, uColor);
      }
    }

    // Axes / scale arms
    if (mode !== 'rotate') {
      const arms: { dir: Vec3; axis: 'x' | 'y' | 'z'; base: [number, number, number, number] }[] = [
        { dir: new Vec3(1, 0, 0), axis: 'x', base: [1, 0.25, 0.25, 1] },
        { dir: new Vec3(0, 1, 0), axis: 'y', base: [0.3, 1, 0.3, 1] },
        { dir: new Vec3(0, 0, 1), axis: 'z', base: [0.35, 0.5, 1, 1] },
      ];
      for (const a of arms) {
        const end = Vec3.add(position, Vec3.scale(a.dir, scale));
        const verts = new Float32Array([position.x, position.y, position.z, end.x, end.y, end.z]);
        this.drawRaw(verts, gl.LINES, colFor(a.base, 'axis', a.axis), uColor);
      }
    }

    // Rotation rings
    if (mode === 'rotate') {
      const segs = 48;
      const ringDefs: { axis: 'x' | 'y' | 'z'; u: Vec3; v: Vec3; base: [number, number, number, number] }[] = [
        { axis: 'x', u: new Vec3(0, 1, 0), v: new Vec3(0, 0, 1), base: [1, 0.25, 0.25, 1] },
        { axis: 'y', u: new Vec3(1, 0, 0), v: new Vec3(0, 0, 1), base: [0.3, 1, 0.3, 1] },
        { axis: 'z', u: new Vec3(1, 0, 0), v: new Vec3(0, 1, 0), base: [0.35, 0.5, 1, 1] },
      ];
      for (const r of ringDefs) {
        const pts: number[] = [];
        for (let i = 0; i <= segs; i++) {
          const t = (i / segs) * Math.PI * 2;
          const cu = Math.cos(t) * scale;
          const cv = Math.sin(t) * scale;
          const p = Vec3.add(position, Vec3.add(Vec3.scale(r.u, cu), Vec3.scale(r.v, cv)));
          pts.push(p.x, p.y, p.z);
        }
        this.drawRaw(new Float32Array(pts), gl.LINE_STRIP, colFor(r.base, 'ring', r.axis), uColor);
      }

      // Outer screen-facing ring (camera-relative rotate)
      const fwd = Vec3.normalize(Vec3.sub(camForward(view), position));
      let upRef = Math.abs(fwd.y) < 0.9 ? new Vec3(0, 1, 0) : new Vec3(1, 0, 0);
      const ru = Vec3.normalize(Vec3.cross(upRef, fwd));
      const rv = Vec3.cross(fwd, ru);
      const R = scale * 1.28;
      const pts: number[] = [];
      for (let i = 0; i <= segs; i++) {
        const t = (i / segs) * Math.PI * 2;
        const p = Vec3.add(
          position,
          Vec3.add(Vec3.scale(ru, Math.cos(t) * R), Vec3.scale(rv, Math.sin(t) * R)),
        );
        pts.push(p.x, p.y, p.z);
      }
      const outerActive =
        (active && active.kind === 'ring') || (hover && hover.kind === 'ring');
      this.drawRaw(
        new Float32Array(pts),
        gl.LINE_STRIP,
        outerActive ? [1, 1, 0.2, 1] : [0.75, 0.75, 0.75, 0.9],
        uColor,
      );
      void upRef;
    }

    gl.disable(gl.BLEND);
  }

  private drawRaw(
    verts: Float32Array,
    mode: number,
    color: [number, number, number, number],
    uColor: WebGLUniformLocation | null,
  ): void {
    const gl = this.gl;
    const vbo = gl.createBuffer();
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.uniform4f(uColor, color[0], color[1], color[2], color[3]);
    gl.drawArrays(mode, 0, verts.length / 3);
    gl.bindVertexArray(null);
    gl.deleteBuffer(vbo);
    gl.deleteVertexArray(vao);
  }
}

/** Extract camera world position from a look-at view matrix (row 4). */
function camForward(_view: Mat4): Vec3 {
  // View matrix is lookAt-based; its inverse translation column gives eye pos.
  const inv = _view.invert();
  return new Vec3(inv.data[12], inv.data[13], inv.data[14]);
}
