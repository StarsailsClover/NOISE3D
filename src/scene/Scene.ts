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
    this.reparentAt(id, newParentId, Number.MAX_SAFE_INTEGER);
  }

  /** Public validity check for drag-drop affordances. */
  canReparent(id: number, newParentId: number): boolean {
    if (id === 0 || id === newParentId) return false;
    const node = this.nodes.get(id);
    if (!node) return false;
    // cannot drop into itself or its own descendant
    let p = this.nodes.get(newParentId);
    while (p) {
      if (p.id === id) return false;
      p = p.parentId !== null ? this.nodes.get(p.parentId) : undefined;
    }
    return true;
  }

  /**
   * Move `id` under `parentId`, inserting at `index` within the parent's
   * child list. Returns true if a change was made.
   */
  reparentAt(id: number, parentId: number, index: number): boolean {
    const node = this.nodes.get(id);
    const parent = this.nodes.get(parentId);
    if (!node || !parent || id === 0) return false;
    if (!this.canReparent(id, parentId)) return false;

    // Detach from current parent
    if (node.parentId !== null) {
      const old = this.nodes.get(node.parentId);
      if (old) old.childIds = old.childIds.filter((c) => c !== id);
    }
    node.parentId = parentId;

    // Clamp index; when moving within the same parent the pre-removal index
    // shifts, so just clamp against final length.
    const idx = Math.max(0, Math.min(index, parent.childIds.length));
    parent.childIds.splice(idx, 0, id);
    return true;
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

