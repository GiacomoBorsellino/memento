// CardFan.jsx
// Displays a fan of card images (PNG). On hover the card rises and shows
// its label and effect in an elegant vintage ribbon below.

import { useState } from "react";
import { sfxCardHover, sfxCardSelect } from "./audio.js";

export default function CardFan({ cards, onSelect, locked }) {
  const [hov, setHov] = useState(null);
  const n = cards.length;
  const spread = n <= 2 ? 18 : n === 3 ? 22 : 26;

  return (
    <div
      style={{
        position: "relative",
        height: 320,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        marginTop: 20,
        // enough width for fan
        width: "100%",
        maxWidth: 580,
        margin: "20px auto 0",
      }}
    >
      {cards.map((card, i) => {
        const angle = (i - (n - 1) / 2) * spread;
        const isHov = hov === i;
        const yBase = Math.pow(Math.abs(angle) / spread, 1.4) * 18;
        const yShift = isHov ? -42 : yBase;

        return (
          <div
            key={card.indexCard}
            onMouseEnter={() => {
              if (!locked) {
                setHov(i);
                sfxCardHover();
              }
            }}
            onMouseLeave={() => setHov(null)}
            onClick={() => {
              if (!locked) {
                sfxCardSelect();
                onSelect(card);
              }
            }}
            style={{
              position: "absolute",
              bottom: 0,
              transform: `rotate(${angle}deg) translateY(${yShift}px) scale(${isHov ? 1.06 : 1})`,
              transformOrigin: "bottom center",
              transition: "transform 0.38s cubic-bezier(0.34,1.45,0.64,1)",
              cursor: locked ? "default" : "pointer",
              zIndex: isHov ? 100 : 10 + i,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Card Image */}
            <div
              style={{
                width: 130,
                height: 200,
                borderRadius: 10,
                overflow: "hidden",
                boxShadow: isHov
                  ? "0 28px 60px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.18)"
                  : "0 12px 35px rgba(0,0,0,0.65)",
                transition: "box-shadow 0.35s ease",
                position: "relative",
              }}
            >
              <img
                src={card.cardPath}
                alt={card.textCard}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  filter:
                    locked && hov !== i
                      ? "brightness(0.55)"
                      : isHov
                        ? "brightness(1.08)"
                        : "brightness(0.88)",
                  transition: "filter 0.3s ease",
                }}
              />
              {/* Hover sheen */}
              {isHov && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(135deg,rgba(255,255,255,0.08) 0%,transparent 55%)",
                    pointerEvents: "none",
                  }}
                />
              )}
            </div>

            {/* Label ribbon — appears on hover */}
            <div
              style={{
                marginTop: 8,
                opacity: isHov ? 1 : 0,
                transform: isHov ? "translateY(0)" : "translateY(8px)",
                transition: "all 0.28s ease",
                textAlign: "center",
                pointerEvents: "none",
                // Prevents the ribbon from shifting the fan layout
                position: "absolute",
                bottom: -68,
                width: 160,
              }}
            >
              <p
                style={{
                  margin: "0 0 2px",
                  color: "#e8dfc8",
                  fontFamily: "'Georgia', 'Palatino Linotype', serif",
                  fontSize: 13,
                  letterSpacing: "1.5px",
                  textShadow: "0 1px 6px rgba(0,0,0,0.8)",
                }}
              >
                {card.textCard}
              </p>
              <p
                style={{
                  margin: 0,
                  color: "#a89870",
                  fontFamily: "'Georgia', serif",
                  fontSize: 10,
                  fontStyle: "italic",
                  letterSpacing: "0.5px",
                  textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                }}
              >
                {card.effectCard}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
