import { create } from 'zustand';
import { Scene, PrimitiveType } from '@scene/Scene';
import { Vec3 } from '@math/Vec';
import type { Material } from '@renderer/Material';
import { createDefaultMaterial } from '@renderer/Material';

export type GizmoMode = 'translate' | 'rotate' | 'scale';

export interface EditorState {
  scene: Scene;
  selectedNodeId: number | null;
  showGrid: boolean;
  cameraPos: Vec3;
  cameraTarget: Vec3;
  materials: Map<number, Material>;
  panelSizes: Record<string, number>;
  isPlaying: boolean;
  consoleMessages: { level: 'info' | 'warn' | 'error'; text: string; time: number }[];
  gizmoMode: GizmoMode;
  frameSelectedTrigger: number;

  addPrimitive: (type: PrimitiveType, parentId?: number | null) => void;
  selectNode: (id: number | null) => void;
  removeNode: (id: number) => void;
  updateNodeTransform: (id: number, position?: Vec3, rotation?: Vec3, scale?: Vec3) => void;
  renameNode: (id: number, name: string) => void;
  setMaterial: (id: number, material: Partial<Material>) => void;
  toggleGrid: () => void;
  setCameraPos: (pos: Vec3) => void;
  setCameraTarget: (target: Vec3) => void;
  togglePlay: () => void;
  log: (level: 'info' | 'warn' | 'error', text: string) => void;
  clearConsole: () => void;
  setGizmoMode: (mode: GizmoMode) => void;
  frameSelected: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  scene: new Scene(),
  selectedNodeId: null,
  showGrid: true,
  cameraPos: new Vec3(5, 5, 5),
  cameraTarget: new Vec3(0, 0, 0),
  materials: new Map(),
  panelSizes: { hierarchy: 250, inspector: 300, console: 200 },
  isPlaying: false,
  consoleMessages: [],
  gizmoMode: 'translate' as GizmoMode,
  frameSelectedTrigger: 0,

  addPrimitive: (type, parentId) => {
    const state = get();
    const node = state.scene.createPrimitive(type, undefined, parentId ?? null);
    state.materials.set(node.id, createDefaultMaterial());
    set({ selectedNodeId: node.id });
    get().log('info', `Created ${type}: ${node.name}`);
  },

  selectNode: (id) => {
    set({ selectedNodeId: id });
  },

  removeNode: (id) => {
    const state = get();
    state.scene.removeNode(id);
    state.materials.delete(id);
    if (state.selectedNodeId === id) {
      set({ selectedNodeId: null });
    }
    set({});
    get().log('info', `Removed node ${id}`);
  },

  updateNodeTransform: (id, position, rotation, scale) => {
    const node = get().scene.getNode(id);
    if (!node) return;
    if (position) node.position.copy(position);
    if (rotation) node.rotation.copy(rotation);
    if (scale) node.scale.copy(scale);
    set({});
  },

  renameNode: (id, name) => {
    const node = get().scene.getNode(id);
    if (!node) return;
    node.name = name;
    set({});
  },

  setMaterial: (id: number, material: Partial<Material>) => {
    const state = get();
    const existing = state.materials.get(id) ?? createDefaultMaterial();
    const newMaterial = { ...existing, ...material } as Material;
    const newMap = new Map(state.materials);
    newMap.set(id, newMaterial);
    set({ materials: newMap });
  },

  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),

  setCameraPos: (pos) => set({ cameraPos: pos }),
  setCameraTarget: (target) => set({ cameraTarget: target }),

  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

  log: (level, text) =>
    set((s) => ({
      consoleMessages: [...s.consoleMessages, { level, text, time: Date.now() }].slice(-200),
    })),

  clearConsole: () => set({ consoleMessages: [] }),

  setGizmoMode: (mode) => set({ gizmoMode: mode }),

  frameSelected: () =>
    set((s) => ({ frameSelectedTrigger: s.frameSelectedTrigger + 1 })),
}));
