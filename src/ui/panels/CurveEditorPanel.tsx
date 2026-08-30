import { useState } from 'react';
import { useEditorStore } from '@core/EditorStore';
import { Dropdown } from '../widgets';
import {
  createClipV2,
  ensureTrack,
  insertKeyframe,
  setInterpolation,
  solveIK,
  createHumanoidSkeleton,
  computeWorldPositions,
  type InterpolationMode,
  type Skeleton,
} from '@scene/AnimationV2';
import type { AnimationClipV2 } from '@scene/AnimationV2';
import { Vec3, Color } from '@math/Vec';

const INTERP_MODES: InterpolationMode[] = ['linear', 'bezier', 'step', 'ease-in', 'ease-out', 'ease-in-out'];

export function CurveEditorPanel() {
  const [clips, setClips] = useState<AnimationClipV2[]>([]);
  const [activeClipId, setActiveClipId] = useState<number | null>(null);
  const [interpMode, setInterpMode] = useState<InterpolationMode>('bezier');
  const [skeleton, setSkeleton] = useState<Skeleton | null>(null);
  const [ikTarget, setIkTarget] = useState({ x: 0.5, y: 0.5 });
  const [ikResult, setIkResult] = useState<string>('');
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId);
  const scene = useEditorStore((s) => s.scene);
  const log = useEditorStore((s) => s.log);

  const activeClip = clips.find((c) => c.id === activeClipId) ?? null;

  const addClip = () => {
    const clip = createClipV2(`Clip ${clips.length + 1}`);
    setClips([...clips, clip]);
    setActiveClipId(clip.id);
    log('info', `Created animation clip: ${clip.name}`);
  };

  const addKeyToClip = (property: 'position' | 'rotation' | 'scale') => {
    if (!activeClip || selectedNodeId === null) return;
    const node = scene.getNode(selectedNodeId);
    if (!node) return;
    const next = { ...activeClip, tracks: activeClip.tracks.map((t) => ({ ...t, keyframes: [...t.keyframes] })) };
    const track = ensureTrack(next, selectedNodeId, property);
    const value = property === 'position' ? node.position : property === 'rotation' ? node.rotation : node.scale;
    insertKeyframe(track, {
      id: `k${Date.now()}`,
      time: 1.0,
      value: value.clone(),
      interpolation: 'bezier',
      inTangent: { x: -0.5, y: 0 },
      outTangent: { x: 0.5, y: 0 },
    });
    setClips(clips.map((c) => (c.id === next.id ? next : c)));
    log('info', `Bezier keyframe added for ${property}`);
  };

  const changeInterpolation = (mode: InterpolationMode) => {
    if (!activeClip || selectedNodeId === null) return;
    const next = { ...activeClip, tracks: activeClip.tracks.map((t) => ({ ...t, keyframes: [...t.keyframes.map((k) => ({ ...k }))] })) };
    for (const track of next.tracks) {
      if (track.nodeId === selectedNodeId && track.keyframes.length > 0) {
        setInterpolation(track, track.keyframes[track.keyframes.length - 1].time, mode);
      }
    }
    setClips(clips.map((c) => (c.id === next.id ? next : c)));
    log('info', `Interpolation set to ${mode}`);
  };

  const createSkeleton = () => {
    const skel = createHumanoidSkeleton(new Vec3(0, 1, 0));
    computeWorldPositions(skel);
    setSkeleton(skel);
    log('info', `Skeleton created with ${skel.bones.length} bones`);
  };

  const runIK = () => {
    const root = new Vec3(0, 1, 0);
    const target = new Vec3(ikTarget.x, ikTarget.y, 0);
    const result = solveIK(root, target, 0.8, 0.8);
    if (result) {
      setIkResult(`mid=(${result.mid.x.toFixed(2)}, ${result.mid.y.toFixed(2)}) end=(${result.end.x.toFixed(2)}, ${result.end.y.toFixed(2)})`);
      log('info', 'IK solved');
    }
  };

  return (
    <div className="panel curve-editor-panel">
      <div className="panel-header">
        <span className="panel-title">Animation Curves</span>
        <div className="panel-actions">
          <button className="panel-btn" onClick={addClip}>+ Clip</button>
        </div>
      </div>
      <div className="panel-body">
        <div className="curve-clips">
          {clips.length === 0 ? (
            <span className="curve-empty">No clips</span>
          ) : (
            clips.map((clip) => (
              <button
                key={clip.id}
                className={`clip-btn ${clip.id === activeClipId ? 'active' : ''}`}
                onClick={() => setActiveClipId(clip.id)}
              >
                {clip.name}
              </button>
            ))
          )}
        </div>

        {activeClip && (
          <div className="inspector-section">
            <label className="inspector-label">Add Key (Node Selected)</label>
            <div className="env-button-row">
              <button className="env-btn" onClick={() => addKeyToClip('position')}>Pos</button>
              <button className="env-btn" onClick={() => addKeyToClip('rotation')}>Rot</button>
              <button className="env-btn" onClick={() => addKeyToClip('scale')}>Scl</button>
            </div>
          </div>
        )}

        {activeClip && activeClip.tracks.length > 0 && (
          <div className="inspector-section">
            <label className="inspector-label">Interpolation</label>
            <Dropdown
              className="env-select"
              value={interpMode}
              options={INTERP_MODES.map((m) => ({ value: m as string, label: m }))}
              onChange={(v) => { setInterpMode(v as InterpolationMode); changeInterpolation(v as InterpolationMode); }}
            />
          </div>
        )}

        <div className="inspector-section">
          <label className="inspector-label">Skeleton Rig</label>
          {!skeleton ? (
            <button className="mesh-op-btn" onClick={createSkeleton}>Create Humanoid Rig</button>
          ) : (
            <div className="skeleton-info">{skeleton.bones.length} bones rigged</div>
          )}
        </div>

        <div className="inspector-section">
          <label className="inspector-label">IK Solver (2-bone)</label>
          <label className="inspector-sublabel">Target X</label>
          <div className="inspector-slider-row">
            <input
              className="inspector-slider"
              type="range"
              min="-1"
              max="2"
              step="0.05"
              value={ikTarget.x}
              onChange={(e) => setIkTarget({ ...ikTarget, x: parseFloat(e.target.value) })}
            />
            <span className="inspector-slider-value">{ikTarget.x.toFixed(2)}</span>
          </div>
          <label className="inspector-sublabel">Target Y</label>
          <div className="inspector-slider-row">
            <input
              className="inspector-slider"
              type="range"
              min="-1"
              max="2"
              step="0.05"
              value={ikTarget.y}
              onChange={(e) => setIkTarget({ ...ikTarget, y: parseFloat(e.target.value) })}
            />
            <span className="inspector-slider-value">{ikTarget.y.toFixed(2)}</span>
          </div>
          <button className="mesh-op-btn" onClick={runIK}>Solve IK</button>
          {ikResult && <div className="ik-result">{ikResult}</div>}
        </div>
      </div>
    </div>
  );
}

void Color;

