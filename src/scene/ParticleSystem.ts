import { Vec3, Color } from '@math/Vec';

export interface ParticleEmitter {
  id: number;
  name: string;
  position: Vec3;
  maxParticles: number;
  emissionRate: number;
  particleLifetime: number;
  startColor: Color;
  endColor: Color;
  startSize: number;
  endSize: number;
  startSpeed: number;
  gravity: number;
  spread: number;
  enabled: boolean;
  particles: Particle[];
  emitAccumulator: number;
}

export interface Particle {
  position: Vec3;
  velocity: Vec3;
  life: number;
  maxLife: number;
  size: number;
  color: Color;
}

let nextEmitterId = 1;

export function createParticleEmitter(name: string = 'Particle System'): ParticleEmitter {
  return {
    id: nextEmitterId++,
    name,
    position: new Vec3(0, 0, 0),
    maxParticles: 200,
    emissionRate: 20,
    particleLifetime: 2.0,
    startColor: new Color(1, 0.8, 0.2, 1),
    endColor: new Color(1, 0.1, 0.05, 0),
    startSize: 0.2,
    endSize: 0.02,
    startSpeed: 3,
    gravity: -5,
    spread: Math.PI * 2,
    enabled: true,
    particles: [],
    emitAccumulator: 0,
  };
}

export function resetEmitterIdCounter(): void {
  nextEmitterId = 1;
}

export function updateParticleEmitter(emitter: ParticleEmitter, dt: number): void {
  if (!emitter.enabled) return;

  emitter.emitAccumulator += emitter.emissionRate * dt;
  while (emitter.emitAccumulator >= 1 && emitter.particles.length < emitter.maxParticles) {
    emitter.emitAccumulator -= 1;
    spawnParticle(emitter);
  }

  for (let i = emitter.particles.length - 1; i >= 0; i--) {
    const p = emitter.particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      emitter.particles.splice(i, 1);
      continue;
    }
    p.velocity.y += emitter.gravity * dt;
    p.position.x += p.velocity.x * dt;
    p.position.y += p.velocity.y * dt;
    p.position.z += p.velocity.z * dt;

    const lifeRatio = 1 - p.life / p.maxLife;
    p.size = emitter.startSize + (emitter.endSize - emitter.startSize) * lifeRatio;
    p.color.r = emitter.startColor.r + (emitter.endColor.r - emitter.startColor.r) * lifeRatio;
    p.color.g = emitter.startColor.g + (emitter.endColor.g - emitter.startColor.g) * lifeRatio;
    p.color.b = emitter.startColor.b + (emitter.endColor.b - emitter.startColor.b) * lifeRatio;
    p.color.a = emitter.startColor.a + (emitter.endColor.a - emitter.startColor.a) * lifeRatio;
  }
}

function spawnParticle(emitter: ParticleEmitter): void {
  const angle = Math.random() * emitter.spread;
  const elevation = Math.random() * Math.PI / 2;
  const speed = emitter.startSpeed * (0.5 + Math.random() * 0.5);
  const vel = new Vec3(
    Math.cos(angle) * Math.cos(elevation) * speed,
    Math.sin(elevation) * speed,
    Math.sin(angle) * Math.cos(elevation) * speed,
  );

  emitter.particles.push({
    position: emitter.position.clone(),
    velocity: vel,
    life: emitter.particleLifetime * (0.8 + Math.random() * 0.2),
    maxLife: emitter.particleLifetime,
    size: emitter.startSize,
    color: emitter.startColor.clone(),
  });
}
