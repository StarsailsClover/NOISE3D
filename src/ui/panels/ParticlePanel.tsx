import { useEditorStore } from '@core/EditorStore';

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
                <div className="inspector-slider-row">
                  <input
                    className="inspector-slider"
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    value={emitter.emissionRate}
                    onChange={(e) =>
                      updateParticleEmitter(emitter.id, { emissionRate: parseInt(e.target.value) })
                    }
                  />
                  <span className="inspector-slider-value">{emitter.emissionRate}/s</span>
                </div>

                <label className="inspector-sublabel">Lifetime</label>
                <div className="inspector-slider-row">
                  <input
                    className="inspector-slider"
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.1"
                    value={emitter.particleLifetime}
                    onChange={(e) =>
                      updateParticleEmitter(emitter.id, { particleLifetime: parseFloat(e.target.value) })
                    }
                  />
                  <span className="inspector-slider-value">{emitter.particleLifetime.toFixed(1)}s</span>
                </div>

                <label className="inspector-sublabel">Start Speed</label>
                <div className="inspector-slider-row">
                  <input
                    className="inspector-slider"
                    type="range"
                    min="0.5"
                    max="20"
                    step="0.5"
                    value={emitter.startSpeed}
                    onChange={(e) =>
                      updateParticleEmitter(emitter.id, { startSpeed: parseFloat(e.target.value) })
                    }
                  />
                  <span className="inspector-slider-value">{emitter.startSpeed.toFixed(1)}</span>
                </div>

                <label className="inspector-sublabel">Gravity</label>
                <div className="inspector-slider-row">
                  <input
                    className="inspector-slider"
                    type="range"
                    min="-20"
                    max="0"
                    step="0.5"
                    value={emitter.gravity}
                    onChange={(e) =>
                      updateParticleEmitter(emitter.id, { gravity: parseFloat(e.target.value) })
                    }
                  />
                  <span className="inspector-slider-value">{emitter.gravity.toFixed(1)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
