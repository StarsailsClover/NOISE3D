// Physics engine for NOISE3D - collision detection, rigidbody dynamics, raycast

import { Vec3 } from '@math/Vec';
import type { SceneNode } from '@scene/SceneNode';

export interface AABB {
  min: Vec3;
  max: Vec3;
}

export interface Sphere {
  center: Vec3;
  radius: number;
}

export type ColliderShape = 'box' | 'sphere';

export interface PhysicsBody {
  nodeId: number;
  shape: ColliderShape;
  aabb?: AABB;
  sphere?: Sphere;
  mass: number;
  velocity: Vec3;
  angularVelocity: Vec3;
  useGravity: boolean;
  isKinematic: boolean;
  isTrigger: boolean;
  position: Vec3;
  restitution: number;
  friction: number;
}

export interface RaycastHit {
  nodeId: number;
  point: Vec3;
  distance: number;
  normal: Vec3;
}

export interface CollisionEvent {
  type: 'enter' | 'exit' | 'stay';
  bodyA: number;
  bodyB: number;
  point: Vec3;
  normal: Vec3;
}

const GRAVITY = new Vec3(0, -9.81, 0);
const FIXED_TIMESTEP = 1 / 60;
const MAX_STEPS = 5;

export class PhysicsWorld {
  private bodies: Map<number, PhysicsBody> = new Map();
  private events: CollisionEvent[] = [];
  private accumulator: number = 0;
  private debug: boolean = false;

  addBody(body: PhysicsBody): void {
    this.bodies.set(body.nodeId, body);
  }

  removeBody(nodeId: number): void {
    this.bodies.delete(nodeId);
  }

  getBody(nodeId: number): PhysicsBody | undefined {
    return this.bodies.get(nodeId);
  }

  getBodies(): PhysicsBody[] {
    return Array.from(this.bodies.values());
  }

  getEvents(): CollisionEvent[] {
    return this.events;
  }

  setDebug(enabled: boolean): void {
    this.debug = enabled;
  }

  get isDebug(): boolean {
    return this.debug;
  }

  clear(): void {
    this.bodies.clear();
    this.events = [];
    this.accumulator = 0;
  }

  /**
   * Sync physics bodies with scene nodes (read collider/rigidbody components).
   */
  syncFromScene(nodes: SceneNode[]): void {
    this.bodies.clear();
    for (const node of nodes) {
      const collider = node.getComponent('Collider');
      const rigidbody = node.getComponent('Rigidbody');
      if (!collider && !rigidbody) continue;

      const shape: ColliderShape = (collider?.properties.colliderType as string) === 'sphere' ? 'sphere' : 'box';
      const isTrigger = (collider?.properties.isTrigger as boolean) ?? false;
      const mass = (rigidbody?.properties.mass as number) ?? 1;
      const useGravity = (rigidbody?.properties.useGravity as boolean) ?? true;
      const isKinematic = (rigidbody?.properties.isKinematic as boolean) ?? false;

      let velocity = new Vec3();
      let angularVelocity = new Vec3();
      if (rigidbody) {
        const v = rigidbody.properties.velocity as number[];
        const av = rigidbody.properties.angularVelocity as number[];
        if (Array.isArray(v)) velocity = new Vec3(v[0] || 0, v[1] || 0, v[2] || 0);
        if (Array.isArray(av)) angularVelocity = new Vec3(av[0] || 0, av[1] || 0, av[2] || 0);
      }

      const body: PhysicsBody = {
        nodeId: node.id,
        shape,
        mass: mass > 0 ? mass : 1,
        velocity,
        angularVelocity,
        useGravity,
        isKinematic,
        isTrigger,
        position: node.position.clone(),
        restitution: 0.3,
        friction: 0.5,
      };

      // Compute collider shape
      const sizeProp = collider?.properties.size as number[];
      const halfSize = sizeProp ? new Vec3(sizeProp[0] / 2, sizeProp[1] / 2, sizeProp[2] / 2) : new Vec3(0.5, 0.5, 0.5);

      if (shape === 'sphere') {
        body.sphere = {
          center: node.position.clone(),
          radius: Math.max(halfSize.x, halfSize.y, halfSize.z),
        };
      } else {
        body.aabb = {
          min: new Vec3(node.position.x - halfSize.x, node.position.y - halfSize.y, node.position.z - halfSize.z),
          max: new Vec3(node.position.x + halfSize.x, node.position.y + halfSize.y, node.position.z + halfSize.z),
        };
      }

      this.bodies.set(node.id, body);
    }
  }

