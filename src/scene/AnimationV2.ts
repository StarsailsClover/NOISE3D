import { Vec3 } from '@math/Vec';

export type InterpolationMode = 'linear' | 'bezier' | 'step' | 'ease-in' | 'ease-out' | 'ease-in-out';

export interface KeyframeV2 {
  id: string;
  time: number;
  value: Vec3;
  interpolation: InterpolationMode;
  inTangent: { x: number; y: number };
  outTangent: { x: number; y: number };
}

export interface AnimationTrackV2 {
  nodeId: number;
  propertyName: 'position' | 'rotation' | 'scale';
  keyframes: KeyframeV2[];
}

export interface AnimationClipV2 {
  id: number;
  name: string;
  duration: number;
  loop: boolean;
  tracks: AnimationTrackV2[];
}

let clipIdCounter = 1;
let keyIdCounter = 1;

export function resetAnimationV2Counters(): void {
  clipIdCounter = 1;
  keyIdCounter = 1;
}

export function createClipV2(name: string = 'Clip'): AnimationClipV2 {
  return { id: clipIdCounter++, name, duration: 5, loop: true, tracks: [] };
}

export function createKeyframe(time: number, value: Vec3, interpolation: InterpolationMode = 'bezier'): KeyframeV2 {
  return {
    id: `k${keyIdCounter++}`,
    time,
    value: value.clone(),
    interpolation,
    inTangent: { x: -0.5, y: 0 },
    outTangent: { x: 0.5, y: 0 },
  };
}

export function findTrack(clip: AnimationClipV2, nodeId: number, property: AnimationTrackV2['propertyName']): AnimationTrackV2 | undefined {
  return clip.tracks.find((t) => t.nodeId === nodeId && t.propertyName === property);
}

export function ensureTrack(clip: AnimationClipV2, nodeId: number, property: AnimationTrackV2['propertyName']): AnimationTrackV2 {
  let track: AnimationTrackV2 | undefined = findTrack(clip, nodeId, property);
  if (!track) {
    const newTrack: AnimationTrackV2 = { nodeId, propertyName: property, keyframes: [] };
    clip.tracks.push(newTrack);
    track = newTrack;
  }
  return track;
}

export function insertKeyframe(
  track: AnimationTrackV2,
  key: KeyframeV2,
): void {
  const existing = track.keyframes.findIndex((k) => Math.abs(k.time - key.time) < 1e-4);
  if (existing >= 0) {
    track.keyframes[existing] = key;
  } else {
    track.keyframes.push(key);
  }
  track.keyframes.sort((a, b) => a.time - b.time);
}

function ease(t: number, mode: InterpolationMode): number {
  switch (mode) {
    case 'linear': return t;
    case 'step': return t < 1 ? 0 : 1;
    case 'ease-in': return t * t;
    case 'ease-out': return t * (2 - t);
    case 'ease-in-out': return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    case 'bezier': {
      // Cubic smoothstep as default bezier approximation
      return t * t * (3 - 2 * t);
    }
    default: return t;
  }
}

export function sampleTrackV2(track: AnimationTrackV2, time: number, duration: number, loop: boolean): Vec3 | null {
  const keys = track.keyframes;
  if (keys.length === 0) return null;

  let t = time;
  if (loop && duration > 0) t = ((time % duration) + duration) % duration;
  else t = Math.max(0, Math.min(time, duration));

  if (keys.length === 1) return keys[0].value.clone();
  if (t <= keys[0].time) return keys[0].value.clone();
  if (t >= keys[keys.length - 1].time) return keys[keys.length - 1].value.clone();

  for (let i = 0; i < keys.length - 1; i++) {
    const k1 = keys[i];
    const k2 = keys[i + 1];
    if (t >= k1.time && t <= k2.time) {
      const span = k2.time - k1.time || 1e-6;
      const raw = (t - k1.time) / span;
      const alpha = ease(raw, k1.interpolation);

      // Hermite with tangents when both sides are bezier
      if (k1.interpolation === 'bezier') {
        const m0 = k1.outTangent.y / Math.max(Math.abs(k1.outTangent.x), 1e-4);
        const m1 = k2.inTangent.y / Math.max(Math.abs(k2.inTangent.x), 1e-4);
        const h10 = alpha ** 3 - 2 * alpha ** 2 + alpha;
        const h01 = -2 * alpha ** 3 + 3 * alpha ** 2;
        const h11 = alpha ** 3 - alpha ** 2;
        const dx = k2.value.x - k1.value.x;
        const dy = k2.value.y - k1.value.y;
        const dz = k2.value.z - k1.value.z;
        return new Vec3(
          k1.value.x + h10 * span * m0 + h01 * dx + h11 * span * m1,
          k1.value.y + h01 * dy,
          k1.value.z + h01 * dz,
        );
      }

      return new Vec3(
        k1.value.x + (k2.value.x - k1.value.x) * alpha,
        k1.value.y + (k2.value.y - k1.value.y) * alpha,
        k1.value.z + (k2.value.z - k1.value.z) * alpha,
      );
    }
  }
  return keys[keys.length - 1].value.clone();
}

