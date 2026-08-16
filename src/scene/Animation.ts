import { Vec3 } from '@math/Vec';

export interface AnimationTrack {
  nodeId: number;
  propertyName: 'position' | 'rotation' | 'scale';
  keyframes: Keyframe[];
}

export interface Keyframe {
  time: number;
  value: Vec3;
}

export interface AnimationClip {
  id: number;
  name: string;
  duration: number;
  tracks: AnimationTrack[];
  loop: boolean;
}

let nextClipId = 1;

export function createAnimationClip(name: string = 'Animation'): AnimationClip {
  return {
    id: nextClipId++,
    name,
    duration: 5,
    tracks: [],
    loop: true,
  };
}

export function addKeyframe(
  clip: AnimationClip,
  nodeId: number,
  propertyName: 'position' | 'rotation' | 'scale',
  time: number,
  value: Vec3,
): void {
  let track = clip.tracks.find(
    (t) => t.nodeId === nodeId && t.propertyName === propertyName,
  );
  if (!track) {
    track = { nodeId, propertyName, keyframes: [] };
    clip.tracks.push(track);
  }

  const existingIdx = track.keyframes.findIndex((k) => k.time === time);
  if (existingIdx >= 0) {
    track.keyframes[existingIdx].value = value.clone();
  } else {
    track.keyframes.push({ time, value: value.clone() });
    track.keyframes.sort((a, b) => a.time - b.time);
  }

  if (time > clip.duration) {
    clip.duration = time;
  }
}

export function sampleAnimation(
  clip: AnimationClip,
  time: number,
  nodeId: number,
  propertyName: 'position' | 'rotation' | 'scale',
): Vec3 | null {
  const track = clip.tracks.find(
    (t) => t.nodeId === nodeId && t.propertyName === propertyName,
  );
  if (!track || track.keyframes.length === 0) return null;

  const t = clip.loop ? time % clip.duration : Math.min(time, clip.duration);

  if (t <= track.keyframes[0].time) return track.keyframes[0].value.clone();
  if (t >= track.keyframes[track.keyframes.length - 1].time)
    return track.keyframes[track.keyframes.length - 1].value.clone();

  for (let i = 0; i < track.keyframes.length - 1; i++) {
    const k1 = track.keyframes[i];
    const k2 = track.keyframes[i + 1];
    if (t >= k1.time && t <= k2.time) {
      const alpha = (t - k1.time) / (k2.time - k1.time);
      return Vec3.lerp(k1.value, k2.value, alpha);
    }
  }

  return track.keyframes[track.keyframes.length - 1].value.clone();
}

export function resetClipIdCounter(): void {
  nextClipId = 1;
}
