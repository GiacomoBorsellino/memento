// music.js — Procedural soundtrack (Web Audio API, no audio files).
//
// Style target: the "gypsy-Victorian" colour of a Holmes-style score —
// out-of-tune parlour piano, cimbalom, fiddle with slides, pizzicato
// oom-pah-pah in 6/8, sudden stops — mixed with an Irish flavour (bodhrán).
// No melody is copied: motifs are generated on the fly from D harmonic /
// Hungarian minor scales.
//
// Each background theme (story.json "theme") maps to a MOOD. Changing theme
// crossfades to the new mood.
//
// Timing uses the classic look-ahead scheduler: a setInterval wakes up every
// 25 ms and schedules on the AudioContext clock every note that falls in the
// next LOOKAHEAD seconds — sample-accurate, immune to UI jank.

import { getAC } from "./audioContext.js";

const LOOKAHEAD = 0.15; // s of audio scheduled ahead
const TICK_MS = 25;
const FADE = 2.5; // crossfade between moods, s
const MASTER = 0.55; // headroom before the compressor

// ── Helpers ───────────────────────────────────────────────────

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const chance = (p) => Math.random() < p;

// Scales as semitone offsets from D
const HARM = [0, 2, 3, 5, 7, 8, 11]; // D harmonic minor: D E F G A Bb C#
const HUNG = [0, 2, 3, 6, 7, 8, 11]; // D Hungarian minor: D E F G# A Bb C#
const D3 = 50;

/** Scale degree (any integer, wraps octaves) → frequency. */
const deg = (d, octave = 0, scale = HARM) => {
  const o = Math.floor(d / 7);
  const i = ((d % 7) + 7) % 7;
  return mtof(D3 + 12 * (octave + o) + scale[i]);
};

// Chords by root degree: i=0 (Dm), iv=3 (Gm), V=4 (A), VI=5 (Bb)
const chordTones = (root) => [root, root + 2, root + 4];

// ── Mixer: tracks → bus (volume) → compressor → speakers, + reverb send ──

let bus = null;
let reverbIn = null;
let musicVolume = 0.7;

function makeImpulse(ac, seconds = 2.6, decay = 3) {
  const len = Math.floor(ac.sampleRate * seconds);
  const buf = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

function getBus() {
  if (bus) return bus;
  const ac = getAC();
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 4;
  comp.connect(ac.destination);

  bus = ac.createGain();
  bus.gain.value = musicVolume * MASTER;
  bus.connect(comp);

  const conv = ac.createConvolver();
  conv.buffer = makeImpulse(ac);
  const wet = ac.createGain();
  wet.gain.value = 0.3;
  conv.connect(wet);
  wet.connect(bus);
  reverbIn = conv;
  return bus;
}

export function setMusicVolume(v) {
  musicVolume = v;
  if (bus) bus.gain.setTargetAtTime(v * MASTER, getAC().currentTime, 0.1);
}

// ── Instruments: each schedules one note at time t into `out` ──

// Karplus–Strong plucked string, rendered once per pitch into a buffer.
// damp ≈ 0.998 → ringing cimbalom; 0.985 → short pizzicato.
const pluckCache = new Map();
function pluckBuffer(ac, freq, damp) {
  const key = `${Math.round(freq * 10)}:${damp}`;
  if (pluckCache.has(key)) return pluckCache.get(key);
  const sr = ac.sampleRate;
  const len = Math.floor(sr * (damp > 0.995 ? 2 : 0.8));
  const N = Math.max(2, Math.round(sr / freq));
  const buf = ac.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < N; i++) d[i] = Math.random() * 2 - 1;
  for (let i = N + 1; i < len; i++) d[i] = damp * 0.5 * (d[i - N] + d[i - N - 1]);
  if (pluckCache.size > 96) pluckCache.delete(pluckCache.keys().next().value);
  pluckCache.set(key, buf);
  return buf;
}