  /**
   * Step the physics simulation forward.
   */
  step(dt: number): void {
    this.accumulator += dt;
    let steps = 0;
    this.events = [];

    while (this.accumulator >= FIXED_TIMESTEP && steps < MAX_STEPS) {
      this.fixedStep(FIXED_TIMESTEP);
      this.accumulator -= FIXED_TIMESTEP;
      steps++;
    }
  }

  private fixedStep(dt: number): void {
    const bodyList = this.getBodies();

    // Apply gravity and integrate
    for (const body of bodyList) {
      if (body.isKinematic) continue;
      if (body.useGravity) {
        body.velocity = Vec3.add(body.velocity, Vec3.scale(GRAVITY, dt));
      }
      // Integrate position
      body.position = Vec3.add(body.position, Vec3.scale(body.velocity, dt));

      // Update collider positions
      if (body.shape === 'sphere' && body.sphere) {
        body.sphere.center = body.position.clone();
      } else if (body.shape === 'box' && body.aabb) {
        const size = Vec3.sub(body.aabb.max, body.aabb.min);
        const half = Vec3.scale(size, 0.5);
        body.aabb.min = Vec3.sub(body.position, half);
        body.aabb.max = Vec3.add(body.position, half);
      }
    }

    // Collision detection and response
    for (let i = 0; i < bodyList.length; i++) {
      for (let j = i + 1; j < bodyList.length; j++) {
        const a = bodyList[i];
        const b = bodyList[j];
        if (a.isKinematic && b.isKinematic) continue;

        const result = this.checkCollision(a, b);
        if (result) {
          if (!a.isTrigger && !b.isTrigger) {
            this.resolveCollision(a, b, result.normal, result.depth);
          }
          this.events.push({
            type: 'enter',
            bodyA: a.nodeId,
            bodyB: b.nodeId,
            point: result.point,
            normal: result.normal,
          });
        }
      }
    }
  }

  private checkCollision(a: PhysicsBody, b: PhysicsBody): { normal: Vec3; depth: number; point: Vec3 } | null {
    if (a.shape === 'sphere' && b.shape === 'sphere') {
      return this.sphereSphere(a.sphere!, b.sphere!);
    }
    if (a.shape === 'box' && b.shape === 'box') {
      return this.aabbAABB(a.aabb!, b.aabb!);
    }
    if (a.shape === 'sphere' && b.shape === 'box') {
      return this.sphereAABB(a.sphere!, b.aabb!);
    }
    if (a.shape === 'box' && b.shape === 'sphere') {
      const result = this.sphereAABB(b.sphere!, a.aabb!);
      if (result) result.normal = Vec3.scale(result.normal, -1);
      return result;
    }
    return null;
  }

