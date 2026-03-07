// SettingsScreen/SettingsScreen.jsx — CSS extracted

import { useState } from "react";
import { sfxClick } from "../audio.js";
import "./SettingsScreen.css";

const SPEEDS = ["Lento", "Normale", "Veloce"];

const CORNERS = [
  { top: 10, left: 10,   borderWidth: "1px 0 0 1px" },
  { top: 10, right: 10,  borderWidth: "1px 1px 0 0" },
  { bottom: 10, left: 10,  borderWidth: "0 0 1px 1px" },
  { bottom: 10, right: 10, borderWidth: "0 1px 1px 0" },
];

export default function SettingsScreen({ settings, onSave, onBack }) {
  const [vol,   setVol]   = useState(settings.volume);
  const [sfx,   setSfx]   = useState(settings.sfx);
  const [speed, setSpeed] = useState(settings.textSpeed);

  const save = () => {
    sfxClick();
    onSave({ volume: vol, sfx, textSpeed: speed });
    onBack();
  };

  return (
    <div className="settings-screen">
      <div className="settings-screen__panel">
        {CORNERS.map((style, i) => (
          <div key={i} className="settings-screen__corner" style={style} />
        ))}

        <h2 className="settings-screen__title">Impostazioni</h2>

        <span className="settings-screen__label">Volume Musica</span>
        <div className="settings-screen__range-row">
          <input type="range" min="0" max="100" value={vol} onChange={(e) => setVol(+e.target.value)} />
          <span className="settings-screen__range-val">{vol}%</span>
        </div>

        <span className="settings-screen__label">Effetti Sonori</span>
        <button
          className={`settings-screen__toggle settings-screen__toggle--${sfx ? "on" : "off"}`}
          onClick={() => setSfx((p) => !p)}
        >
          {sfx ? "● Attivi" : "○ Disattivi"}
        </button>

        <span className="settings-screen__label">Velocità del Testo</span>
        <div className="settings-screen__speeds">
          {SPEEDS.map((s, i) => (
            <button
              key={s}
              className={`settings-screen__speed-btn settings-screen__speed-btn--${speed === i ? "active" : "inactive"}`}
              onClick={() => setSpeed(i)}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="settings-screen__actions">
          <button className="settings-screen__btn settings-screen__btn--ghost" onClick={() => { sfxClick(); onBack(); }}>
            Annulla
          </button>
          <button className="settings-screen__btn settings-screen__btn--primary" onClick={save}>
            Salva
          </button>
        </div>
      </div>
    </div>
  );
}
