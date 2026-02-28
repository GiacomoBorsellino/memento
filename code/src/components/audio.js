// audio.js — Web Audio API utilities for Memento
// All sounds are generated procedurally, no external files required.

let _ac = null;
const getAC = () => {
  if (!_ac) _ac = new (window.AudioContext || window.webkitAudioContext)();
  return _ac;
};

const tone = (freq, dur, type = "sine", vol = 0.2, startDelay = 0) => {
  try {
    const ctx = getAC();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = type;
    o.frequency.value = freq;
    const t = ctx.currentTime + startDelay;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.start(t);
    o.stop(t + dur + 0.05);
  } catch (e) {
    console.warn("Audio error:", e);
  }
};

export const sfxCardSelect = () => {
  // Harp-like pluck
  tone(523, 0.35, "triangle", 0.25);
  tone(659, 0.28, "triangle", 0.18, 0.08);
  tone(784, 0.22, "triangle", 0.14, 0.18);
};

export const sfxCardHover = () => {
  tone(440, 0.12, "sine", 0.07);
};

export const sfxClick = () => {
  tone(480, 0.09, "sine", 0.15);
};

export const sfxMenuOpen = () => {
  tone(360, 0.12, "sine", 0.1);
  tone(480, 0.10, "sine", 0.07, 0.08);
};

export const sfxTextReveal = () => {
  // Soft atmospheric chord
  [330, 415, 523].forEach((f, i) =>
    tone(f, 0.45, "triangle", 0.1 - i * 0.02, i * 0.1)
  );
};

export const sfxDiceRoll = () => {
  for (let i = 0; i < 10; i++) {
    tone(
      80 + Math.random() * 120,
      0.05,
      "sawtooth",
      0.12,
      i * 0.07
    );
  }
};

export const sfxDiceLand = (value) => {
  // Different pitch based on result
  const base = 180 + value * 30;
  tone(base, 0.4, "triangle", 0.22);
  tone(base * 1.5, 0.25, "triangle", 0.12, 0.12);
};

export const sfxPageTurn = () => {
  // Soft whoosh
  tone(200, 0.18, "sine", 0.08);
  tone(150, 0.22, "sine", 0.06, 0.1);
};

export const sfxTransition = () => {
  // Low ambient swell
  [110, 138, 165].forEach((f, i) =>
    tone(f, 0.65, "sine", 0.08, i * 0.12)
  );
};
