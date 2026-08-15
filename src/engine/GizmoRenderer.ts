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
}
