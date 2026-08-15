import { Color } from '@math/Vec';

export interface TextureData {
  id: string;
  name: string;
  width: number;
  height: number;
  glTexture: WebGLTexture | null;
  source: string | null;
}

export interface Material {
  baseColor: Color;
  metallic: number;
  roughness: number;
  emissive: Color;
  emissiveIntensity: number;
  wireframe: boolean;
  doubleSided: boolean;
  textureId: string | null;
  textureTiling: [number, number];
  textureOffset: [number, number];
}

export function createDefaultMaterial(): Material {
  return {
    baseColor: Color.fromHex(0xcccccc),
    metallic: 0,
    roughness: 0.5,
    emissive: Color.BLACK.clone(),
    emissiveIntensity: 0,
    wireframe: false,
    doubleSided: false,
    textureId: null,
    textureTiling: [1, 1],
    textureOffset: [0, 0],
  };
}

export function createMaterialFromColor(color: Color): Material {
  const mat = createDefaultMaterial();
  mat.baseColor = color.clone();
  return mat;
}

export interface MaterialPreset {
  name: string;
  material: Material;
}

export const MATERIAL_PRESETS: MaterialPreset[] = [
  {
    name: 'Default',
    material: createDefaultMaterial(),
  },
  {
    name: 'Metal',
    material: {
      baseColor: Color.fromHex(0xaaaaaa),
      metallic: 1,
      roughness: 0.2,
      emissive: Color.BLACK.clone(),
      emissiveIntensity: 0,
      wireframe: false,
      doubleSided: false,
      textureId: null,
      textureTiling: [1, 1],
      textureOffset: [0, 0],
    },
  },
  {
    name: 'Plastic',
    material: {
      baseColor: Color.fromHex(0xffffff),
      metallic: 0,
      roughness: 0.6,
      emissive: Color.BLACK.clone(),
      emissiveIntensity: 0,
      wireframe: false,
      doubleSided: false,
      textureId: null,
      textureTiling: [1, 1],
      textureOffset: [0, 0],
    },
  },
  {
    name: 'Emissive',
    material: {
      baseColor: Color.fromHex(0x222222),
      metallic: 0,
      roughness: 0.5,
      emissive: Color.fromHex(0xff8800),
      emissiveIntensity: 2,
      wireframe: false,
      doubleSided: false,
      textureId: null,
      textureTiling: [1, 1],
      textureOffset: [0, 0],
    },
  },
  {
    name: 'Glass-like',
    material: {
      baseColor: Color.fromHex(0x88ccff),
      metallic: 0.9,
      roughness: 0.05,
      emissive: Color.BLACK.clone(),
      emissiveIntensity: 0,
      wireframe: false,
      doubleSided: true,
      textureId: null,
      textureTiling: [1, 1],
      textureOffset: [0, 0],
    },
  },
];
