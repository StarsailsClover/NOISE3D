import { useEditorStore } from '@core/EditorStore';
import { Slider } from '../widgets';

export function TimelinePanel() {
  const animationClips = useEditorStore((s) => s.animationClips);
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const setSelectedClip = useEditorStore((s) => s.setSelectedClip);
  const currentTime = useEditorStore((s) => s.currentTime);
  const isPlayingAnim = useEditorStore((s) => s.isPlayingAnim);
  const toggleAnimPlay = useEditorStore((s) => s.toggleAnimPlay);
  const setCurrentTime = useEditorStore((s) => s.setCurrentTime);
  const addAnimationClip = useEditorStore((s) => s.addAnimationClip);
  const addKeyframeAtCurrent = useEditorStore((s) => s.addKeyframeAtCurrent);
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId);
  const scene = useEditorStore((s) => s.scene);

  const selectedClip = animationClips.find((c) => c.id === selectedClipId);
  const duration = selectedClip?.duration ?? 5;

  return (
    <div className="panel timeline-panel">
      <div className="panel-header">
        <span className="panel-title">Animation Timeline</span>
        <div className="panel-actions">
          <button className="panel-btn" onClick={addAnimationClip} title="Add Clip">+ Clip</button>
          <button
            className={`panel-btn ${isPlayingAnim ? 'active' : ''}`}
            onClick={toggleAnimPlay}
            title="Play/Pause"
          >
            {isPlayingAnim ? 'Pause' : 'Play'}
          </button>
        </div>
      </div>
      <div className="panel-body timeline-body">
        {animationClips.length === 0 ? (
          <div className="timeline-empty">No animation clips. Click +Clip to create.</div>
        ) : (
          <>
            <div className="timeline-clips">
              {animationClips.map((clip) => (
                <button
                  key={clip.id}
                  className={`clip-btn ${selectedClipId === clip.id ? 'active' : ''}`}
                  onClick={() => setSelectedClip(clip.id)}
                >
                  {clip.name}
                </button>
              ))}
            </div>

            {selectedClip && (
              <>
                <div className="timeline-track">
                  <Slider
                    className="timeline-slider"
                    value={currentTime}
                    min={0}
                    max={duration}
                    step={0.01}
                    format={(v) => v.toFixed(2)}
                    onChange={(v) => setCurrentTime(v)}
                  />
                  <span className="timeline-time">
                    {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
                  </span>
                </div>

                <div className="timeline-keyframes">
                  <div className="keyframe-label">Keyframes:</div>
                  {selectedNodeId !== null && scene.getNode(selectedNodeId) && (
                    <div className="keyframe-buttons">
                      <button
                        className="keyframe-btn"
                        onClick={() => addKeyframeAtCurrent(selectedNodeId, 'position')}
                      >
                        + Pos
                      </button>
                      <button
                        className="keyframe-btn"
                        onClick={() => addKeyframeAtCurrent(selectedNodeId, 'rotation')}
                      >
                        + Rot
                      </button>
                      <button
                        className="keyframe-btn"
                        onClick={() => addKeyframeAtCurrent(selectedNodeId, 'scale')}
                      >
                        + Scl
                      </button>
                    </div>
                  )}
                </div>

                <div className="timeline-track-list">
                  {selectedClip.tracks.map((track, i) => (
                    <div key={i} className="timeline-track-item">
                      <span className="track-node">Node {track.nodeId}</span>
                      <span className="track-prop">{track.propertyName}</span>
                      <span className="track-keys">{track.keyframes.length} keys</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

