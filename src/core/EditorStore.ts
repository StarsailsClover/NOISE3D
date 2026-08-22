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
import { createComponent, type ComponentData, type ComponentType } from '@scene/Component';
import { PrefabManager, createPrefabId, type PrefabData } from '@scene/Prefab';
import { PhysicsWorld, type RaycastHit } from '@scene/Physics';
import { createTerrain, generateProceduralHeights, flattenTerrain as flattenTerrainOp, type TerrainData } from '@scene/Terrain';
import { createDefaultEnvironment, type EnvironmentSettings } from '@scene/Environment';
import { Color } from '@math/Vec';

const undoManager = new UndoManager();
const assetManager = new AssetManager();
const prefabManager = new PrefabManager();
const physicsWorld = new PhysicsWorld();

export type GizmoMode = 'translate' | 'rotate' | 'scale';
export type SceneViewMode = 'material' | 'wireframe' | 'solid' | 'rendered';

export interface EditorState {
  scene: Scene;
  selectedNodeId: number | null;
  selectedNodeIds: number[];
  selectedLightId: number | null;
  showGrid: boolean;
  sceneViewMode: SceneViewMode;
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
  selectNodeMulti: (id: number, additive: boolean) => void;
  selectAllNodes: () => void;
  deselectAll: () => void;
  removeNode: (id: number) => void;
  removeSelectedNodes: () => void;
  duplicateSelectedNodes: () => void;
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
  setSceneViewMode: (mode: SceneViewMode) => void;
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
  components: ComponentData[];
  prefabs: PrefabData[];
  addComponent: (nodeId: number, type: ComponentType) => void;
  removeComponent: (nodeId: number, componentId: string) => void;
  updateComponent: (nodeId: number, componentId: string, properties: Record<string, any>) => void;
  createPrefabFromNode: (nodeId: number) => void;
  instantiatePrefab: (prefabId: string) => void;
  physicsEnabled: boolean;
  togglePhysics: () => void;
  physicsDebug: boolean;
  togglePhysicsDebug: () => void;
  stepPhysics: (dt: number) => void;
  raycast: (origin: Vec3, direction: Vec3, maxDist?: number) => RaycastHit | null;
  terrain: TerrainData | null;
  environment: EnvironmentSettings;
  addTerrain: () => void;
  removeTerrain: () => void;
  generateProceduralTerrain: (seed: number) => void;
  flattenTerrain: (x: number, z: number, strength: number) => void;
  updateEnvironment: (partial: Partial<EnvironmentSettings>) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  scene: (() => {
    const s = new Scene();
    s.lights.push(createDirectionalLight('Sun'));
    return s;
  })(),
  selectedNodeId: null,
  selectedNodeIds: [],
  selectedLightId: null,
  showGrid: true,
  sceneViewMode: 'material' as SceneViewMode,
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
  terrain: null,
  environment: createDefaultEnvironment(),
  particleEmitters: [],
  animationClips: [],
  selectedClipId: null,
  currentTime: 0,
  isPlayingAnim: false,
  cameraState: null,
  setCameraState: (state) => set({ cameraState: state }),
  components: [],
  prefabs: [],

  addComponent: (nodeId, type) => {
    const state = get();
    const node = state.scene.getNode(nodeId);
    if (!node) return;
    const comp = createComponent(type);
    node.addComponent(comp);
    const allComponents: ComponentData[] = [];
    for (const n of state.scene.getAllNodes()) {
      allComponents.push(...n.components);
    }
    set({ components: allComponents });
    get().log('info', `Added ${type} component to ${node.name}`);
  },

  removeComponent: (nodeId, componentId) => {
    const state = get();
    const node = state.scene.getNode(nodeId);
    if (!node) return;
    node.removeComponent(componentId);
    const allComponents: ComponentData[] = [];
    for (const n of state.scene.getAllNodes()) {
      allComponents.push(...n.components);
    }
    set({ components: allComponents });
    get().log('info', `Removed component from ${node.name}`);
  },

  updateComponent: (nodeId, componentId, properties) => {
    const state = get();
    const node = state.scene.getNode(nodeId);
    if (!node) return;
    const comp = node.components.find((c) => c.id === componentId);
    if (!comp) return;
    comp.properties = { ...comp.properties, ...properties };
    const allComponents: ComponentData[] = [];
    for (const n of state.scene.getAllNodes()) {
      allComponents.push(...n.components);
    }
    set({ components: allComponents });
  },

