import { useEffect, useRef, useState } from 'react';

export interface NumberFieldProps {
  value: number;
  onCommit: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  precision?: number;
  className?: string;
  disabled?: boolean;
  title?: string;
  /** Called once when a scrub gesture actually starts (first movement). */
  onDragStart?: () => void;
}

type Mode = 'idle' | 'scrub' | 'edit';

/**
 * Blender-style numeric field.
 *
 * Idle:        hover shows < > steppers; cursor is ew-resize.
 * Scrub:       LMB-drag horizontally changes value live.
 *              Ctrl quantizes to step; Shift = precision (0.1x rate).
 * Edit:        plain click (no drag) enters text entry.
 *              Enter/click-outside commits; Esc reverts; invalid input
 *              flashes red and reverts.
 * Keys (idle): Up/Down nudge by step (Shift x10, Alt x0.1);
 *              Ctrl+Wheel steps; Minus negates.
 */
export function NumberField({
  value,
  onCommit,
  step = 0.1,
  min,
  max,
  precision = 2,
  className = '',
  disabled = false,
  title,
  onDragStart,
}: NumberFieldProps) {
  const [mode, setMode] = useState<Mode>('idle');
  const [draft, setDraft] = useState('');
  const [flash, setFlash] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // scrub session (refs so window listeners see fresh data)
  const scrub = useRef({ active: false, moved: false, startX: 0, startVal: 0 });

  const clamp = (v: number) => {
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    return v;
  };

  const fmt = (v: number) => {
    if (Object.is(v, -0)) v = 0;
    return v.toFixed(precision);
  };

  const commit = (v: number) => {
    onCommit(clamp(v));
  };

  const nudge = (dir: 1 | -1, mult: number) => {
    commit(clamp(value + dir * step * mult));
  };

  const enterEdit = () => {
    if (disabled) return;
    setDraft(fmt(value));
    setMode('edit');
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  };

  const commitDraft = () => {
    const parsed = parseFloat(draft);
    if (Number.isNaN(parsed)) {
      setFlash(true);
      window.setTimeout(() => setFlash(false), 450);
      setMode('idle');
      return; // revert silently
    }
    commit(clamp(parsed));
    setMode('idle');
  };

  const revertDraft = () => setMode('idle');

  // ---- scrub handling ----
  const onFieldMouseDown = (e: React.MouseEvent) => {
    if (disabled || e.button !== 0 || mode === 'edit') return;
    e.preventDefault();
    scrub.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startVal: value,
    };
    const onMove = (ev: MouseEvent) => {
      if (!scrub.current.active) return;
      const dx = ev.clientX - scrub.current.startX;
      if (!scrub.current.moved && Math.abs(dx) < 3) return;
      if (!scrub.current.moved) onDragStart?.();
      scrub.current.moved = true;
      setMode('scrub');
      const rate = step * (ev.shiftKey ? 0.1 : 1);
      let v = scrub.current.startVal + dx * rate;
      if (ev.ctrlKey) v = Math.round(v / step) * step;
      commit(clamp(v));
    };
    const onUp = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      if (!scrub.current.active) return;
      const moved = scrub.current.moved;
      scrub.current.active = false;
      if (!moved) {
        enterEdit();
      } else {
        setMode('idle');
      }
      void ev;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // ---- idle keyboard ----
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (mode === 'edit') {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitDraft();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        revertDraft();
      }
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      nudge(1, e.shiftKey ? 10 : e.altKey ? 0.1 : 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      nudge(-1, e.shiftKey ? 10 : e.altKey ? 0.1 : 1);
    } else if (e.key === '-') {
      commit(clamp(-value));
    }
  };

  // Ctrl+Wheel steps while hovering
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey || mode === 'edit' || disabled) return;
      e.preventDefault();
      nudge(e.deltaY < 0 ? 1 : -1, 1);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, step, min, max, mode, disabled]);

  const stepBy = (dir: 1 | -1) => commit(clamp(value + dir * step));

  if (mode === 'edit') {
    return (
      <input
        ref={inputRef}
        className={`${className} numfield-editing ${flash ? 'numfield-flash' : ''}`}
        type="text"
        value={draft}
        disabled={disabled}
        title={title}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitDraft}
        onKeyDown={onKeyDown}
      />
    );
  }

  return (
    <div
      ref={wrapRef}
      className={`numfield ${className} ${flash ? 'numfield-flash' : ''}`}
      title={title}
      onMouseDown={onFieldMouseDown}
      onKeyDown={onKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="spinbutton"
      aria-valuenow={value}
      data-numberfield
    >
      <button
        className="numfield-arrow left"
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); stepBy(-1); }}
        disabled={disabled}
      >
        {'<'}
      </button>
      <input
        className="numfield-display"
        type="text"
        value={fmt(value)}
        readOnly
        disabled={disabled}
      />
      <button
        className="numfield-arrow right"
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); stepBy(1); }}
        disabled={disabled}
      >
        {'>'}
      </button>
    </div>
  );
}