export function setInterpolation(track: AnimationTrackV2, time: number, mode: InterpolationMode): void {
  const key = track.keyframes.find((k) => Math.abs(k.time - time) < 1e-4);
  if (key) key.interpolation = mode;
}

// ---- Skeletal rigging ----

export interface Bone {
  id: number;
  name: string;
  parentId: number | null;
  localOffset: Vec3;
  worldPosition: Vec3;
  rotation: number;
  length: number;
}

export interface Skeleton {
  bones: Bone[];
}

let boneIdCounter = 1;

export function resetBoneCounter(): void {
  boneIdCounter = 1;
}

export function createBone(name: string, parentId: number | null, offset: Vec3, length = 1): Bone {
  return {
    id: boneIdCounter++,
    name,
    parentId,
    localOffset: offset.clone(),
    worldPosition: offset.clone(),
    rotation: 0,
    length,
  };
}

export function createHumanoidSkeleton(rootPos: Vec3): Skeleton {
  resetBoneCounter();
  const hips = createBone('Hips', null, rootPos.clone(), 0.8);
  const spine = createBone('Spine', hips.id, new Vec3(0, 0.8, 0), 0.7);
  const head = createBone('Head', spine.id, new Vec3(0, 0.7, 0), 0.4);
  const armL = createBone('ArmL', spine.id, new Vec3(-0.5, 0.55, 0), 0.9);
  const armR = createBone('ArmR', spine.id, new Vec3(0.5, 0.55, 0), 0.9);
  const legL = createBone('LegL', hips.id, new Vec3(-0.25, 0, 0), 1.0);
  const legR = createBone('LegR', hips.id, new Vec3(0.25, 0, 0), 1.0);
  return { bones: [hips, spine, head, armL, armR, legL, legR] };
}

export function computeWorldPositions(skeleton: Skeleton): void {
  for (const bone of skeleton.bones) {
    if (bone.parentId === null) {
      bone.worldPosition = Vec3.add(bone.localOffset, new Vec3(0, bone.rotation * 0.1, 0));
    } else {
      const parent = skeleton.bones.find((b) => b.id === bone.parentId);
      if (parent) {
        bone.worldPosition = Vec3.add(parent.worldPosition, bone.localOffset);
      } else {
        bone.worldPosition = bone.localOffset.clone();
      }
    }
  }
}

// ---- Inverse Kinematics (simple 2-bone analytic solver) ----

export function solveIK(
  root: Vec3,
  target: Vec3,
  upperLen: number,
  lowerLen: number,
): { mid: Vec3; end: Vec3 } | null {
  const toTarget = Vec3.sub(target, root);
  const dist = toTarget.length();

  // Out of reach: clamp
  const reach = upperLen + lowerLen;
  const clampedDist = Math.min(dist, reach * 0.999);
  const dir = dist > 1e-6 ? Vec3.scale(toTarget, 1 / dist) : new Vec3(0, 1, 0);

  const effectiveTarget = Vec3.add(root, Vec3.scale(dir, clampedDist));

  // Law of cosines for the knee angle
  const a = upperLen;
  const b = lowerLen;
  const c = Math.min(clampedDist, a + b - 1e-4);

  const cosMid = (a * a + b * b - c * c) / (2 * a * b);
  const midAngle = Math.acos(Math.max(-1, Math.min(1, cosMid)));

  // Place mid joint perpendicular to the root-target line (elbow/knee bend)
  const along = (a * a - b * b + c * c) / (2 * c);
  const height = Math.sqrt(Math.max(a * a - along * along, 0));

  // Perpendicular direction (choose up-ish bend)
  let perp = new Vec3(-dir.z, 0, dir.x);
  if (perp.lengthSq() < 1e-8) perp = new Vec3(1, 0, 0);
  perp = perp.normalized();
  if (perp.y < 0) perp = Vec3.scale(perp, -1);

  const mid = Vec3.add(Vec3.add(root.clone(), Vec3.scale(dir, along)), Vec3.scale(perp, height));
  const end = effectiveTarget;

  void midAngle;
  return { mid, end };
}
