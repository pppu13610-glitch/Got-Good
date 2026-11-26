import React, {useEffect, useRef} from 'react';

interface SunlitParticlesProps {
  paused?: boolean;
}

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

function createMoteSprite(warm: boolean): HTMLCanvasElement {
  const sprite = document.createElement('canvas');
  sprite.width = 32;
  sprite.height = 32;
  const sctx = sprite.getContext('2d');
  if (sctx) {
    const grad = sctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    if (warm) {
      grad.addColorStop(0, 'rgba(255, 241, 198, 1)');
      grad.addColorStop(0.5, 'rgba(255, 241, 198, 0.35)');
      grad.addColorStop(1, 'rgba(255, 241, 198, 0)');
    } else {
      grad.addColorStop(0, 'rgba(220, 236, 212, 1)');
      grad.addColorStop(0.5, 'rgba(220, 236, 212, 0.35)');
      grad.addColorStop(1, 'rgba(220, 236, 212, 0)');
    }
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 32, 32);
  }
  return sprite;
}

export const SunlitParticles: React.FC<SunlitParticlesProps> = ({
  paused = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || paused) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let frameId = 0;

    const warmSprite = createMoteSprite(true);
    const coolSprite = createMoteSprite(false);

    const resize = () => {
      const parent = canvas.parentElement;
      width = parent ? parent.clientWidth : window.innerWidth;
      height = parent ? parent.clientHeight : window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const motes: Mote[] = Array.from({length: 18}, (_, i) => ({
      x: Math.random() * Math.max(width, 400),
      y: Math.random() * Math.max(height, 300),
      r: 1.4 + (i % 4) * 0.85,
      vx: 4 + Math.random() * 8,
      vy: -(5 + Math.random() * 9),
      alpha: 0.2 + (i % 5) * 0.08,
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
        const size = m.r * 6.4;
        ctx.globalAlpha = m.alpha * twinkle;
        ctx.drawImage(
          m.warm ? warmSprite : coolSprite,
          m.x - size * 0.5,
          m.y - size * 0.5,
          size,
          size,
        );
      }
      ctx.globalAlpha = 1;

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
    };
  }, [paused]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
};
