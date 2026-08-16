import { Vec3 } from '@math/Vec';
import { Mat4 } from '@math/Mat4';
import { Scene } from '@scene/Scene';
import { MAX_LIGHTS } from '@scene/Light';
import { MeshData, GeometryGenerator } from './Geometry';
import { Material, createDefaultMaterial } from './Material';
import {
  WGSL_VERTEX_SHADER,
  WGSL_FRAGMENT_SHADER,
  WGSL_GRID_SHADER,
  WGSL_WIREFRAME_SHADER,
} from './WebGPUShaders';

export function isWebGPUAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

interface GPUMeshData {
  vertexBuffer: GPUBuffer;
  indexBuffer: GPUBuffer;
  indexCount: number;
  indexFormat: GPUIndexFormat;
}

const VERTEX_BUFFER_LAYOUT: GPUVertexBufferLayout[] = [
  {
    arrayStride: 12,
    attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }],
  },
  {
    arrayStride: 12,
    attributes: [{ shaderLocation: 1, offset: 0, format: 'float32x3' }],
  },
  {
    arrayStride: 8,
    attributes: [{ shaderLocation: 2, offset: 0, format: 'float32x2' }],
  },
];

export class WebGPURenderer {
  private device!: GPUDevice;
  private context!: GPUCanvasContext;
  private format!: GPUTextureFormat;
  private depthTexture: GPUTexture | null = null;
  private pipeline: GPURenderPipeline | null = null;
  private gridPipeline: GPURenderPipeline | null = null;
  // @ts-ignore - used for selection wireframe rendering in future
  private wireframePipeline: GPURenderPipeline | null = null;
  private uniformBuffer: GPUBuffer | null = null;
  private lightBuffer: GPUBuffer | null = null;
  private materialBuffer: GPUBuffer | null = null;
  private meshCache: Map<string, GPUMeshData> = new Map();
  private gridVertexBuffer: GPUBuffer | null = null;
  private gridVertexCount: number = 0;
  private gridUniformBuffer: GPUBuffer | null = null;
  private sampler: GPUSampler | null = null;
  private bindGroupLayout: GPUBindGroupLayout | null = null;
  private dummyTexture: GPUTexture | null = null;
  private dummyTextureView: GPUTextureView | null = null;

  public cameraPos: Vec3 = new Vec3(5, 5, 5);
  public cameraTarget: Vec3 = new Vec3(0, 0, 0);
  public cameraUp: Vec3 = new Vec3(0, 1, 0);
  public fov: number = (60 * Math.PI) / 180;
  public near: number = 0.1;
  public far: number = 1000;
  public ambient: Vec3 = new Vec3(0.2, 0.2, 0.2);
  public clearColor: [number, number, number, number] = [0.15, 0.15, 0.15, 1];
  public showGrid: boolean = true;
  public selectedNodeId: number | null = null;
  public postExposure: number = 1.0;
  public postBloomThreshold: number = 1.0;
  public postBloomIntensity: number = 0.3;

