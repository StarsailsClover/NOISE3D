import { useEffect, useRef } from 'react';

/**
 * Styled tooltips for toolbar-zone buttons. Reads the native title
 * attribute (so Playwright getByTitle keeps working), hides the native
 * tooltip while hovering by temporarily moving the attribute, and shows
 * a dark card after a 300 ms delay.
 */
export function TooltipLayer() {
  const layerRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  const lastEl = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const show = (el: HTMLElement) => {
      const layer = layerRef.current;
      if (!layer) return;
      const text = el.getAttribute('title');
      if (!text) return;
      lastEl.current = el;
      layer.textContent = text;
      layer.style.display = 'block';
      const r = el.getBoundingClientRect();
      const lw = layer.offsetWidth;
      let x = r.left + r.width / 2 - lw / 2;
      x = Math.max(6, Math.min(x, window.innerWidth - lw - 6));
      layer.style.left = `${x}px`;
      layer.style.top = `${r.bottom + 6}px`;
    };
    const hide = () => {
      const layer = layerRef.current;
      if (timer.current) { window.clearTimeout(timer.current); timer.current = null; }
      lastEl.current = null;
      if (layer) layer.style.display = 'none';
    };

    const ZONES = '.main-toolbar, .viewport-toolbar, .viewport-gizmo-controls, .viewport-camera-controls, .status-bar';
    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const el = target.closest?.('[title]') as HTMLElement | null;
      if (!el || !el.closest(ZONES) || el === lastEl.current) return;
      hide();
      timer.current = window.setTimeout(() => show(el), 300);
    };
    const onOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest?.(ZONES)) hide();
    };
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
    return () => {
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
      hide();
    };
  }, []);

  return <div ref={layerRef} className="tooltip-layer" style={{ display: 'none' }} />;
}
