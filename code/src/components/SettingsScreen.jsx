// SettingsScreen.jsx

import { useState } from "react";
import { sfxClick } from "./audio.js";

const SPEEDS = ["Lento", "Normale", "Veloce"];

export default function SettingsScreen({ settings, onSave, onBack }) {
  const [vol, setVol] = useState(settings.volume);
  const [sfx, setSfx] = useState(settings.sfx);
  const [speed, setSpeed] = useState(settings.textSpeed);

  const save = () => {
    sfxClick();
    onSave({ volume: vol, sfx, textSpeed: speed });
    onBack();
  };

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
          maxWidth: 420,
          width: "90%",
          boxShadow: "0 0 80px rgba(0,0,0,0.8)",
          position: "relative",
        }}
      >
        {/* Corner ornaments */}
        {["0 0", "0 auto", "auto 0", "auto auto"].map((m, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: i < 2 ? 10 : "auto",
              bottom: i >= 2 ? 10 : "auto",
              left: i % 2 === 0 ? 10 : "auto",
              right: i % 2 === 1 ? 10 : "auto",
              width: 20,
              height: 20,
              borderTop: i < 2 ? "1px solid rgba(180,160,110,0.35)" : "none",
              borderBottom:
                i >= 2 ? "1px solid rgba(180,160,110,0.35)" : "none",
              borderLeft:
                i % 2 === 0 ? "1px solid rgba(180,160,110,0.35)" : "none",
              borderRight:
                i % 2 === 1 ? "1px solid rgba(180,160,110,0.35)" : "none",
            }}
          />
        ))}

        <h2
          style={{
            color: "#e8dfc8",
            letterSpacing: "8px",
            fontFamily: "Georgia, serif",
            textAlign: "center",
            marginTop: 0,
            marginBottom: 36,
            fontWeight: "normal",
            fontSize: 18,
            textTransform: "uppercase",
          }}
        >
          Impostazioni
        </h2>

        {/* Volume */}
        <Label>Volume Musica</Label>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 28,
          }}
        >
          <input
            type="range"
            min="0"
            max="100"
            value={vol}
            onChange={(e) => setVol(+e.target.value)}
            style={{ flex: 1, accentColor: "#a89870", cursor: "pointer" }}
          />
          <span
            style={{
              color: "#a89870",
              fontFamily: "monospace",
              fontSize: 12,
              minWidth: 32,
            }}
          >
            {vol}%
          </span>
        </div>

        {/* SFX */}
        <Label>Effetti Sonori</Label>
        <button
          onClick={() => setSfx((p) => !p)}
          style={{
            background: sfx ? "rgba(168,152,112,0.12)" : "transparent",
            border: `1px solid ${sfx ? "rgba(180,160,110,0.5)" : "rgba(180,160,110,0.18)"}`,
            color: sfx ? "#e8dfc8" : "#5a5040",
            padding: "10px 28px",
            cursor: "pointer",
            fontFamily: "Georgia, serif",
            letterSpacing: "2px",
            fontSize: 12,
            marginBottom: 28,
            transition: "all 0.25s",
          }}
        >
          {sfx ? "● Attivi" : "○ Disattivi"}
        </button>

        {/* Text speed */}
        <Label>Velocità del Testo</Label>
        <div style={{ display: "flex", gap: 8, marginBottom: 40 }}>
          {SPEEDS.map((s, i) => (
            <button
              key={s}
              onClick={() => setSpeed(i)}
              style={{
                flex: 1,
                background:
                  speed === i ? "rgba(168,152,112,0.15)" : "transparent",
                border: `1px solid ${speed === i ? "rgba(180,160,110,0.5)" : "rgba(180,160,110,0.14)"}`,
                color: speed === i ? "#e8dfc8" : "#5a5040",
                padding: "10px 0",
                cursor: "pointer",
                fontSize: 11,
                letterSpacing: "1px",
                fontFamily: "Georgia, serif",
                transition: "all 0.2s",
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <Btn
            onClick={() => {
              sfxClick();
              onBack();
            }}
            variant="ghost"
          >
            Annulla
          </Btn>
          <Btn onClick={save} variant="primary">
            Salva
          </Btn>
        </div>
      </div>
    </div>
  );
}

function Label({ children }) {
  return (
    <p
      style={{
        color: "#7a6a50",
        fontSize: 10,
        letterSpacing: "3px",
        marginBottom: 10,
        textTransform: "uppercase",
        fontFamily: "monospace",
      }}
    >
      {children}
    </p>
  );
}

function Btn({ children, onClick, variant }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background:
          variant === "primary" ? "rgba(168,152,112,0.12)" : "transparent",
        border: `1px solid ${variant === "primary" ? "rgba(180,160,110,0.4)" : "rgba(180,160,110,0.14)"}`,
        color: variant === "primary" ? "#e8dfc8" : "#6a5a40",
        padding: "12px 0",
        cursor: "pointer",
        fontFamily: "Georgia, serif",
        letterSpacing: "3px",
        fontSize: 11,
        textTransform: "uppercase",
        transition: "all 0.22s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(180,160,110,0.6)";
        e.currentTarget.style.color = "#e8dfc8";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor =
          variant === "primary"
            ? "rgba(180,160,110,0.4)"
            : "rgba(180,160,110,0.14)";
        e.currentTarget.style.color =
          variant === "primary" ? "#e8dfc8" : "#6a5a40";
      }}
    >
      {children}
    </button>
  );
}
