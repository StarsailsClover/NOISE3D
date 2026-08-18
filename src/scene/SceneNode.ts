import { Vec3 } from '@math/Vec';
import type { ComponentData } from './Component';

let nextId = 1;
export type PrimitiveType =
  | 'cube'
  | 'sphere'
  | 'plane'
  | 'cylinder'
  | 'cone'
  | 'empty'
  | 'custom';

export class SceneNode {
  id: number;
  name: string;
  type: PrimitiveType;
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
  visible: boolean;
  parentId: number | null;
  childIds: number[];
  meshAssetId: string | null;
  textureAssetId: string | null;
  components: ComponentData[];

  constructor(
    name: string,
    type: PrimitiveType = 'empty',
    position?: Vec3,
    rotation?: Vec3,
    scale?: Vec3,
  ) {
    this.id = nextId++;
    this.name = name;
    this.type = type;
    this.position = position ?? Vec3.ZERO.clone();
    this.rotation = rotation ?? Vec3.ZERO.clone();
    this.scale = scale ?? Vec3.ONE.clone();
    this.visible = true;
    this.parentId = null;
    this.childIds = [];
    this.meshAssetId = null;
    this.textureAssetId = null;
    this.components = [];
  }

  addComponent(component: ComponentData): void {
    this.components.push(component);
  }

  removeComponent(componentId: string): void {
    this.components = this.components.filter((c) => c.id !== componentId);
  }

  getComponent(type: string): ComponentData | undefined {
    return this.components.find((c) => c.type === type);
  }

  clone(): SceneNode {
    const node = new SceneNode(this.name, this.type, this.position.clone(), this.rotation.clone(), this.scale.clone());
    node.visible = this.visible;
    node.meshAssetId = this.meshAssetId;
    node.textureAssetId = this.textureAssetId;
    node.components = this.components.map((c) => ({
      ...c,
      properties: { ...c.properties },
    }));
    return node;
  }

  serialize(): object {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      position: this.position.toArray(),
      rotation: this.rotation.toArray(),
      scale: this.scale.toArray(),
      visible: this.visible,
      parentId: this.parentId,
      childIds: [...this.childIds],
      meshAssetId: this.meshAssetId,
      textureAssetId: this.textureAssetId,
      components: this.components,
    };
  }
}

export function resetNodeIdCounter(): void {
  nextId = 1;
}

export function setNodeIdCounter(value: number): void {
  nextId = value;
}

export function getNextNodeId(): number {
  return nextId;
}