  createPrefabFromNode: (nodeId) => {
    const state = get();
    const node = state.scene.getNode(nodeId);
    if (!node) return;
    const mat = state.materials.get(nodeId);
    const prefab: PrefabData = {
      id: createPrefabId(),
      name: `${node.name} Prefab`,
      nodeData: {
        name: node.name,
        type: node.type,
        position: node.position.toArray(),
        rotation: node.rotation.toArray(),
        scale: node.scale.toArray(),
        meshAssetId: node.meshAssetId,
        textureAssetId: node.textureAssetId,
        childPrefabs: [],
      },
      components: node.components.map((c) => ({ ...c, properties: { ...c.properties } })),
      material: mat ? {
        baseColor: mat.baseColor.toArray(),
        metallic: mat.metallic,
        roughness: mat.roughness,
        emissive: mat.emissive.toArray(),
        emissiveIntensity: mat.emissiveIntensity,
        wireframe: mat.wireframe,
        doubleSided: mat.doubleSided,
      } : {
        baseColor: [1, 1, 1, 1],
        metallic: 0,
        roughness: 0.5,
        emissive: [0, 0, 0, 0],
        emissiveIntensity: 0,
        wireframe: false,
        doubleSided: false,
      },
      createdAt: Date.now(),
    };
    prefabManager.savePrefab(prefab);
    set({ prefabs: prefabManager.getAllPrefabs() });
    get().log('info', `Created prefab: ${prefab.name}`);
  },

  instantiatePrefab: (prefabId) => {
    const state = get();
    const prefab = prefabManager.getPrefab(prefabId);
    if (!prefab) return;
    state.takeSnapshot();
    const node = state.scene.createPrimitive(prefab.nodeData.type as any, prefab.nodeData.name);
    node.position = new Vec3(...prefab.nodeData.position);
    node.rotation = new Vec3(...prefab.nodeData.rotation);
    node.scale = new Vec3(...prefab.nodeData.scale);
    node.meshAssetId = prefab.nodeData.meshAssetId;
    node.textureAssetId = prefab.nodeData.textureAssetId;
    node.components = prefab.components.map((c) => ({ ...c, properties: { ...c.properties } }));
    const mat = createDefaultMaterial();
    mat.baseColor = new Color(...prefab.material.baseColor);
    mat.metallic = prefab.material.metallic;
    mat.roughness = prefab.material.roughness;
    mat.emissive = new Color(...prefab.material.emissive);
    mat.emissiveIntensity = prefab.material.emissiveIntensity;
    mat.wireframe = prefab.material.wireframe;
    mat.doubleSided = prefab.material.doubleSided;
    state.materials.set(node.id, mat);
    const allComponents: ComponentData[] = [];
    for (const n of state.scene.getAllNodes()) {
      allComponents.push(...n.components);
    }
    set({ selectedNodeId: node.id, selectedNodeIds: [node.id], components: allComponents, undoRevision: get().undoRevision + 1 });
    get().log('info', `Instantiated prefab: ${prefab.name}`);
  },

  physicsEnabled: false,
  physicsDebug: false,

  togglePhysics: () => {
    const state = get();
    const enabled = !state.physicsEnabled;
    if (enabled) {
      physicsWorld.syncFromScene(state.scene.getAllNodes());
      useEditorStore.getState().log('info', 'Physics simulation started');
    } else {
      useEditorStore.getState().log('info', 'Physics simulation stopped');
    }
    set({ physicsEnabled: enabled });
  },

  togglePhysicsDebug: () => {
    const state = get();
    physicsWorld.setDebug(!state.physicsDebug);
    set({ physicsDebug: !state.physicsDebug });
  },

  stepPhysics: (dt) => {
    const state = get();
    if (!state.physicsEnabled) return;
    physicsWorld.syncFromScene(state.scene.getAllNodes());
    physicsWorld.step(dt);

    // Apply physics positions back to scene nodes
    for (const body of physicsWorld.getBodies()) {
      const node = state.scene.getNode(body.nodeId);
      if (node) {
        node.position = body.position.clone();
      }
    }

    // Log collision events
    for (const evt of physicsWorld.getEvents()) {
      if (evt.type === 'enter') {
        get().log('info', `Collision: node ${evt.bodyA} <-> node ${evt.bodyB}`);
      }
    }

    set({ scene: state.scene });
  },

  raycast: (origin, direction, maxDist) => {
    return physicsWorld.raycast(origin, direction, maxDist);
  },

  addTerrain: () => {
    const terrain = createTerrain();
    generateProceduralHeights(terrain);
    set({ terrain });
    get().log('info', `Created ${terrain.name}`);
  },

  removeTerrain: () => {
    set({ terrain: null });
    get().log('info', 'Removed terrain');
  },

  generateProceduralTerrain: (seed) => {
    const state = get();
    if (!state.terrain) return;
    const terrain = { ...state.terrain, heights: new Float32Array(state.terrain.heights) };
    generateProceduralHeights(terrain, seed);
    set({ terrain });
    get().log('info', `Terrain generated with seed ${seed}`);
  },