function pluck(out, t, freq, vol = 0.2, damp = 0.997) {
  const ac = getAC();
  const g = ac.createGain();
  g.gain.value = vol;
  g.connect(out);
  // Two slightly detuned strings per note, like a cimbalom course
  [-5, 5].forEach((cents) => {
    const src = ac.createBufferSource();
    src.buffer = pluckBuffer(ac, freq, damp);
    src.detune.value = cents;
    src.connect(g);
    src.start(t);
  });
}

// Parlour piano a little out of tune ("honky-tonk": detuned unison)
function piano(out, t, freq, vol = 0.12, dur = 1.3) {
  const ac = getAC();
  const f = ac.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.setValueAtTime(Math.min(5000, freq * 8), t);
  f.frequency.exponentialRampToValueAtTime(Math.max(250, freq * 1.5), t + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  f.connect(g);
  g.connect(out);
  [
    ["triangle", 1, -11],
    ["triangle", 1, 9],
    ["sine", 2, 4],
  ].forEach(([type, mult, cents]) => {
    const o = ac.createOscillator();
    o.type = type;
    o.frequency.value = freq * mult;
    o.detune.value = cents;
    o.connect(f);
    o.start(t);
    o.stop(t + dur + 0.05);
  });
}

// Fiddle: sawtooth, slide into the note from below, delayed vibrato
function fiddle(out, t, freq, dur, vol = 0.05) {
  const ac = getAC();
  const o = ac.createOscillator();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(freq * 0.97, t);
  o.frequency.exponentialRampToValueAtTime(freq, t + 0.06);

  const lfo = ac.createOscillator();
  lfo.frequency.value = 5.6;
  const depth = ac.createGain();
  depth.gain.setValueAtTime(0, t);
  depth.gain.linearRampToValueAtTime(freq * 0.007, t + Math.min(0.35, dur * 0.6));
  lfo.connect(depth);
  depth.connect(o.frequency);

  const hp = ac.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 220;
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 2600;

  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.05);
  g.gain.setValueAtTime(vol, t + dur * 0.7);
  g.gain.linearRampToValueAtTime(0.0001, t + dur);

  o.connect(hp);
  hp.connect(lp);
  lp.connect(g);
  g.connect(out);
  o.start(t);
  lfo.start(t);
  o.stop(t + dur + 0.05);
  lfo.stop(t + dur + 0.05);
}

let noiseBuf = null;
function getNoise(ac) {
  if (noiseBuf) return noiseBuf;
  noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

function noiseHit(out, t, { vol, dur, type, freq, q = 1 }) {
  const ac = getAC();
  const src = ac.createBufferSource();
  src.buffer = getNoise(ac);
  const f = ac.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ac.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f);
  f.connect(g);
  g.connect(out);
  src.start(t, Math.random());
  src.stop(t + dur + 0.02);
}

// Bodhrán: pitched-down skin thump + a little stick noise
function drum(out, t, vol = 0.35) {
  const ac = getAC();
  const o = ac.createOscillator();
  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(52, t + 0.12);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
  o.connect(g);
  g.connect(out);
  o.start(t);
  o.stop(t + 0.3);
  noiseHit(out, t, { vol: vol * 0.25, dur: 0.05, type: "lowpass", freq: 900 });
}

// Clock tick / tock
const tick = (out, t, tock) =>
  noiseHit(out, t, { vol: 0.05, dur: 0.025, type: "bandpass", freq: tock ? 1700 : 2600, q: 6 });

// Bell / celesta: inharmonic partials
function bell(out, t, freq, vol = 0.05) {
  const ac = getAC();
  [
    [1, 1, 2.4],
    [2.76, 0.45, 1.2],
    [5.4, 0.22, 0.6],
    [8.93, 0.1, 0.3],
  ].forEach(([ratio, amp, decay]) => {
    const o = ac.createOscillator();
    o.frequency.value = freq * ratio;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol * amp, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    o.connect(g);
    g.connect(out);
    o.start(t);
    o.stop(t + decay + 0.05);
  });
}

