import { Vec3 } from '@math/Vec';

let nextId = 1;

export type PrimitiveType =
  | 'cube'
  | 'sphere'
  | 'plane'
  | 'cylinder'
  | 'cone'
  | 'empty';

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
  }

  clone(): SceneNode {
    const node = new SceneNode(this.name, this.type, this.position.clone(), this.rotation.clone(), this.scale.clone());
    node.visible = this.visible;
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
