// App.jsx — Root component: screen routing, story loading, autosave/continue

import { useState, useCallback, useEffect } from "react";
import Background from "./components/Background/Background.jsx";
import TitleScreen from "./components/TitleScreen/TitleScreen.jsx";
import SettingsScreen from "./components/SettingsScreen/SettingsScreen.jsx";
import CreditsScreen from "./components/CreditsScreen/CreditsScreen.jsx";
import GameScreen from "./components/GameScreen/GameScreen.jsx";
import { setAudioSettings } from "./components/audio.js";
import { loadGame, clearAllSaves } from "./db.js";
import "./App.css";

const DEFAULT_SETTINGS = { volume: 70, sfx: true, textSpeed: 1 };

// BASE_URL follows Vite's `base` option, so the story still loads if the app
// is served from a sub-path (or from a Capacitor webview).
const STORY_URL = `${import.meta.env.BASE_URL}story.json`;

export default function App() {
  const [screen,   setScreen]   = useState("menu");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [story,    setStory]    = useState(null);
  const [bgTheme,  setBgTheme]  = useState("title");

  // Saved state to resume from
  const [savedNodeIdx,   setSavedNodeIdx]   = useState(0);
  const [savedInventory, setSavedInventory] = useState([]);
  const [hasSave,        setHasSave]        = useState(false);

  // Load story JSON
  useEffect(() => {
    fetch(STORY_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setStory)
      .catch((e) => console.error("Failed to load story.json:", e));
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
      .then((save) => {
        if (cancelled) return;
        if (save && save.nodeIdx > 0) {
          setSavedNodeIdx(save.nodeIdx);
          setSavedInventory(save.inventory ?? []);
          setHasSave(true);
        } else {
          setHasSave(false);
        }
      })
      .catch(() => {
        if (!cancelled) setHasSave(false);
      });
    return () => { cancelled = true; };
  }, [screen]);

  const handleThemeChange = useCallback((theme) => setBgTheme(theme), []);

  const goToMenu = useCallback(() => {
    setBgTheme("title");
    setScreen("menu");
  }, []);

  const startNewGame = () => {
    clearAllSaves().catch(() => {});
    setSavedNodeIdx(0);
    setSavedInventory([]);
    setBgTheme("mist");
    setScreen("game");
  };

  const continueGame = () => {
    setBgTheme("mist");
    setScreen("game-continue");
  };

  const inGame = screen === "game" || screen === "game-continue";

  return (
    <div className="app">
      <Background theme={bgTheme} />

      {screen === "menu" && (
        <TitleScreen
          hasSave={hasSave}
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
          initialNodeIdx={screen === "game-continue" ? savedNodeIdx : 0}
          initialInventory={screen === "game-continue" ? savedInventory : []}
        />
      )}

      {inGame && !story && <div className="app__loading">Caricamento...</div>}
    </div>
  );
}
