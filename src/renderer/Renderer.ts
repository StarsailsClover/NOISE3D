import { Vec3 } from '@math/Vec';
import { Mat4 } from '@math/Mat4';
import { Scene } from '@scene/Scene';
import { MeshData, GeometryGenerator } from './Geometry';
import { Material, createDefaultMaterial } from './Material';
import {
  VERTEX_SHADER_SOURCE,
  FRAGMENT_SHADER_SOURCE,
  GRID_VERTEX_SHADER,
  GRID_FRAGMENT_SHADER,
  LINE_VERTEX_SHADER,
  LINE_FRAGMENT_SHADER,
  WIREFRAME_VERTEX_SHADER,
  WIREFRAME_FRAGMENT_SHADER,
} from './Shaders';

interface GLMesh {
  vao: WebGLVertexArrayObject;
  indexCount: number;
  indexType: number;
}

interface GridBuffers {
  vao: WebGLVertexArrayObject;
  vertexCount: number;
}

export class Renderer {
  private gl: WebGL2RenderingContext;
  private shaderProgram: WebGLProgram | null = null;
  private gridProgram: WebGLProgram | null = null;
  private lineProgram: WebGLProgram | null = null;
  public wireframeShader: WebGLProgram | null = null;
  private meshCache: Map<string, GLMesh> = new Map();
  private gridBuffers: GridBuffers | null = null;
  private textures: Map<string, WebGLTexture> = new Map();

  public cameraPos: Vec3 = new Vec3(5, 5, 5);
  public cameraTarget: Vec3 = new Vec3(0, 0, 0);
  public cameraUp: Vec3 = new Vec3(0, 1, 0);
  public fov: number = (60 * Math.PI) / 180;
  public near: number = 0.1;
  public far: number = 1000;

  public lightDir: Vec3 = new Vec3(-0.5, -1, -0.3);
  public lightColor: Vec3 = new Vec3(1, 1, 1);
  public ambient: Vec3 = new Vec3(0.2, 0.2, 0.2);

  public clearColor: [number, number, number, number] = [0.15, 0.15, 0.15, 1];
  public showGrid: boolean = true;
  public selectedNodeId: number | null = null;

