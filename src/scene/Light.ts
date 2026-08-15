import { Vec3, Color } from '@math/Vec';

export type LightType = 'directional' | 'point' | 'spot';

export interface Light {
  id: number;
  name: string;
  type: LightType;
  position: Vec3;
  direction: Vec3;
  color: Color;
  intensity: number;
  range: number;
  innerConeAngle: number;
  outerConeAngle: number;
  castShadows: boolean;
  enabled: boolean;
}

let nextLightId = 1;

export function createDirectionalLight(
  name: string = 'Directional Light',
): Light {
  return {
    id: nextLightId++,
    name,
    type: 'directional',
    position: new Vec3(0, 10, 0),
    direction: new Vec3(-0.5, -1, -0.3),
    color: Color.WHITE.clone(),
    intensity: 1,
    range: 100,
    innerConeAngle: Math.PI / 6,
    outerConeAngle: Math.PI / 4,
    castShadows: false,
    enabled: true,
  };
}

export function createPointLight(
  name: string = 'Point Light',
): Light {
  return {
    id: nextLightId++,
    name,
    type: 'point',
    position: new Vec3(0, 2, 0),
    direction: new Vec3(0, -1, 0),
    color: Color.WHITE.clone(),
    intensity: 5,
    range: 10,
    innerConeAngle: Math.PI / 4,
    outerConeAngle: Math.PI / 3,
    castShadows: false,
    enabled: true,
  };
}

export function createSpotLight(
  name: string = 'Spot Light',
): Light {
  return {
    id: nextLightId++,
    name,
    type: 'spot',
    position: new Vec3(0, 5, 0),
    direction: new Vec3(0, -1, 0),
    color: Color.WHITE.clone(),
    intensity: 10,
    range: 20,
    innerConeAngle: Math.PI / 12,
    outerConeAngle: Math.PI / 6,
    castShadows: false,
    enabled: true,
  };
}

export const MAX_LIGHTS = 8;

export function resetLightIdCounter(): void {
  nextLightId = 1;
}