  private aabbAABB(a: AABB, b: AABB): { normal: Vec3; depth: number; point: Vec3 } | null {
    const overlapX = Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x);
    const overlapY = Math.min(a.max.y, b.max.y) - Math.max(a.min.y, b.min.y);
    const overlapZ = Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z);

    if (overlapX <= 0 || overlapY <= 0 || overlapZ <= 0) return null;

    // Find minimum overlap axis
    if (overlapX <= overlapY && overlapX <= overlapZ) {
      const normal = new Vec3(a.max.x < b.max.x ? -1 : 1, 0, 0);
      return { normal, depth: overlapX, point: new Vec3((a.max.x + a.min.x) / 2, (a.max.y + a.min.y) / 2, (a.max.z + a.min.z) / 2) };
    }
    if (overlapY <= overlapX && overlapY <= overlapZ) {
      const normal = new Vec3(0, a.max.y < b.max.y ? -1 : 1, 0);
      return { normal, depth: overlapY, point: new Vec3((a.max.x + a.min.x) / 2, (a.max.y + a.min.y) / 2, (a.max.z + a.min.z) / 2) };
    }
    const normal = new Vec3(0, 0, a.max.z < b.max.z ? -1 : 1);
    return { normal, depth: overlapZ, point: new Vec3((a.max.x + a.min.x) / 2, (a.max.y + a.min.y) / 2, (a.max.z + a.min.z) / 2) };
  }

  private sphereSphere(a: Sphere, b: Sphere): { normal: Vec3; depth: number; point: Vec3 } | null {
    const delta = Vec3.sub(b.center, a.center);
    const dist = Math.sqrt(delta.x * delta.x + delta.y * delta.y + delta.z * delta.z);
    const sumRadius = a.radius + b.radius;
    if (dist >= sumRadius) return null;

    const normal = dist > 0.001 ? Vec3.scale(delta, 1 / dist) : new Vec3(0, 1, 0);
    return {
      normal,
      depth: sumRadius - dist,
      point: Vec3.add(a.center, Vec3.scale(normal, a.radius)),
    };
  }

  private sphereAABB(s: Sphere, a: AABB): { normal: Vec3; depth: number; point: Vec3 } | null {
    const closest = new Vec3(
      Math.max(a.min.x, Math.min(s.center.x, a.max.x)),
      Math.max(a.min.y, Math.min(s.center.y, a.max.y)),
      Math.max(a.min.z, Math.min(s.center.z, a.max.z)),
    );
    const delta = Vec3.sub(s.center, closest);
    const dist = Math.sqrt(delta.x * delta.x + delta.y * delta.y + delta.z * delta.z);
    if (dist >= s.radius) return null;

    const normal = dist > 0.001 ? Vec3.scale(delta, 1 / dist) : new Vec3(0, 1, 0);
    return { normal, depth: s.radius - dist, point: closest };
  }

  private resolveCollision(a: PhysicsBody, b: PhysicsBody, normal: Vec3, depth: number): void {
    // Positional correction
    const totalMass = a.mass + b.mass;
    const correction = Vec3.scale(normal, depth);
    if (!a.isKinematic) {
      a.position = Vec3.sub(a.position, Vec3.scale(correction, b.mass / totalMass));
    }
    if (!b.isKinematic) {
      b.position = Vec3.add(b.position, Vec3.scale(correction, a.mass / totalMass));
    }

    // Velocity response (impulse-based)
    const relVel = Vec3.sub(b.velocity, a.velocity);
    const velAlongNormal = relVel.x * normal.x + relVel.y * normal.y + relVel.z * normal.z;
    if (velAlongNormal > 0) return; // Separating

    const e = Math.min(a.restitution, b.restitution);
    const j = -(1 + e) * velAlongNormal / (1 / a.mass + 1 / b.mass);
    const impulse = Vec3.scale(normal, j);

    if (!a.isKinematic) {
      a.velocity = Vec3.sub(a.velocity, Vec3.scale(impulse, 1 / a.mass));
    }
    if (!b.isKinematic) {
      b.velocity = Vec3.add(b.velocity, Vec3.scale(impulse, 1 / b.mass));
    }

    // Update collider positions
    if (a.shape === 'sphere' && a.sphere) a.sphere.center = a.position.clone();
    else if (a.shape === 'box' && a.aabb) {
      const size = Vec3.sub(a.aabb.max, a.aabb.min);
      const half = Vec3.scale(size, 0.5);
      a.aabb.min = Vec3.sub(a.position, half);
      a.aabb.max = Vec3.add(a.position, half);
    }
    if (b.shape === 'sphere' && b.sphere) b.sphere.center = b.position.clone();
    else if (b.shape === 'box' && b.aabb) {
      const size = Vec3.sub(b.aabb.max, b.aabb.min);
      const half = Vec3.scale(size, 0.5);
      b.aabb.min = Vec3.sub(b.position, half);
      b.aabb.max = Vec3.add(b.position, half);
    }
  }

  /**
   * Raycast against all physics bodies.
   */
  raycast(origin: Vec3, direction: Vec3, maxDist: number = 1000): RaycastHit | null {
    const dir = Vec3.normalize(direction);
    let closest: RaycastHit | null = null;
    let closestDist = maxDist;

    for (const body of this.bodies.values()) {
      let hit: { point: Vec3; distance: number; normal: Vec3 } | null = null;

      if (body.shape === 'sphere' && body.sphere) {
        hit = this.raySphere(origin, dir, body.sphere);
      } else if (body.shape === 'box' && body.aabb) {
        hit = this.rayAABB(origin, dir, body.aabb);
      }

      if (hit && hit.distance < closestDist) {
        closestDist = hit.distance;
        closest = { nodeId: body.nodeId, ...hit };
      }
    }

    return closest;
  }

  private raySphere(origin: Vec3, dir: Vec3, sphere: Sphere): { point: Vec3; distance: number; normal: Vec3 } | null {
    const oc = Vec3.sub(origin, sphere.center);
    const a = dir.x * dir.x + dir.y * dir.y + dir.z * dir.z;
    const b = 2 * (oc.x * dir.x + oc.y * dir.y + oc.z * dir.z);
    const c = oc.x * oc.x + oc.y * oc.y + oc.z * oc.z - sphere.radius * sphere.radius;
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return null;

    const t = (-b - Math.sqrt(discriminant)) / (2 * a);
    if (t < 0) return null;

    const point = Vec3.add(origin, Vec3.scale(dir, t));
    const normal = Vec3.normalize(Vec3.sub(point, sphere.center));
    return { point, distance: t, normal };
  }

  private rayAABB(origin: Vec3, dir: Vec3, aabb: AABB): { point: Vec3; distance: number; normal: Vec3 } | null {
    let tmin = -Infinity;
    let tmax = Infinity;
    let hitAxis = 0;
    let hitSign = 1;

    const axes: [number, number, number, number, number][] = [
      [origin.x, dir.x, aabb.min.x, aabb.max.x, 0],
      [origin.y, dir.y, aabb.min.y, aabb.max.y, 1],
      [origin.z, dir.z, aabb.min.z, aabb.max.z, 2],
    ];

    for (const [o, d, min, max, axisIdx] of axes) {
      if (Math.abs(d) < 1e-9) {
        if (o < min || o > max) return null;
      } else {
        let t1 = (min - o) / d;
        let t2 = (max - o) / d;
        let sign = -1;
        if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; sign = 1; }
        if (t1 > tmin) { tmin = t1; hitAxis = axisIdx; hitSign = sign; }
        if (t2 < tmax) tmax = t2;
        if (tmin > tmax) return null;
      }
    }

    if (tmin < 0) return null;

    const point = Vec3.add(origin, Vec3.scale(dir, tmin));
    const normal = new Vec3(0, 0, 0);
    if (hitAxis === 0) normal.x = hitSign;
    else if (hitAxis === 1) normal.y = hitSign;
    else normal.z = hitSign;

    return { point, distance: tmin, normal };
  }

  /**
   * Get debug visualization data for colliders.
   */
  getDebugData(): { type: ColliderShape; position: Vec3; size: Vec3; radius: number }[] {
    const data: { type: ColliderShape; position: Vec3; size: Vec3; radius: number }[] = [];
    for (const body of this.bodies.values()) {
      if (body.shape === 'sphere' && body.sphere) {
        data.push({ type: 'sphere', position: body.sphere.center.clone(), size: Vec3.ZERO, radius: body.sphere.radius });
      } else if (body.shape === 'box' && body.aabb) {
        const size = Vec3.sub(body.aabb.max, body.aabb.min);
        data.push({ type: 'box', position: body.position.clone(), size, radius: 0 });
      }
    }
    return data;
  }
}
