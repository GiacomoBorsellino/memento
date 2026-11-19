// CardFan/CardFan.jsx
// Displays a fan of card images with:
//   Desktop: hover → preview label, click → select
//   Mobile:  first tap → preview label + confirm button, "Scegli" → select
//            backdrop tap → dismiss preview
// Inventory: cards with requiresItem are hidden unless item is in inventory

import { useState } from "react";
import { sfxCardHover, sfxCardSelect } from "../audio.js";
import "./CardFan.css";

// Devices whose primary input can't hover (phones, tablets) get the
// tap-to-preview + confirm flow. Evaluated once: it doesn't change at runtime
// in practice, and it's known before the first touch (unlike touchstart).
const isTouchDevice =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(hover: none)").matches;

export default function CardFan({ cards, onSelect, locked, inventory = [] }) {
  const [activeIdx, setActiveIdx] = useState(null); // hovered/previewed card

  // Filter cards based on inventory requirements
  const visibleCards = cards.filter(
    (card) =>
      !card.requiresItem ||
      inventory.some((item) => item.id === card.requiresItem),
  );

  const n = visibleCards.length;
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
      // First tap: open preview
      if (activeIdx !== i) {
        setActiveIdx(i);
        sfxCardHover();
        return;
      }
      // Second tap directly on card (not confirm btn) — close preview
      setActiveIdx(null);
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

  const handleBackdrop = () => setActiveIdx(null);

  return (
    <>
      {/* Backdrop for dismissing mobile preview */}
      {isTouchDevice && activeIdx !== null && (
        <div className="card-fan__backdrop" onClick={handleBackdrop} />
      )}

      <div className={`card-fan${isTouchDevice ? " card-fan--touch" : ""}`}>
        {visibleCards.map((card, i) => {
          const angle = (i - (n - 1) / 2) * spread;
          const isActive = activeIdx === i;
          const yBase =
            Math.pow(Math.abs(angle) / Math.max(spread, 1), 1.4) * 18;
          const yShift = isActive ? -44 : yBase;
          const scale = isActive ? 1.06 : 1;

          return (
            <div
              key={card.indexCard}
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
              {/* Card image */}
              <div className="card-fan__image-wrapper">
                <img
                  src={card.cardPath}
                  alt={card.textCard}
                  className="card-fan__image"
                  draggable={false}
                />
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
