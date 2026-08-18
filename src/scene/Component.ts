// Component system for NOISE3D - Unity-style component architecture

export type ComponentType =
  | 'MeshFilter'
  | 'MeshRenderer'
  | 'Collider'
  | 'Rigidbody'
  | 'Camera'
  | 'AudioSource'
  | 'Script';

export interface ComponentData {
  id: string;
  type: ComponentType;
  enabled: boolean;
  properties: Record<string, number | string | boolean | number[]>;
}

export interface IComponent {
  onUpdate?(dt: number): void;
  onRender?(): void;
  onInspector?(): void;
}

const componentIdCounter = { next: 1 };

export function getNextComponentId(): string {
  return `comp_${componentIdCounter.next++}`;
}

export function resetComponentIdCounter(): void {
  componentIdCounter.next = 1;
}

export function createComponent(type: ComponentType): ComponentData {
  const base: ComponentData = {
    id: getNextComponentId(),
    type,
    enabled: true,
    properties: {},
  };

  switch (type) {
    case 'MeshFilter':
      base.properties = { meshType: 'cube' };
      break;
    case 'MeshRenderer':
      base.properties = { castShadows: true, receiveShadows: true };
      break;
    case 'Collider':
      base.properties = { colliderType: 'box', size: [1, 1, 1], isTrigger: false };
      break;
    case 'Rigidbody':
      base.properties = {
        mass: 1,
        velocity: [0, 0, 0],
        angularVelocity: [0, 0, 0],
        useGravity: true,
        isKinematic: false,
      };
      break;
    case 'Camera':
      base.properties = {
        fov: 60,
        near: 0.1,
        far: 1000,
        isPrimary: false,
      };
      break;
    case 'AudioSource':
      base.properties = {
        volume: 1,
        loop: false,
        autoplay: false,
        audioClip: '',
      };
      break;
    case 'Script':
      base.properties = {
        scriptName: 'CustomScript',
        scriptCode: '// Called every frame\nfunction onUpdate(dt) {\n  \n}',
      };
      break;
  }

  return base;
}

export const BUILTIN_COMPONENT_TYPES: ComponentType[] = [
  'MeshFilter',
  'MeshRenderer',
  'Collider',
  'Rigidbody',
  'Camera',
  'AudioSource',
  'Script',
];

export function getComponentDisplayName(type: ComponentType): string {
  return type;
}

export function getComponentPropertyLabels(type: ComponentType): Record<string, string> {
  switch (type) {
    case 'Rigidbody':
      return {
        mass: 'Mass',
        useGravity: 'Use Gravity',
        isKinematic: 'Is Kinematic',
        velocity: 'Velocity',
        angularVelocity: 'Angular Velocity',
      };
    case 'Collider':
      return {
        colliderType: 'Collider Type',
        size: 'Size',
        isTrigger: 'Is Trigger',
      };
    case 'Camera':
      return {
        fov: 'Field of View',
        near: 'Near Plane',
        far: 'Far Plane',
        isPrimary: 'Primary Camera',
      };
    case 'MeshFilter':
      return { meshType: 'Mesh Type' };
    case 'MeshRenderer':
      return {
        castShadows: 'Cast Shadows',
        receiveShadows: 'Receive Shadows',
      };
    case 'AudioSource':
      return {
        volume: 'Volume',
        loop: 'Loop',
        autoplay: 'Autoplay',
        audioClip: 'Audio Clip',
      };
    case 'Script':
      return {
        scriptName: 'Script Name',
        scriptCode: 'Script Code',
      };
    default:
      return {};
  }
}
