// Dice/Dice.jsx — Animated d6: the face flickers, slows down, lands, and
// after a short pause the result goes to the parent (GameScreen).

import { useState, useEffect, useRef } from "react";
import { sfxDiceRoll, sfxDiceLand } from "../audio.js";
import "./Dice.css";

const ROLL_TICKS = 15; // random faces shown before landing
const TICK_MS = 40; // first tick; each next one is TICK_SLOWDOWN_MS longer
const TICK_SLOWDOWN_MS = 5;
const RESULT_DELAY_MS = 1400; // pause on the landed face before onResult

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

  // The one pending timer (animation tick or result delay). Cleared on
  // unmount: otherwise, leaving the node mid-roll (restart chapter, main
  // menu) let onResult fire later with the OLD node's rules, showing its
  // clue — and its exit — on whatever node came next.
  const timerRef = useRef(null);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Set synchronously: two clicks in the same tick (die face + button, or a
  // double click) would both still see `rolling === false` in state.
  const startedRef = useRef(false);

  const roll = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    sfxDiceRoll();
    setRolling(true);

    // A chain of timeouts, each a little longer than the previous one, so
    // the die visibly slows down before landing. (A setInterval can't do
    // this: its delay is fixed when it starts.)
    let ticks = 0;
    const tick = () => {
      ticks++;
      if (ticks < ROLL_TICKS) {
        setDisplay(Math.ceil(Math.random() * 6));
        timerRef.current = setTimeout(tick, TICK_MS + ticks * TICK_SLOWDOWN_MS);
        return;
      }
      const result = Math.ceil(Math.random() * 6);
      setDisplay(result);
      setValue(result);
      setRolling(false);
      sfxDiceLand(result);
      timerRef.current = setTimeout(() => onResult(result), RESULT_DELAY_MS);
    };
    timerRef.current = setTimeout(tick, TICK_MS);
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
