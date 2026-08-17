import { create } from 'zustand';
import { Scene, PrimitiveType } from '@scene/Scene';
import { Vec3 } from '@math/Vec';
import type { Light, LightType } from '@scene/Light';
import { createDirectionalLight, createPointLight, createSpotLight } from '@scene/Light';
import type { ParticleEmitter } from '@scene/ParticleSystem';
import { createParticleEmitter, updateParticleEmitter } from '@scene/ParticleSystem';
import type { AnimationClip } from '@scene/Animation';
import { createAnimationClip, addKeyframe, sampleAnimation } from '@scene/Animation';
import type { Material } from '@renderer/Material';
import { createDefaultMaterial } from '@renderer/Material';
import { SceneSerializer } from './SceneSerializer';
import { UndoManager } from './UndoManager';
import { AssetManager, type Asset } from './AssetManager';
import { OBJParser } from '@renderer/OBJParser';
import { SceneExporter } from '@renderer/SceneExporter';

const undoManager = new UndoManager();
const assetManager = new AssetManager();

export type GizmoMode = 'translate' | 'rotate' | 'scale';

export interface EditorState {
  scene: Scene;
  selectedNodeId: number | null;
  selectedLightId: number | null;
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
  addLight: (type: LightType) => void;
  removeLight: (id: number) => void;
  selectLight: (id: number | null) => void;
  updateLight: (id: number, partial: Partial<Light>) => void;
  saveScene: (name: string) => void;
  loadScene: (name: string) => void;
  downloadScene: (name: string) => void;
  loadSceneFromFile: (file: File) => void;
  newScene: () => void;
  sceneName: string;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  duplicateNode: (id: number) => void;
  moveNode: (id: number, newParentId: number) => void;
  takeSnapshot: () => void;
  undoRevision: number;
  assets: Asset[];
  importOBJ: (file: File) => void;
  importTexture: (file: File) => void;
  addCustomMeshNode: (meshAssetId: string, name: string) => void;
  exportOBJ: () => void;
  exportJSON: () => void;
  exportPNG: () => void;
  postExposure: number;
  postBloomThreshold: number;
  postBloomIntensity: number;
  setPostSetting: (key: string, value: number) => void;
  renderCanvas: HTMLCanvasElement | null;
  setRenderCanvas: (canvas: HTMLCanvasElement | null) => void;
  editorMode: '3D' | '2D';
  toggleEditorMode: () => void;
  particleEmitters: ParticleEmitter[];
  addParticleEmitter: () => void;
  removeParticleEmitter: (id: number) => void;
  updateParticleEmitter: (id: number, partial: Partial<ParticleEmitter>) => void;
  animationClips: AnimationClip[];
  selectedClipId: number | null;
  currentTime: number;
  isPlayingAnim: boolean;
  addAnimationClip: () => void;
  addKeyframeAtCurrent: (nodeId: number, property: 'position' | 'rotation' | 'scale') => void;
  setSelectedClip: (id: number | null) => void;
  setCurrentTime: (time: number) => void;
  toggleAnimPlay: () => void;
  tickAnimation: (dt: number) => void;
  cameraState: object | null;
  setCameraState: (state: object | null) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  scene: (() => {
    const s = new Scene();
    s.lights.push(createDirectionalLight('Sun'));
    return s;
  })(),
  selectedNodeId: null,
  selectedLightId: null,
  showGrid: true,
  cameraPos: new Vec3(5, 5, 5),
  cameraTarget: new Vec3(0, 0, 0),
  materials: new Map(),
  panelSizes: { hierarchy: 250, inspector: 300, console: 200 },
  isPlaying: false,
  consoleMessages: [],
  gizmoMode: 'translate' as GizmoMode,
  frameSelectedTrigger: 0,
  sceneName: 'Untitled',
  undoRevision: 0,
  assets: [],
  postExposure: 1.0,
  postBloomThreshold: 1.0,
  postBloomIntensity: 0.3,
  renderCanvas: null,
  editorMode: '3D' as '3D' | '2D',
  particleEmitters: [],
  animationClips: [],
  selectedClipId: null,
  currentTime: 0,
  isPlayingAnim: false,
  cameraState: null,
  setCameraState: (state) => set({ cameraState: state }),

  addPrimitive: (type, parentId) => {
    const state = get();
    state.takeSnapshot();
    const node = state.scene.createPrimitive(type, undefined, parentId ?? null);
    state.materials.set(node.id, createDefaultMaterial());
    set({ selectedNodeId: node.id, undoRevision: get().undoRevision + 1 });
    get().log('info', `Created ${type}: ${node.name}`);
  },

  selectNode: (id) => {
    set({ selectedNodeId: id });
  },

