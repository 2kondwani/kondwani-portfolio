'use client';
import { useState, useEffect } from 'react';
import { currently, interests } from './data';
import JournalSection from './JournalSection';

/* ============================================================
   Helpers
   ============================================================ */

/** Turn any Spotify share URL into an embed URL. */
function toSpotifyEmbed(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (!u.hostname.includes('spotify.com')) return null;
    if (u.pathname.startsWith('/embed/')) return u.toString();
    return `https://open.spotify.com${u.pathname.replace(/^\//, '/embed/')}`;
  } catch {
    return null;
  }
}

function formatWatched(iso) {
  try {
    const d = new Date(iso + 'T00:00:00');
    return d
      .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      .toLowerCase();
  } catch {
    return iso;
  }
}

/** Split plain text into paragraphs. */
function paragraphs(text) {
  return text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
}

/* ============================================================
   Smooth-loading image — fades in once decoded
   ============================================================ */
function SmoothImage({ src, alt, className = '' }) {
  const [ready, setReady] = useState(false);
  // Re-arm whenever src changes
  useEffect(() => {
    setReady(false);
  }, [src]);

  return (
    <>
      {!ready && (
        <div className="aero-more-img-skeleton" aria-hidden="true">
          <span className="aero-more-img-shimmer" />
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={`${className} ${ready ? 'is-ready' : 'is-loading'}`}
        onLoad={() => setReady(true)}
        decoding="async"
      />
    </>
  );
}

/* ============================================================
   Star rating — half-step fills for 0.5–5.0 Letterboxd scores
   ============================================================ */
function Stars({ value }) {
  if (value == null) return null;
  return (
    <span className="aero-more-stars" aria-label={`${value} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className="aero-more-star">
            <span className="aero-more-star-bg">★</span>
            <span className="aero-more-star-fg" style={{ width: `${fill * 100}%` }}>
              ★
            </span>
          </span>
        );
      })}
    </span>
  );
}

/* ============================================================
   Decorative stickers — pure inline SVG, no deps
   ============================================================ */
function Sticker({ kind, style }) {
  const common = { className: 'aero-more-sticker', style };
  switch (kind) {
    case 'droplet':
      return (
        <svg {...common} viewBox="0 0 32 40" aria-hidden="true">
          <defs>
            <radialGradient id="drop-g" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#a8dcff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#2da8e0" stopOpacity="0.9" />
            </radialGradient>
          </defs>
          <path
            d="M16 2c0 0 12 14 12 22a12 12 0 0 1-24 0C4 16 16 2 16 2z"
            fill="url(#drop-g)"
            stroke="#ffffffd0"
            strokeWidth="1"
          />
          <ellipse cx="11" cy="18" rx="3" ry="5" fill="#ffffffaa" />
        </svg>
      );
    case 'bubble':
      return (
        <svg {...common} viewBox="0 0 40 40" aria-hidden="true">
          <defs>
            <radialGradient id="bub-g" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#bfeaff" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#82c8ff" stopOpacity="0.2" />
            </radialGradient>
          </defs>
          <circle cx="20" cy="20" r="18" fill="url(#bub-g)" stroke="#ffffffcc" strokeWidth="1" />
          <ellipse cx="14" cy="13" rx="4" ry="2.4" fill="#ffffff" opacity="0.85" />
        </svg>
      );
    case 'star':
      return (
        <svg {...common} viewBox="0 0 40 40" aria-hidden="true">
          <defs>
            <linearGradient id="star-g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff5b8" />
              <stop offset="100%" stopColor="#ffd03b" />
            </linearGradient>
          </defs>
          <path
            d="M20 3l4.5 11h11.5l-9 7.5 3.5 11.5L20 25.8 9.5 33l3.5-11.5-9-7.5h11.5z"
            fill="url(#star-g)"
            stroke="#ffffffd0"
            strokeWidth="1"
          />
        </svg>
      );
    case 'leaf':
      return (
        <svg {...common} viewBox="0 0 40 40" aria-hidden="true">
          <defs>
            <linearGradient id="leaf-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a8e8a3" />
              <stop offset="100%" stopColor="#3a9a45" />
            </linearGradient>
          </defs>
          <path
            d="M6 34c0-14 12-26 28-28-2 16-14 28-28 28z"
            fill="url(#leaf-g)"
            stroke="#ffffffd0"
            strokeWidth="1"
          />
          <path d="M10 30c8-8 14-14 22-22" stroke="#ffffff80" strokeWidth="1.2" fill="none" />
        </svg>
      );
    case 'fish':
      return (
        <svg {...common} viewBox="0 0 48 32" aria-hidden="true">
          <defs>
            <linearGradient id="fish-g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffd084" />
              <stop offset="100%" stopColor="#ff7a3d" />
            </linearGradient>
          </defs>
          <path
            d="M2 16c8-10 22-12 32-6l10-6v24l-10-6c-10 6-24 4-32-6z"
            fill="url(#fish-g)"
            stroke="#ffffffd0"
            strokeWidth="1"
          />
          <circle cx="34" cy="14" r="1.8" fill="#0b2238" />
        </svg>
      );
    default:
      return null;
  }
}

/* ============================================================
   Watching — live Letterboxd panel with prev/next navigation
   ============================================================ */
function WatchingPanel({ reviews }) {
  const list = reviews && reviews.length > 0 ? reviews : [];
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const total = list.length;

  const go = (delta) => {
    setActive((i) => (i + delta + total) % total);
    setExpanded(false);
  };

  // No live data — fall back to data.js
  if (total === 0) {
    const item = currently.watching;
    return (
      <article className="aero-more-watch aero-more-watch--fallback">
        <header className="aero-more-watch-tape">
          <span>now watching · offline</span>
        </header>
        <div className="aero-more-watch-stage">
          <div className="aero-more-watch-placeholder">
            <span>🎞️</span>
          </div>
        </div>
        <div className="aero-more-watch-body">
          <h3 className="aero-more-watch-title">
            {item.title}
            {item.year && <span className="aero-more-watch-year"> · {item.year}</span>}
          </h3>
          {item.note && <p className="aero-more-watch-note">{item.note}</p>}
        </div>
      </article>
    );
  }

  const review = list[active];
  const paras = review.review ? paragraphs(review.review) : [];
  const preview = paras[0] || '';
  const rest = paras.slice(1);
  const hasMore = rest.length > 0 || preview.length > 260;
  const previewTrimmed =
    !expanded && preview.length > 260 ? preview.slice(0, 260).trimEnd() + '…' : preview;

  return (
    <article className="aero-more-watch">
      {/* tape / header */}
      <header className="aero-more-watch-tape">
        <span>now watching · letterboxd</span>
        <span className="aero-more-watch-counter">
          {String(active + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
      </header>

      {/* poster stage */}
      <div className="aero-more-watch-stage">
        {review.poster ? (
          <SmoothImage
            key={review.link || review.title}
            src={review.poster}
            alt={`${review.title} poster`}
            className="aero-more-watch-poster"
          />
        ) : (
          <div className="aero-more-watch-placeholder">
            <span>🎞️</span>
          </div>
        )}

        {review.rating != null && (
          <div className="aero-more-watch-rating">
            <Stars value={review.rating} />
            <span className="aero-more-watch-rating-num">{review.rating.toFixed(1)}</span>
          </div>
        )}

        {review.rewatch && <div className="aero-more-watch-badge">↻ rewatch</div>}

        {/* prev / next */}
        <button
          type="button"
          className="aero-more-watch-arrow aero-more-watch-arrow--prev"
          onClick={() => go(-1)}
          aria-label="Previous review"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          className="aero-more-watch-arrow aero-more-watch-arrow--next"
          onClick={() => go(1)}
          aria-label="Next review"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* meta + review */}
      <div className="aero-more-watch-body">
        <h3 className="aero-more-watch-title">
          {review.title}
          {review.year && <span className="aero-more-watch-year"> · {review.year}</span>}
        </h3>
        {review.watchedDate && (
          <p className="aero-more-watch-when">watched {formatWatched(review.watchedDate)}</p>
        )}

        {preview ? (
          <div className="aero-more-watch-review">
            <p>{previewTrimmed}</p>
            {expanded && rest.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        ) : (
          <p className="aero-more-watch-noreview">no written review · just logged</p>
        )}

        <div className="aero-more-watch-actions">
          {preview && hasMore && (
            <button
              type="button"
              className="aero-more-watch-toggle"
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
            >
              {expanded ? '↑ less' : '↓ more'}
            </button>
          )}
          {review.link && (
            <a
              href={review.link}
              target="_blank"
              rel="noopener noreferrer"
              className="aero-more-watch-link"
            >
              {preview ? 'letterboxd ↗' : 'view log on letterboxd ↗'}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

/* ============================================================
   Listening — aero MP3 player chassis with Spotify embed
   ============================================================ */
function Mp3Player({ item }) {
  const embed = toSpotifyEmbed(item.spotifyUrl);
  const [embedReady, setEmbedReady] = useState(false);

  return (
    <article className="aero-more-mp3" aria-label="Now listening">
      {/* "rotation" sticker badge pinned to the corner */}
      <span className="aero-more-mp3-sticker" aria-hidden="true">
        <span className="aero-more-mp3-sticker-inner">rotation</span>
      </span>

      {/* tiny speaker / brand strip */}
      <header className="aero-more-mp3-top">
        <span className="aero-more-mp3-led" aria-hidden="true" />
        <span className="aero-more-mp3-brand">aero · sound</span>
        <span className="aero-more-mp3-speaker" aria-hidden="true">
          <span /><span /><span /><span /><span />
        </span>
      </header>

      {/* TFT-style screen wrapping the embed */}
      <div className="aero-more-mp3-screen">
        {embed ? (
          <>
            {!embedReady && (
              <div className="aero-more-mp3-embed-skeleton" aria-hidden="true">
                <span className="aero-more-mp3-equalizer">
                  <span /><span /><span /><span /><span />
                </span>
                <span className="aero-more-mp3-embed-label">tuning in…</span>
              </div>
            )}
            <iframe
              src={embed}
              className={`aero-more-mp3-iframe ${embedReady ? 'is-ready' : ''}`}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title="Spotify rotation"
              onLoad={() => setEmbedReady(true)}
            />
          </>
        ) : (
          <div className="aero-more-mp3-placeholder">
            <span>♫</span>
            <p>add a spotify share url in data.js</p>
          </div>
        )}
      </div>

      {/* decorative click-wheel + transport */}
      <div className="aero-more-mp3-controls" aria-hidden="true">
        <div className="aero-more-mp3-wheel">
          <span className="aero-more-mp3-wheel-prev">«</span>
          <span className="aero-more-mp3-wheel-play">▶</span>
          <span className="aero-more-mp3-wheel-next">»</span>
          <span className="aero-more-mp3-wheel-center" />
        </div>
      </div>

      <footer className="aero-more-mp3-foot">
        <h3>{item.title}</h3>
        {item.note && <p>{item.note}</p>}
      </footer>
    </article>
  );
}

/* Journal entry rendering + admin editor now lives in JournalSection.js */

/* ============================================================
   Page
   ============================================================ */
export default function MoreClient({ reviews = [], initialJournal = [] }) {
  return (
    <section className="aero-more">
      {/* Scattered decorative stickers */}
      <Sticker kind="droplet" style={{ top: 10, right: '12%', width: 28, transform: 'rotate(-12deg)' }} />
      <Sticker kind="bubble" style={{ top: 80, left: '6%', width: 40, opacity: 0.85 }} />
      <Sticker kind="star" style={{ top: 320, right: '4%', width: 32, transform: 'rotate(14deg)' }} />
      <Sticker kind="leaf" style={{ top: 620, left: '3%', width: 36, transform: 'rotate(-18deg)' }} />
      <Sticker kind="fish" style={{ top: 880, right: '7%', width: 44, transform: 'rotate(8deg)' }} />
      <Sticker kind="bubble" style={{ top: 1120, left: '10%', width: 22 }} />

      {/* Header */}
      <header className="aero-more-head">
        <h1 className="aero-more-title">more</h1>
        <p className="aero-more-sub">
          a low-pressure corner of the site — what i&apos;m watching, what
          i&apos;m listening to, and short journal notes. updated whenever the
          mood hits.
        </p>
      </header>

      {/* ============ Now / Currently ============ */}
      <section className="aero-more-now" aria-labelledby="now-heading">
        <div className="aero-more-section-head">
          <h2 id="now-heading" className="aero-more-section-title">currently</h2>
          <span className="aero-more-section-rule" />
        </div>
        <div className="aero-more-now-row">
          <WatchingPanel reviews={reviews} />
          <Mp3Player item={currently.listening} />
        </div>
      </section>

      {/* ============ Journal (admin-editable) ============ */}
      <JournalSection initialEntries={initialJournal} />

      {/* ============ Interests ============ */}
      <section className="aero-more-interests" aria-labelledby="interests-heading">
        <div className="aero-more-section-head">
          <h2 id="interests-heading" className="aero-more-section-title">interests</h2>
          <span className="aero-more-section-rule" />
        </div>
        <ul className="aero-more-chips">
          {interests.map((it) => (
            <li key={it.label} className="aero-more-chip">
              <span className="aero-more-chip-icon" aria-hidden="true">{it.icon}</span>
              <span className="aero-more-chip-text">
                <strong>{it.label}</strong>
                <em>{it.note}</em>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
