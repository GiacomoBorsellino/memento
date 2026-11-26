// Background/Background.jsx — Atmospheric canvas with smooth theme transitions

import { useEffect, useRef } from "react";
import { THEMES } from "./themes.js";
import "./Background.css";

const lerpColor = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;

// Touch devices get half the raindrops (same check as music.js LITE mode).
const RAIN_DROPS =
  typeof window !== "undefined" && window.matchMedia?.("(hover: none)").matches
    ? 70
    : 140;
const RAIN_SLANT = 0.18; // horizontal drift per pixel of fall (wind from the sea)

const newDrop = (W, H, anywhere) => ({
  x: Math.random() * (W + H * RAIN_SLANT),
  y: anywhere ? Math.random() * H : -Math.random() * 40,
  len: Math.random() * 14 + 10,
  speed: Math.random() * 6 + 9,
});

export default function Background({ theme = "title" }) {
  const canvasRef = useRef();
  const fromRef = useRef(THEMES[theme] || THEMES.title); // transition start
  const targetRef = useRef(THEMES[theme] || THEMES.title); // transition end
  const shownRef = useRef(THEMES[theme] || THEMES.title); // colours on screen now
  const progressRef = useRef(1);
  const rafRef = useRef();
  const timeRef = useRef(0);

  // On theme change, start the new transition from the colours currently
  // drawn — so switching mid-transition doesn't jump back to the old theme.
  useEffect(() => {
    fromRef.current = shownRef.current;
    targetRef.current = THEMES[theme] || THEMES.title;
    progressRef.current = 0;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let particles = [];
    let drops = [];

    const initParticles = (W, H) => {
      particles = Array.from({ length: 60 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 120 + 40,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -(Math.random() * 0.08 + 0.02),
        a: Math.random() * 0.06 + 0.01,
      }));
      drops = Array.from({ length: RAIN_DROPS }, () => newDrop(W, H, true));
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

      const from = fromRef.current;
      const tgt = targetRef.current;
      const sky = lerpColor(from.sky, tgt.sky, ease);
      const fog = lerpColor(from.fog, tgt.fog, ease);
      const mist = lerpColor(from.mist, tgt.mist, ease);
      const fromRain = from.rain ?? 0;
      const rain = fromRain + ((tgt.rain ?? 0) - fromRain) * ease;
      const fromHaze = from.haze ?? 0;
      const haze = fromHaze + ((tgt.haze ?? 0) - fromHaze) * ease;
      shownRef.current = { sky, fog, mist, rain, haze };
      const fogAlpha = 1 + 2.5 * haze; // thicker fog banks with "haze"

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
          `rgba(${fog[0] + 20},${fog[1] + 20},${fog[2] + 20},${pt.a * breathe * fogAlpha})`,
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

      // Rain: thin slanted streaks, all in one path and one stroke() so a
      // hundred drops cost about as much as a single line. Skipped entirely
      // when no rain is showing; while it fades in/out, fewer drops are drawn.
      if (rain > 0.01) {
        const visible = Math.round(drops.length * rain);
        ctx.beginPath();
        for (let i = 0; i < drops.length; i++) {
          const d = drops[i];
          d.y += d.speed;
          d.x -= d.speed * RAIN_SLANT;
          if (d.y - d.len > H) Object.assign(d, newDrop(W, H, false));
          if (i >= visible) continue;
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x + d.len * RAIN_SLANT, d.y - d.len);
        }
        ctx.strokeStyle = `rgba(190,205,218,${0.22 * rain})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

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
