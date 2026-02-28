// CreditsScreen.jsx

import { sfxClick } from "./audio.js";

const CREDITS = [
  ["Concept & Narrazione", "Giacomo Borsellino"],
  ["Arte delle Carte", "Giacomo Borsellino"],
  ["Sviluppo", "JavaScript · React"],
  ["Musica & Suono", "Web Audio API"],
];

export default function CreditsScreen({ onBack }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "rgba(8,6,4,0.95)",
          border: "1px solid rgba(180,160,110,0.2)",
          padding: "44px 52px",
          maxWidth: 400,
          width: "90%",
          textAlign: "center",
          boxShadow: "0 0 80px rgba(0,0,0,0.8)",
          position: "relative",
        }}
      >
        <h2
          style={{
            color: "#e8dfc8",
            letterSpacing: "8px",
            fontFamily: "Georgia, serif",
            fontWeight: "normal",
            marginTop: 0,
            marginBottom: 36,
            fontSize: 18,
            textTransform: "uppercase",
          }}
        >
          Crediti
        </h2>

        <div
          style={{
            width: 40,
            height: 1,
            background: "rgba(180,160,110,0.3)",
            margin: "-24px auto 30px",
          }}
        />

        {CREDITS.map(([role, name]) => (
          <div key={role} style={{ marginBottom: 22 }}>
            <p
              style={{
                color: "#5a5040",
                fontSize: 10,
                letterSpacing: "3px",
                margin: "0 0 4px",
                fontFamily: "monospace",
                textTransform: "uppercase",
              }}
            >
              {role}
            </p>
            <p
              style={{
                color: "#c8b890",
                fontSize: 15,
                fontFamily: "Georgia, serif",
                margin: 0,
                letterSpacing: "1px",
              }}
            >
              {name}
            </p>
          </div>
        ))}

        <div
          style={{
            width: 40,
            height: 1,
            background: "rgba(180,160,110,0.2)",
            margin: "28px auto",
          }}
        />

        <button
          onClick={() => {
            sfxClick();
            onBack();
          }}
          style={{
            background: "transparent",
            border: "1px solid rgba(180,160,110,0.25)",
            color: "#a89870",
            padding: "12px 44px",
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
            e.currentTarget.style.borderColor = "rgba(180,160,110,0.25)";
            e.currentTarget.style.color = "#a89870";
          }}
        >
          Indietro
        </button>
      </div>
    </div>
  );
}
