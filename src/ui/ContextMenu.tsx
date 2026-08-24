import { useEffect, useState } from 'react';
import { useOverlayStore } from '@core/OverlayStore';

export function ContextMenu() {
  const menu = useOverlayStore((s) => s.menu);
  const closeMenu = useOverlayStore((s) => s.closeMenu);
  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive(0);
  }, [menu]);

  useEffect(() => {
    if (!menu?.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setActive((a) => Math.min(a + 1, menu.items.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setActive((a) => Math.max(a - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        const item = menu.items[active];
        if (item) {
          closeMenu();
          item.action();
        }
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [menu, active, closeMenu]);

  if (!menu?.open) return null;

  const W = 210;
  const x = Math.min(menu.x, window.innerWidth - W - 8);
  const estH = menu.items.length * 26 + 8;
  const y = Math.min(menu.y, window.innerHeight - estH - 8);

  return (
    <>
      <div className="ctx-overlay" onMouseDown={closeMenu} onContextMenu={(e) => { e.preventDefault(); closeMenu(); }} />
      <div className="ctx-menu" style={{ left: x, top: y, width: W }}>
        {menu.items.map((item, i) => (
          <div key={item.label}>
            {item.separatorBefore && <div className="ctx-sep" />}
            <div
              className={`ctx-item ${item.danger ? 'danger' : ''} ${i === active ? 'active' : ''}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => { closeMenu(); item.action(); }}
            >
              <span>{item.label}</span>
              {item.shortcut && <span className="ctx-keys">{item.shortcut}</span>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