  removeNode: (id) => {
    const state = get();
    state.takeSnapshot();
    state.scene.removeNode(id);
    state.materials.delete(id);
    if (state.selectedNodeId === id) {
      set({ selectedNodeId: null, undoRevision: get().undoRevision + 1 });
    } else {
      set({ undoRevision: get().undoRevision + 1 });
    }
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

  addLight: (type) => {
    const state = get();
    let light: Light;
    if (type === 'directional') light = createDirectionalLight();
    else if (type === 'point') light = createPointLight();
    else light = createSpotLight();
    state.scene.lights = [...state.scene.lights, light];
    set({ scene: state.scene, selectedLightId: light.id });
    get().log('info', `Created ${type} light: ${light.name}`);
  },

  removeLight: (id) => {
    const state = get();
    state.scene.lights = state.scene.lights.filter((l) => l.id !== id);
    if (state.selectedLightId === id) {
      set({ selectedLightId: null, scene: state.scene });
    } else {
      set({ scene: state.scene });
    }
    get().log('info', `Removed light ${id}`);
  },

  selectLight: (id) => {
    set({ selectedLightId: id, selectedNodeId: null });
  },

  updateLight: (id, partial) => {
    const state = get();
    state.scene.lights = state.scene.lights.map((l) =>
      l.id === id ? { ...l, ...partial } : l
    );
    set({ scene: state.scene });
  },

  saveScene: (name) => {
    const state = get();
    SceneSerializer.saveToLocal(state.scene, state.materials, name, state.cameraState ?? undefined);
    set({ sceneName: name });
    get().log('info', `Scene saved: ${name}`);
  },

  loadScene: (name) => {
    const result = SceneSerializer.loadFromLocal(name);
    if (!result) {
      get().log('error', `Scene not found: ${name}`);
      return;
    }
    set({
      scene: result.scene,
      materials: result.materials,
      selectedNodeId: null,
      selectedLightId: null,
      sceneName: result.name,
      cameraState: result.camera ?? null,
    });
    get().log('info', `Scene loaded: ${name}`);
  },

  downloadScene: (name) => {
    const state = get();
    SceneSerializer.download(state.scene, state.materials, name, state.cameraState ?? undefined);
    get().log('info', `Scene downloaded: ${name}`);
  },

  loadSceneFromFile: async (file) => {
    try {
      const result = await SceneSerializer.loadFromFile(file);
      set({
        scene: result.scene,
        materials: result.materials,
        selectedNodeId: null,
        selectedLightId: null,
        sceneName: result.name,
        cameraState: result.camera ?? null,
      });
      get().log('info', `Scene loaded from file: ${file.name}`);
    } catch (e) {
      get().log('error', `Failed to load scene: ${e}`);
    }
  },

  newScene: () => {
    const newScene = new Scene();
    newScene.lights.push(createDirectionalLight('Sun'));
    set({
      scene: newScene,
      materials: new Map(),
      selectedNodeId: null,
      selectedLightId: null,
      sceneName: 'Untitled',
    });
    get().log('info', 'New scene created');
  },

  takeSnapshot: () => {
    const state = get();
    undoManager.snapshot(state.scene, state.materials, state.selectedNodeId, state.sceneName);
  },

  undo: () => {
    const state = get();
    const result = undoManager.undo(state.scene, state.materials, state.selectedNodeId, state.sceneName);
    if (result) {
      const restored = SceneSerializer.deserialize(result.sceneJson);
      set({
        scene: restored.scene,
        materials: restored.materials,
        selectedNodeId: result.selectedNodeId,
        sceneName: result.sceneName,
        undoRevision: get().undoRevision + 1,
      });
      get().log('info', 'Undo');
    }
  },

  redo: () => {
    const state = get();
    const result = undoManager.redo(state.scene, state.materials, state.selectedNodeId, state.sceneName);
    if (result) {
      const restored = SceneSerializer.deserialize(result.sceneJson);
      set({
        scene: restored.scene,
        materials: restored.materials,
        selectedNodeId: result.selectedNodeId,
        sceneName: result.sceneName,
        undoRevision: get().undoRevision + 1,
      });
      get().log('info', 'Redo');
    }
  },

  canUndo: () => undoManager.canUndo(),
  canRedo: () => undoManager.canRedo(),

  duplicateNode: (id) => {
    const state = get();
    const node = state.scene.getNode(id);
    if (!node) return;
    state.takeSnapshot();
    const clone = node.clone();
    clone.name = `${node.name} Copy`;
    state.scene.addNode(clone, node.parentId);
    const mat = state.materials.get(id);
    if (mat) {
      state.materials.set(clone.id, { ...mat, baseColor: mat.baseColor.clone(), emissive: mat.emissive.clone() });
    }
    set({ selectedNodeId: clone.id, scene: state.scene, undoRevision: get().undoRevision + 1 });
    get().log('info', `Duplicated node: ${node.name}`);
  },

  moveNode: (id, newParentId) => {
    const state = get();
    state.takeSnapshot();
    state.scene.moveNode(id, newParentId);
    set({ scene: state.scene, undoRevision: get().undoRevision + 1 });
    get().log('info', `Moved node ${id} to parent ${newParentId}`);
  },

  importOBJ: async (file) => {
    try {
      const text = await file.text();
      const mesh = OBJParser.parse(text);
      const id = `mesh_${Date.now()}`;
      assetManager.addMesh(id, file.name.replace(/\.obj$/i, ''), mesh);
      set({ assets: assetManager.getAssets() });
      get().log('info', `Imported OBJ: ${file.name}`);
    } catch (e) {
      get().log('error', `Failed to import OBJ: ${e}`);
    }
  },

  importTexture: (file) => {
    const id = `tex_${Date.now()}`;
    const url = URL.createObjectURL(file);
    assetManager.addTexture(id, file.name, url);
    set({ assets: assetManager.getAssets() });
    get().log('info', `Imported texture: ${file.name}`);
  },

  addCustomMeshNode: (meshAssetId, name) => {
    const state = get();
    state.takeSnapshot();
    const node = state.scene.createPrimitive('custom', name);
    node.meshAssetId = meshAssetId;
    state.materials.set(node.id, createDefaultMaterial());
    set({ selectedNodeId: node.id, undoRevision: get().undoRevision + 1 });
    get().log('info', `Added custom mesh: ${name}`);
  },

  exportOBJ: () => {
    const state = get();
    SceneExporter.downloadOBJ(state.scene, state.materials, state.sceneName);
    get().log('info', 'Exported OBJ');
  },

  exportJSON: () => {
    const state = get();
    SceneExporter.downloadJSON(state.scene, state.materials, state.sceneName);
    get().log('info', 'Exported JSON');
  },

  exportPNG: () => {
    const state = get();
    if (state.renderCanvas) {
      SceneExporter.downloadPNG(state.renderCanvas, state.sceneName);
      get().log('info', 'Exported PNG');
    }
  },

  setPostSetting: (key, value) => {
    set({ [key]: value } as any);
  },

  setRenderCanvas: (canvas) => set({ renderCanvas: canvas }),

  toggleEditorMode: () =>
    set((s) => ({ editorMode: s.editorMode === '3D' ? '2D' : '3D' })),

  addParticleEmitter: () => {
    const emitter = createParticleEmitter();
    set((s) => ({ particleEmitters: [...s.particleEmitters, emitter] }));
    get().log('info', `Created particle system: ${emitter.name}`);
  },

  removeParticleEmitter: (id) => {
    set((s) => ({ particleEmitters: s.particleEmitters.filter((e) => e.id !== id) }));
    get().log('info', `Removed particle system ${id}`);
  },

  updateParticleEmitter: (id, partial) => {
    set((s) => ({
      particleEmitters: s.particleEmitters.map((e) =>
        e.id === id ? { ...e, ...partial } : e,
      ),
    }));
  },

  addAnimationClip: () => {
    const clip = createAnimationClip();
    set((s) => ({ animationClips: [...s.animationClips, clip], selectedClipId: clip.id }));
    get().log('info', `Created animation clip: ${clip.name}`);
  },

  addKeyframeAtCurrent: (nodeId, property) => {
    const state = get();
    if (state.selectedClipId === null) return;
    const clip = state.animationClips.find((c) => c.id === state.selectedClipId);
    if (!clip) return;
    const node = state.scene.getNode(nodeId);
    if (!node) return;
    const value = property === 'position' ? node.position : property === 'rotation' ? node.rotation : node.scale;
    addKeyframe(clip, nodeId, property, state.currentTime, value.clone());
    set({ animationClips: [...state.animationClips] });
    get().log('info', `Keyframe added at ${state.currentTime.toFixed(2)}s`);
  },

  setSelectedClip: (id) => set({ selectedClipId: id }),

  setCurrentTime: (time) => set({ currentTime: time }),

  toggleAnimPlay: () => set((s) => ({ isPlayingAnim: !s.isPlayingAnim })),

  tickAnimation: (dt) => {
    const state = get();
    if (!state.isPlayingAnim || state.selectedClipId === null) return;
    const clip = state.animationClips.find((c) => c.id === state.selectedClipId);
    if (!clip) return;
    const newTime = state.currentTime + dt;
    const wrappedTime = clip.loop ? newTime % clip.duration : Math.min(newTime, clip.duration);
    set({ currentTime: wrappedTime });

    for (const track of clip.tracks) {
      const sampled = sampleAnimation(clip, wrappedTime, track.nodeId, track.propertyName);
      if (sampled) {
        const node = state.scene.getNode(track.nodeId);
        if (node) {
          if (track.propertyName === 'position') node.position.copy(sampled);
          else if (track.propertyName === 'rotation') node.rotation.copy(sampled);
          else node.scale.copy(sampled);
        }
      }
    }

    for (const emitter of state.particleEmitters) {
      updateParticleEmitter(emitter, dt);
    }

    set({ scene: state.scene, particleEmitters: [...state.particleEmitters] });
  },
}));
