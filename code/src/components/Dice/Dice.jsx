// Dice/Dice.jsx — Animated d6, CSS extracted

import { useState } from "react";
import { sfxDiceRoll, sfxDiceLand } from "../audio.js";
import "./Dice.css";

const FACE_DOTS = {
  1: [[1,1]],
  2: [[0,0],[2,2]],
  3: [[0,0],[1,1],[2,2]],
  4: [[0,0],[0,2],[2,0],[2,2]],
  5: [[0,0],[0,2],[1,1],[2,0],[2,2]],
  6: [[0,0],[0,2],[1,0],[1,2],[2,0],[2,2]],
};

function DiceFace({ value, rolling, landed, onClick }) {
  const dots = FACE_DOTS[value] || [];
  return (
    <div
      className={[
        "dice-face",
        rolling ? "dice-face--rolling" : "",
        landed  ? "dice-face--landed"  : "",
      ].filter(Boolean).join(" ")}
      onClick={onClick}
    >
      {Array.from({ length: 9 }, (_, idx) => {
        const r = Math.floor(idx / 3), c = idx % 3;
        const hasDot = dots.some(([dr, dc]) => dr === r && dc === c);
        return (
          <div key={idx} className="dice-cell">
            {hasDot && <div className="dice-dot" />}
          </div>
        );
      })}
    </div>
  );
}

export default function Dice({ onResult }) {
  const [value,   setValue]   = useState(null);
  const [rolling, setRolling] = useState(false);
  const [display, setDisplay] = useState(6);

  const roll = () => {
    if (rolling || value !== null) return;
    sfxDiceRoll();
    setRolling(true);
    setValue(null);

    let ticks = 0;
    const interval = setInterval(() => {
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
    }, 55 + ticks * 6);
  };

  return (
    <div className="dice-container">
      <DiceFace
        value={display}
        rolling={rolling}
        landed={!!value}
        onClick={roll}
      />

      {value !== null ? (
        <p className="dice-result">
          Il fato ha parlato:{" "}
          <span className="dice-result__number">{value}</span>
        </p>
      ) : (
        <button
          className="dice-roll-btn"
          onClick={roll}
          disabled={rolling}
        >
          Lancia il Dado
        </button>
      )}
    </div>
  );
}
