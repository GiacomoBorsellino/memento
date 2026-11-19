// PinPad/PinPad.jsx — Phone lock screen for "pin" nodes.
//
// story.json:
//   "pin": {
//     "code": "1948",            digits to enter (length = number of dots)
//     "nextNode": "S09",         where a correct PIN leads
//     "prompt": "...",           optional, shown above the dots
//     "errorText": "...",        optional, shown after a wrong attempt
//     "hint": "...",             optional, replaces errorText after `hintAfter` errors
//     "hintAfter": 3,
//     "successText": "..."
//   }
// Works with taps and with the physical keyboard (digits, Backspace).

import { useState, useEffect, useRef } from "react";
import { sfxPinKey, sfxPinError, sfxPinSuccess } from "../audio.js";
import "./PinPad.css";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];
const ERROR_MS = 650;
const SUCCESS_MS = 900;

export default function PinPad({ pin, onSuccess }) {
  const code = String(pin.code);
  const [digits, setDigits] = useState("");
  const [status, setStatus] = useState("idle"); // idle | error | success
  const [errors, setErrors] = useState(0);
  const timerRef = useRef(null);

  // Source of truth for the input, updated synchronously: React applies state
  // updates later, so two key presses in the same tick (fast typing, a
  // keyboard repeat) would otherwise both read the old value.
  const inputRef = useRef({ digits: "", status: "idle" });
  const update = (patch) => {
    inputRef.current = { ...inputRef.current, ...patch };
    if ("digits" in patch) setDigits(patch.digits);
    if ("status" in patch) setStatus(patch.status);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const submit = (entered) => {
    if (entered === code) {
      update({ status: "success" });
      sfxPinSuccess();
      timerRef.current = setTimeout(onSuccess, SUCCESS_MS);
      return;
    }
    update({ status: "error" });
    setErrors((n) => n + 1);
    sfxPinError();
    navigator.vibrate?.(180);
    timerRef.current = setTimeout(() => update({ digits: "", status: "idle" }), ERROR_MS);
  };

  const press = (key) => {
    const { digits: current, status: now } = inputRef.current;
    if (now !== "idle") return;
    if (key === "⌫") {
      update({ digits: current.slice(0, -1) });
      return;
    }
    if (!key || current.length >= code.length) return;
    sfxPinKey();
    const next = current + key;
    update({ digits: next });
    if (next.length === code.length) submit(next);
  };

  // Physical keyboard. The ref always holds the latest `press`, so the
  // listener is attached once and never reads stale state.
  const pressRef = useRef(press);
  useEffect(() => {
    pressRef.current = press;
  });
  useEffect(() => {
    const onKey = (e) => {
      if (/^\d$/.test(e.key)) pressRef.current(e.key);
      else if (e.key === "Backspace") pressRef.current("⌫");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hintAfter = pin.hintAfter ?? 3;
  const message =
    status === "success"
      ? (pin.successText ?? "Sbloccato")
      : errors === 0
        ? (pin.prompt ?? "Inserisci il PIN")
        : errors >= hintAfter && pin.hint
          ? pin.hint
          : (pin.errorText ?? "PIN errato");

  return (
    <div className={`pin-pad pin-pad--${status}`}>
      <div className="pin-pad__dots" aria-label={`${digits.length} cifre inserite su ${code.length}`}>
        {Array.from(code, (_, i) => (
          <span
            key={i}
            className={`pin-pad__dot${i < digits.length ? " pin-pad__dot--filled" : ""}`}
          />
        ))}
      </div>

      <p className="pin-pad__message" aria-live="polite">{message}</p>

      <div className="pin-pad__keys">
        {KEYS.map((key, i) =>
          key ? (
            <button
              key={i}
              className={`pin-pad__key${key === "⌫" ? " pin-pad__key--back" : ""}`}
              onClick={() => press(key)}
              aria-label={key === "⌫" ? "Cancella" : key}
            >
              {key}
            </button>
          ) : (
            <span key={i} />
          ),
        )}
      </div>
    </div>
  );
}
