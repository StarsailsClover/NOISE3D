import { useEffect, useMemo, useRef, useState } from 'react';
import { useOverlayStore } from '@core/OverlayStore';
import { buildCommands, fuzzyRank, type CommandDef } from './commands';

// GitHub@NDBlockConnect | BlockConnect@StarsailsClover

export function CommandPalette() {
  const open = useOverlayStore((s) => s.paletteOpen);
  const setOpen = useOverlayStore((s) => s.setPaletteOpen);
  const recent = useOverlayStore((s) => s.recentCommands);
  const pushRecent = useOverlayStore((s) => s.pushRecentCommand);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const all = useMemo(() => buildCommands(), [open]);

  const filtered: CommandDef[] = useMemo(() => {
    if (!query.trim()) {
      // Recent first, then registry order
      const recents = recent
        .map((id) => all.find((c) => c.id === id))
        .filter((c): c is CommandDef => !!c);
      const rest = all.filter((c) => !recent.includes(c.id));
      return [...recents, ...rest];
    }
    return all
      .map((c) => ({ c, r: Math.min(fuzzyRank(query, c.label), fuzzyRank(query, c.group) + 50) }))
      .filter((x) => x.r >= 0)
      .sort((a, b) => a.r - b.r)
      .map((x) => x.c);
  }, [query, all, recent]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  // Keep active item in view
  useEffect(() => {
    const el = listRef.current?.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [active, filtered.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setActive((a) => Math.min(a + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setActive((a) => Math.max(a - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        const cmd = filtered[active];
        if (cmd) {
          setOpen(false);
          pushRecent(cmd.id);
          cmd.run();
        }
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, filtered, active, setOpen, pushRecent]);

  if (!open) return null;

  const showRecent = !query.trim() && recent.length > 0;
  let rendered = 0;

  return (
    <div className="palette-overlay" onMouseDown={() => setOpen(false)}>
      <div className="palette" onMouseDown={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="palette-input"
          placeholder="Type a command..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          spellCheck={false}
        />
        <div className="palette-list" ref={listRef}>
          {filtered.length === 0 && (
            <div className="palette-empty">No matching commands</div>
          )}
          {filtered.map((cmd, i) => {
            const isRecentHeader =
              showRecent && i === recent.filter((id) => all.some((c) => c.id === id)).length;
            const nodes: JSX.Element[] = [];
            if (isRecentHeader) {
              nodes.push(
                <div key="recent-hdr" className="palette-group">Recent</div>,
              );
            }
            nodes.push(
              <div
                key={cmd.id}
                className={`palette-item ${i === active ? 'active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => { setOpen(false); pushRecent(cmd.id); cmd.run(); }}
              >
                <span className="palette-label">{cmd.label}</span>
                {cmd.keys && <span className="palette-keys">{cmd.keys}</span>}
              </div>,
            );
            rendered += 1;
            void rendered;
            return nodes;
          })}
        </div>
        <div className="palette-footer">Enter run 路 Arrows navigate 路 Esc close</div>
      </div>
    </div>
  );
}

