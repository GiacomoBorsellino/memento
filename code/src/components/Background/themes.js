// Background/themes.js — Colour palettes for the atmospheric canvas.
// Kept apart from Background.jsx so that file exports only a component
// (required by React Fast Refresh). Keys are the `theme` values of story.json;
// music.js maps the same keys to a musical mood.

export const THEMES = {
  // ── Arklow, Capitolo 1 ──
  hotel: { sky: [40, 30, 22], fog: [62, 46, 30], mist: [24, 17, 12] }, // ambra stanca, carta da parati
  pub: { sky: [18, 30, 24], fog: [40, 48, 30], mist: [12, 18, 14] }, // verde scuro e ottone
  legend: { sky: [22, 10, 10], fog: [42, 18, 16], mist: [12, 5, 5] }, // la leggenda di Glen: buio color sangue
  street: { sky: [26, 32, 38], fog: [44, 54, 62], mist: [16, 20, 26] }, // grigio-blu del mare d'Irlanda
  library: { sky: [22, 30, 44], fog: [30, 40, 58], mist: [14, 20, 32] }, // ardesia
  mist: { sky: [32, 28, 42], fog: [44, 38, 56], mist: [20, 18, 30] }, // viola freddo, esoterico
  title: { sky: [14, 12, 22], fog: [22, 18, 36], mist: [10, 8, 18] },

  // ── Demo themes (still available) ──
  forest: { sky: [28, 52, 40], fog: [40, 68, 52], mist: [20, 38, 30] },
  forge: { sky: [38, 28, 18], fog: [58, 42, 22], mist: [24, 18, 10] },
  throne: { sky: [44, 38, 18], fog: [62, 52, 24], mist: [26, 22, 10] },
  dusk: { sky: [42, 28, 22], fog: [58, 38, 28], mist: [28, 18, 14] },
  dawn: { sky: [24, 36, 46], fog: [34, 50, 62], mist: [16, 26, 36] },
};
