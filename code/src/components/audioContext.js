// audioContext.js — the single AudioContext shared by sfx (audio.js)
// and the music engine (music.js).

let _ac = null;

export const getAC = () => {
  if (!_ac) _ac = new (window.AudioContext || window.webkitAudioContext)();
  // Browsers create/keep the context "suspended" until a user gesture:
  // every sound is triggered after a click, so resuming here is enough.
  if (_ac.state === "suspended") _ac.resume().catch(() => {});
  return _ac;
};
