// audioContext.js — the single AudioContext shared by sfx (audio.js)
// and the music engine (music.js).

// Phones and tablets (no hover) get bigger audio buffers and a lighter
// music engine: with tiny low-latency buffers a busy phone CPU can't refill
// them in time and the sound crackles (buffer underruns).
export const isLowPowerDevice =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(hover: none)").matches;

let _ac = null;

export const getAC = () => {
  if (!_ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    _ac = new AC({ latencyHint: isLowPowerDevice ? "playback" : "interactive" });
  }
  // Browsers create/keep the context "suspended" until a user gesture:
  // every sound is triggered after a click, so resuming here is enough.
  if (_ac.state === "suspended") _ac.resume().catch(() => {});
  return _ac;
};