  flattenTerrain: (x, z, strength) => {
    const state = get();
    if (!state.terrain) return;
    const terrain = { ...state.terrain, heights: new Float32Array(state.terrain.heights) };
    flattenTerrainOp(terrain, x, z, 5, 0, strength);
    set({ terrain });
  },

  updateEnvironment: (partial) => {
    const state = get();
    set({ environment: { ...state.environment, ...partial } });
  },

  addPrimitive: (type, parentId) => {
    const state = get();
    state.takeSnapshot();
    const node = state.scene.createPrimitive(type, undefined, parentId ?? null);
    state.materials.set(node.id, createDefaultMaterial());
    set({ selectedNodeId: node.id, undoRevision: get().undoRevision + 1 });
    get().log('info', `Created ${type}: ${node.name}`);
  },

  selectNode: (id) => {
    set({ selectedNodeId: id, selectedNodeIds: id !== null ? [id] : [] });
  },

  selectNodeMulti: (id, additive) => {
    const state = get();
    if (additive) {
      const ids = state.selectedNodeIds.includes(id)
        ? state.selectedNodeIds.filter((x) => x !== id)
        : [...state.selectedNodeIds, id];
      set({
        selectedNodeIds: ids,
        selectedNodeId: ids.length > 0 ? ids[ids.length - 1] : null,
      });
    } else {
      set({ selectedNodeIds: [id], selectedNodeId: id });
    }
  },

  selectAllNodes: () => {
    const state = get();
    const allIds = state.scene.getAllNodes()
      .filter((n) => n.id !== 0 && n.visible && n.type !== 'empty')
      .map((n) => n.id);
    set({ selectedNodeIds: allIds, selectedNodeId: allIds.length > 0 ? allIds[0] : null });
  },

  deselectAll: () => {
    set({ selectedNodeIds: [], selectedNodeId: null });
  },

  removeNode: (id) => {
    const state = get();
    state.takeSnapshot();
    state.scene.removeNode(id);
    state.materials.delete(id);
    const newSelectedIds = state.selectedNodeIds.filter((x) => x !== id);
    if (state.selectedNodeId === id) {
      set({ selectedNodeId: null, selectedNodeIds: newSelectedIds, undoRevision: get().undoRevision + 1 });
    } else {
      set({ selectedNodeIds: newSelectedIds, undoRevision: get().undoRevision + 1 });
    }
    get().log('info', `Removed node ${id}`);
  },

  removeSelectedNodes: () => {
    const state = get();
    if (state.selectedNodeIds.length === 0) return;
    state.takeSnapshot();
    for (const id of state.selectedNodeIds) {
      state.scene.removeNode(id);
      state.materials.delete(id);
    }
    set({ selectedNodeId: null, selectedNodeIds: [], undoRevision: get().undoRevision + 1 });
    get().log('info', `Removed ${state.selectedNodeIds.length} nodes`);
  },

  duplicateSelectedNodes: () => {
    const state = get();
    if (state.selectedNodeIds.length === 0) return;
    state.takeSnapshot();
    const newIds: number[] = [];
    for (const id of state.selectedNodeIds) {
      const node = state.scene.getNode(id);
      if (!node) continue;
      const clone = node.clone();
      clone.name = `${node.name} Copy`;
      state.scene.addNode(clone, node.parentId);
      const mat = state.materials.get(id);
      if (mat) {
        state.materials.set(clone.id, { ...mat, baseColor: mat.baseColor.clone(), emissive: mat.emissive.clone() });
      }
      newIds.push(clone.id);
    }
    set({ selectedNodeIds: newIds, selectedNodeId: newIds[0] ?? null, undoRevision: get().undoRevision + 1 });
    get().log('info', `Duplicated ${newIds.length} nodes`);
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

  setSceneViewMode: (mode) => set({ sceneViewMode: mode }),

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
    if (state.isPlayingAnim || state.physicsEnabled) {
      if (state.isPlayingAnim && state.selectedClipId !== null) {
        const clip = state.animationClips.find((c) => c.id === state.selectedClipId);
        if (clip) {
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
        }
      }

      // Step physics
      if (state.physicsEnabled) {
        physicsWorld.syncFromScene(state.scene.getAllNodes());
        physicsWorld.step(dt);
        for (const body of physicsWorld.getBodies()) {
          const node = state.scene.getNode(body.nodeId);
          if (node) {
            node.position = body.position.clone();
          }
        }
        for (const evt of physicsWorld.getEvents()) {
          if (evt.type === 'enter') {
            get().log('info', `Collision: node ${evt.bodyA} <-> node ${evt.bodyB}`);
          }
        }
      }
    }

    for (const emitter of state.particleEmitters) {
      updateParticleEmitter(emitter, dt);
    }

    set({ scene: state.scene, particleEmitters: [...state.particleEmitters] });
  },
}));