// Low pad / drone
function drone(out, t, freq, dur, vol = 0.05) {
  const ac = getAC();
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 520;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + dur * 0.3);
  g.gain.setValueAtTime(vol, t + dur * 0.7);
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  lp.connect(g);
  g.connect(out);
  [
    ["sawtooth", -7],
    ["sawtooth", 7],
    ["sine", 0],
  ].forEach(([type, cents]) => {
    const o = ac.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = cents;
    o.connect(lp);
    o.start(t);
    o.stop(t + dur + 0.05);
  });
}

// Continuous rain bed (street). Returns the source so it can be stopped.
function rainBed(out) {
  const ac = getAC();
  const src = ac.createBufferSource();
  src.buffer = getNoise(ac);
  src.loop = true;
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1400;
  bp.Q.value = 0.4;
  const g = ac.createGain();
  g.gain.value = 0.06;
  src.connect(bp);
  bp.connect(g);
  g.connect(out);
  src.start();
  return src;
}

// ── Melody: short motifs, repeated in sequence over the chords ──

function makeMotif(restChance) {
  const steps = [-2, -1, -1, 0, 1, 1, 2, 3, -3];
  let d = pick([2, 4, 4, 6]);
  return Array.from({ length: 6 }, () => {
    d = Math.max(0, Math.min(9, d + pick(steps)));
    return chance(restChance) ? null : d;
  });
}

// Chromatic lower-neighbour grace note: the "gypsy" ornament
const grace = (fn, t, freq) => fn(t - 0.045, freq * Math.pow(2, -1 / 12));

// ── Moods ─────────────────────────────────────────────────────
// step: seconds per eighth note · bar: 6 eighths (6/8)
// prog: chord roots per bar · play(): schedules one step

