import { Color } from '@math/Vec';

export interface Material {
  baseColor: Color;
  metallic: number;
  roughness: number;
  wireframe: boolean;
}

export function createDefaultMaterial(): Material {
  return {
    baseColor: Color.fromHex(0xcccccc),
    metallic: 0,
    roughness: 0.5,
    wireframe: false,
  };
}
