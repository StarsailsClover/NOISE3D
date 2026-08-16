import { MeshData } from '@renderer/Geometry';

export interface Asset {
  id: string;
  name: string;
  type: 'mesh' | 'texture';
  data?: MeshData;
  url?: string;
  width?: number;
  height?: number;
}

export class AssetManager {
  private meshes: Map<string, MeshData> = new Map();
  private textures: Map<string, string> = new Map();
  private assets: Asset[] = [];

  addMesh(id: string, name: string, mesh: MeshData): void {
    this.meshes.set(id, mesh);
    this.assets.push({ id, name, type: 'mesh', data: mesh });
  }

  addTexture(id: string, name: string, url: string): void {
    this.textures.set(id, url);
    this.assets.push({ id, name, type: 'texture', url });
  }

  getMesh(id: string): MeshData | undefined {
    return this.meshes.get(id);
  }

  getTextureUrl(id: string): string | undefined {
    return this.textures.get(id);
  }

  getAssets(): Asset[] {
    return [...this.assets];
  }

  getMeshes(): Asset[] {
    return this.assets.filter((a) => a.type === 'mesh');
  }

  getTextures(): Asset[] {
    return this.assets.filter((a) => a.type === 'texture');
  }

  removeAsset(id: string): void {
    this.meshes.delete(id);
    this.textures.delete(id);
    this.assets = this.assets.filter((a) => a.id !== id);
  }

  clear(): void {
    this.meshes.clear();
    this.textures.clear();
    this.assets = [];
  }

  serialize(): object {
    return {
      meshes: this.getMeshes().map((a) => ({ id: a.id, name: a.name })),
      textures: this.getTextures().map((a) => ({ id: a.id, name: a.name, url: a.url })),
    };
  }
}
