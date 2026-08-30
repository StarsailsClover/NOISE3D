import { useEffect, useState } from 'react';

const STEPS = [
  { target: '.main-toolbar', title: 'Toolbar', text: 'Create primitives, save/load scenes, switch workspaces, and toggle play mode from here.' },
  { target: '.hierarchy-panel', title: 'Hierarchy', text: 'Every object in the scene. Click to select, drag to re-parent or reorder, right-click for actions.' },
  { target: '.viewport-container', title: 'Viewport', text: 'Left-click select, drag gizmo handles to transform, hold RMB and use WASD to fly, Alt+LMB to orbit.' },
  { target: '.inspector-panel', title: 'Inspector', text: 'Edit transform, material, and components. Drag field labels to scrub values; press ? anytime for shortcuts.' },
];

const FLAG = 'noise3d:tour-done';

export function Onboarding() {
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    let done = '1';
    try { done = localStorage.getItem(FLAG) ?? '0'; } catch { /* ignore */ }
    if (done === '0') setStep(0);
  }, []);

  const finish = () => {
    try { localStorage.setItem(FLAG, '1'); } catch { /* ignore */ }
    setStep(null);
    document.querySelectorAll('.tour-spotlight').forEach((el) => el.classList.remove('tour-spotlight'));
  };

  useEffect(() => {
    if (step === null) return;
    document.querySelectorAll('.tour-spotlight').forEach((el) => el.classList.remove('tour-spotlight'));
    const target = document.querySelector(STEPS[step].target);
    target?.classList.add('tour-spotlight');
  }, [step]);

  if (step === null) return null;

  const s = STEPS[step];
  return (
    <div className="tour-overlay" data-step={step} onClick={finish}>
      <div className="tour-card" onClick={(e) => e.stopPropagation()}>
        <div className="tour-step-count">Step {step + 1} / {STEPS.length}</div>
        <div className="tour-title">{s.title}</div>
        <div className="tour-text">{s.text}</div>
        <div className="tour-actions">
          <button className="tour-btn" onClick={finish}>Skip</button>
          {step > 0 && (
            <button className="tour-btn" onClick={() => setStep(step - 1)}>Back</button>
          )}
          <button
            className="tour-btn primary"
            onClick={() => (step >= STEPS.length - 1 ? finish() : setStep(step + 1))}
          >
            {step >= STEPS.length - 1 ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
