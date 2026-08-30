import { useEditorStore } from '@core/EditorStore';
import { Slider } from '../widgets';

export function ParticlePanel() {
  const emitters = useEditorStore((s) => s.particleEmitters);
  const addParticleEmitter = useEditorStore((s) => s.addParticleEmitter);
  const removeParticleEmitter = useEditorStore((s) => s.removeParticleEmitter);
  const updateParticleEmitter = useEditorStore((s) => s.updateParticleEmitter);

  return (
    <div className="panel particle-panel">
      <div className="panel-header">
        <span className="panel-title">Particles</span>
        <div className="panel-actions">
          <button className="panel-btn" onClick={addParticleEmitter} title="Add Particle System">+</button>
        </div>
      </div>
      <div className="panel-body">
        {emitters.length === 0 ? (
          <div className="particle-empty">No particle systems.</div>
        ) : (
          emitters.map((emitter) => (
            <div key={emitter.id} className="particle-item">
              <div className="particle-item-header">
                <span className="particle-label">{emitter.name}</span>
                <button
                  className="particle-delete"
                  onClick={() => removeParticleEmitter(emitter.id)}
                >
                  x
                </button>
              </div>
              <div className="inspector-section">
                <label className="inspector-sublabel">Emission Rate</label>
                <Slider
                  className="inspector-slider"
                  value={emitter.emissionRate}
                  min={1}
                  max={100}
                  step={1}
                  format={(v) => `${v.toFixed(0)}/s`}
                  onChange={(v) => updateParticleEmitter(emitter.id, { emissionRate: v })}
                />

                <label className="inspector-sublabel">Lifetime</label>
                <Slider
                  className="inspector-slider"
                  value={emitter.particleLifetime}
                  min={0.5}
                  max={10}
                  step={0.1}
                  format={(v) => `${v.toFixed(1)}s`}
                  onChange={(v) => updateParticleEmitter(emitter.id, { particleLifetime: v })}
                />

                <label className="inspector-sublabel">Start Speed</label>
                <Slider
                  className="inspector-slider"
                  value={emitter.startSpeed}
                  min={0.5}
                  max={20}
                  step={0.5}
                  onChange={(v) => updateParticleEmitter(emitter.id, { startSpeed: v })}
                />

                <label className="inspector-sublabel">Gravity</label>
                <Slider
                  className="inspector-slider"
                  value={emitter.gravity}
                  min={-20}
                  max={0}
                  step={0.5}
                  onChange={(v) => updateParticleEmitter(emitter.id, { gravity: v })}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

