// App.jsx — Root component with autosave/continue support

import { useState, useCallback, useEffect } from "react";
import Background from "./components/Background/Background.jsx";
import TitleScreen from "./components/TitleScreen/TitleScreen.jsx";
import SettingsScreen from "./components/SettingsScreen/SettingsScreen.jsx";
import CreditsScreen from "./components/CreditsScreen/CreditsScreen.jsx";
import GameScreen from "./components/GameScreen/GameScreen.jsx";
import { loadGame, clearAllSaves } from "./db.js";

const DEFAULT_SETTINGS = { volume: 70, sfx: true, textSpeed: 1 };

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
    fetch("/story.json")
      .then((r) => r.json())
      .then(setStory)
      .catch((e) => console.error("Failed to load story.json:", e));
  }, []);

  // Check for autosave on mount
  useEffect(() => {
    loadGame("autosave").then((save) => {
      if (save && save.nodeIdx > 0) {
        setSavedNodeIdx(save.nodeIdx);
        setSavedInventory(save.inventory ?? []);
        setHasSave(true);
      }
    }).catch(() => {});
  }, []);

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

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden" }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080604; font-family: Georgia, serif; color: #e8dfc8; }
        ::-webkit-scrollbar { display: none; }
        button:focus { outline: 2px solid rgba(180,160,110,0.3); outline-offset: 2px; }
        input[type=range] {
          -webkit-appearance: none; height: 2px;
          background: rgba(180,160,110,0.2); border-radius: 1px;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none; width: 14px; height: 14px;
          border-radius: 50%; background: #a89870; cursor: pointer;
          box-shadow: 0 0 6px rgba(168,152,112,0.4);
        }
      `}</style>

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

      {(screen === "game" || screen === "game-continue") && story && (
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

      {(screen === "game" || screen === "game-continue") && !story && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#5a5040", fontFamily: "Georgia, serif",
          letterSpacing: "4px", fontSize: 12,
        }}>
          Caricamento...
        </div>
      )}
    </div>
  );
}
