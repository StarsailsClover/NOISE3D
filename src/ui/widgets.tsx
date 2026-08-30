import { useCallback, useEffect, useRef, useState } from 'react';

// GitHub@NDBlockConnect | BlockConnect@StarsailsClover

/* ============================================================
   NOISE3D custom widget library -- no native H5 controls.
   Blender-style: dark theme, filled slider tracks, hover
   steppers, styled popups. All keyboard accessible.
   ============================================================ */

/* ---------------- Slider ---------------- */

export interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  title?: string;
  className?: string;
}

/**
 * Blender-style slider: the entire track is draggable; a filled bar
 * shows the value; `<` `>` steppers appear on hover; Shift = precision
 * (0.1x rate), Ctrl = snap to step. Arrow keys nudge when focused.
 */
export function Slider({
  value,
  min,
  max,
  step = 0.01,
  onChange,
  format,
  title,
  className = '',
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const fmt = format ?? ((v: number) => v.toFixed(2));
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));

  const setFromClientX = useCallback(
    (clientX: number, precision: boolean, snap: boolean) => {
      const el = trackRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      let t = (clientX - r.left) / r.width;
      t = Math.max(0, Math.min(1, t));
      let v = min + t * (max - min);
      if (snap) v = Math.round(v / step) * step;
      else if (!precision) v = Math.round(v / step) * step;
      else v = Math.round(v / (step * 0.1)) * step * 0.1;
      v = Math.max(min, Math.min(max, v));
      onChange(parseFloat(v.toFixed(6)));
    },
    [min, max, step, onChange],
  );

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setFromClientX(e.clientX, e.shiftKey, e.ctrlKey);
    const onMove = (ev: MouseEvent) =>
      setFromClientX(ev.clientX, ev.shiftKey, ev.ctrlKey);
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const nudge = (dir: 1 | -1) =>
    onChange(parseFloat(Math.max(min, Math.min(max, value + dir * step)).toFixed(6)));

  return (
    <div
      ref={trackRef}
      className={`w-slider ${className}`}
      title={title}
      role="slider"
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onKeyDown={(e) => {
        const mult = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
        if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
          e.preventDefault();
          nudge(1 * mult as 1);
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
          e.preventDefault();
          nudge(-1 * mult as -1);
        }
      }}
    >
      <div className="w-slider-fill" style={{ width: `${pct * 100}%` }} />
      <span className="w-slider-text">{fmt(value)}</span>
      {hover && (
        <>
          <button
            className="w-slider-arrow left"
            tabIndex={-1}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); nudge(-1); }}
          >
            {'<'}
          </button>
          <button
            className="w-slider-arrow right"
            tabIndex={-1}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); nudge(1); }}
          >
            {'>'}
          </button>
        </>
      )}
    </div>
  );
}

/* ---------------- Dropdown ---------------- */

export interface DropdownOption<V extends string = string> {
  value: V;
  label: string;
}

export interface DropdownProps<V extends string = string> {
  value: V;
  options: DropdownOption<V>[];
  onChange: (v: V) => void;
  className?: string;
  title?: string;
}

/** Styled popup listbox replacing native <select>. */
export function Dropdown<V extends string = string>({
  value,
  options,
  onChange,
  className = '',
  title,
}: DropdownProps<V>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  const current = options.find((o) => o.value === value);

  return (
    <div ref={rootRef} className={`w-dropdown ${className}`} title={title}>
      <button
        type="button"
        className="w-dropdown-btn"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{current?.label ?? value}</span>
        <span className="w-dropdown-caret">{'\u25BE'}</span>
      </button>
      {open && (
        <div className="w-dropdown-pop" role="listbox">
          {options.map((o) => (
            <div
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              className={`w-dropdown-item ${o.value === value ? 'active' : ''}`}
              onClick={() => { onChange(o.value); setOpen(false); }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Toggle ---------------- */

export interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  title?: string;
}

/** Blender-style checkbox: small square with a check, label at side. */
export function Toggle({ checked, onChange, label, title }: ToggleProps) {
  return (
    <div
      className="w-toggle"
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      title={title}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onChange(!checked);
        }
      }}
    >
      <span className={`w-toggle-box ${checked ? 'on' : ''}`}>
        {checked ? '\u2713' : ''}
      </span>
      <span className="w-toggle-label">{label}</span>
    </div>
  );
}

/* ---------------- ColorSwatch ---------------- */

export interface ColorSwatchProps {
  value: string; // #rrggbb
  onChange: (v: string) => void;
  className?: string;
  title?: string;
}

/** Styled swatch; opens the native color dialog from a hidden input. */
export function ColorSwatch({ value, onChange, className = '', title }: ColorSwatchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <button
      type="button"
      className={`w-color ${className}`}
      style={{ background: value }}
      title={title}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
        tabIndex={-1}
      />
    </button>
  );
}

// GitHub@NDBlockConnect | BlockConnect@StarsailsClover
