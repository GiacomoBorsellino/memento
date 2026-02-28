// SideMenu.jsx — Slide-in side panel accessible during gameplay

import { sfxClick } from "./audio.js";

export default function SideMenu({ open, onClose, onRestart, onMainMenu }) {
  const items = [
    { label: "Riavvia capitolo", icon: "↺", action: onRestart },
    { label: "Menu principale", icon: "⌂", action: onMainMenu },
  ];

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 38,
            background: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(1px)",
          }}
        />
      )}

      {/* Panel */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: 260,
          height: "100%",
          zIndex: 39,
          background: "rgba(12,10,8,0.97)",
          borderLeft: "1px solid rgba(180,160,110,0.15)",
          display: "flex",
          flexDirection: "column",
          paddingTop: 88,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.38s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: open ? "-12px 0 60px rgba(0,0,0,0.7)" : "none",
        }}
      >
        {/* Decorative top line */}
        <div
          style={{
            position: "absolute",
            top: 72,
            left: 24,
            right: 24,
            height: 1,
            background:
              "linear-gradient(to right,transparent,rgba(180,160,110,0.3),transparent)",
          }}
        />

        {items.map(({ label, icon, action }) => (
          <button
            key={label}
            onClick={() => {
              sfxClick();
              onClose();
              action();
            }}
            style={{
              background: "transparent",
              border: "none",
              borderBottom: "1px solid rgba(180,160,110,0.08)",
              color: "#a89870",
              textAlign: "left",
              padding: "18px 28px",
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "Georgia, serif",
              letterSpacing: "1px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              transition: "all 0.22s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#e8dfc8";
              e.currentTarget.style.background = "rgba(180,160,110,0.06)";
              e.currentTarget.style.paddingLeft = "34px";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#a89870";
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.paddingLeft = "28px";
            }}
          >
            <span style={{ opacity: 0.65, fontSize: 16 }}>{icon}</span>
            {label}
          </button>
        ))}

        {/* Bottom version tag */}
        <p
          style={{
            position: "absolute",
            bottom: 24,
            left: 0,
            right: 0,
            textAlign: "center",
            color: "rgba(180,160,110,0.2)",
            fontSize: 10,
            fontFamily: "monospace",
            letterSpacing: "3px",
          }}
        >
          MEMENTO v0.1
        </p>
      </nav>
    </>
  );
}
