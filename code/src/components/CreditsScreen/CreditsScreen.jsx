// CreditsScreen/CreditsScreen.jsx — CSS extracted

import { sfxClick } from "../audio.js";
import "./CreditsScreen.css";

const CREDITS = [
  ["Concept & Narrazione", "Giacomo Borsellino"],
  ["Arte delle Carte",     "Giacomo Borsellino"],
  ["Sviluppo",             "JavaScript · React"],
  ["Musica & Suono",       "Web Audio API"],
];

export default function CreditsScreen({ onBack }) {
  return (
    <div className="credits-screen">
      <div className="credits-screen__panel">
        <h2 className="credits-screen__title">Crediti</h2>
        <div className="credits-screen__divider" />
        {CREDITS.map(([role, name]) => (
          <div key={role} className="credits-screen__entry">
            <p className="credits-screen__role">{role}</p>
            <p className="credits-screen__name">{name}</p>
          </div>
        ))}
        <div className="credits-screen__divider credits-screen__divider--bottom" />
        <button className="credits-screen__btn" onClick={() => { sfxClick(); onBack(); }}>
          Indietro
        </button>
      </div>
    </div>
  );
}
