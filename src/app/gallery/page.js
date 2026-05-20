"use client";
import { useState, useEffect, useMemo } from "react";

// Static fallback list of image filenames from the public/pics directory
const fallbackImageFiles = [
  "IMG5573-R01-007A.png",
  "IMG5573-R01-008A.png",
  "IMG5573-R01-011A.png",
  "IMG5573-R01-013A.png",
  "IMG5573-R01-016A.png",
  "IMG5573-R01-022A.png",
  "IMG5573-R01-023A.png",
  "IMG5573-R01-024A.png",
  "IMG5573-R01-033A.png",
  "IMG5573-R01-035A.png",
  "IMG6103-R01-003A.png",
  "IMG6103-R01-006A.png",
  "IMG6103-R01-007A.png",
  "IMG6103-R01-008A.png",
  "IMG6103-R01-014A.png",
  "IMG6103-R01-023A.png",
  "IMG6103-R01-024A.png",
  "IMG6109-R01-027.png",
  "IMG6110-R01-001A.png",
  "IMG6110-R01-008A.png",
  "IMG6110-R01-010A.png",
  "IMG6110-R01-013A.png",
  "IMG6110-R01-014A.png",
  "IMG6110-R01-016A.png",
  "IMG6110-R01-017A.png",
  "IMG6110-R01-018A.png",
  "IMG6110-R01-019A.png",
  "IMG6110-R01-021A.png",
  "IMG6110-R01-022A.png",
  "IMG6110-R01-023A.png",
  "IMG6110-R01-029A.png",
  "IMG7659-R01-008.png",
  "IMG7659-R01-009.png",
  "IMG7659-R01-010.png",
  "IMG7659-R01-011.png",
  "IMG7659-R01-016.png",
  "IMG7659-R01-019.png",
  "IMG7659-R01-025.png",
  "IMG7659-R01-028.png",
  "IMG7659-R01-029.png",
  "IMG7659-R01-030.png",
  "IMG7659-R01-031.png",
  "IMG7659-R01-032.png",
  "image1.png",
  "image2.png",
  "image3.png",
  "image4.png",
  "image5.png",
];

// Parse a filename like "IMG5573-R01-007A.png" into a film-roll + frame pair.
// Files that don't match the IMG####-R##-FRAME pattern fall into a MISC group.
function parseFilename(file) {
  const m = file.match(/^(IMG\d+-R\d+)-(\d+[A-Za-z]?)\.(png|jpg|jpeg|webp|gif)$/i);
  if (m) return { roll: m[1], frame: m[2] };
  return { roll: "MISC", frame: file.replace(/\.[^.]+$/, "") };
}

// View-mode preference, persisted across sessions
const VIEW_KEY = "kp-gallery-view";

