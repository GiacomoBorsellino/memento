// App.jsx — Root component: screen routing, story loading, autosave/continue

import { useState, useCallback, useEffect } from "react";
import Background from "./components/Background/Background.jsx";
import TitleScreen from "./components/TitleScreen/TitleScreen.jsx";
import SettingsScreen from "./components/SettingsScreen/SettingsScreen.jsx";
import CreditsScreen from "./components/CreditsScreen/CreditsScreen.jsx";
import GameScreen from "./components/GameScreen/GameScreen.jsx";
import { setAudioSettings } from "./components/audio.js";
import { loadGame, clearAllSaves } from "./db.js";
import { buildStory } from "./engine.js";
import "./App.css";

const DEFAULT_SETTINGS = { volume: 70, sfx: true, textSpeed: 1 };

// BASE_URL follows Vite's `base` option, so the story still loads if the app
// is served from a sub-path (or from a Capacitor webview).
const STORY_URL = `${import.meta.env.BASE_URL}story.json`;

export default function App() {
  const [screen,     setScreen]     = useState("menu");
  const [settings,   setSettings]   = useState(DEFAULT_SETTINGS);
  const [story,      setStory]      = useState(null);
  const [storyError, setStoryError] = useState(null);
  const [bgTheme,    setBgTheme]    = useState("title");
  const [save,       setSave]       = useState(null); // autosave record

  // Load and index story.json
  useEffect(() => {
    fetch(STORY_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((raw) => setStory(buildStory(raw)))
      .catch((e) => {
        console.error("Failed to load story.json:", e);
        setStoryError(e.message);
      });
  }, []);

  // Keep the audio module in sync with the user's settings
  useEffect(() => {
    setAudioSettings(settings);
  }, [settings]);

  // Re-read the autosave every time we land on the main menu, so "Continua"
  // reflects the progress made in the game session that just ended.
  useEffect(() => {
    if (screen !== "menu") return;
    let cancelled = false;
    loadGame("autosave")
      .then((record) => {
        if (!cancelled) setSave(record?.nodeId ? record : null);
      })
      .catch(() => {
        if (!cancelled) setSave(null);
      });
    return () => { cancelled = true; };
  }, [screen]);

  // A save is resumable only if its node still exists in the current story
  // (the story can change between deploys) and it's past the first node.
  const canContinue =
    !!story && !!save && story.nodes.has(save.nodeId) && save.nodeId !== story.start;

  const handleThemeChange = useCallback((theme) => setBgTheme(theme), []);

  const goToMenu = useCallback(() => {
    setBgTheme("title");
    setScreen("menu");
  }, []);

  const startNewGame = () => {
    clearAllSaves().catch(() => {});
    setSave(null);
    setScreen("game");
  };

  const continueGame = () => setScreen("game-continue");

  const inGame = screen === "game" || screen === "game-continue";
  const resuming = screen === "game-continue" && canContinue;

  return (
    <div className="app">
      <Background theme={bgTheme} />

      {screen === "menu" && (
        <TitleScreen
          hasSave={canContinue}
          onStart={startNewGame}
          onContinue={continueGame}
          onSettings={() => setScreen("settings")}
          onCredits={() => setScreen("credits")}
        />
      )}

      {screen === "settings" && (
        <SettingsScreen
          settings={settings}
          onSave={setSettings}
          onBack={() => setScreen("menu")}
        />
      )}

      {screen === "credits" && (
        <CreditsScreen onBack={() => setScreen("menu")} />
      )}

      {inGame && story && (
        <GameScreen
          key={screen} // remount on new game vs continue
          story={story}
          settings={settings}
          onMenu={goToMenu}
          onThemeChange={handleThemeChange}
          initialNodeId={resuming ? save.nodeId : undefined}
          initialState={
            resuming
              ? { inventory: save.inventory ?? [], flags: save.flags ?? [] }
              : undefined
          }
        />
      )}

      {inGame && !story && (
        <div className="app__loading">
          {storyError ? `Impossibile caricare la storia (${storyError})` : "Caricamento..."}
        </div>
      )}
    </div>
  );
}
