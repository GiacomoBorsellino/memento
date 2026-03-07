// InventoryModal/InventoryModal.jsx
// Floating bag button → full-screen modal with CSS scroll-snap carousel.
// Each slide shows: item image, name, description.

import { useState, useRef, useEffect } from "react";
import "./InventoryModal.css";

export default function InventoryModal({ inventory = [] }) {
  const [open, setOpen]           = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef               = useRef();

  // Sync active dot with scroll position
  const handleScroll = () => {
    if (!carouselRef.current) return;
    const el    = carouselRef.current;
    const slideW = 260; // matches .inventory-modal__slide width
    const idx   = Math.round(el.scrollLeft / slideW);
    setActiveSlide(Math.max(0, Math.min(idx, inventory.length - 1)));
  };

  // Scroll to a specific slide when dot is clicked
  const scrollTo = (idx) => {
    if (!carouselRef.current) return;
    carouselRef.current.scrollTo({ left: idx * 260, behavior: "smooth" });
    setActiveSlide(idx);
  };

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Reset to first slide on open
  useEffect(() => {
    if (open) {
      setActiveSlide(0);
      setTimeout(() => {
        if (carouselRef.current) carouselRef.current.scrollLeft = 0;
      }, 50);
    }
  }, [open]);

  return (
    <>
      {/* ── Floating trigger button ───────────────────────── */}
      <button
        className="inventory-btn"
        onClick={() => setOpen(true)}
        aria-label="Inventario"
        title="Inventario"
      >
        🎒
        {inventory.length > 0 && (
          <span className="inventory-btn__badge">{inventory.length}</span>
        )}
      </button>

      {/* ── Modal ─────────────────────────────────────────── */}
      {open && (
        <div
          className="inventory-modal__overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          {/* Header */}
          <div className="inventory-modal__header">
            <h2 className="inventory-modal__title">Inventario</h2>
            <button
              className="inventory-modal__close"
              onClick={() => setOpen(false)}
              aria-label="Chiudi"
            >
              ✕
            </button>
          </div>

          <div className="inventory-modal__divider" />

          {inventory.length === 0 ? (
            <p className="inventory-modal__empty">
              Il tuo inventario è vuoto.
            </p>
          ) : (
            <>
              {/* Carousel */}
              <div
                className="inventory-modal__carousel"
                ref={carouselRef}
                onScroll={handleScroll}
              >
                {inventory.map((item) => (
                  <div key={item.id} className="inventory-modal__slide">
                    <img
                      src={item.imagePath}
                      alt={item.name}
                      className="inventory-modal__item-img"
                    />
                    <div className="inventory-modal__item-info">
                      <p className="inventory-modal__item-name">{item.name}</p>
                      <p className="inventory-modal__item-desc">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dot navigation */}
              {inventory.length > 1 && (
                <div className="inventory-modal__dots">
                  {inventory.map((_, i) => (
                    <button
                      key={i}
                      className={`inventory-modal__dot${i === activeSlide ? " inventory-modal__dot--active" : ""}`}
                      onClick={() => scrollTo(i)}
                      aria-label={`Oggetto ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
