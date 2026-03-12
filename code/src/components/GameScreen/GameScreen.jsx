// GameScreen/GameScreen.jsx — Core game loop + inventory management + autosave

import { useState, useEffect, useCallback } from "react";
import CardFan from "../CardFan/CardFan.jsx";
import Dice from "../Dice/Dice.jsx";
import SideMenu from "../SideMenu/SideMenu.jsx";
import InventoryModal from "../InventoryModal/InventoryModal.jsx";
import {
  sfxTextReveal,
  sfxTransition,
  sfxMenuOpen,
  startAmbientMusic,
} from "../audio.js";
import { saveGame, loadGame } from "../../db.js";
import "./GameScreen.css";

const TEXT_DELAYS = [2200, 1500, 900]; // Lento, Normale, Veloce

export default function GameScreen({
  story,
  settings,
  onMenu,
  onThemeChange,
  initialNodeIdx = 0,
  initialInventory = [],
}) {
  const [nodeIdx, setNodeIdx] = useState(initialNodeIdx);
  const [inventory, setInventory] = useState(initialInventory);
  const [shownTexts, setShownTexts] = useState([]);
  const [textCursor, setTextCursor] = useState(0);
  const [showChoices, setShowChoices] = useState(false);
  const [cardLocked, setCardLocked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [key, setKey] = useState(0);

  const node = story[nodeIdx];
  const delay = TEXT_DELAYS[settings.textSpeed ?? 1];

  // Notify parent of theme change
  useEffect(() => {
    if (node?.theme) onThemeChange(node.theme);
  }, [node?.theme, onThemeChange]);

  // Reset text state on node change
  useEffect(() => {
    setShownTexts([]);
    setTextCursor(0);
    setShowChoices(false);
    setCardLocked(false);
    startAmbientMusic();
  }, [nodeIdx, key]);

  // Sequential text reveal
  useEffect(() => {
    if (!node) return;
    if (textCursor >= node.texts.length) {
      // Auto-advance nodes with no choices
      if (
        node.nextNode != null &&
        !node.isEnd &&
        !node.cardsSelected &&
        !node.dice
      ) {
        const t = setTimeout(() => goTo(node.nextNode), 500);
        return () => clearTimeout(t);
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textCursor, node, delay]);

  const goTo = useCallback(
    (idx, newInventory) => {
      sfxTransition();
      setFadeOut(true);
      setTimeout(() => {
        setFadeOut(false);
        setNodeIdx(idx);
        // Autosave whenever we advance
        const inv = newInventory ?? inventory;
        saveGame("autosave", { nodeIdx: idx, inventory: inv }).catch(
          console.error,
        );
      }, 700);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [inventory],
  );

  // ── Inventory helpers ──────────────────────────────────────
  const applyInventoryChanges = (card, currentInventory) => {
    let inv = [...currentInventory];

    // Remove first (e.g. consuming an item)
    if (card.removeFromInventory) {
      inv = inv.filter((item) => item.id !== card.removeFromInventory);
    }

    // Then add (avoids duplicates by id)
    if (card.addToInventory) {
      const alreadyHas = inv.some((item) => item.id === card.addToInventory.id);
      if (!alreadyHas) inv.push(card.addToInventory);
    }

    return inv;
  };

  const handleCardSelect = (card) => {
    setCardLocked(true);
    const newInventory = applyInventoryChanges(card, inventory);
    setInventory(newInventory);
    setTimeout(() => goTo(card.nextNode, newInventory), 800);
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
    setInventory([]);
    setNodeIdx(0);
    setKey((k) => k + 1);
    saveGame("autosave", { nodeIdx: 0, inventory: [] }).catch(console.error);
  };

  if (!node) return null;

  return (
    <div className={`game-screen${fadeOut ? " game-screen--fade" : ""}`}>
      {/* ── Hamburger button ──────────────────────────────── */}
      <button
        className="game-screen__menu-btn"
        onClick={() => {
          sfxMenuOpen();
          setMenuOpen((p) => !p);
        }}
        aria-label="Menu"
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={[
              "game-screen__menu-bar",
              menuOpen && i === 0 ? "game-screen__menu-bar--top-open" : "",
              menuOpen && i === 1 ? "game-screen__menu-bar--mid-open" : "",
              menuOpen && i === 2 ? "game-screen__menu-bar--bot-open" : "",
            ]
              .filter(Boolean)
              .join(" ")}
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

      {/* ── Inventory button + modal ───────────────────────── */}
      <InventoryModal inventory={inventory} />

      {/* ── Main content ──────────────────────────────────── */}
      <div key={key} className="game-screen__content">
        {/* Text area */}
        <div className="game-screen__texts">
          {shownTexts.map((txt, i) => (
            <p
              key={i}
              className={[
                "game-screen__text",
                i === 0
                  ? "game-screen__text--first"
                  : "game-screen__text--body",
                i === shownTexts.length - 1
                  ? "game-screen__text--current"
                  : "game-screen__text--past",
              ].join(" ")}
            >
              {txt}
            </p>
          ))}
        </div>

        {/* Choices */}
        {showChoices && (
          <div className="game-screen__choices">
            {node.isEnd ? (
              <EndCard onMenu={onMenu} />
            ) : node.cardsSelected ? (
              <CardFan
                cards={node.cardsSelected}
                onSelect={handleCardSelect}
                locked={cardLocked}
                inventory={inventory}
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
      <p className="game-screen__node-indicator">
        §{nodeIdx.toString().padStart(3, "0")}
      </p>
    </div>
  );
}

function EndCard({ onMenu }) {
  return (
    <div className="end-card">
      <div className="end-card__divider" />
      <p className="end-card__label">Fine Capitolo</p>
      <button className="end-card__btn" onClick={onMenu}>
        Menu Principale
      </button>
    </div>
  );
}

function ContinueBtn({ onClick }) {
  return (
    <div className="continue-btn">
      <button className="continue-btn__inner" onClick={onClick}>
        Continua ›
      </button>
    </div>
  );
}
