// SideMenu/SideMenu.jsx — CSS extracted

import { sfxClick } from "../audio.js";
import "./SideMenu.css";

export default function SideMenu({ open, onClose, onRestart, onMainMenu }) {
  const items = [
    { label: "Riavvia capitolo", icon: "↺", action: onRestart },
    { label: "Menu principale",  icon: "⌂", action: onMainMenu },
  ];

  return (
    <>
      {open && <div className="side-menu__backdrop" onClick={onClose} />}
      <nav className={`side-menu__panel${open ? "" : " side-menu__panel--closed"}`}>
        <div className="side-menu__divider" />
        {items.map(({ label, icon, action }) => (
          <button
            key={label}
            className="side-menu__item"
            onClick={() => { sfxClick(); onClose(); action(); }}
          >
            <span className="side-menu__item-icon">{icon}</span>
            {label}
          </button>
        ))}
        <p className="side-menu__version">MEMENTO v0.2</p>
      </nav>
    </>
  );
}
