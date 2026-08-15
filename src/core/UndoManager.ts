import type { Scene } from '@scene/Scene';
import type { Material } from '@renderer/Material';
import { SceneSerializer } from './SceneSerializer';

export interface UndoState {
  sceneJson: string;
  materialsJson: string;
  selectedNodeId: number | null;
  sceneName: string;
}

export class UndoManager {
  private undoStack: UndoState[] = [];
  private redoStack: UndoState[] = [];
  private maxStack: number = 50;

  snapshot(scene: Scene, materials: Map<number, Material>, selectedNodeId: number | null, sceneName: string): void {
    const state: UndoState = {
      sceneJson: SceneSerializer.serialize(scene, materials, sceneName),
      materialsJson: '',
      selectedNodeId,
      sceneName,
    };
    state.materialsJson = state.sceneJson;
    this.undoStack.push(state);
    if (this.undoStack.length > this.maxStack) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  undo(currentScene: Scene, currentMaterials: Map<number, Material>, selectedNodeId: number | null, sceneName: string): UndoState | null {
    if (!this.canUndo()) return null;
    const currentState: UndoState = {
      sceneJson: SceneSerializer.serialize(currentScene, currentMaterials, sceneName),
      materialsJson: '',
      selectedNodeId,
      sceneName,
    };
    currentState.materialsJson = currentState.sceneJson;
    this.redoStack.push(currentState);

    const state = this.undoStack.pop()!;
    return state;
  }

  redo(currentScene: Scene, currentMaterials: Map<number, Material>, selectedNodeId: number | null, sceneName: string): UndoState | null {
    if (!this.canRedo()) return null;
    const currentState: UndoState = {
      sceneJson: SceneSerializer.serialize(currentScene, currentMaterials, sceneName),
      materialsJson: '',
      selectedNodeId,
      sceneName,
    };
    currentState.materialsJson = currentState.sceneJson;
    this.undoStack.push(currentState);

    const state = this.redoStack.pop()!;
    return state;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  getUndoCount(): number {
    return this.undoStack.length;
  }

  getRedoCount(): number {
    return this.redoStack.length;
  }
}
