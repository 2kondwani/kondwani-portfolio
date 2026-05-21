"use client";
import { useState, useEffect } from "react";

/* Fisher–Yates shuffle (uniform distribution). Returns a new array. */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const VIEW_KEY = "kp-gallery-view";

export default function GalleryPage() {
  const [view, setView] = useState("contact"); // "contact" | "grid"
  const [modalImg, setModalImg] = useState(null); // { full, name } | null
  const [touchStartX, setTouchStartX] = useState(null);
  const [images, setImages] = useState([]); // [{ id, name, thumb, full }, ...]
  const [loading, setLoading] = useState(true);

  // Restore view preference
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(VIEW_KEY);
      if (saved === "contact" || saved === "grid") setView(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try { window.localStorage.setItem(VIEW_KEY, view); } catch {}
  }, [view]);

  // Pull images from the Drive-backed API, then shuffle for this page load
  useEffect(() => {
    let cancelled = false;
    async function loadImages() {
      try {
        setLoading(true);
        const res = await fetch("/api/gallery-images", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        const normalized = Array.isArray(data)
          ? data.filter((img) => img && img.thumb && img.full)
          : [];
        setImages(shuffle(normalized));
      } catch {
        if (!cancelled) setImages([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadImages();
    return () => { cancelled = true; };
  }, []);

  const modalIndex = modalImg
    ? images.findIndex((i) => i.full === modalImg.full)
    : -1;

  // Keyboard nav in modal
  useEffect(() => {
    if (!modalImg) return;
    const onKey = (e) => {
      if (images.length === 0) return;
      if (e.key === "ArrowLeft") {
        const prev = (modalIndex - 1 + images.length) % images.length;
        setModalImg(images[prev]);
      } else if (e.key === "ArrowRight") {
        const next = (modalIndex + 1) % images.length;
        setModalImg(images[next]);
      } else if (e.key === "Escape") {
        setModalImg(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalImg, images, modalIndex]);

  // Touch swipe in modal
  function handleTouchStart(e) {
    setTouchStartX(e.touches[0].clientX);
  }
  function handleTouchEnd(e) {
    if (touchStartX === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(deltaX) > 50 && images.length > 0) {
      if (deltaX > 0) {
        const prev = (modalIndex - 1 + images.length) % images.length;
        setModalImg(images[prev]);
      } else {
        const next = (modalIndex + 1) % images.length;
        setModalImg(images[next]);
      }
    }
    setTouchStartX(null);
  }

  return (
    <section className="aero-gallery">
      <header className="aero-gallery-head">
        <h1 className="aero-gallery-title">
          all images by me, from 2023 to present.
        </h1>

        <div className="aero-view-toggle" role="tablist" aria-label="Gallery view">
          <button
            type="button"
            role="tab"
            aria-selected={view === "contact"}
            data-active={view === "contact"}
            onClick={() => setView("contact")}
          >
            contact sheet
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "grid"}
            data-active={view === "grid"}
            onClick={() => setView("grid")}
          >
            grid
          </button>
        </div>
      </header>

      {loading && (
        <div className="aero-gallery-loading">loading images…</div>
      )}

      {!loading && images.length === 0 && (
        <div className="aero-gallery-loading">
          no images yet. drop some in the drive folder and refresh.
        </div>
      )}

      {/* One long contact sheet — no per-roll grouping */}
      {!loading && images.length > 0 && view === "contact" && (
        <section className="aero-contact-sheet">
          <header className="aero-contact-roll-head">
            <span className="aero-contact-roll-label">contact sheet</span>
            <span className="aero-contact-roll-id">all frames</span>
            <span className="aero-contact-roll-meta">
              {images.length} frame{images.length === 1 ? "" : "s"}
            </span>
          </header>

          <div className="aero-contact-grid">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                className="aero-frame"
                style={{ "--i": i }}
                onClick={() => setModalImg(img)}
                aria-label={`Open frame ${i + 1}`}
              >
                <span className="aero-frame-edge" aria-hidden="true">
                  KODAK 400TX
                </span>
                <span className="aero-frame-photo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.thumb} alt={img.name} loading="lazy" />
                </span>
                <span className="aero-frame-foot" aria-hidden="true">
                  <span className="aero-frame-tri">▲</span>
                  <span className="aero-frame-num">·{String(i + 1).padStart(3, "0")}·</span>
                  <span className="aero-frame-tri">▲</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {!loading && images.length > 0 && view === "grid" && (
        <div className="aero-grid-wrap">
          <div className="aero-grid-columns">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                className="aero-grid-item"
                style={{ "--i": i }}
                onClick={() => setModalImg(img)}
                aria-label={`Open ${img.name}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.thumb} alt={img.name} loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal overlay */}
      {modalImg && (
        <div
          className="aero-modal"
          onClick={() => setModalImg(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
        >
          <div
            className="aero-modal-inner"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <button
              type="button"
              className="aero-modal-close"
              onClick={() => setModalImg(null)}
              aria-label="Close"
            >
              ×
            </button>
            <button
              type="button"
              className="aero-modal-nav aero-modal-nav-prev"
              onClick={() => {
                if (images.length === 0) return;
                const prev = (modalIndex - 1 + images.length) % images.length;
                setModalImg(images[prev]);
              }}
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              type="button"
              className="aero-modal-nav aero-modal-nav-next"
              onClick={() => {
                if (images.length === 0) return;
                const next = (modalIndex + 1) % images.length;
                setModalImg(images[next]);
              }}
              aria-label="Next image"
            >
              ›
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={modalImg.full} alt={modalImg.name} />
            {modalIndex >= 0 && (
              <div className="aero-modal-meta">
                frame {String(modalIndex + 1).padStart(3, "0")} · {images.length}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