  private materials: Map<number, Material> = new Map();
  private customMeshes: Map<string, MeshData> = new Map();
  public ready: Promise<void>;
  public initialized: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.ready = this.init(canvas).then(() => {
      this.initialized = true;
    }).catch((e) => {
      console.warn('WebGPU init failed, falling back to WebGL2:', e);
      throw e;
    });
  }

  private async init(canvas: HTMLCanvasElement): Promise<void> {
    if (!isWebGPUAvailable()) {
      throw new Error('WebGPU is not supported by this browser');
    }

    const adapter = await navigator.gpu!.requestAdapter();
    if (!adapter) {
      throw new Error('No WebGPU adapter found');
    }

    this.device = await adapter.requestDevice();
    this.context = canvas.getContext('webgpu')!;
    if (!this.context) {
      throw new Error('Failed to get WebGPU canvas context');
    }
    this.format = navigator.gpu!.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: 'opaque',
    });

    this.createPipelines();
    this.createUniformBuffers();
    this.createGrid();
    this.createSamplerAndDummyTexture();
  }

  private createPipelines(): void {
    const shaderModule = this.device.createShaderModule({
      code: WGSL_VERTEX_SHADER + '\n' + WGSL_FRAGMENT_SHADER,
    });

    this.bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {} },
        { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, buffer: {} },
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
        { binding: 4, visibility: GPUShaderStage.FRAGMENT, texture: {} },
      ],
    });

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [this.bindGroupLayout],
    });

    this.pipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: { module: shaderModule, entryPoint: 'vs_main', buffers: VERTEX_BUFFER_LAYOUT },
      fragment: { module: shaderModule, entryPoint: 'fs_main', targets: [{ format: this.format }] },
      primitive: { topology: 'triangle-list', cullMode: 'back' },
      depthStencil: { format: 'depth24plus', depthWriteEnabled: true, depthCompare: 'less' },
    });

    const gridModule = this.device.createShaderModule({ code: WGSL_GRID_SHADER });
    const gridLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [
        this.device.createBindGroupLayout({
          entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {} }],
        }),
      ],
    });
    this.gridPipeline = this.device.createRenderPipeline({
      layout: gridLayout,
      vertex: {
        module: gridModule,
        entryPoint: 'vs_main',
        buffers: [{
          arrayStride: 12,
          attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }],
        }],
      },
      fragment: { module: gridModule, entryPoint: 'fs_main', targets: [{ format: this.format, blend: { color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' }, alpha: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' } } }] },
      primitive: { topology: 'line-list' },
      depthStencil: { format: 'depth24plus', depthWriteEnabled: true, depthCompare: 'less' },
    });

    const wireModule = this.device.createShaderModule({ code: WGSL_WIREFRAME_SHADER });
    this.wireframePipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [
          this.device.createBindGroupLayout({
            entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {} }],
          }),
        ],
      }),
      vertex: {
        module: wireModule,
        entryPoint: 'vs_main',
        buffers: [{
          arrayStride: 12,
          attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }],
        }],
      },
      fragment: { module: wireModule, entryPoint: 'fs_main', targets: [{ format: this.format, blend: { color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' }, alpha: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' } } }] },
      primitive: { topology: 'line-list' },
      depthStencil: { format: 'depth24plus', depthWriteEnabled: false, depthCompare: 'less' },
    });
  }

  private createUniformBuffers(): void {
    const uniformSize = 16 * 4 * 4 + 16 + 16;
    this.uniformBuffer = this.device.createBuffer({
      size: Math.max(uniformSize, 256),
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const lightSize = 16 + 8 * 4 + 8 * 16 + 8 * 16 + 8 * 16 + 8 * 4 + 8 * 4 + 8 * 4 + 8 * 4;
    this.lightBuffer = this.device.createBuffer({
      size: Math.max(lightSize, 256),
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const matSize = 16 + 16 + 16 + 8;
    this.materialBuffer = this.device.createBuffer({
      size: Math.max(matSize, 256),
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.gridUniformBuffer = this.device.createBuffer({
      size: 16 * 4 * 2,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  private createGrid(): void {
    const size = 50;
    const step = 1;
    const lines: number[] = [];
    for (let i = -size; i <= size; i += step) {
      lines.push(i, 0, -size, i, 0, size);
      lines.push(-size, 0, i, size, 0, i);
    }
    this.gridVertexCount = lines.length / 3;
    this.gridVertexBuffer = this.device.createBuffer({
      size: lines.length * 4,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.gridVertexBuffer, 0, new Float32Array(lines).buffer as ArrayBuffer);
  }

  private createSamplerAndDummyTexture(): void {
    this.sampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: 'repeat',
      addressModeV: 'repeat',
    });
    this.dummyTexture = this.device.createTexture({
      size: [1, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    this.dummyTextureView = this.dummyTexture.createView();
    this.device.queue.writeTexture(
      { texture: this.dummyTexture },
      new Uint8Array([255, 255, 255, 255]),
      { bytesPerRow: 4 },
      { width: 1, height: 1 },
    );
  }

  setMaterial(nodeId: number, material: Material): void {
    this.materials.set(nodeId, material);
  }

  getMaterial(nodeId: number): Material {
    return this.materials.get(nodeId) ?? createDefaultMaterial();
  }

  uploadCustomMesh(id: string, mesh: MeshData): void {
    this.customMeshes.set(id, mesh);
  }

  private getMeshForType(type: string, meshAssetId?: string | null): GPUMeshData | null {
    const cacheKey = meshAssetId ? `custom:${meshAssetId}` : type;
    if (this.meshCache.has(cacheKey)) return this.meshCache.get(cacheKey)!;

    let mesh: MeshData;
    if (meshAssetId && this.customMeshes.has(meshAssetId)) {
      mesh = this.customMeshes.get(meshAssetId)!;
    } else {
      switch (type) {
        case 'cube': mesh = GeometryGenerator.createCube(); break;
        case 'sphere': mesh = GeometryGenerator.createSphere(); break;
        case 'plane': mesh = GeometryGenerator.createPlane(); break;
        case 'cylinder': mesh = GeometryGenerator.createCylinder(); break;
        case 'cone': mesh = GeometryGenerator.createCone(); break;
        default: return null;
      }
    }

    const interleaved = this.interleaveMesh(mesh);
    const vertexBuffer = this.device.createBuffer({
      size: interleaved.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(vertexBuffer, 0, interleaved.buffer as ArrayBuffer);

    const indexFormat: GPUIndexFormat =
      mesh.positions.length / 3 > 65535 ? 'uint32' : 'uint16';
    const indexBuffer = this.device.createBuffer({
      size: mesh.indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(indexBuffer, 0, mesh.indices.buffer as ArrayBuffer);

    const data: GPUMeshData = {
      vertexBuffer,
      indexBuffer,
      indexCount: mesh.indices.length,
      indexFormat,
    };
    this.meshCache.set(cacheKey, data);
    return data;
  }

  private interleaveMesh(mesh: MeshData): Float32Array {
    const vertCount = mesh.positions.length / 3;
    const result = new Float32Array(vertCount * 8);
    for (let i = 0; i < vertCount; i++) {
      const o = i * 8;
      result[o] = mesh.positions[i * 3];
      result[o + 1] = mesh.positions[i * 3 + 1];
      result[o + 2] = mesh.positions[i * 3 + 2];
      result[o + 3] = mesh.normals[i * 3];
      result[o + 4] = mesh.normals[i * 3 + 1];
      result[o + 5] = mesh.normals[i * 3 + 2];
      result[o + 6] = mesh.uvs[i * 2];
      result[o + 7] = mesh.uvs[i * 2 + 1];
    }
    return result;
  }

  render(scene: Scene, canvasWidth: number, canvasHeight: number): void {
    if (!this.pipeline || !this.device || !this.uniformBuffer) return;

    if (!this.depthTexture || this.depthTexture.width !== canvasWidth || this.depthTexture.height !== canvasHeight) {
      if (this.depthTexture) this.depthTexture.destroy();
      this.depthTexture = this.device.createTexture({
        size: [canvasWidth, canvasHeight],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
    }

    const aspect = canvasWidth / Math.max(1, canvasHeight);
    const projection = Mat4.perspective(this.fov, aspect, this.near, this.far);
    const view = Mat4.lookAt(this.cameraPos, this.cameraTarget, this.cameraUp);

    const uniformData = new Float32Array(16 * 4 + 8);
    uniformData.set(Mat4.identity().data, 0);
    uniformData.set(view.data, 16);
    uniformData.set(projection.data, 32);
    uniformData.set(Mat4.identity().data, 48);
    uniformData.set([this.cameraPos.x, this.cameraPos.y, this.cameraPos.z, 0], 64);
    uniformData.set([this.ambient.x, this.ambient.y, this.ambient.z, 0], 68);
    this.device.queue.writeBuffer(this.uniformBuffer!, 0, uniformData);

    const lights = scene.lights.filter((l) => l.enabled).slice(0, MAX_LIGHTS);
    const lightData = new Float32Array(16 + 8 * 4 + 8 * 16 + 8 * 16 + 8 * 16 + 8 * 4 + 8 * 4 + 8 * 4 + 8 * 4);
    lightData[0] = lights.length;
    for (let i = 0; i < lights.length; i++) {
      const l = lights[i];
      lightData[4 + i] = l.type === 'directional' ? 0 : l.type === 'point' ? 1 : 2;
      lightData.set([l.position.x, l.position.y, l.position.z, 0], 8 + i * 4);
      lightData.set([l.direction.x, l.direction.y, l.direction.z, 0], 8 + 32 + i * 4);
      lightData.set([l.color.r, l.color.g, l.color.b, 0], 8 + 64 + i * 4);
      lightData[8 + 96 + i] = l.intensity;
      lightData[8 + 96 + 8 + i] = l.range;
      lightData[8 + 96 + 16 + i] = l.innerConeAngle;
      lightData[8 + 96 + 24 + i] = l.outerConeAngle;
    }
    this.device.queue.writeBuffer(this.lightBuffer!, 0, lightData);

    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: this.context.getCurrentTexture().createView(),
        clearValue: { r: this.clearColor[0], g: this.clearColor[1], b: this.clearColor[2], a: this.clearColor[3] },
        loadOp: 'clear',
        storeOp: 'store',
      }],
      depthStencilAttachment: {
        view: this.depthTexture!.createView(),
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    });

    if (this.showGrid && this.gridPipeline && this.gridVertexBuffer) {
      const gridUniformData = new Float32Array(32);
      gridUniformData.set(view.data, 0);
      gridUniformData.set(projection.data, 16);
      this.device.queue.writeBuffer(this.gridUniformBuffer!, 0, gridUniformData);

      pass.setPipeline(this.gridPipeline);
      pass.setBindGroup(0, this.device.createBindGroup({
        layout: this.gridPipeline.getBindGroupLayout(0),
        entries: [{ binding: 0, resource: { buffer: this.gridUniformBuffer! } }],
      }));
      pass.setVertexBuffer(0, this.gridVertexBuffer);
      pass.draw(this.gridVertexCount);
    }

    pass.setPipeline(this.pipeline);

    for (const node of scene.getAllNodes()) {
      if (!node.visible) continue;
      const mesh = this.getMeshForType(node.type, node.meshAssetId);
      if (!mesh) continue;

      const model = Mat4.fromTRS(node.position, node.rotation, node.scale);
      const modelData = new Float32Array(16 * 4 + 8);
      modelData.set(model.data, 0);
      modelData.set(view.data, 16);
      modelData.set(projection.data, 32);
      modelData.set(model.invert().data, 48);
      modelData.set([this.cameraPos.x, this.cameraPos.y, this.cameraPos.z, 0], 64);
      modelData.set([this.ambient.x, this.ambient.y, this.ambient.z, 0], 68);
      this.device.queue.writeBuffer(this.uniformBuffer!, 0, modelData);

      const mat = this.getMaterial(node.id);
      const matData = new Float32Array(14);
      matData.set([mat.baseColor.r, mat.baseColor.g, mat.baseColor.b, mat.baseColor.a], 0);
      matData.set([mat.emissive.r, mat.emissive.g, mat.emissive.b, mat.emissiveIntensity], 4);
      matData[8] = mat.metallic;
      matData[9] = mat.roughness;
      matData[10] = mat.emissiveIntensity;
      matData[11] = 0;
      matData.set([mat.textureTiling[0], mat.textureTiling[1]], 12);
      this.device.queue.writeBuffer(this.materialBuffer!, 0, matData);

      const bindGroup = this.device.createBindGroup({
        layout: this.bindGroupLayout!,
        entries: [
          { binding: 0, resource: { buffer: this.uniformBuffer! } },
          { binding: 1, resource: { buffer: this.lightBuffer! } },
          { binding: 2, resource: { buffer: this.materialBuffer! } },
          { binding: 3, resource: this.sampler! },
          { binding: 4, resource: this.dummyTextureView! },
        ],
      });
      pass.setBindGroup(0, bindGroup);
      pass.setIndexBuffer(mesh.indexBuffer, mesh.indexFormat);
      pass.setVertexBuffer(0, mesh.vertexBuffer);
      pass.drawIndexed(mesh.indexCount);
    }

    pass.end();
    this.device.queue.submit([encoder.finish()]);
  }

  loadTextureFromImage(_textureId: string, _image: HTMLImageElement): void {
  }

  createCheckerTexture(_textureId: string): void {
  }

  dispose(): void {
    for (const mesh of this.meshCache.values()) {
      mesh.vertexBuffer.destroy();
      mesh.indexBuffer.destroy();
    }
    this.meshCache.clear();
    if (this.depthTexture) this.depthTexture.destroy();
    if (this.dummyTexture) this.dummyTexture.destroy();
    this.device.destroy();
  }
}
