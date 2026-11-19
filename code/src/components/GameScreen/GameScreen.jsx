// GameScreen/GameScreen.jsx — Core game loop + inventory management + autosave

import { useState, useEffect, useCallback, useRef } from "react";
import CardFan from "../CardFan/CardFan.jsx";
import Dice from "../Dice/Dice.jsx";
import SideMenu from "../SideMenu/SideMenu.jsx";
import InventoryModal from "../InventoryModal/InventoryModal.jsx";
import {
  sfxTextReveal,
  sfxTransition,
  sfxMenuOpen,
  startAmbientMusic,
  stopAmbientMusic,
} from "../audio.js";
import { saveGame } from "../../db.js";
import "./GameScreen.css";

const TEXT_DELAYS = [2200, 1500, 900]; // Lento, Normale, Veloce
const FADE_MS = 700; // fade-out duration before switching node
const CARD_SELECT_MS = 800; // pause after a card is picked

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

  // Latest inventory, readable from timers/callbacks without stale closures.
  const inventoryRef = useRef(initialInventory);
  useEffect(() => {
    inventoryRef.current = inventory;
  }, [inventory]);

  // Pending transition timers. They are cleared on unmount, so going back to
  // the main menu mid-transition does not trigger a late node switch/autosave.
  const timersRef = useRef(new Set());
  const later = useCallback((fn, ms) => {
    const id = setTimeout(() => {
      timersRef.current.delete(id);
      fn();
    }, ms);
    timersRef.current.add(id);
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current.clear();
  }, []);

  const node = story[nodeIdx];
  const delay = TEXT_DELAYS[settings.textSpeed ?? 1];

  // Ambient music lives as long as the game screen does
  useEffect(() => {
    startAmbientMusic();
    return () => {
      stopAmbientMusic();
      clearTimers();
    };
  }, [clearTimers]);

  // Notify parent of theme change
  useEffect(() => {
    if (node?.theme) onThemeChange(node.theme);
  }, [node?.theme, onThemeChange]);

  // Resets the per-node UI state (called together with every node switch)
  const resetNodeUI = () => {
    setShownTexts([]);
    setTextCursor(0);
    setShowChoices(false);
    setCardLocked(false);
    setFadeOut(false);
  };

  // Stable: reads the inventory through the ref, so it never goes stale.
  const goTo = useCallback(
    (idx, newInventory) => {
      sfxTransition();
      setFadeOut(true);
      later(() => {
        resetNodeUI();
        setNodeIdx(idx);
        // Autosave whenever we advance
        const inv = newInventory ?? inventoryRef.current;
        saveGame("autosave", { nodeIdx: idx, inventory: inv }).catch(
          console.error,
        );
      }, FADE_MS);
    },
    [later],
  );

  // Sequential text reveal
  useEffect(() => {
    if (!node) return;
    if (textCursor >= node.texts.length) {
      // Pass-through node (no cards/dice): advance automatically
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
  }, [textCursor, node, delay, goTo]);

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
    if (cardLocked) return; // guards against a double tap/click
    setCardLocked(true);
    const newInventory = applyInventoryChanges(card, inventory);
    setInventory(newInventory);
    later(() => goTo(card.nextNode, newInventory), CARD_SELECT_MS);
  };

  const handleDiceResult = (result) => {
    if (!node.dice) return;
    const rule = node.dice.find(
      (r) => result >= r.range[0] && result <= r.range[1],
    );
    if (rule) goTo(rule.nextNode);
  };

  const restart = () => {
    clearTimers();
    setMenuOpen(false);
    resetNodeUI();
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

        {/* Choices — pass-through nodes advance on their own (see above) */}
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
