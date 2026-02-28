// Dice.jsx — Animated d6 with a worn parchment aesthetic

import { useState } from "react";
import { sfxDiceRoll, sfxDiceLand } from "./audio.js";

const FACE_DOTS = {
  1: [[1, 1]],
  2: [
    [0, 0],
    [2, 2],
  ],
  3: [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  4: [
    [0, 0],
    [0, 2],
    [2, 0],
    [2, 2],
  ],
  5: [
    [0, 0],
    [0, 2],
    [1, 1],
    [2, 0],
    [2, 2],
  ],
  6: [
    [0, 0],
    [0, 2],
    [1, 0],
    [1, 2],
    [2, 0],
    [2, 2],
  ],
};

// Single face with dots
function DiceFace({ value }) {
  const dots = FACE_DOTS[value] || [];
  return (
    <div
      style={{
        width: 100,
        height: 100,
        background: "linear-gradient(145deg,#d4c9a8,#b5a882)",
        border: "2px solid #8a7a58",
        borderRadius: 14,
        display: "grid",
        gridTemplate: "repeat(3,1fr)/repeat(3,1fr)",
        padding: 12,
        boxSizing: "border-box",
        boxShadow:
          "inset 0 2px 4px rgba(255,255,255,0.35), inset 0 -2px 6px rgba(0,0,0,0.3), 0 8px 28px rgba(0,0,0,0.6)",
      }}
    >
      {Array.from({ length: 9 }, (_, idx) => {
        const r = Math.floor(idx / 3),
          c = idx % 3;
        const hasDot = dots.some(([dr, dc]) => dr === r && dc === c);
        return (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {hasDot && (
              <div
                style={{
                  width: 13,
                  height: 13,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle at 35% 35%,#5a4830,#2a1e0e)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.5)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Dice({ onResult }) {
  const [value, setValue] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [display, setDisplay] = useState(6); // shown face during roll

  const roll = () => {
    if (rolling || value !== null) return;
    sfxDiceRoll();
    setRolling(true);
    setValue(null);

    // Fast-flickering random faces during roll
    let ticks = 0;
    const interval = setInterval(
      () => {
        setDisplay(Math.ceil(Math.random() * 6));
        ticks++;
        if (ticks > 14) {
          clearInterval(interval);
          const result = Math.ceil(Math.random() * 6);
          setDisplay(result);
          setValue(result);
          setRolling(false);
          sfxDiceLand(result);
          setTimeout(() => onResult(result), 1400);
        }
      },
      55 + ticks * 6,
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
      }}
    >
      {/* Dice */}
      <div
        onClick={roll}
        style={{
          cursor: rolling || value !== null ? "default" : "pointer",
          transform: rolling
            ? `rotate(${Math.random() * 20 - 10}deg) scale(0.9)`
            : value
              ? "rotate(0deg) scale(1.05)"
              : "rotate(0deg) scale(1)",
          transition: rolling
            ? "transform 0.12s ease"
            : "transform 0.5s cubic-bezier(0.34,1.56,0.64,1)",
          animation: rolling ? "diceShake 0.1s infinite" : "none",
        }}
      >
        <DiceFace value={display} />
      </div>

      {/* Result or CTA */}
      {value !== null ? (
        <p
          style={{
            color: "#e8dfc8",
            fontFamily: "Georgia, serif",
            fontSize: 17,
            letterSpacing: "1px",
            textAlign: "center",
            textShadow: "0 2px 8px rgba(0,0,0,0.6)",
          }}
        >
          Il fato ha parlato:{" "}
          <span
            style={{
              fontSize: 28,
              color: "#c8a84b",
              textShadow: "0 0 18px rgba(200,168,75,0.5)",
            }}
          >
            {value}
          </span>
        </p>
      ) : (
        <button
          onClick={roll}
          disabled={rolling}
          style={{
            background: "transparent",
            border: "1px solid rgba(200,168,75,0.5)",
            color: "#c8a84b",
            padding: "12px 44px",
            fontFamily: "Georgia, serif",
            letterSpacing: "4px",
            fontSize: 12,
            cursor: rolling ? "not-allowed" : "pointer",
            opacity: rolling ? 0.5 : 1,
            textTransform: "uppercase",
            transition: "all 0.25s",
          }}
          onMouseEnter={(e) => {
            if (!rolling) e.target.style.borderColor = "#c8a84b";
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = "rgba(200,168,75,0.5)";
          }}
        >
          Lancia il Dado
        </button>
      )}

      <style>{`
        @keyframes diceShake {
          0%,100% { transform: translate(0,0) rotate(0deg); }
          25%  { transform: translate(-2px,1px) rotate(-3deg); }
          75%  { transform: translate(2px,-1px) rotate(3deg); }
        }
      `}</style>
    </div>
  );
}
