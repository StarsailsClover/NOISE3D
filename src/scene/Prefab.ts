// Prefab system for NOISE3D - reusable node templates

import type { ComponentData } from './Component';

export interface PrefabData {
  id: string;
  name: string;
  nodeData: {
    name: string;
    type: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    meshAssetId: string | null;
    textureAssetId: string | null;
    childPrefabs: string[];
  };
  components: ComponentData[];
  material: {
    baseColor: [number, number, number, number];
    metallic: number;
    roughness: number;
    emissive: [number, number, number, number];
    emissiveIntensity: number;
    wireframe: boolean;
    doubleSided: boolean;
  };
  createdAt: number;
}

const prefabIdCounter = { next: 1 };

export function createPrefabId(): string {
  return `prefab_${Date.now()}_${prefabIdCounter.next++}`;
}

export class PrefabManager {
  private prefabs: Map<string, PrefabData> = new Map();

  savePrefab(prefab: PrefabData): void {
    this.prefabs.set(prefab.id, { ...prefab });
  }

  getPrefab(id: string): PrefabData | undefined {
    return this.prefabs.get(id);
  }

  getAllPrefabs(): PrefabData[] {
    return Array.from(this.prefabs.values());
  }

  removePrefab(id: string): void {
    this.prefabs.delete(id);
  }

  serialize(): string {
    return JSON.stringify(Array.from(this.prefabs.values()), null, 2);
  }

  deserialize(json: string): void {
    const data = JSON.parse(json) as PrefabData[];
    this.prefabs.clear();
    for (const p of data) {
      this.prefabs.set(p.id, p);
    }
  }

  clear(): void {
    this.prefabs.clear();
  }
}
