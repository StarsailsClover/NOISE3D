import { SceneNode, type PrimitiveType } from './SceneNode';
import type { Light } from './Light';

export type { PrimitiveType };

export class Scene {
  root: SceneNode;
  nodes: Map<number, SceneNode>;
  lights: Light[] = [];
  ambientColor: [number, number, number] = [0.2, 0.2, 0.2];

  constructor() {
    this.root = new SceneNode('Scene', 'empty');
    this.root.id = 0;
    this.nodes = new Map();
    this.nodes.set(0, this.root);
  }

  addNode(node: SceneNode, parentId: number | null = null): void {
    const parent = parentId !== null ? this.nodes.get(parentId) : this.root;
    if (!parent) {
      throw new Error(`Parent node ${parentId} not found`);
    }
    node.parentId = parent.id;
    parent.childIds.push(node.id);
    this.nodes.set(node.id, node);
  }

  removeNode(id: number): void {
    const node = this.nodes.get(id);
    if (!node || id === 0) return;
    if (node.parentId !== null) {
      const parent = this.nodes.get(node.parentId);
      if (parent) {
        parent.childIds = parent.childIds.filter((cid) => cid !== id);
      }
    }
    this.removeChildNodes(node);
    this.nodes.delete(id);
  }

  private removeChildNodes(node: SceneNode): void {
    for (const childId of [...node.childIds]) {
      const child = this.nodes.get(childId);
      if (child) {
        this.removeChildNodes(child);
        this.nodes.delete(childId);
      }
    }
    node.childIds = [];
  }

  getNode(id: number): SceneNode | undefined {
    return this.nodes.get(id);
  }

  getAllNodes(): SceneNode[] {
    return Array.from(this.nodes.values()).filter((n) => n.id !== 0);
  }

  createPrimitive(
    type: PrimitiveType,
    name?: string,
    parentId?: number | null,
  ): SceneNode {
    const node = new SceneNode(name ?? type.charAt(0).toUpperCase() + type.slice(1), type);
    this.addNode(node, parentId ?? null);
    return node;
  }

  getChildren(id: number): SceneNode[] {
    const node = this.nodes.get(id);
    if (!node) return [];
    return node.childIds
      .map((cid) => this.nodes.get(cid))
      .filter((n): n is SceneNode => n !== undefined);
  }

  moveNode(id: number, newParentId: number): void {
    const node = this.nodes.get(id);
    if (!node || id === 0) return;
    if (this.isAncestor(id, newParentId)) return;

    if (node.parentId !== null) {
      const oldParent = this.nodes.get(node.parentId);
      if (oldParent) {
        oldParent.childIds = oldParent.childIds.filter((cid) => cid !== id);
      }
    }
    const newParent = this.nodes.get(newParentId);
    if (newParent) {
      newParent.childIds.push(id);
      node.parentId = newParentId;
    }
  }

  private isAncestor(ancestorId: number, descendantId: number): boolean {
    let node = this.nodes.get(descendantId);
    while (node && node.parentId !== null) {
      if (node.parentId === ancestorId) return true;
      node = this.nodes.get(node.parentId);
    }
    return false;
  }

  clone(): Scene {
    const scene = new Scene();
    this.cloneChildren(this.root, scene, null);
    return scene;
  }

  private cloneChildren(
    node: SceneNode,
    targetScene: Scene,
    targetParentId: number | null,
  ): void {
    for (const childId of node.childIds) {
      const child = this.nodes.get(childId);
      if (!child) continue;
      const clone = child.clone();
      targetScene.addNode(clone, targetParentId);
      this.cloneChildren(child, targetScene, clone.id);
    }
  }

  serialize(): object {
    return {
      rootId: this.root.id,
      nodes: this.getAllNodes().map((n) => n.serialize()),
    };
  }
}
