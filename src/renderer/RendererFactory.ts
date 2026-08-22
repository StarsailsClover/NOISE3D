import { Renderer } from './Renderer';
import { WebGPURenderer, isWebGPUAvailable } from './WebGPURenderer';

export type RendererBackend = 'webgl2' | 'webgpu';

export interface IRenderer {
  cameraPos: { x: number; y: number; z: number };
  cameraTarget: { x: number; y: number; z: number };
  fov: number;
  near: number;
  far: number;
  ambient: { x: number; y: number; z: number };
  clearColor: [number, number, number, number];
  showGrid: boolean;
  selectedNodeId: number | null;
  postExposure: number;
  postBloomThreshold: number;
  postBloomIntensity: number;
  projectionMatrix: any;
  setMaterial: (nodeId: number, material: any) => void;
  uploadCustomMesh: (id: string, mesh: any) => void;
  render: (scene: any, width: number, height: number) => void;
  dispose: () => void;
}

let detectedBackend: RendererBackend | null = null;

export function getPreferredBackend(): RendererBackend {
  if (detectedBackend) return detectedBackend;
  detectedBackend = isWebGPUAvailable() ? 'webgpu' : 'webgl2';
  return detectedBackend;
}

export async function createRendererAsync(canvas: HTMLCanvasElement, backend: RendererBackend): Promise<IRenderer> {
  if (backend === 'webgpu') {
    try {
      const r = new WebGPURenderer(canvas);
      await r.ready;
      return r as unknown as IRenderer;
    } catch {
      detectedBackend = 'webgl2';
      return new Renderer(canvas) as unknown as IRenderer;
    }
  }
  return new Renderer(canvas) as unknown as IRenderer;
}

export function createRendererSync(canvas: HTMLCanvasElement, backend: RendererBackend): IRenderer {
  if (backend === 'webgpu') {
    try {
      const r = new WebGPURenderer(canvas);
      return r as unknown as IRenderer;
    } catch {
      detectedBackend = 'webgl2';
      return new Renderer(canvas) as unknown as IRenderer;
    }
  }
  return new Renderer(canvas) as unknown as IRenderer;
}

export function createRenderer(canvas: HTMLCanvasElement, backend: RendererBackend): IRenderer {
  return createRendererSync(canvas, backend);
}
