// CardFan/CardFan.jsx
// Displays a fan of card images with:
//   Desktop: hover → preview label, click → select
//   Mobile:  first tap → preview label + confirm button, second tap confirm → select
//            backdrop tap → dismiss preview
// Inventory: cards with requiresItem are hidden unless item is in inventory

import { useState, useEffect, useRef } from "react";
import { sfxCardHover, sfxCardSelect } from "../audio.js";
import "./CardFan.css";

export default function CardFan({ cards, onSelect, locked, inventory = [] }) {
  const [activeIdx, setActiveIdx]     = useState(null); // hovered/previewed card
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const containerRef = useRef();

  // Detect touch capability on first touchstart anywhere in the document
  useEffect(() => {
    const detect = () => {
      setIsTouchDevice(true);
      document.removeEventListener("touchstart", detect);
    };
    document.addEventListener("touchstart", detect, { passive: true });
    return () => document.removeEventListener("touchstart", detect);
  }, []);

  // Filter cards based on inventory requirements
  const visibleCards = cards.filter((card) =>
    !card.requiresItem || inventory.some((item) => item.id === card.requiresItem)
  );

  const n      = visibleCards.length;
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
        <div className="card-fan__backdrop" onTouchStart={handleBackdrop} />
      )}

      <div
        ref={containerRef}
        className={`card-fan${isTouchDevice ? " card-fan--touch" : ""}`}
      >
        {visibleCards.map((card, i) => {
          const angle   = (i - (n - 1) / 2) * spread;
          const isActive = activeIdx === i;
          const yBase   = Math.pow(Math.abs(angle) / Math.max(spread, 1), 1.4) * 18;
          const yShift  = isActive ? -44 : yBase;
          const scale   = isActive ? 1.06 : 1;

          return (
            <div
              key={card.indexCard}
              className={[
                "card-fan__card",
                isActive ? "card-fan__card--active" : "",
                locked   ? "card-fan__card--locked" : "",
              ].filter(Boolean).join(" ")}
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
              <div className={`card-fan__label${isActive ? " card-fan__label--visible" : ""}`}>
                <p className="card-fan__label-title">{card.textCard}</p>
                <p className="card-fan__label-effect">{card.effectCard}</p>

                {/* Confirm button — mobile only */}
                <button
                  className="card-fan__confirm-btn"
                  onTouchEnd={(e) => handleConfirm(card, e)}
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