const MOODS = {
  // Title / fallback: slow cimbalom arpeggios over a drone
  title: {
    step: 0.5, prog: [0, 0, 5, 4], reverb: 0.5, rest: 0.4,
    play({ out, t, s, bar, root }) {
      if (s === 0 && bar % 2 === 0) drone(out, t, deg(root, -1), this.step * 12, 0.045);
      if (chance(0.55)) pluck(out, t, deg(chordTones(root)[s % 3], 1), 0.11);
      if (s === 3 && chance(0.15)) bell(out, t, deg(pick(chordTones(root)), 2), 0.04);
    },
  },

  // Dorney's Lodge: cuckoo clock, tired parlour piano
  hotel: {
    step: 0.38, prog: [0, 3, 4, 0], reverb: 0.3, rest: 0.45,
    play({ out, t, s, bar, root, motif }) {
      if (s % 3 === 0) tick(out, t, s === 3);
      if (bar % 8 === 7) return; // the "stop": only the clock keeps going
      if (s === 0) piano(out, t, deg(root, -1), 0.13, 1.6);
      if (s === 3) piano(out, t, deg(root + 4, -1), 0.08, 1.2);
      if ((s === 1 || s === 4) && chance(0.6)) {
        chordTones(root).forEach((d) => piano(out, t, deg(d), 0.04, 0.8));
      }
      const m = motif[s];
      if (m != null) {
        const f = deg(m + root, 1);
        if (chance(0.2)) grace((tt, ff) => piano(out, tt, ff, 0.05, 0.3), t, f);
        piano(out, t, f, 0.09, 1.1);
      }
    },
  },

  // Maisie Kelly's: jaunty jig — bodhrán, pizzicato oom-pah-pah, fiddle
  pub: {
    step: 0.17, prog: [0, 0, 3, 4, 0, 5, 3, 4], reverb: 0.18, rest: 0.12,
    play({ out, t, s, bar, root, motif }) {
      const stop = bar % 8 === 7;
      if (stop && s > 0) return; // sudden stop: one stab, then silence
      if (s === 0) drum(out, t, 0.42);
      else if (s === 3) drum(out, t, 0.28);
      else if (chance(0.25)) drum(out, t, 0.1);

      if (s === 0) pluck(out, t, deg(root, -1), 0.3, 0.985);
      if (s === 3) pluck(out, t, deg(root + 4, -1), 0.24, 0.985);
      if (s !== 0 && s !== 3) {
        chordTones(root).slice(1).forEach((d) => pluck(out, t, deg(d), 0.07, 0.985));
      }

      const m = motif[s];
      if (m != null) {
        const f = deg(m + root, 1);
        if (chance(0.25)) grace((tt, ff) => fiddle(out, tt, ff, 0.05, 0.04), t, f);
        fiddle(out, t, f, this.step * (stop ? 3 : 0.95), 0.05);
        if (chance(0.3)) pluck(out, t, f * 2, 0.05);
      }
    },
  },

  // Tadhg's tale of Glen Bootleg: the pub fades, the music darkens —
  // low piano tolls, a dissonant drone, a slow fiddle lament, distant drum
  legend: {
    step: 0.6, prog: [0, 0, 5, 4], reverb: 0.65, rest: 0.35, scale: HUNG,
    play({ out, t, s, bar, root, motif }) {
      if (s === 0 && bar % 2 === 0) {
        drone(out, t, deg(root, -1), this.step * 12, 0.06);
        drone(out, t, deg(root, -1) * Math.pow(2, 1 / 12), this.step * 12, 0.018);
      }
      if (s === 0) piano(out, t, deg(root, -1), 0.16, 3);
      if (s === 3 && chance(0.5)) piano(out, t, deg(root + 4, -1, HUNG), 0.08, 2.5);
      const m = motif[s];
      if ((s === 0 || s === 3) && m != null) {
        fiddle(out, t, deg(m + root, 0, HUNG), this.step * 2.8, 0.04);
      }
      if (s === 4 && bar % 4 === 3) drum(out, t, 0.22);
    },
  },

  // Arklow streets: rain, heartbeat, low pizzicato ostinato
  street: {
    step: 0.32, prog: [0, 0, 5, 4], reverb: 0.35, rest: 0.6,
    start: (out) => [rainBed(out)],
    play({ out, t, s, bar, root }) {
      if (s === 0) drum(out, t, 0.26);
      if (s === 1) drum(out, t, 0.15);
      pluck(out, t, deg([0, 4, 0, 2, 0, 4][s] + root, -1), 0.15, 0.985);
      if (s === 0 && bar % 4 === 0) drone(out, t, deg(root, -1), this.step * 24, 0.035);
      if (s === 0 && bar % 4 === 2) {
        const f = deg(root + 4, 1);
        for (let i = 0; i < 6; i++) pluck(out, t + i * 0.06, f, 0.05 - i * 0.006);
      }
    },
  },

  // Arklow Library: esoteric — Hungarian minor, bells, long fiddle notes
  library: {
    step: 0.45, prog: [0, 5, 3, 4], reverb: 0.55, rest: 0.3, scale: HUNG,
    play({ out, t, s, bar, root, motif }) {
      if (s === 0 && bar % 2 === 0) drone(out, t, deg(root, -1, HUNG), this.step * 12, 0.045);
      if (s % 2 === 0 && chance(0.3)) bell(out, t, deg(pick(chordTones(root)), 2, HUNG), 0.04);
      const m = motif[s];
      if ((s === 0 || (s === 3 && chance(0.5))) && m != null) {
        fiddle(out, t, deg(m + root, 1, HUNG), this.step * 3, 0.035);
      }
    },
  },

  // Revelation / cliffhanger: dissonant drone, distant bells
  mist: {
    step: 0.55, prog: [0, 0, 4, 4], reverb: 0.6, rest: 0.5, scale: HUNG,
    play({ out, t, s, bar, root }) {
      if (s === 0 && bar % 2 === 0) {
        drone(out, t, deg(root, -1), this.step * 12, 0.04);
        drone(out, t, deg(root, -1) * Math.pow(2, 1 / 12), this.step * 12, 0.02);
      }
      if (chance(0.22)) bell(out, t, deg(Math.floor(Math.random() * 10), 2, HUNG), 0.035);
      if (s === 0 && bar % 4 === 3) drum(out, t, 0.2);
    },
  },
};

