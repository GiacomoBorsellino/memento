// TownMap/ArklowBase.jsx — The default town map: a stylised Arklow drawn as
// an old sepia chart (1000×700 units, the same system as the locations in
// story.json). Inspired by the real town — the Avoca flowing east into the
// Irish Sea, the bridge, Main Street on the south bank, Ferrybank to the
// north, the harbour at the river mouth, Arklow Rock to the south — but not
// to scale. Story places are NOT drawn here: TownMap adds them on top as the
// player discovers them. Replace the whole drawing with an image by setting
// "map.image" in story.json.

// River centre line, west → east (also used to place its label)
const RIVER = "M -20 236 C 120 214, 230 300, 380 288 S 640 296, 770 318 S 860 340, 906 345";

// Small building blocks along the streets: [x, y, width, height, rotation]
const BLOCKS = [
  // Main Street, north side
  [262, 418, 26, 14, -6], [296, 414, 30, 14, -4], [392, 410, 24, 14, -2], [478, 408, 30, 14, 0],
  [516, 408, 22, 14, 0], [566, 410, 28, 14, 1], [606, 412, 24, 14, 2], [652, 414, 30, 14, 4],
  [700, 420, 26, 14, 8], [744, 412, 24, 14, -18],
  // Main Street, south side
  [250, 456, 30, 16, -6], [300, 452, 26, 16, -4], [396, 448, 30, 16, -2], [440, 446, 24, 16, 0],
  [494, 446, 30, 16, 0], [574, 450, 22, 16, 1], [636, 452, 28, 16, 3], [742, 452, 24, 16, -10],
  // Bridge Street
  [418, 330, 18, 24, 0], [418, 362, 18, 22, 0], [470, 336, 18, 26, 0], [472, 380, 18, 20, 0],
  // Collin Street and the lanes
  [548, 580, 26, 14, 0], [664, 582, 26, 14, 0], [628, 510, 16, 24, 0], [372, 500, 22, 16, 0],
  [320, 488, 20, 16, 0],
  // Ferrybank
  [380, 186, 26, 14, 0], [470, 160, 28, 14, 0], [540, 186, 26, 14, 0], [610, 178, 24, 14, 0],
  [470, 214, 22, 16, 0],
];

