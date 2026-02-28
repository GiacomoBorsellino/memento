// GameScreen.jsx — Core game loop: sequential text reveal → cards or dice → next node

import { useState, useEffect, useCallback } from "react";
import CardFan from "./CardFan.jsx";
import Dice from "./Dice.jsx";
import SideMenu from "./SideMenu.jsx";
import { sfxTextReveal, sfxTransition, sfxMenuOpen } from "./audio.js";

const TEXT_DELAYS = [2200, 1500, 900]; // Lento, Normale, Veloce

export default function GameScreen({ story, settings, onMenu, onThemeChange }) {
  const [nodeIdx, setNodeIdx] = useState(0);
  const [shownTexts, setShownTexts] = useState([]);
  const [textCursor, setTextCursor] = useState(0);
  const [showChoices, setShowChoices] = useState(false);
  const [cardLocked, setCardLocked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [key, setKey] = useState(0); // force re-mount on restart

  const node = story[nodeIdx];
  const delay = TEXT_DELAYS[settings.textSpeed ?? 1];

  // Notify parent of theme change
  useEffect(() => {
    if (node?.theme) onThemeChange(node.theme);
  }, [node?.theme, onThemeChange]);

  // Reset state when node changes
  useEffect(() => {
    setShownTexts([]);
    setTextCursor(0);
    setShowChoices(false);
    setCardLocked(false);
  }, [nodeIdx, key]);

  // Sequential text reveal
  useEffect(() => {
    if (!node) return;
    if (textCursor >= node.texts.length) {
      const t = setTimeout(() => {
        sfxTextReveal();
        setShowChoices(true);
      }, 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => {
        setShownTexts((p) => [...p, node.texts[textCursor]]);
        setTextCursor((p) => p + 1);
      },
      textCursor === 0 ? 700 : delay,
    );
    return () => clearTimeout(t);
  }, [textCursor, node, delay]);

  const goTo = useCallback((idx) => {
    sfxTransition();
    setFadeOut(true);
    setTimeout(() => {
      setFadeOut(false);
      setNodeIdx(idx);
    }, 700);
  }, []);

  const handleCardSelect = (card) => {
    setCardLocked(true);
    setTimeout(() => goTo(card.nextNode), 800);
  };

  const handleDiceResult = (result) => {
    if (!node.dice) return;
    const rule = node.dice.find(
      (r) => result >= r.range[0] && result <= r.range[1],
    );
    if (rule) goTo(rule.nextNode);
  };

  const restart = () => {
    setMenuOpen(false);
    setNodeIdx(0);
    setKey((k) => k + 1);
  };

  if (!node) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10,
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.7s ease",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 24px 80px",
      }}
    >
      {/* ── Hamburger button ──────────────────────────────────── */}
      <button
        onClick={() => {
          sfxMenuOpen();
          setMenuOpen((p) => !p);
        }}
        aria-label="Menu"
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 50,
          background: "rgba(8,6,4,0.75)",
          border: "1px solid rgba(180,160,110,0.2)",
          width: 46,
          height: 46,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          backdropFilter: "blur(4px)",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 20,
              height: 1.5,
              background: "#a89870",
              transition: "all 0.3s",
              transform:
                menuOpen && i === 0
                  ? "rotate(45deg) translate(4.5px, 4.5px)"
                  : menuOpen && i === 2
                    ? "rotate(-45deg) translate(4.5px, -4.5px)"
                    : "none",
              opacity: menuOpen && i === 1 ? 0 : 1,
            }}
          />
        ))}
      </button>

      <SideMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onRestart={restart}
        onMainMenu={() => {
          setMenuOpen(false);
          onMenu();
        }}
      />

      {/* ── Main content ─────────────────────────────────────── */}
      <div
        key={key}
        style={{
          maxWidth: 640,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Text area */}
        <div
          style={{
            minHeight: 200,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 20,
            marginBottom: 16,
            width: "100%",
          }}
        >
          {shownTexts.map((txt, i) => (
            <p
              key={i}
              style={{
                color: i === shownTexts.length - 1 ? "#e8dfc8" : "#7a6a50",
                fontSize: i === 0 ? 22 : 17,
                fontFamily: "Georgia, 'Palatino Linotype', serif",
                lineHeight: 1.78,
                margin: 0,
                textAlign: "center",
                maxWidth: 560,
                letterSpacing: "0.2px",
                animation: "mFadeUp 0.85s ease both",
                textShadow:
                  i === shownTexts.length - 1
                    ? "0 2px 20px rgba(0,0,0,0.5)"
                    : "none",
              }}
            >
              {txt}
            </p>
          ))}
        </div>

        {/* Choices */}
        {showChoices && (
          <div style={{ animation: "mFadeUp 0.7s ease both", width: "100%" }}>
            {node.isEnd ? (
              <EndCard onMenu={onMenu} />
            ) : node.cardsSelected ? (
              <CardFan
                cards={node.cardsSelected}
                onSelect={handleCardSelect}
                locked={cardLocked}
              />
            ) : node.dice ? (
              <Dice onResult={handleDiceResult} />
            ) : node.nextNode != null ? (
              <ContinueBtn onClick={() => goTo(node.nextNode)} />
            ) : null}
          </div>
        )}
      </div>

      {/* Node indicator */}
      <p
        style={{
          position: "fixed",
          bottom: 18,
          left: 20,
          color: "rgba(120,100,70,0.3)",
          fontSize: 10,
          fontFamily: "monospace",
          letterSpacing: 2,
          margin: 0,
        }}
      >
        §{nodeIdx.toString().padStart(3, "0")}
      </p>

      <style>{`
        @keyframes mFadeUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:none; }
        }
      `}</style>
    </div>
  );
}

function EndCard({ onMenu }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 22,
        marginTop: 30,
      }}
    >
      <div
        style={{
          width: 60,
          height: 1,
          background:
            "linear-gradient(to right,transparent,rgba(180,160,110,0.5),transparent)",
        }}
      />
      <p
        style={{
          color: "#5a5040",
          letterSpacing: "6px",
          fontSize: 10,
          fontFamily: "monospace",
          textTransform: "uppercase",
        }}
      >
        Fine Capitolo
      </p>
      <button
        onClick={onMenu}
        style={{
          background: "transparent",
          border: "1px solid rgba(180,160,110,0.3)",
          color: "#a89870",
          padding: "13px 44px",
          cursor: "pointer",
          fontFamily: "Georgia, serif",
          letterSpacing: "4px",
          fontSize: 11,
          textTransform: "uppercase",
          transition: "all 0.25s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(180,160,110,0.6)";
          e.currentTarget.style.color = "#e8dfc8";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(180,160,110,0.3)";
          e.currentTarget.style.color = "#a89870";
        }}
      >
        Menu Principale
      </button>
    </div>
  );
}

function ContinueBtn({ onClick }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: 28 }}>
      <button
        onClick={onClick}
        style={{
          background: "transparent",
          border: "none",
          borderBottom: "1px solid rgba(180,160,110,0.3)",
          color: "#a89870",
          padding: "10px 0",
          cursor: "pointer",
          fontFamily: "Georgia, serif",
          letterSpacing: "5px",
          fontSize: 11,
          textTransform: "uppercase",
          transition: "all 0.25s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderBottomColor = "rgba(180,160,110,0.7)";
          e.currentTarget.style.color = "#e8dfc8";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderBottomColor = "rgba(180,160,110,0.3)";
          e.currentTarget.style.color = "#a89870";
        }}
      >
        Continua ›
      </button>
    </div>
  );
}
