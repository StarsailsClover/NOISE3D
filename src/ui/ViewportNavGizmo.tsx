import { useEffect, useRef } from 'react';
import type { OrbitCamera, ViewPreset } from '@engine/OrbitCamera';

// GitHub@NDBlockConnect | BlockConnect@StarsailsClover

interface BallDef {
  id: string;
  axis: 'x' | 'y' | 'z';
  sign: 1 | -1;
  color: string;
  label: string;
  preset: ViewPreset;
}

const BALLS: BallDef[] = [
  { id: 'px', axis: 'x', sign: 1, color: '#e05555', label: 'X', preset: 'right' },
  { id: 'nx', axis: 'x', sign: -1, color: '#7a3030', label: '-X', preset: 'left' },
  { id: 'py', axis: 'y', sign: 1, color: '#55c455', label: 'Y', preset: 'top' },
  { id: 'ny', axis: 'y', sign: -1, color: '#2e6e2e', label: '-Y', preset: 'bottom' },
  { id: 'pz', axis: 'z', sign: 1, color: '#5588e0', label: 'Z', preset: 'front' },
  { id: 'nz', axis: 'z', sign: -1, color: '#2e4a7a', label: '-Z', preset: 'back' },
];

const AXIS: Record<string, { x: number; y: number; z: number }> = {
  x: { x: 1, y: 0, z: 0 },
  y: { x: 0, y: 1, z: 0 },
  z: { x: 0, y: 0, z: 1 },
};

/**
 * Blender/Unity-style navigation axis gizmo (top-right of viewport).
 * Click a ball to snap to that axis view; drag the background to orbit.
 * Positions are updated via direct DOM writes (no React re-render per
 * frame) for stability and performance.
 */
export function ViewportNavGizmo({ cameraRef }: { cameraRef: React.MutableRefObject<OrbitCamera | undefined | null> }) {
  const ballRefs = useRef<Record<string, SVGGElement | null>>({});
  const stalkRefs = useRef<Record<string, SVGLineElement | null>>({});

  useEffect(() => {
    let raf = 0;
    const R = 34;
    const cx = 44;
    const cy = 44;

    let lastAz = NaN;
    let lastEl = NaN;
    const loop = () => {
      const cam = cameraRef.current;
      if (cam && !cam.flying) {
        if (cam.azimuth === lastAz && cam.elevation === lastEl) {
          raf = requestAnimationFrame(loop);
          return;
        }
        lastAz = cam.azimuth;
        lastEl = cam.elevation;
        const az = cam.azimuth;
        const el = cam.elevation;
        // Camera right and up basis vectors in world space
        const rightX = Math.cos(az);
        const rightZ = -Math.sin(az);
        const upY = Math.cos(el);
        // depth component: how much an axis points toward/away from camera
        const fwdX = Math.sin(az + Math.PI / 2) * Math.cos(el);
        const fwdY = Math.sin(el);
        const fwdZ = Math.cos(az + Math.PI / 2) * Math.cos(el);

        for (const b of BALLS) {
          const a = AXIS[b.axis];
          const vx = a.x * b.sign;
          const vy = a.y * b.sign;
          const vz = a.z * b.sign;

          const sx = vx * rightX + vz * rightZ;
          const sy = vy * upY;
          const depth = vx * fwdX + vy * fwdY + vz * fwdZ;

          const px = cx + sx * R;
          const py = cy - sy * R;

          const g = ballRefs.current[b.id];
          const stalk = stalkRefs.current[b.id];
          if (g) {
            g.setAttribute('transform', `translate(${px}, ${py})`);
            g.style.opacity = depth > 0 ? '1' : '0.45';
          }
          if (stalk) {
            stalk.setAttribute('x2', `${px}`);
            stalk.setAttribute('y2', `${py}`);
          }
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [cameraRef]);

  return (
    <svg className="nav-gizmo" width={88} height={88}>
      {BALLS.map((b) => (
        <line
          key={`s-${b.id}`}
          ref={(el) => { stalkRefs.current[b.id] = el; }}
          x1={44}
          y1={44}
          stroke={b.color}
          strokeWidth={1.5}
          opacity={0.7}
        />
      ))}
      {BALLS.map((b) => (
        <g
          key={b.id}
          ref={(el) => { ballRefs.current[b.id] = el; }}
          data-ball={b.id}
          className="nav-ball"
          style={{ cursor: 'pointer' }}
          onClick={() => cameraRef.current?.setView(b.preset)}
        >
          <circle r={9} fill={b.color} stroke="rgba(0,0,0,0.5)" strokeWidth={1} />
          <text y={3} textAnchor="middle" fontSize={8} fill="#fff" style={{ pointerEvents: 'none' }}>
            {b.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