  private materials: Map<number, Material> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', {
      antialias: true,
      depth: true,
      stencil: false,
      alpha: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) {
      throw new Error('WebGL2 is not supported by this browser');
    }
    this.gl = gl;
    this.initShaders();
    this.initGrid();
  }

  private initShaders(): void {
    this.shaderProgram = this.createProgram(VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE);
    this.gridProgram = this.createProgram(GRID_VERTEX_SHADER, GRID_FRAGMENT_SHADER);
    this.lineProgram = this.createProgram(LINE_VERTEX_SHADER, LINE_FRAGMENT_SHADER);
    this.wireframeShader = this.createProgram(WIREFRAME_VERTEX_SHADER, WIREFRAME_FRAGMENT_SHADER);
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
      console.error('Program link error:', gl.getProgramInfoLog(program));
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
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  private initGrid(): void {
    const gl = this.gl;
    const size = 50;
    const step = 1;
    const lines: number[] = [];

    for (let i = -size; i <= size; i += step) {
      lines.push(i, 0, -size, i, 0, size);
      lines.push(-size, 0, i, size, 0, i);
    }

    const vao = gl.createVertexArray();
    if (!vao) return;
    gl.bindVertexArray(vao);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lines), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);

    this.gridBuffers = { vao, vertexCount: lines.length / 3 };
  }

  private getMeshForType(type: string): GLMesh | null {
    if (this.meshCache.has(type)) {
      return this.meshCache.get(type)!;
    }

    let mesh: MeshData;
    switch (type) {
      case 'cube':
        mesh = GeometryGenerator.createCube();
        break;
      case 'sphere':
        mesh = GeometryGenerator.createSphere();
        break;
      case 'plane':
        mesh = GeometryGenerator.createPlane();
        break;
      case 'cylinder':
        mesh = GeometryGenerator.createCylinder();
        break;
      case 'cone':
        mesh = GeometryGenerator.createCone();
        break;
      default:
        return null;
    }

    const glMesh = this.uploadMesh(mesh);
    if (glMesh) {
      this.meshCache.set(type, glMesh);
    }
    return glMesh;
  }

  private uploadMesh(mesh: MeshData): GLMesh | null {
    const gl = this.gl;
    const vao = gl.createVertexArray();
    if (!vao) return null;
    gl.bindVertexArray(vao);

    const posVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posVBO);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    const normVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normVBO);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

    const uvVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvVBO);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.uvs, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);

    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);

    const indexType =
      mesh.indices instanceof Uint32Array
        ? gl.UNSIGNED_INT
        : gl.UNSIGNED_SHORT;

    return { vao, indexCount: mesh.indices.length, indexType };
  }

  setMaterial(nodeId: number, material: Material): void {
    this.materials.set(nodeId, material);
  }

  getMaterial(nodeId: number): Material {
    return this.materials.get(nodeId) ?? createDefaultMaterial();
  }

  loadTextureFromImage(textureId: string, image: HTMLImageElement): void {
    const gl = this.gl;
    const texture = gl.createTexture();
    if (!texture) return;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.bindTexture(gl.TEXTURE_2D, null);
    this.textures.set(textureId, texture);
  }

  createCheckerTexture(textureId: string): void {
    const gl = this.gl;
    const size = 64;
    const data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const checker = ((Math.floor(x / 8) + Math.floor(y / 8)) % 2) === 0;
        const v = checker ? 200 : 100;
        data[idx] = v;
        data[idx + 1] = v;
        data[idx + 2] = v;
        data[idx + 3] = 255;
      }
    }
    const texture = gl.createTexture();
    if (!texture) return;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.bindTexture(gl.TEXTURE_2D, null);
    this.textures.set(textureId, texture);
  }

  render(scene: Scene, canvasWidth: number, canvasHeight: number): void {
    const gl = this.gl;

    gl.viewport(0, 0, canvasWidth, canvasHeight);
    gl.clearColor(...this.clearColor);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const aspect = canvasWidth / Math.max(1, canvasHeight);
    const projection = Mat4.perspective(this.fov, aspect, this.near, this.far);
    const view = Mat4.lookAt(this.cameraPos, this.cameraTarget, this.cameraUp);

    if (this.showGrid) {
      this.renderGrid(view, projection);
    }

    if (this.shaderProgram) {
      gl.useProgram(this.shaderProgram);

      const uModel = gl.getUniformLocation(this.shaderProgram, 'uModel');
      const uView = gl.getUniformLocation(this.shaderProgram, 'uView');
      const uProj = gl.getUniformLocation(this.shaderProgram, 'uProjection');
      const uNormalMat = gl.getUniformLocation(this.shaderProgram, 'uNormalMatrix');
      const uBaseColor = gl.getUniformLocation(this.shaderProgram, 'uBaseColor');
      const uEmissive = gl.getUniformLocation(this.shaderProgram, 'uEmissive');
      const uEmissiveIntensity = gl.getUniformLocation(this.shaderProgram, 'uEmissiveIntensity');
      const uMetallic = gl.getUniformLocation(this.shaderProgram, 'uMetallic');
      const uRoughness = gl.getUniformLocation(this.shaderProgram, 'uRoughness');
      const uCameraPos = gl.getUniformLocation(this.shaderProgram, 'uCameraPos');
      const uAmbient = gl.getUniformLocation(this.shaderProgram, 'uAmbient');
      const uLightDir = gl.getUniformLocation(this.shaderProgram, 'uLightDir');
      const uLightColor = gl.getUniformLocation(this.shaderProgram, 'uLightColor');
      const uHasTexture = gl.getUniformLocation(this.shaderProgram, 'uHasTexture');
      const uTexture = gl.getUniformLocation(this.shaderProgram, 'uTexture');
      const uTexTiling = gl.getUniformLocation(this.shaderProgram, 'uTextureTiling');
      const uTexOffset = gl.getUniformLocation(this.shaderProgram, 'uTextureOffset');

      gl.uniformMatrix4fv(uView, false, view.data);
      gl.uniformMatrix4fv(uProj, false, projection.data);
      gl.uniform3f(uCameraPos, this.cameraPos.x, this.cameraPos.y, this.cameraPos.z);
      gl.uniform3f(uAmbient, this.ambient.x, this.ambient.y, this.ambient.z);
      gl.uniform3f(uLightDir, this.lightDir.x, this.lightDir.y, this.lightDir.z);
      gl.uniform3f(uLightColor, this.lightColor.x, this.lightColor.y, this.lightColor.z);
      gl.uniform1i(uTexture, 0);

      for (const node of scene.getAllNodes()) {
        if (!node.visible) continue;
        const mesh = this.getMeshForType(node.type);
        if (!mesh) continue;

        const model = Mat4.fromTRS(node.position, node.rotation, node.scale);
        const normalMatrix = model.invert();

        gl.uniformMatrix4fv(uModel, false, model.data);
        gl.uniformMatrix4fv(uNormalMat, false, normalMatrix.data);

        const mat = this.getMaterial(node.id);
        gl.uniform4f(uBaseColor, mat.baseColor.r, mat.baseColor.g, mat.baseColor.b, mat.baseColor.a);
        gl.uniform3f(uEmissive, mat.emissive.r, mat.emissive.g, mat.emissive.b);
        gl.uniform1f(uEmissiveIntensity, mat.emissiveIntensity);
        gl.uniform1f(uMetallic, mat.metallic);
        gl.uniform1f(uRoughness, mat.roughness);

        const hasTex = mat.textureId !== null && this.textures.has(mat.textureId);
        gl.uniform1i(uHasTexture, hasTex ? 1 : 0);
        gl.uniform2f(uTexTiling, mat.textureTiling[0], mat.textureTiling[1]);
        gl.uniform2f(uTexOffset, mat.textureOffset[0], mat.textureOffset[1]);

        if (hasTex && mat.textureId) {
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, this.textures.get(mat.textureId)!);
        }

        if (mat.doubleSided) {
          gl.disable(gl.CULL_FACE);
        } else {
          gl.enable(gl.CULL_FACE);
        }

        gl.bindVertexArray(mesh.vao);
        gl.drawElements(gl.TRIANGLES, mesh.indexCount, mesh.indexType, 0);
      }

      gl.bindVertexArray(null);
    }

    if (this.selectedNodeId !== null && this.wireframeShader) {
      const node = scene.getNode(this.selectedNodeId);
      if (node && node.visible) {
        const mesh = this.getMeshForType(node.type);
        if (mesh) {
          gl.useProgram(this.wireframeShader);
          gl.disable(gl.DEPTH_TEST);
          gl.enable(gl.BLEND);
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

          const uModel = gl.getUniformLocation(this.wireframeShader, 'uModel');
          const uView = gl.getUniformLocation(this.wireframeShader, 'uView');
          const uProj = gl.getUniformLocation(this.wireframeShader, 'uProjection');
          const uColor = gl.getUniformLocation(this.wireframeShader, 'uColor');

          const model = Mat4.fromTRS(node.position, node.rotation, node.scale);
          gl.uniformMatrix4fv(uModel, false, model.data);
          gl.uniformMatrix4fv(uView, false, view.data);
          gl.uniformMatrix4fv(uProj, false, projection.data);
          gl.uniform4f(uColor, 1, 0.6, 0, 0.8);

          gl.bindVertexArray(mesh.vao);
          gl.drawElements(gl.LINES, mesh.indexCount, mesh.indexType, 0);
          gl.bindVertexArray(null);

          gl.disable(gl.BLEND);
          gl.enable(gl.DEPTH_TEST);
        }
      }
    }
  }

  private renderGrid(view: Mat4, projection: Mat4): void {
    if (!this.gridProgram || !this.gridBuffers) return;
    const gl = this.gl;
    gl.useProgram(this.gridProgram);

    const uView = gl.getUniformLocation(this.gridProgram, 'uView');
    const uProj = gl.getUniformLocation(this.gridProgram, 'uProjection');
    gl.uniformMatrix4fv(uView, false, view.data);
    gl.uniformMatrix4fv(uProj, false, projection.data);

    gl.bindVertexArray(this.gridBuffers.vao);
    gl.drawArrays(gl.LINES, 0, this.gridBuffers.vertexCount);
    gl.bindVertexArray(null);
  }

  dispose(): void {
    const gl = this.gl;
    for (const mesh of this.meshCache.values()) {
      gl.deleteVertexArray(mesh.vao);
    }
    this.meshCache.clear();
    if (this.shaderProgram) gl.deleteProgram(this.shaderProgram);
    if (this.gridProgram) gl.deleteProgram(this.gridProgram);
    if (this.lineProgram) gl.deleteProgram(this.lineProgram);
    if (this.wireframeShader) gl.deleteProgram(this.wireframeShader);
    for (const tex of this.textures.values()) {
      gl.deleteTexture(tex);
    }
    this.textures.clear();
  }
}
