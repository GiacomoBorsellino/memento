// TitleScreen.jsx

import { useState, useEffect } from "react";
import { sfxClick } from "./audio.js";

function MenuBtn({ label, onClick, delay = 0 }) {
  const [hov, setHov] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <button
      onClick={() => {
        sfxClick();
        onClick();
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "transparent",
        border: "none",
        borderBottom: `1px solid ${hov ? "rgba(200,175,120,0.6)" : "rgba(200,175,120,0.18)"}`,
        color: hov ? "#e8dfc8" : "#a89870",
        padding: "14px 0",
        fontSize: "12px",
        letterSpacing: "6px",
        cursor: "pointer",
        fontFamily: "Georgia, 'Palatino Linotype', serif",
        textTransform: "uppercase",
        width: 240,
        textAlign: "center",
        transition: "all 0.3s",
        opacity: show ? 1 : 0,
        transform: show ? "none" : "translateY(10px)",
        transitionProperty: "all",
        transitionDuration: show ? "0.6s" : "0s",
      }}
    >
      {label}
    </button>
  );
}

export default function TitleScreen({ onStart, onSettings, onCredits }) {
  const [showTitle, setShowTitle] = useState(false);
  const [showSub, setShowSub] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowTitle(true), 300);
    const t2 = setTimeout(() => setShowSub(true), 900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
      }}
    >
      {/* ── Title block ──────────────────────────────────────── */}
      <div
        style={{
          textAlign: "center",
          opacity: showTitle ? 1 : 0,
          transform: showTitle ? "none" : "translateY(-20px)",
          transition: "opacity 1.6s ease, transform 1.6s ease",
          marginBottom: 14,
        }}
      >
        {/* Decorative line above */}
        <div
          style={{
            width: 80,
            height: 1,
            background:
              "linear-gradient(to right,transparent,rgba(200,175,120,0.5),transparent)",
            margin: "0 auto 22px",
          }}
        />

        <h1
          style={{
            fontSize: "clamp(52px,10vw,108px)",
            fontFamily: "Georgia, 'Palatino Linotype', serif",
            color: "#e8dfc8",
            letterSpacing: "20px",
            margin: 0,
            fontWeight: "normal",
            textShadow:
              "0 2px 40px rgba(168,152,112,0.45), 0 0 80px rgba(168,152,112,0.15)",
          }}
        >
          MEMENTO
        </h1>

        {/* Decorative line below */}
        <div
          style={{
            width: 80,
            height: 1,
            background:
              "linear-gradient(to right,transparent,rgba(200,175,120,0.5),transparent)",
            margin: "18px auto 0",
          }}
        />

        <p
          style={{
            color: "rgba(168,152,112,0.55)",
            letterSpacing: "7px",
            fontSize: "10px",
            marginTop: 14,
            fontFamily: "monospace",
            opacity: showSub ? 1 : 0,
            transition: "opacity 1s ease",
          }}
        >
          UN RACCONTO INTERATTIVO
        </p>
      </div>

      {/* ── Menu buttons ─────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
          marginTop: 52,
        }}
      >
        <MenuBtn label="Inizia" onClick={onStart} delay={1200} />
        <MenuBtn label="Impostazioni" onClick={onSettings} delay={1500} />
        <MenuBtn label="Crediti" onClick={onCredits} delay={1800} />
      </div>

      {/* Version */}
      <p
        style={{
          position: "fixed",
          bottom: 18,
          color: "rgba(100,90,70,0.5)",
          fontSize: "10px",
          letterSpacing: "2px",
          fontFamily: "monospace",
        }}
      >
        © 2026 MEMENTO
      </p>
    </div>
  );
}
