export type SkyType = 'gradient' | 'solid' | 'procedural';

export interface EnvironmentSettings {
  skyType: SkyType;
  skyTopColor: [number, number, number];
  skyBottomColor: [number, number, number];
  sunAzimuth: number;
  sunElevation: number;
  fogEnabled: boolean;
  fogColor: [number, number, number];
  fogDensity: number;
  ambientIntensity: number;
}

export function createDefaultEnvironment(): EnvironmentSettings {
  return {
    skyType: 'gradient',
    skyTopColor: [0.35, 0.55, 0.85],
    skyBottomColor: [0.75, 0.82, 0.92],
    sunAzimuth: Math.PI / 4,
    sunElevation: Math.PI / 3,
    fogEnabled: false,
    fogColor: [0.6, 0.65, 0.72],
    fogDensity: 0.02,
    ambientIntensity: 0.25,
  };
}
