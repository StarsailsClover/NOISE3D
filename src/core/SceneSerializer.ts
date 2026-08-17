import { Scene } from '@scene/Scene';
import { SceneNode, setNodeIdCounter, getNextNodeId } from '@scene/SceneNode';
import { Light } from '@scene/Light';
import { createDirectionalLight, createPointLight, createSpotLight, resetLightIdCounter } from '@scene/Light';
import { Material, createDefaultMaterial } from '@renderer/Material';
import { Vec3, Color } from '@math/Vec';

export interface SerializedScene {
  version: string;
  name: string;
  nodes: SerializedNode[];
  lights: SerializedLight[];
  ambient: [number, number, number];
  materials: SerializedMaterial[];
  nextNodeId: number;
  camera?: SerializedCamera;
}

interface SerializedCamera {
  target: [number, number, number];
  distance: number;
  azimuth: number;
  elevation: number;
  projectionMode: string;
  orthoZoom: number;
}

interface SerializedNode {
  id: number;
  name: string;
  type: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  visible: boolean;
  parentId: number | null;
  childIds: number[];
}

interface SerializedLight {
  id: number;
  name: string;
  type: string;
  position: [number, number, number];
  direction: [number, number, number];
  color: [number, number, number, number];
  intensity: number;
  range: number;
  innerConeAngle: number;
  outerConeAngle: number;
  enabled: boolean;
}

interface SerializedMaterial {
  nodeId: number;
  baseColor: [number, number, number, number];
  metallic: number;
  roughness: number;
  emissive: [number, number, number, number];
  emissiveIntensity: number;
  wireframe: boolean;
  doubleSided: boolean;
  textureId: string | null;
  textureTiling: [number, number];
  textureOffset: [number, number];
}

const SCENE_VERSION = '5.0.0';

export class SceneSerializer {
  static serialize(
    scene: Scene,
    materials: Map<number, Material>,
    name: string = 'Untitled',
    cameraState?: object,
  ): string {
    const nodes: SerializedNode[] = scene.getAllNodes().map((n) => ({
      id: n.id,
      name: n.name,
      type: n.type,
      position: n.position.toArray(),
      rotation: n.rotation.toArray(),
      scale: n.scale.toArray(),
      visible: n.visible,
      parentId: n.parentId,
      childIds: [...n.childIds],
    }));

    const lights: SerializedLight[] = scene.lights.map((l) => ({
      id: l.id,
      name: l.name,
      type: l.type,
      position: l.position.toArray(),
      direction: l.direction.toArray(),
      color: l.color.toArray(),
      intensity: l.intensity,
      range: l.range,
      innerConeAngle: l.innerConeAngle,
      outerConeAngle: l.outerConeAngle,
      enabled: l.enabled,
    }));

    const serializedMaterials: SerializedMaterial[] = [];
    for (const [nodeId, mat] of materials) {
      serializedMaterials.push({
        nodeId,
        baseColor: mat.baseColor.toArray(),
        metallic: mat.metallic,
        roughness: mat.roughness,
        emissive: mat.emissive.toArray(),
        emissiveIntensity: mat.emissiveIntensity,
        wireframe: mat.wireframe,
        doubleSided: mat.doubleSided,
        textureId: mat.textureId,
        textureTiling: [...mat.textureTiling] as [number, number],
        textureOffset: [...mat.textureOffset] as [number, number],
      });
    }

    const data: SerializedScene = {
      version: SCENE_VERSION,
      name,
      nodes,
      lights,
      ambient: [...scene.ambientColor] as [number, number, number],
      materials: serializedMaterials,
      nextNodeId: getNextNodeId(),
      camera: cameraState as SerializedCamera | undefined,
    };

    return JSON.stringify(data, null, 2);
  }

  static deserialize(json: string): { scene: Scene; materials: Map<number, Material>; name: string; camera?: SerializedCamera } {
    const data = JSON.parse(json) as SerializedScene;

    const scene = new Scene();
    scene.ambientColor = [...data.ambient] as [number, number, number];

    setNodeIdCounter(1);

    for (const sn of data.nodes) {
      const node = new SceneNode(sn.name, sn.type as any);
      node.id = sn.id;
      node.position = Vec3.fromArray(sn.position);
      node.rotation = Vec3.fromArray(sn.rotation);
      node.scale = Vec3.fromArray(sn.scale);
      node.visible = sn.visible;
      node.parentId = sn.parentId;
      node.childIds = [...sn.childIds];
      scene.nodes.set(node.id, node);
    }

    scene.root.childIds = data.nodes
      .filter((n) => n.parentId === 0)
      .map((n) => n.id);

    if (getNextNodeId() < data.nextNodeId) {
      setNodeIdCounter(data.nextNodeId);
    }

    resetLightIdCounter();
    for (const sl of data.lights) {
      let light: Light;
      if (sl.type === 'directional') light = createDirectionalLight(sl.name);
      else if (sl.type === 'point') light = createPointLight(sl.name);
      else light = createSpotLight(sl.name);
      light.id = sl.id;
      light.position = Vec3.fromArray(sl.position);
      light.direction = Vec3.fromArray(sl.direction);
      light.color = new Color(sl.color[0], sl.color[1], sl.color[2], sl.color[3]);
      light.intensity = sl.intensity;
      light.range = sl.range;
      light.innerConeAngle = sl.innerConeAngle;
      light.outerConeAngle = sl.outerConeAngle;
      light.enabled = sl.enabled;
      scene.lights.push(light);
    }

    const materials = new Map<number, Material>();
    for (const sm of data.materials) {
      const mat = createDefaultMaterial();
      mat.baseColor = new Color(sm.baseColor[0], sm.baseColor[1], sm.baseColor[2], sm.baseColor[3]);
      mat.metallic = sm.metallic;
      mat.roughness = sm.roughness;
      mat.emissive = new Color(sm.emissive[0], sm.emissive[1], sm.emissive[2], sm.emissive[3]);
      mat.emissiveIntensity = sm.emissiveIntensity;
      mat.wireframe = sm.wireframe;
      mat.doubleSided = sm.doubleSided;
      mat.textureId = sm.textureId;
      mat.textureTiling = [...sm.textureTiling] as [number, number];
      mat.textureOffset = [...sm.textureOffset] as [number, number];
      materials.set(sm.nodeId, mat);
    }

    return { scene, materials, name: data.name, camera: data.camera };
  }

  static saveToLocal(scene: Scene, materials: Map<number, Material>, name: string, cameraState?: object): void {
    const json = SceneSerializer.serialize(scene, materials, name, cameraState);
    localStorage.setItem(`noise3d:scene:${name}`, json);
  }

  static loadFromLocal(name: string): { scene: Scene; materials: Map<number, Material>; name: string; camera?: SerializedCamera } | null {
    const json = localStorage.getItem(`noise3d:scene:${name}`);
    if (!json) return null;
    return SceneSerializer.deserialize(json);
  }

  static listLocalScenes(): string[] {
    const scenes: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('noise3d:scene:')) {
        scenes.push(key.substring('noise3d:scene:'.length));
      }
    }
    return scenes;
  }

  static deleteLocal(name: string): void {
    localStorage.removeItem(`noise3d:scene:${name}`);
  }

  static download(scene: Scene, materials: Map<number, Material>, name: string, cameraState?: object): void {
    const json = SceneSerializer.serialize(scene, materials, name, cameraState);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.scene.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  static async loadFromFile(file: File): Promise<{ scene: Scene; materials: Map<number, Material>; name: string; camera?: SerializedCamera }> {
    const text = await file.text();
    return SceneSerializer.deserialize(text);
  }
}
