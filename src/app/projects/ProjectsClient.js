'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { CATEGORIES } from './data';

/* ============================================================
   Loading helpers (skeleton + fade-in for iframes/images)
   ============================================================ */
function MediaSkeleton({ label }) {
  return (
    <div className="aero-slide-skeleton" aria-hidden="true">
      <span className="aero-slide-skeleton-shimmer" />
      <span className="aero-slide-skeleton-label">{label}</span>
    </div>
  );
}

function LoadingIframe({ src, className, title, label, ...rest }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(false); }, [src]);
  return (
    <>
      {!ready && <MediaSkeleton label={label} />}
      <iframe
        src={src}
        className={`${className} ${ready ? 'is-ready' : ''}`}
        title={title}
        loading="lazy"
        onLoad={() => setReady(true)}
        {...rest}
      />
    </>
  );
}

function LoadingImage({ src, alt }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(false); }, [src]);
  return (
    <>
      {!ready && <MediaSkeleton label="loading image" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={`aero-slide-media aero-slide-media--image ${ready ? 'is-ready' : ''}`}
        onLoad={() => setReady(true)}
      />
    </>
  );
}

/* ============================================================
   Media renderer
   ============================================================ */
function MediaViewer({ media, title }) {
  if (!media) return <MediaSkeleton label="no media" />;
  switch (media.type) {
    case 'pdf':
      return (
        <LoadingIframe
          key={media.src}
          src={media.src.includes('#') ? media.src : `${media.src}${media.src.includes('?') ? '&' : '#'}toolbar=0&navpanes=0&view=FitH`}
          className="aero-slide-media aero-slide-media--pdf"
          title={title}
          label="loading pdf"
        />
      );
    case 'youtube':
      return (
        <LoadingIframe
          key={media.embedId}
          src={`https://www.youtube.com/embed/${media.embedId}?rel=0&modestbranding=1`}
          className="aero-slide-media aero-slide-media--video"
          title={title}
          label="loading video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    case 'instagram':
      return (
        <LoadingIframe
          key={media.postId}
          src={`https://www.instagram.com/p/${media.postId}/embed/`}
          className="aero-slide-media aero-slide-media--instagram"
          title={title}
          label="loading instagram"
          allowFullScreen
          scrolling="no"
        />
      );
    case 'video':
      return (
        <video
          key={media.src}
          src={media.src}
          poster={media.poster}
          controls
          playsInline
          preload="metadata"
          className="aero-slide-media aero-slide-media--video"
        />
      );
    case 'image':
      return <LoadingImage key={media.src} src={media.src} alt={media.alt || title} />;
    case 'link':
      return (
        <div className="aero-slide-link">
          <p>External project</p>
          <a href={media.href} target="_blank" rel="noopener noreferrer" className="aero-slide-link-btn">
            {media.label || 'Open link'} ↗
          </a>
        </div>
      );
    default:
      return <MediaSkeleton label="preview unavailable" />;
  }
}

function externalHref(media) {
  if (!media) return null;
  if (media.type === 'pdf' || media.type === 'video' || media.type === 'image') return media.src;
  if (media.type === 'youtube') return `https://youtu.be/${media.embedId}`;
  if (media.type === 'instagram') return `https://www.instagram.com/p/${media.postId}/`;
  if (media.type === 'link') return media.href;
  return null;
}

function MediaTag({ media }) {
  if (!media) return null;
  const map = {
    pdf: 'PDF',
    youtube: 'YouTube',
    instagram: 'Instagram',
    video: 'Video',
    image: 'Image',
    link: 'Link',
  };
  return <span className="aero-slide-tag">{map[media.type] || media.type}</span>;
}

function formatYear(date) {
  if (!date) return '';
  return date.split('-')[0];
}

/* ============================================================
   Main client
   ============================================================ */
export default function ProjectsClient({ projects = [] }) {
  const [category, setCategory] = useState(CATEGORIES[0].id); // Film first
  const [active, setActive] = useState(0);
  const [fileIdx, setFileIdx] = useState(0);

  // Projects in the active category (preserve global chronological order)
  const visible = useMemo(
    () => projects.filter((p) => p.category === category),
    [projects, category]
  );
  const total = visible.length;

  // If category changes or list shrinks, snap active back to first
  useEffect(() => {
    setActive(0);
    setFileIdx(0);
  }, [category]);

  useEffect(() => {
    if (active >= total) setActive(0);
    setFileIdx(0);
  }, [active, total]);

  const project = visible[active] || null;
  const mediaCount = project?.media?.length || 0;
  const media = project?.media?.[fileIdx] || null;

  const goProject = useCallback((delta) => {
    if (total === 0) return;
    setActive((i) => (i + delta + total) % total);
    setFileIdx(0);
  }, [total]);

  const goFile = useCallback((delta) => {
    if (mediaCount <= 1) return;
    setFileIdx((i) => (i + delta + mediaCount) % mediaCount);
  }, [mediaCount]);

  const jumpTo = useCallback((i) => {
    setActive(i);
    setFileIdx(0);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft')  goProject(-1);
      else if (e.key === 'ArrowRight') goProject(1);
      else if (e.key === 'ArrowUp')   { e.preventDefault(); goFile(-1); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); goFile(1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goProject, goFile]);

  const link = externalHref(media);

  return (
    <section className="aero-projects">
      {/* Header */}
      <header className="aero-projects-head">
        <h1 className="aero-projects-title">projects</h1>
        <p className="aero-projects-sub">
          A rolling reel of writing, engineering, and design work — newest
          first. Arrow keys or the dock to navigate; up/down flips between
          files inside a project.
        </p>
      </header>

      {/* Category tabs */}
      <div className="aero-projects-tabs" role="tablist" aria-label="Project category">
        {CATEGORIES.map((c) => {
          const count = projects.filter((p) => p.category === c.id).length;
          const isActive = c.id === category;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-active={isActive}
              className="aero-projects-tab"
              onClick={() => setCategory(c.id)}
            >
              {c.label}
              <span className="aero-projects-tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {total === 0 && (
        <div className="aero-projects-empty">
          <p>No projects in this category yet.</p>
        </div>
      )}

      {/* Slider */}
      {project && (
        <>
          <div className="aero-slider" role="region" aria-roledescription="carousel">
            <div className="aero-slider-stack" aria-hidden="true">
              <span className="aero-slider-stack-card aero-slider-stack-card--back" />
              <span className="aero-slider-stack-card aero-slider-stack-card--mid" />
            </div>

            <div className="aero-slider-window">
              <div className="aero-slider-chrome">
                <span className="aero-slider-dots">
                  <span className="aero-slider-dot aero-slider-dot--r" />
                  <span className="aero-slider-dot aero-slider-dot--y" />
                  <span className="aero-slider-dot aero-slider-dot--g" />
                </span>
                <span className="aero-slider-url" title={project.title}>
                  <span className="aero-slider-url-lock">⌬</span>
                  kondwaniphiri.com / projects / {category} / {String(active + 1).padStart(2, '0')}
                </span>
                <span className="aero-slider-counter">
                  {String(active + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
                </span>
              </div>

              <div className="aero-slider-stage">
                <MediaViewer media={media} title={project.title} />

                <button
                  type="button"
                  className="aero-slider-arrow aero-slider-arrow--prev"
                  onClick={() => goProject(-1)}
                  aria-label="Previous project"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="aero-slider-arrow aero-slider-arrow--next"
                  onClick={() => goProject(1)}
                  aria-label="Next project"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              {/* In-project file strip — only if more than one media item */}
              {mediaCount > 1 && (
                <nav className="aero-slider-files" aria-label="Files in this project">
                  <button
                    type="button"
                    className="aero-slider-files-arrow"
                    onClick={() => goFile(-1)}
                    aria-label="Previous file"
                  >‹</button>
                  <ul className="aero-slider-files-list">
                    {project.media.map((m, i) => (
                      <li key={`${m.src || m.embedId || i}`}>
                        <button
                          type="button"
                          className={`aero-slider-files-item ${i === fileIdx ? 'is-active' : ''}`}
                          onClick={() => setFileIdx(i)}
                          aria-current={i === fileIdx ? 'true' : 'false'}
                        >
                          <span className="aero-slider-files-num">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span className="aero-slider-files-label">
                            {m.label || `file ${i + 1}`}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="aero-slider-files-arrow"
                    onClick={() => goFile(1)}
                    aria-label="Next file"
                  >›</button>
                </nav>
              )}
            </div>
          </div>

          {/* Info card */}
          <article className="aero-slider-info">
            <div className="aero-slider-info-head">
              <div>
                <h2 className="aero-slider-info-title">
                  <span className="aero-slider-info-num">
                    {String(active + 1).padStart(2, '0')}
                  </span>
                  {project.title}
                  <MediaTag media={media} />
                </h2>
                <p className="aero-slider-info-meta">
                  {[project.subtitle, formatYear(project.date)].filter(Boolean).join(' · ')}
                  {mediaCount > 1 && ` · ${mediaCount} files`}
                </p>
              </div>

              {link && (
                <a href={link} target="_blank" rel="noopener noreferrer" className="aero-slider-info-open">
                  Open in new tab ↗
                </a>
              )}
            </div>
            {project.summary && (
              <p className="aero-slider-info-desc">{project.summary}</p>
            )}
            {!project.summary && project.driveFolderId && (
              <p className="aero-slider-info-desc aero-slider-info-desc--muted">
                Description coming soon.
              </p>
            )}
          </article>

          {/* Floating dock — only projects in active category */}
          <nav className="aero-slider-dock" aria-label="Project navigation">
            <button
              type="button"
              className="aero-slider-dock-arrow"
              onClick={() => goProject(-1)}
              aria-label="Previous project"
            >‹</button>
            <ul className="aero-slider-dock-list">
              {visible.map((p, i) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`aero-slider-dock-item ${i === active ? 'is-active' : ''}`}
                    onClick={() => jumpTo(i)}
                    aria-label={`Go to project ${i + 1}: ${p.title}`}
                    aria-current={i === active ? 'true' : 'false'}
                  >
                    <span className="aero-slider-dock-icon">{p.icon}</span>
                    <span className="aero-slider-dock-label">{p.title}</span>
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="aero-slider-dock-arrow"
              onClick={() => goProject(1)}
              aria-label="Next project"
            >›</button>
          </nav>
        </>
      )}
    </section>
  );
}
