// Background/themes.js — Colour palettes for the atmospheric canvas.
// Kept apart from Background.jsx so that file exports only a component
// (required by React Fast Refresh). Keys are the `theme` values of story.json.

export const THEMES = {
  forest: { sky: [28, 52, 40], fog: [40, 68, 52], mist: [20, 38, 30] },
  forge: { sky: [38, 28, 18], fog: [58, 42, 22], mist: [24, 18, 10] },
  throne: { sky: [44, 38, 18], fog: [62, 52, 24], mist: [26, 22, 10] },
  library: { sky: [22, 30, 44], fog: [30, 40, 58], mist: [14, 20, 32] },
  mist: { sky: [32, 28, 42], fog: [44, 38, 56], mist: [20, 18, 30] },
  dusk: { sky: [42, 28, 22], fog: [58, 38, 28], mist: [28, 18, 14] },
  dawn: { sky: [24, 36, 46], fog: [34, 50, 62], mist: [16, 26, 36] },
  title: { sky: [14, 12, 22], fog: [22, 18, 36], mist: [10, 8, 18] },
};
