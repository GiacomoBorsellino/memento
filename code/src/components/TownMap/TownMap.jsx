// TownMap/TownMap.jsx — Map button + full-screen map of Arklow.
//
// What the player knows comes from the game state (engine.mapProgress):
//   • visited places: inked on the map, mist cleared around them, joined by
//     a dashed line in the order they were discovered;
//   • places only heard of: pencilled with a "?", mist only thinned;
//     a place with no coordinates (unknown address) appears only in the list;
//   • the current place: a pulsing red ring.
// Places discovered since the map was last opened "ink in" with an animation,
// and the button shows a dot until the map is opened.
//
// The drawing underneath is ArklowBase (SVG), or story.json "map.image".

import { useEffect, useMemo, useRef, useState } from "react";
import { mapProgress } from "../../engine.js";
import { sfxPageTurn, sfxClick } from "../audio.js";
import ArklowBase from "./ArklowBase.jsx";
import "./TownMap.css";

const REVEAL_R = 120; // radius of the clear area around a visited place
const HEARD_R = 60; // radius of the thinned mist around a place heard of
const LABEL_DY = 30; // label below the marker

export default function TownMap({ story, state, nodeId }) {
  const map = story.map;
  const [open, setOpen] = useState(false);
  // Places already shown on an opened map ("v:pub", "h:chiesa"), and the ones
  // to animate in the map currently open
  const [seen, setSeen] = useState(() => new Set());
  const [fresh, setFresh] = useState(() => new Set());

  const progress = useMemo(() => mapProgress(story, state, nodeId), [story, state, nodeId]);
  const keys = [
    ...progress.visited.map((id) => `v:${id}`),
    ...progress.heard.map((id) => `h:${id}`),
  ];
  const hasNews = keys.some((k) => !seen.has(k));

  const openMap = () => {
    sfxPageTurn();
    setFresh(new Set(keys.filter((k) => !seen.has(k))));
    setSeen(new Set([...seen, ...keys]));
    setOpen(true);
  };
  const close = () => {
    sfxClick();
    setOpen(false);
  };

  // Escape closes the map
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const place = (id) => map.locations.get(id);
  const onMap = (id) => typeof place(id)?.x === "number";
  const visited = progress.visited.filter(onMap).map(place);
  const heard = progress.heard.filter(onMap).map(place);
  const here = progress.current && onMap(progress.current) ? place(progress.current) : null;

  // On narrow screens the chart is wider than the window (min-width in CSS)
  // and scrolls sideways: start centred on "you are here".
  const frameRef = useRef(null);
  const hereX = here?.x;
  useEffect(() => {
    const frame = frameRef.current;
    if (!open || !frame || hereX == null) return;
    const overflow = frame.scrollWidth - frame.clientWidth;
    if (overflow > 0) {
      frame.scrollLeft = (hereX / map.width) * frame.scrollWidth - frame.clientWidth / 2;
    }
  }, [open, hereX, map.width]);
  const anim = (key) => (fresh.has(key) ? " town-map--fresh" : "");

  return (
    <>
      <button className="town-map-btn" onClick={openMap} aria-label="Mappa di Arklow" title="Mappa">
        🗺️
        {hasNews && <span className="town-map-btn__badge" aria-hidden="true" />}
      </button>

      {open && (
        <div
          className="town-map__overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="town-map__header">
            <h2 className="town-map__title">Mappa</h2>
            <button className="town-map__close" onClick={close} aria-label="Chiudi">
              ✕
            </button>
          </div>

          <div className="town-map__frame" ref={frameRef}>
            <svg
              viewBox={`0 0 ${map.width} ${map.height}`}
              className="town-map__svg"
              role="img"
              aria-label="Mappa di Arklow con i luoghi che hai scoperto"
            >
              <defs>
                {/* The mist: dark, cloudy, covering what you don't remember */}
                {/* sRGB: by default filters work in linear RGB, which turns
                    this dark brown into a washed-out grey */}
                <filter id="tm-mist" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
                  <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="3" seed="11" />
                  <feColorMatrix values="0 0 0 0 0.11  0 0 0 0 0.085  0 0 0 0 0.06  0.6 0 0 0 0.5" />
                </filter>
                {/* Mask: white = mist, black = clear. Each known place
                    punches a soft hole in the mist. */}
                <radialGradient id="tm-clear">
                  <stop offset="0%" stopColor="#000" stopOpacity="1" />
                  <stop offset="55%" stopColor="#000" stopOpacity="1" />
                  <stop offset="100%" stopColor="#000" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="tm-thin">
                  <stop offset="0%" stopColor="#000" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#000" stopOpacity="0" />
                </radialGradient>
                <mask id="tm-mist-mask" maskUnits="userSpaceOnUse" x="0" y="0" width={map.width} height={map.height}>
                  <rect width={map.width} height={map.height} fill="#fff" />
                  {heard.map((l) => (
                    <circle
                      key={l.id}
                      cx={l.x}
                      cy={l.y}
                      r={HEARD_R}
                      fill="url(#tm-thin)"
                      className={`town-map__hole${anim(`h:${l.id}`)}`}
                    />
                  ))}
                  {visited.map((l) => (
                    <circle
                      key={l.id}
                      cx={l.x}
                      cy={l.y}
                      r={REVEAL_R}
                      fill="url(#tm-clear)"
                      className={`town-map__hole${anim(`v:${l.id}`)}`}
                    />
                  ))}
                </mask>
              </defs>

              {map.image ? (
                <image href={map.image} width={map.width} height={map.height} preserveAspectRatio="xMidYMid slice" />
              ) : (
                <ArklowBase />
              )}

              <rect
                width={map.width}
                height={map.height}
                filter="url(#tm-mist)"
                mask="url(#tm-mist-mask)"
              />

              {/* Route, in order of discovery */}
              {visited.length > 1 && (
                <polyline
                  points={visited.map((l) => `${l.x},${l.y}`).join(" ")}
                  className="town-map__route"
                />
              )}

              {heard.map((l) => (
                <g key={l.id} className={`town-map__place town-map__place--heard${anim(`h:${l.id}`)}`}>
                  <circle cx={l.x} cy={l.y} r="12" className="town-map__pencil-ring" />
                  <text x={l.x} y={l.y + 5} className="town-map__question">?</text>
                  <text x={l.x} y={l.y + LABEL_DY} className="town-map__label town-map__label--pencil">
                    {l.name}
                  </text>
                </g>
              ))}

              {visited.map((l) => (
                <g key={l.id} className={`town-map__place town-map__place--visited${anim(`v:${l.id}`)}`}>
                  <circle cx={l.x} cy={l.y} r="8" className="town-map__ink-dot" />
                  <text x={l.x} y={l.y + LABEL_DY} className="town-map__label">
                    {l.name}
                  </text>
                </g>
              ))}

              {here && (
                <g className="town-map__here">
                  <circle cx={here.x} cy={here.y} r="17" className="town-map__here-ring" />
                  <text x={here.x} y={here.y - 24} className="town-map__here-label">
                    sei qui
                  </text>
                </g>
              )}
            </svg>
          </div>

          <div className="town-map__legend">
            <section>
              <h3 className="town-map__legend-title">Luoghi visitati</h3>
              <ul className="town-map__list">
                {progress.visited.map((id) => (
                  <li
                    key={id}
                    className={`town-map__item${id === progress.current ? " town-map__item--here" : ""}`}
                  >
                    {place(id)?.name ?? id}
                    {place(id)?.note && <span className="town-map__note"> — {place(id).note}</span>}
                  </li>
                ))}
              </ul>
            </section>
            {progress.heard.length > 0 && (
              <section>
                <h3 className="town-map__legend-title">Sentiti nominare</h3>
                <ul className="town-map__list town-map__list--pencil">
                  {progress.heard.map((id) => (
                    <li key={id} className="town-map__item">
                      {place(id)?.name ?? id}
                      {place(id)?.note && <span className="town-map__note"> — {place(id).note}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      )}
    </>
  );
}