export default function ArklowBase() {
  return (
    <g className="am">
      <defs>
        {/* Paper stains: low-frequency noise turned into brown blotches */}
        <filter id="am-stains" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.009" numOctaves="4" seed="3" />
          <feColorMatrix values="0 0 0 0 0.42  0 0 0 0 0.30  0 0 0 0 0.15  1.1 0 0 0 -0.42" />
        </filter>
        <radialGradient id="am-burn" cx="50%" cy="50%" r="70%">
          <stop offset="60%" stopColor="#6b4a22" stopOpacity="0" />
          <stop offset="100%" stopColor="#6b4a22" stopOpacity="0.55" />
        </radialGradient>
        {/* Water: little wave strokes */}
        <pattern id="am-waves" width="46" height="22" patternUnits="userSpaceOnUse">
          <path d="M 4 12 q 6 -6 12 0 t 12 0" className="am__wave" />
        </pattern>
        {/* Fields: light diagonal hatching */}
        <pattern id="am-fields" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <line x1="0" y1="0" x2="0" y2="14" className="am__hatch" />
        </pattern>
      </defs>

      {/* Paper */}
      <rect width="1000" height="700" className="am__paper" />
      <rect width="1000" height="700" filter="url(#am-stains)" opacity="0.55" />

      {/* Countryside around the town */}
      <path d="M 20 40 L 330 40 L 300 150 L 120 190 L 20 170 Z" fill="url(#am-fields)" />
      <path d="M 20 560 L 200 520 L 330 580 L 300 680 L 20 680 Z" fill="url(#am-fields)" />
      <path d="M 640 40 L 850 40 L 860 200 L 700 230 Z" fill="url(#am-fields)" />

      {/* Irish Sea, with the river mouth left open */}
      <path
        d="M 878 0 C 868 120, 896 230, 906 318 L 906 372 C 898 470, 858 560, 880 700 L 1000 700 L 1000 0 Z"
        className="am__water"
      />
      <path
        d="M 878 0 C 868 120, 896 230, 906 318 L 906 372 C 898 470, 858 560, 880 700 L 1000 700 L 1000 0 Z"
        fill="url(#am-waves)"
      />
      <path d="M 878 0 C 868 120, 896 230, 906 318" className="am__coast" />
      <path d="M 906 372 C 898 470, 858 560, 880 700" className="am__coast" />

      {/* River Avoca: dark banks, light water, widening estuary */}
      <path d={RIVER} className="am__river-bank" />
      <path d="M 760 300 Q 830 302 906 318 L 906 372 Q 830 364 760 336 Z" className="am__water am__estuary" />
      <path d={RIVER} className="am__river" />
      <path id="am-river-label" d="M 120 222 C 200 232, 250 284, 360 278" fill="none" />
      <text className="am__label am__label--water">
        <textPath href="#am-river-label">Fiume Avoca</textPath>
      </text>

      {/* Harbour: two piers and a small basin */}
      <path d="M 906 318 L 968 304 M 906 372 L 972 392" className="am__pier" />
      <rect x="800" y="368" width="58" height="30" rx="3" className="am__water am__basin" />
      <text x="829" y="420" className="am__label am__label--small">Porto</text>

      {/* The bridge */}
      <rect x="430" y="262" width="24" height="52" className="am__bridge" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path key={i} d={`M 430 ${268 + i * 8} q 12 -5 24 0`} className="am__arch" />
      ))}
      <text x="470" y="256" className="am__label am__label--small">il ponte</text>

      {/* Streets (double ink lines: a wide dark stroke under a light one) */}
      {[
        "M 230 448 C 380 432, 520 430, 640 434 S 760 446, 836 408", // Main Street
        "M 446 312 L 452 428", // Bridge Street
        "M 600 434 C 602 500, 610 540, 612 610", // to Collin Street
        "M 520 566 L 706 570", // Collin Street
        "M 350 440 L 352 510", // lane to the hotel
        "M 442 262 L 436 110", // north road, Ferrybank
        "M 300 196 C 420 176, 560 168, 720 190", // Ferrybank street
        "M 230 448 L 40 470", // road west
        "M 836 408 L 860 378", // to the harbour
      ].map((d, i) => (
        <g key={i}>
          <path d={d} className="am__street-edge" />
          <path d={d} className="am__street" />
        </g>
      ))}
      <path id="am-main-label" d="M 250 474 C 380 458, 520 456, 640 460" fill="none" />
      <text className="am__label">
        <textPath href="#am-main-label" startOffset="8%">Main Street</textPath>
      </text>
      <text x="470" y="300" className="am__label am__label--small" transform="rotate(86 470 300)">
        Bridge St.
      </text>
      <text x="630" y="600" className="am__label am__label--small">Collin St.</text>

      {/* Buildings */}
      {BLOCKS.map(([x, y, w, h, r], i) => (
        <rect
          key={i}
          x={x}
          y={y}
          width={w}
          height={h}
          transform={`rotate(${r} ${x + w / 2} ${y + h / 2})`}
          className="am__block"
        />
      ))}

      {/* Arklow Rock: hachured hill to the south-east */}
      {[70, 54, 38, 22].map((r) => (
        <ellipse key={r} cx="790" cy="618" rx={r * 1.5} ry={r} className="am__hill" />
      ))}
      <text x="790" y="676" className="am__label am__label--small">Arklow Rock</text>

      {/* Place names */}
      <text x="560" y="136" className="am__label am__label--district">FERRYBANK</text>
      <text x="948" y="560" className="am__label am__label--sea" transform="rotate(-90 948 560)">
        Mare d&apos;Irlanda
      </text>

      {/* Compass rose */}
      <g transform="translate(112 596)" className="am__compass">
        <circle r="44" className="am__compass-ring" />
        <circle r="36" className="am__compass-ring" />
        <path d="M 0 -50 L 8 -8 L 0 0 L -8 -8 Z" className="am__compass-dark" />
        <path d="M 0 50 L 8 8 L 0 0 L -8 8 Z" className="am__compass-light" />
        <path d="M -50 0 L -8 -8 L 0 0 L -8 8 Z" className="am__compass-light" />
        <path d="M 50 0 L 8 -8 L 0 0 L 8 8 Z" className="am__compass-dark" />
        <text y="-56" className="am__compass-n">N</text>
      </g>

      {/* Title cartouche */}
      <g transform="translate(40 36)">
        <rect width="250" height="100" className="am__cartouche" />
        <rect x="6" y="6" width="238" height="88" className="am__cartouche-inner" />
        <text x="125" y="62" className="am__title">Arklow</text>
        <text x="125" y="84" className="am__label am__label--small">Contea di Wicklow · Irlanda</text>
      </g>

      {/* Burnt edges and frame */}
      <rect width="1000" height="700" fill="url(#am-burn)" />
      <rect x="12" y="12" width="976" height="676" className="am__frame" />
      <rect x="18" y="18" width="964" height="664" className="am__frame am__frame--thin" />
    </g>
  );
}
