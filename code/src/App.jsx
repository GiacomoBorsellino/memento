// App.jsx — Root component

import { useState, useCallback, useEffect } from "react";
import Background from "./components/Background.jsx";
import TitleScreen from "./components/TitleScreen.jsx";
import SettingsScreen from "./components/SettingsScreen.jsx";
import CreditsScreen from "./components/CreditsScreen.jsx";
import GameScreen from "./components/GameScreen.jsx";

const DEFAULT_SETTINGS = { volume: 70, sfx: true, textSpeed: 1 };

export default function App() {
  const [screen, setScreen] = useState("menu");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [story, setStory] = useState(null);
  const [bgTheme, setBgTheme] = useState("title");

  // Load story JSON
  useEffect(() => {
    fetch("/story.json", {
      method: "GET",
    })
      .then((r) => r.json())
      .then(setStory)
      .catch((e) => console.error("Failed to load story.json:", e));
  }, []);

  const handleThemeChange = useCallback((theme) => setBgTheme(theme), []);

  const goToMenu = useCallback(() => {
    setBgTheme("title");
    setScreen("menu");
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden" }}>
      {/* Global styles */}
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

      {/* Atmospheric background — persists across all screens */}
      <Background theme={bgTheme} />

      {/* Screens */}
      {screen === "menu" && (
        <TitleScreen
          onStart={() => {
            setBgTheme("forest");
            setScreen("game");
          }}
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

      {screen === "game" && story && (
        <GameScreen
          story={story}
          settings={settings}
          onMenu={goToMenu}
          onThemeChange={handleThemeChange}
        />
      )}

      {screen === "game" && !story && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#5a5040",
            fontFamily: "Georgia, serif",
            letterSpacing: "4px",
            fontSize: 12,
          }}
        >
          Caricamento...
        </div>
      )}
    </div>
  );
}
