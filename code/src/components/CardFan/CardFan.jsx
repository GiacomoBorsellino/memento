// CardFan/CardFan.jsx
// Displays a fan of cards with:
//   Desktop: hover → preview label, click → select
//   Mobile:  first tap → preview label + confirm button, "Scegli" → select
//            backdrop tap → dismiss preview
// A card with `cardPath` shows that image; without it, a minimal text card
// (title on a framed face) is drawn in CSS.
// The parent passes only the cards whose conditions are met (engine.js).

import { useState } from "react";
import { sfxCardHover, sfxCardSelect } from "../audio.js";
import "./CardFan.css";

// Devices whose primary input can't hover (phones, tablets) get the
// tap-to-preview + confirm flow. Known before the first touch.
const isTouchDevice =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(hover: none)").matches;

export default function CardFan({ cards, onSelect, locked }) {
  const [activeIdx, setActiveIdx] = useState(null); // hovered/previewed card

  const n = cards.length;
  const spread = n <= 2 ? 18 : n === 3 ? 22 : 26;

  // ── Desktop: hover handlers ────────────────────────────────
  const handleMouseEnter = (i) => {
    if (locked || isTouchDevice) return;
    setActiveIdx(i);
    sfxCardHover();
  };

  const handleMouseLeave = () => {
    if (isTouchDevice) return;
    setActiveIdx(null);
  };

  const handleClick = (card, i) => {
    if (locked) return;
    if (isTouchDevice) {
      // First tap: open preview; tapping the same card again closes it
      if (activeIdx !== i) {
        setActiveIdx(i);
        sfxCardHover();
      } else {
        setActiveIdx(null);
      }
      return;
    }
    // Desktop click
    sfxCardSelect();
    onSelect(card);
  };

  // Only onClick: on touch screens the browser synthesizes a click after
  // touchend, so handling both would select the card twice.
  const handleConfirm = (card, e) => {
    e.stopPropagation();
    if (locked) return;
    sfxCardSelect();
    setActiveIdx(null);
    onSelect(card);
  };

  return (
    <>
      {/* Backdrop for dismissing mobile preview */}
      {isTouchDevice && activeIdx !== null && (
        <div className="card-fan__backdrop" onClick={() => setActiveIdx(null)} />
      )}

      <div className={`card-fan${isTouchDevice ? " card-fan--touch" : ""}`}>
        {cards.map((card, i) => {
          const angle = (i - (n - 1) / 2) * spread;
          const isActive = activeIdx === i;
          const yBase =
            Math.pow(Math.abs(angle) / Math.max(spread, 1), 1.4) * 18;
          const yShift = isActive ? -44 : yBase;
          const scale = isActive ? 1.06 : 1;

          return (
            <div
              key={`${i}-${card.textCard}`}
              className={[
                "card-fan__card",
                isActive ? "card-fan__card--active" : "",
                locked ? "card-fan__card--locked" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{
                transform: `rotate(${angle}deg) translateY(${yShift}px) scale(${scale})`,
                transformOrigin: "bottom center",
                zIndex: isActive ? 100 : 10 + i,
              }}
              onMouseEnter={() => handleMouseEnter(i)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleClick(card, i)}
            >
              {/* Card face */}
              <div className="card-fan__image-wrapper">
                {card.cardPath ? (
                  <img
                    src={card.cardPath}
                    alt={card.textCard}
                    className="card-fan__image"
                    draggable={false}
                  />
                ) : (
                  <div className="card-fan__text-card">
                    <span className="card-fan__text-card-ornament" aria-hidden="true">✦</span>
                    <p className="card-fan__text-card-title">{card.textCard}</p>
                    <span className="card-fan__text-card-ornament" aria-hidden="true">✦</span>
                  </div>
                )}
                {isActive && <div className="card-fan__sheen" />}
              </div>

              {/* Label ribbon */}
              <div
                className={`card-fan__label${isActive ? " card-fan__label--visible" : ""}`}
              >
                <p className="card-fan__label-title">{card.textCard}</p>
                <p className="card-fan__label-effect">{card.effectCard}</p>

                {/* Confirm button — visible on touch devices only (CSS) */}
                <button
                  className="card-fan__confirm-btn"
                  onClick={(e) => handleConfirm(card, e)}
                >
                  Scegli
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
