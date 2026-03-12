// TitleScreen/TitleScreen.jsx — CSS extracted

import { useState, useEffect } from "react";
import { sfxClick } from "../audio.js";
import "./TitleScreen.css";

function MenuBtn({ label, onClick, delay = 0 }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <button
      className={`title-screen__btn${show ? " title-screen__btn--visible" : " title-screen__btn--hidden"}`}
      style={{ transitionDuration: show ? "0.6s" : "0s" }}
      onClick={() => {
        sfxClick();
        onClick();
      }}
    >
      {label}
    </button>
  );
}

export default function TitleScreen({
  onStart,
  onSettings,
  onCredits,
  hasSave,
  onContinue,
}) {
  const [showTitle, setShowTitle] = useState(false);
  const [showSub, setShowSub] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowTitle(true), 300);
    const t2 = setTimeout(() => setShowSub(true), 900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="title-screen">
      <div
        className={`title-screen__header${showTitle ? " title-screen__header--visible" : " title-screen__header--hidden"}`}
      >
        <div className="title-screen__line" />
        <h1 className="title-screen__h1">MEMENTO</h1>
        <div className="title-screen__line title-screen__line--below" />
        <p
          className={`title-screen__subtitle${showSub ? " title-screen__subtitle--visible" : " title-screen__subtitle--hidden"}`}
        >
          UN RACCONTO INTERATTIVO
        </p>
      </div>

      <div className="title-screen__menu">
        {hasSave && (
          <MenuBtn label="Continua" onClick={onContinue} delay={900} />
        )}
        <MenuBtn
          label="Nuova Partita"
          onClick={onStart}
          delay={hasSave ? 1200 : 1200}
        />
        <MenuBtn
          label="Impostazioni"
          onClick={onSettings}
          delay={hasSave ? 1500 : 1500}
        />
        <MenuBtn
          label="Crediti"
          onClick={onCredits}
          delay={hasSave ? 1800 : 1800}
        />
      </div>

      <p className="title-screen__version">© 2026 MEMENTO</p>
    </div>
  );
}
