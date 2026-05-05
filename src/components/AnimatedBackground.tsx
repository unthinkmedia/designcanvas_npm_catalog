import { useState, useEffect, useRef, useCallback } from 'react';

/* ── animated mesh background ── */
const MESH_KEYFRAMES = `
@keyframes mesh-drift-1 {
  0%, 100% { transform: translate(0%, 0%) scale(1); }
  25%      { transform: translate(15%, -10%) scale(1.1); }
  50%      { transform: translate(-5%, 15%) scale(0.95); }
  75%      { transform: translate(-15%, -5%) scale(1.05); }
}
@keyframes mesh-drift-2 {
  0%, 100% { transform: translate(0%, 0%) scale(1); }
  25%      { transform: translate(-20%, 10%) scale(1.05); }
  50%      { transform: translate(10%, -15%) scale(1.1); }
  75%      { transform: translate(5%, 20%) scale(0.9); }
}
@keyframes mesh-drift-3 {
  0%, 100% { transform: translate(0%, 0%) scale(1.05); }
  25%      { transform: translate(10%, 15%) scale(0.95); }
  50%      { transform: translate(-15%, -10%) scale(1.1); }
  75%      { transform: translate(20%, -5%) scale(1); }
}
@keyframes mesh-drift-4 {
  0%, 100% { transform: translate(0%, 0%) scale(0.95); }
  33%      { transform: translate(-10%, -15%) scale(1.1); }
  66%      { transform: translate(15%, 10%) scale(1); }
}
`;

const blobs: { color: string; size: string; top: string; left: string; animation: string }[] = [
  { color: 'rgba(99, 102, 241, 0.18)',  size: '55%', top: '-15%', left: '-10%', animation: 'mesh-drift-1 18s ease-in-out infinite' },
  { color: 'rgba(59, 130, 246, 0.14)',  size: '50%', top: '10%',  left: '55%',  animation: 'mesh-drift-2 22s ease-in-out infinite' },
  { color: 'rgba(139, 92, 246, 0.16)',  size: '45%', top: '40%',  left: '20%',  animation: 'mesh-drift-3 20s ease-in-out infinite' },
  { color: 'rgba(6, 182, 212, 0.12)',   size: '40%', top: '-10%', left: '70%',  animation: 'mesh-drift-4 24s ease-in-out infinite' },
  { color: 'rgba(168, 85, 247, 0.10)',  size: '35%', top: '50%',  left: '65%',  animation: 'mesh-drift-1 26s ease-in-out infinite reverse' },
];

export function MeshBackground() {
  const injected = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (injected.current) return;
    injected.current = true;
    const style = document.createElement('style');
    style.textContent = MESH_KEYFRAMES;
    document.head.appendChild(style);
    return () => { style.remove(); };
  }, []);

  useEffect(() => {
    const el = containerRef.current?.parentElement;
    if (!el) return;

    let raf = 0;
    const handleMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        setOffset({ x, y });
      });
    };

    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', () => setOffset({ x: 0, y: 0 }));
    return () => {
      el.removeEventListener('mousemove', handleMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const depths = [12, 8, 15, 6, 10];

  return (
    <div ref={containerRef} style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      filter: 'blur(60px) saturate(1.5)',
      pointerEvents: 'none',
    }}>
      {blobs.map((b, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: b.size,
          height: b.size,
          top: b.top,
          left: b.left,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
          animation: b.animation,
          willChange: 'transform',
          translate: `${offset.x * depths[i]}px ${offset.y * depths[i]}px`,
          transition: 'translate 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
        }} />
      ))}
    </div>
  );
}

/* ── 3D wireframe mesh trail ── */
const GRID_COLS = 40;
const GRID_ROWS = 24;
const INFLUENCE_RADIUS = 140;
const LIFT_STRENGTH = 35;
const TRAIL_DECAY = 0.95;
const LERP_SPEED = 0.06;