export default function GalleryPage() {
  const [view, setView] = useState("contact"); // "contact" | "grid"
  const [modalImg, setModalImg] = useState(null);
  const [touchStartX, setTouchStartX] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore saved view preference
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(VIEW_KEY);
      if (saved === "contact" || saved === "grid") setView(saved);
    } catch {}
  }, []);

  // Persist view preference
  useEffect(() => {
    try {
      window.localStorage.setItem(VIEW_KEY, view);
    } catch {}
  }, [view]);

  // Fetch images dynamically from API; fall back to a static list if needed
  useEffect(() => {
    let cancelled = false;
    async function loadImages() {
      try {
        setLoading(true);
        const res = await fetch("/api/gallery-images", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const files = await res.json();
        if (!cancelled) {
          const normalized = Array.isArray(files)
            ? files.filter((f) => typeof f === "string").sort()
            : [];
          setImages(normalized.length ? normalized : fallbackImageFiles);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setImages(fallbackImageFiles);
          setError(null); // silent fallback, no scary message in UI
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadImages();
    return () => {
      cancelled = true;
    };
  }, []);

  // Group images by film roll for the contact-sheet view
  const rolls = useMemo(() => {
    const groups = new Map();
    for (const file of images) {
      const { roll, frame } = parseFilename(file);
      if (!groups.has(roll)) groups.set(roll, []);
      groups.get(roll).push({ file, frame });
    }
    // Sort frames within each roll by numeric prefix
    for (const arr of groups.values()) {
      arr.sort((a, b) =>
        a.frame.localeCompare(b.frame, "en", { numeric: true })
      );
    }
    // Preserve insertion order (alphabetical by sorted filenames), but push MISC last
    const ordered = [];
    for (const [roll, items] of groups.entries()) {
      if (roll !== "MISC") ordered.push([roll, items]);
    }
    if (groups.has("MISC")) ordered.push(["MISC", groups.get("MISC")]);
    return ordered;
  }, [images]);

  // Modal navigation index (flat index into `images`)
  const modalIndex = modalImg
    ? images.findIndex((f) => `/pics/${f}` === modalImg)
    : -1;

  // Keyboard navigation
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!modalImg) return;
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft" && images.length > 0) {
        const prev = (modalIndex - 1 + images.length) % images.length;
        setModalImg(`/pics/${images[prev]}`);
      } else if (e.key === "ArrowRight" && images.length > 0) {
        const next = (modalIndex + 1) % images.length;
        setModalImg(`/pics/${images[next]}`);
      } else if (e.key === "Escape") {
        setModalImg(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalImg, images, modalIndex]);

  // Touch swipe navigation
  function handleTouchStart(e) {
    setTouchStartX(e.touches[0].clientX);
  }
  function handleTouchEnd(e) {
    if (touchStartX === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(deltaX) > 50 && images.length > 0) {
      if (deltaX > 0) {
        const prev = (modalIndex - 1 + images.length) % images.length;
        setModalImg(`/pics/${images[prev]}`);
      } else {
        const next = (modalIndex + 1) % images.length;
        setModalImg(`/pics/${images[next]}`);
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

        <div
          className="aero-view-toggle"
          role="tablist"
          aria-label="Gallery view"
        >
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

      {!loading && view === "contact" && (
        <div className="aero-contact-wrap">
          {rolls.map(([roll, items], rollIdx) => (
            <section key={roll} className="aero-contact-sheet">
              <header className="aero-contact-roll-head">
                <span className="aero-contact-roll-label">roll</span>
                <span className="aero-contact-roll-id">
                  {roll === "MISC" ? "misc / digital" : roll.toLowerCase()}
                </span>
                <span className="aero-contact-roll-meta">
                  {items.length} frame{items.length === 1 ? "" : "s"}
                </span>
              </header>

              <div className="aero-contact-grid">
                {items.map(({ file, frame }, i) => (
                  <button
                    key={file}
                    type="button"
                    className="aero-frame"
                    style={{ "--i": i + rollIdx * 12 }}
                    onClick={() => setModalImg(`/pics/${file}`)}
                    aria-label={`Open frame ${frame} from roll ${roll}`}
                  >
                    <span className="aero-frame-edge" aria-hidden="true">
                      KODAK 400TX
                    </span>
                    <span className="aero-frame-photo">
                      <img
                        src={`/pics/${file}`}
                        alt={`Frame ${frame}, roll ${roll}`}
                        loading="lazy"
                      />
                    </span>
                    <span className="aero-frame-foot" aria-hidden="true">
                      <span className="aero-frame-tri">▲</span>
                      <span className="aero-frame-num">·{frame}·</span>
                      <span className="aero-frame-tri">▲</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {!loading && view === "grid" && (
        <div className="aero-grid-wrap">
          <div className="aero-grid-columns">
            {images.map((file, i) => (
              <button
                key={file}
                type="button"
                className="aero-grid-item"
                style={{ "--i": i }}
                onClick={() => setModalImg(`/pics/${file}`)}
                aria-label={`Open ${file}`}
              >
                <img src={`/pics/${file}`} alt={file} loading="lazy" />
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
                setModalImg(`/pics/${images[prev]}`);
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
                setModalImg(`/pics/${images[next]}`);
              }}
              aria-label="Next image"
            >
              ›
            </button>
            <img src={modalImg} alt="Enlarged view" />
            {modalIndex >= 0 && (
              <div className="aero-modal-meta">
                {(() => {
                  const f = images[modalIndex];
                  const { roll, frame } = parseFilename(f);
                  if (roll === "MISC") return f;
                  return `${roll.toLowerCase()} · frame ${frame}`;
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