// Old demo themes fall back to the closest mood
const THEME_TO_MOOD = {
  title: "title", hotel: "hotel", pub: "pub", legend: "legend", street: "street",
  library: "library", mist: "mist", dusk: "street", dawn: "title",
  forest: "title", forge: "hotel", throne: "title",
};

// ── Sequencer ─────────────────────────────────────────────────

const seq = { mood: null, track: null, timer: null, nextTime: 0, stepIdx: 0, motif: null };

function makeTrack(mood) {
  const ac = getAC();
  getBus();
  const input = ac.createGain();
  input.gain.setValueAtTime(0.0001, ac.currentTime);
  input.gain.exponentialRampToValueAtTime(1, ac.currentTime + FADE);
  input.connect(bus);
  const send = ac.createGain();
  send.gain.value = mood.reverb;
  input.connect(send);
  send.connect(reverbIn);
  const sources = mood.start ? mood.start(input) : [];
  return { input, send, sources };
}

function fadeOutTrack(track) {
  const ac = getAC();
  const now = ac.currentTime;
  const gain = track.input.gain;
  gain.cancelScheduledValues(now);
  gain.setValueAtTime(gain.value, now);
  gain.linearRampToValueAtTime(0, now + FADE);
  setTimeout(() => {
    track.sources.forEach((src) => {
      try {
        src.stop();
      } catch {
        /* already stopped */
      }
    });
    track.input.disconnect();
    track.send.disconnect();
  }, (FADE + 3) * 1000); // leave room for note and reverb tails
}

function schedule() {
  const ac = getAC();
  const mood = seq.mood;
  if (!mood) return;
  // Tab was in background (timers throttled): skip ahead instead of
  // firing a burst of overdue notes all at once.
  if (seq.nextTime < ac.currentTime - 0.05) seq.nextTime = ac.currentTime + 0.05;

  while (seq.nextTime < ac.currentTime + LOOKAHEAD) {
    const s = seq.stepIdx % 6;
    const bar = Math.floor(seq.stepIdx / 6);
    if (s === 0 && bar % 4 === 0) seq.motif = makeMotif(mood.rest);
    const t = seq.nextTime + Math.random() * 0.008; // human timing
    mood.play({ out: seq.track.input, t, s, bar, root: mood.prog[bar % mood.prog.length], motif: seq.motif });
    seq.nextTime += mood.step;
    seq.stepIdx++;
  }
}

/** Plays (or crossfades to) the mood for a background theme. */
export function playMusic(theme) {
  const mood = MOODS[THEME_TO_MOOD[theme]] ?? MOODS.title;
  if (seq.mood === mood && seq.timer) return;
  try {
    const ac = getAC();
    if (seq.track) fadeOutTrack(seq.track);
    seq.mood = mood;
    seq.track = makeTrack(mood);
    seq.stepIdx = 0;
    seq.nextTime = ac.currentTime + 0.1;
    seq.motif = null;
    if (!seq.timer) seq.timer = setInterval(schedule, TICK_MS);
  } catch (e) {
    console.warn("Music error:", e);
  }
}

/** Fades the music out and stops the sequencer. */
export function stopMusic() {
  if (seq.timer) clearInterval(seq.timer);
  seq.timer = null;
  if (seq.track) fadeOutTrack(seq.track);
  seq.track = null;
  seq.mood = null;
}
