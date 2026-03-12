// Background/Background.jsx — Atmospheric canvas, unchanged logic, CSS extracted

import { useEffect, useRef } from "react";
import "./Background.css";

export const THEMES = {
  forest: { sky: [28, 52, 40], fog: [40, 68, 52], mist: [20, 38, 30] },
  forge: { sky: [38, 28, 18], fog: [58, 42, 22], mist: [24, 18, 10] },
  throne: { sky: [44, 38, 18], fog: [62, 52, 24], mist: [26, 22, 10] },
  library: { sky: [22, 30, 44], fog: [30, 40, 58], mist: [14, 20, 32] },
  mist: { sky: [32, 28, 42], fog: [44, 38, 56], mist: [20, 18, 30] },
  dusk: { sky: [42, 28, 22], fog: [58, 38, 28], mist: [28, 18, 14] },
  dawn: { sky: [24, 36, 46], fog: [34, 50, 62], mist: [16, 26, 36] },
  title: { sky: [14, 12, 22], fog: [22, 18, 36], mist: [10, 8, 18] },
};

const lerpColor = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;

export default function Background({ theme = "title" }) {
  const canvasRef = useRef();
  const themeRef = useRef(THEMES[theme] || THEMES.title);
  const targetRef = useRef(THEMES[theme] || THEMES.title);
  const progressRef = useRef(1);
  const rafRef = useRef();
  const timeRef = useRef(0);

  useEffect(() => {
    themeRef.current = { ...themeRef.current };
    targetRef.current = THEMES[theme] || THEMES.title;
    progressRef.current = 0;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let particles = [];

    const initParticles = (W, H) => {
      particles = Array.from({ length: 60 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 120 + 40,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -(Math.random() * 0.08 + 0.02),
        a: Math.random() * 0.06 + 0.01,
      }));
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const { width: W, height: H } = canvas;
      const t = timeRef.current;

      if (progressRef.current < 1)
        progressRef.current = Math.min(1, progressRef.current + 0.008);
      const p = progressRef.current;
      const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;

      const cur = themeRef.current;
      const tgt = targetRef.current;
      const sky = lerpColor(cur.sky, tgt.sky, ease);
      const fog = lerpColor(cur.fog, tgt.fog, ease);
      const mist = lerpColor(cur.mist, tgt.mist, ease);

      if (p >= 1) themeRef.current = { ...tgt };

      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, rgb(sky));
      grad.addColorStop(0.55, rgb(fog));
      grad.addColorStop(1, rgb(mist));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      const vig = ctx.createRadialGradient(
        W / 2,
        H / 2,
        H * 0.15,
        W / 2,
        H / 2,
        H * 0.85,
      );
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      particles.forEach((pt) => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        if (pt.y + pt.r < 0) {
          pt.y = H + pt.r;
          pt.x = Math.random() * W;
        }
        if (pt.x < -pt.r) {
          pt.x = W + pt.r;
        }
        if (pt.x > W + pt.r) {
          pt.x = -pt.r;
        }

        const breathe = 0.6 + 0.4 * Math.sin(t * 0.4 + pt.x * 0.01);
        const g2 = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pt.r);
        g2.addColorStop(
          0,
          `rgba(${fog[0] + 20},${fog[1] + 20},${fog[2] + 20},${pt.a * breathe})`,
        );
        g2.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g2;
        ctx.fillRect(pt.x - pt.r, pt.y - pt.r, pt.r * 2, pt.r * 2);
      });

      const band = ctx.createLinearGradient(0, H * 0.65, 0, H);
      const intensity = 0.12 + 0.05 * Math.sin(t * 0.25);
      band.addColorStop(0, "rgba(0,0,0,0)");
      band.addColorStop(1, `rgba(${fog[0]},${fog[1]},${fog[2]},${intensity})`);
      ctx.fillStyle = band;
      ctx.fillRect(0, 0, W, H);

      timeRef.current += 0.016;
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="background-canvas" />;
}
