import { useEffect } from 'react';
import { useOverlayStore } from '@core/OverlayStore';
import { SHORTCUTS } from './SHORTCUTS';

export function ShortcutHelp() {
  const open = useOverlayStore((s) => s.shortcutHelpOpen);
  const setOpen = useOverlayStore((s) => s.setShortcutHelp);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, setOpen]);

  if (!open) return null;

  const groups = Array.from(new Set(SHORTCUTS.map((s) => s.group)));

  return (
    <div className="help-overlay" onClick={() => setOpen(false)}>
      <div className="help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="help-header">
          <span>Keyboard Shortcuts</span>
          <button className="help-close" onClick={() => setOpen(false)}>x</button>
        </div>
        <div className="help-body">
          {groups.map((g) => (
            <div key={g} className="help-group">
              <div className="help-group-title">{g}</div>
              {SHORTCUTS.filter((s) => s.group === g).map((s) => (
                <div key={s.keys + s.description} className="help-row">
                  <span className="help-keys">{s.keys}</span>
                  <span className="help-desc">{s.description}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="help-footer">Press Esc to close</div>
      </div>
    </div>
  );
}
