// GameScreen/GameScreen.jsx — Core game loop: text reveal, choices,
// inventory/flags (via engine.js), music per theme, autosave.

import { useState, useEffect, useCallback, useRef } from "react";
import CardFan from "../CardFan/CardFan.jsx";
import Dice from "../Dice/Dice.jsx";
import PinPad from "../PinPad/PinPad.jsx";
import SideMenu from "../SideMenu/SideMenu.jsx";
import InventoryModal from "../InventoryModal/InventoryModal.jsx";
import TownMap from "../TownMap/TownMap.jsx";
import { sfxTextReveal, sfxTransition, sfxMenuOpen, sfxClue } from "../audio.js";
import { playMusic, stopMusic } from "../music.js";
import { saveGame } from "../../db.js";
import {
  EMPTY_STATE,
  applyEffects,
  enterNode,
  findDiceRule,
  nodeKind,
  visibleCards,
} from "../../engine.js";
import "./GameScreen.css";

const TEXT_DELAYS = [2200, 1500, 900]; // Lento, Normale, Veloce
const FADE_MS = 700; // fade-out duration before switching node
const CARD_SELECT_MS = 800; // pause after a card is picked

const freshStart = (story) => enterNode(story, story.start, EMPTY_STATE);

export default function GameScreen({
  story, // built story: { start, nodes: Map } (engine.buildStory)
  settings,
  onMenu,
  onThemeChange,
  initialNodeId, // undefined → new game
  initialState, // { inventory, flags } from the save
}) {
  const [nodeId, setNodeId] = useState(initialNodeId ?? story.start);
  const [game, setGame] = useState(() => initialState ?? freshStart(story));
  const [shownTexts, setShownTexts] = useState([]);
  const [textCursor, setTextCursor] = useState(0);
  const [showChoices, setShowChoices] = useState(false);
  const [cardLocked, setCardLocked] = useState(false);
  const [diceOutcome, setDiceOutcome] = useState(null); // { rule, state }
  const [menuOpen, setMenuOpen] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [key, setKey] = useState(0);

  // Latest game state, readable from timers/callbacks without stale closures.
  const gameRef = useRef(game);
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

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

  const node = story.nodes.get(nodeId);
  const kind = node ? nodeKind(node) : "none";
  const delay = TEXT_DELAYS[settings.textSpeed ?? 1];

  // On small screens the texts + choices are taller than the screen, and the
  // game screen scrolls: follow the newest text / the choices down into view.
  const screenRef = useRef(null);
  useEffect(() => {
    const el = screenRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() =>
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }),
    );
    return () => cancelAnimationFrame(raf);
  }, [shownTexts.length, showChoices, diceOutcome]);

  // Music lives as long as the game screen does
  useEffect(() => {
    return () => {
      stopMusic();
      clearTimers();
    };
  }, [clearTimers]);

  // Background + music follow the node's theme
  useEffect(() => {
    if (!node?.theme) return;
    onThemeChange(node.theme);
    playMusic(node.theme);
  }, [node?.theme, onThemeChange]);

  // Resets the per-node UI state (called together with every node switch)
  const resetNodeUI = () => {
    setShownTexts([]);
    setTextCursor(0);
    setShowChoices(false);
    setCardLocked(false);
    setDiceOutcome(null);
    setFadeOut(false);
  };

  // Moves to node `id`. `state` is the game state to carry over (defaults to
  // the current one); the target's onEnter effects are applied on arrival.
  const goTo = useCallback(
    (id, state) => {
      sfxTransition();
      setFadeOut(true);
      later(() => {
        const next = enterNode(story, id, state ?? gameRef.current);
        resetNodeUI();
        setGame(next);
        setNodeId(id);
        saveGame("autosave", { nodeId: id, ...next }).catch(console.error);
      }, FADE_MS);
    },
    [later, story],
  );

  // Sequential text reveal
  useEffect(() => {
    if (!node) return;
    if (textCursor >= node.texts.length) {
      // Optional legacy behaviour: pass-through node that advances by itself
      if (kind === "continue" && node.autoAdvance) {
        const t = setTimeout(() => goTo(node.nextNode), delay);
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
  }, [textCursor, node, kind, delay, goTo]);

  // ── Choices ────────────────────────────────────────────────
  const handleCardSelect = (card) => {
    if (cardLocked) return; // guards against a double tap/click
    setCardLocked(true);
    const next = applyEffects(gameRef.current, card);
    setGame(next);
    later(() => goTo(card.nextNode, next), CARD_SELECT_MS);
  };

  const handleDiceResult = (roll) => {
    const rule = findDiceRule(node, roll);
    if (!rule) return;
    const next = applyEffects(gameRef.current, rule);
    setGame(next);
    if (rule.text) {
      // Show the clue and let the player continue when ready
      sfxClue();
      setDiceOutcome({ rule, state: next });
    } else {
      goTo(rule.nextNode, next);
    }
  };

  const restart = () => {
    clearTimers();
    setMenuOpen(false);
    resetNodeUI();
    const fresh = freshStart(story);
    setGame(fresh);
    setNodeId(story.start);
    setKey((k) => k + 1);
    saveGame("autosave", { nodeId: story.start, ...fresh }).catch(console.error);
  };

  if (!node) return null;

  return (
    <div
      ref={screenRef}
      className={`game-screen${fadeOut ? " game-screen--fade" : ""}`}
    >
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

      {/* ── Inventory and map: buttons + modals ────────────── */}
      <InventoryModal inventory={game.inventory} />
      {story.map && <TownMap story={story} state={game} nodeId={nodeId} />}

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
            {kind === "end" && (
              <EndCard label={node.endLabel} onMenu={onMenu} />
            )}

            {kind === "cards" && (
              <CardFan
                cards={visibleCards(node, game)}
                onSelect={handleCardSelect}
                locked={cardLocked}
              />
            )}

            {kind === "dice" && (
              <>
                <Dice onResult={handleDiceResult} />
                {diceOutcome && (
                  <>
                    <Clue text={diceOutcome.rule.text} />
                    <ContinueBtn
                      label={diceOutcome.rule.continueLabel ?? node.continueLabel}
                      disabled={fadeOut}
                      onClick={() => goTo(diceOutcome.rule.nextNode, diceOutcome.state)}
                    />
                  </>
                )}
              </>
            )}

            {kind === "pin" && (
              <PinPad
                pin={node.pin}
                onSuccess={() => goTo(node.pin.nextNode)}
                onLeave={node.pin.leave ? () => goTo(node.pin.leave.nextNode) : undefined}
              />
            )}

            {kind === "continue" && !node.autoAdvance && (
              <ContinueBtn
                label={node.continueLabel}
                disabled={fadeOut}
                onClick={() => goTo(node.nextNode)}
              />
            )}
          </div>
        )}
      </div>

      {/* Node indicator */}
      <p className="game-screen__node-indicator">§{nodeId}</p>
    </div>
  );
}

function EndCard({ label, onMenu }) {
  return (
    <div className="end-card">
      <div className="end-card__divider" />
      <p className="end-card__label">{label ?? "Fine Capitolo"}</p>
      <button className="end-card__btn" onClick={onMenu}>
        Menu Principale
      </button>
    </div>
  );
}

function Clue({ text }) {
  return (
    <div className="game-clue">
      <p className="game-clue__label">Indizio</p>
      <p className="game-clue__text">{text}</p>
    </div>
  );
}

function ContinueBtn({ label, onClick, disabled }) {
  return (
    <div className="continue-btn">
      <button
        className="continue-btn__inner"
        onClick={onClick}
        disabled={disabled}
      >
        {label ?? "Continua"} ›
      </button>
    </div>
  );
}
