import React, {useEffect, useRef} from 'react';

interface Mote {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  alpha: number;
  phase: number;
  warm: boolean;
}

export const SunlitParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let frameId = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      width = parent ? parent.clientWidth : window.innerWidth;
      height = parent ? parent.clientHeight : window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const motes: Mote[] = Array.from({length: 26}, (_, i) => ({
      x: Math.random() * Math.max(width, 400),
      y: Math.random() * Math.max(height, 300),
      r: 1.3 + (i % 4) * 0.85,
      vx: 4 + Math.random() * 8,
      vy: -(5 + Math.random() * 9),
      alpha: 0.18 + (i % 5) * 0.08,
      phase: Math.random() * Math.PI * 2,
      warm: i % 3 !== 0,
    }));

    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      ctx.clearRect(0, 0, width, height);

      for (const m of motes) {
        m.phase += dt * 1.1;
        m.x += (m.vx + Math.sin(m.phase) * 4) * dt;
        m.y += m.vy * dt;

        if (m.y < -12) m.y = height + 12;
        if (m.x > width + 12) m.x = -12;
        if (m.x < -12) m.x = width + 12;

        const twinkle = 0.65 + 0.35 * Math.sin(m.phase * 1.6);
        const a = m.alpha * twinkle;

        const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 3.2);
        if (m.warm) {
          grad.addColorStop(0, `rgba(255, 241, 198, ${a})`);
          grad.addColorStop(1, 'rgba(255, 241, 198, 0)');
        } else {
          grad.addColorStop(0, `rgba(220, 236, 212, ${a})`);
          grad.addColorStop(1, 'rgba(220, 236, 212, 0)');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r * 3.2, 0, Math.PI * 2);
        ctx.fill();
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
};