export function WireframeMesh() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -1000, y: -1000 });
  const trail = useRef<Float32Array | null>(null);
  const target = useRef<Float32Array | null>(null);
  const time = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    time.current += 0.008;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    }

    const cellW = w / (GRID_COLS - 1);
    const gridH = h * 1.3;
    const cellH = gridH / (GRID_ROWS - 1);
    const gridOffsetY = -h * 0.05;
    const count = GRID_COLS * GRID_ROWS;

    if (!trail.current || trail.current.length !== count) {
      trail.current = new Float32Array(count);
    }
    if (!target.current || target.current.length !== count) {
      target.current = new Float32Array(count);
    }

    const mx = mouse.current.x;
    const my = mouse.current.y;
    const t = time.current;

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const idx = row * GRID_COLS + col;
        const px = col * cellW;
        const py = row * cellH + gridOffsetY;

        const wave =
          Math.sin(col * 0.3 + t * 1.2) * 3.5 +
          Math.sin(row * 0.4 + t * 0.9) * 2.5 +
          Math.sin((col + row) * 0.2 + t * 1.6) * 2.0;

        const dx = px - mx;
        const dy = py - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let mouseInfluence = 0;
        if (dist < INFLUENCE_RADIUS) {
          const nt = 1 - dist / INFLUENCE_RADIUS;
          mouseInfluence = nt * nt * (3 - 2 * nt) * LIFT_STRENGTH;
        }

        target.current[idx] = Math.max(wave, target.current[idx] * TRAIL_DECAY, mouseInfluence);
        trail.current[idx] += (target.current[idx] - trail.current[idx]) * LERP_SPEED;
      }
    }

    ctx.clearRect(0, 0, w, h);

    const cx = w * 0.5;
    const horizon = h * -0.3;
    const fov = h * 1.0;
    const tiltX = 0.42;

    const project = (x: number, y: number, z: number) => {
      const pivotY = h * 0.65;
      const ry = (y - pivotY);
      const rz = z;
      const cosT = Math.cos(tiltX);
      const sinT = Math.sin(tiltX);
      const ty = ry * cosT - rz * sinT + pivotY;
      const tz = ry * sinT + rz * cosT;

      const depth = fov / (fov + tz * 2);
      return {
        x: cx + (x - cx) * depth,
        y: horizon + (ty - horizon) * depth,
        d: depth,
      };
    };

    const projected = new Array(count);
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const idx = row * GRID_COLS + col;
        projected[idx] = project(col * cellW, row * cellH + gridOffsetY, trail.current[idx]);
      }
    }

    for (let row = GRID_ROWS - 1; row >= 0; row--) {
      for (let col = 0; col < GRID_COLS; col++) {
        const idx = row * GRID_COLS + col;
        const z = trail.current[idx];
        const p = projected[idx];
        const lift = Math.min(Math.abs(z) / LIFT_STRENGTH, 1);

        const depthAlpha = (1 - row / GRID_ROWS) * 0.5;
        const lineW = (0.4 + lift * 1.5) * p.d;

        if (col < GRID_COLS - 1) {
          const np = projected[idx + 1];
          const nz = trail.current[idx + 1];
          const nLift = Math.min(Math.abs(nz) / LIFT_STRENGTH, 1);
          const avgLift = (lift + nLift) * 0.5;
          const la = 0.03 + depthAlpha * 0.08 + avgLift * 0.4;

          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(np.x, np.y);
          ctx.strokeStyle = `rgba(139, 92, 246, ${la})`;
          ctx.lineWidth = lineW;
          ctx.stroke();

          if (avgLift > 0.15) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(np.x, np.y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${avgLift * 0.15})`;
            ctx.lineWidth = lineW * 3;
            ctx.stroke();
          }
        }

        if (row < GRID_ROWS - 1) {
          const nIdx = (row + 1) * GRID_COLS + col;
          const np = projected[nIdx];
          const nz = trail.current[nIdx];
          const nLift = Math.min(Math.abs(nz) / LIFT_STRENGTH, 1);
          const avgLift = (lift + nLift) * 0.5;
          const la = 0.03 + depthAlpha * 0.08 + avgLift * 0.35;

          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(np.x, np.y);
          ctx.strokeStyle = `rgba(99, 102, 241, ${la})`;
          ctx.lineWidth = lineW * 0.8;
          ctx.stroke();

          if (avgLift > 0.15) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(np.x, np.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${avgLift * 0.12})`;
            ctx.lineWidth = lineW * 2.5;
            ctx.stroke();
          }
        }

        if (lift > 0.08) {
          const dotSize = (1.2 + lift * 3) * p.d;
          ctx.beginPath();
          ctx.arc(p.x, p.y, dotSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200, 160, 255, ${lift * 0.5})`;
          ctx.fill();

          if (lift > 0.3) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, dotSize * 2.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(168, 85, 247, ${lift * 0.08})`;
            ctx.fill();
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    let running = true;
    const loop = () => {
      if (!running) return;
      draw();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return () => { running = false; };
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const hero = canvas.closest('[data-hero]') as HTMLElement | null;
    if (!hero) return;

    const handleMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const margin = 60;
      if (x > -margin && x < rect.width + margin && y > -margin && y < rect.height + margin) {
        mouse.current = { x, y };
      } else {
        mouse.current = { x: -1000, y: -1000 };
      }
    };

    document.addEventListener('mousemove', handleMove);
    return () => {
      document.removeEventListener('mousemove', handleMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
        opacity: 0.45,
      }}
    />
  );
}
