'use client';
import { useState, useEffect, useCallback } from 'react';

/* Skeleton shimmer overlay shown until an iframe / media element loads. */
function MediaSkeleton({ label }) {
  return (
    <div className="aero-slide-skeleton" aria-hidden="true">
      <span className="aero-slide-skeleton-shimmer" />
      <span className="aero-slide-skeleton-label">{label}</span>
    </div>
  );
}

/* Iframe wrapper that fades a skeleton out on load. */
function LoadingIframe({ src, className, title, label, ...rest }) {
  const [ready, setReady] = useState(false);
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

/* Image wrapper that fades in on load. */
function LoadingImage({ src, alt }) {
  const [ready, setReady] = useState(false);
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
   Project data
   ------------------------------------------------------------
   Each project supports a flexible `media` object so the slide
   viewer can render any of: pdf, youtube, video, image, link.

     media: { type: 'pdf',     src: '/path.pdf' }
     media: { type: 'youtube', embedId: 'dQw4w9WgXcQ' }
     media: { type: 'video',   src: '/clip.mp4', poster: '/thumb.jpg' }
     media: { type: 'image',   src: '/img.jpg', alt: 'caption' }
     media: { type: 'link',    href: 'https://...', label: 'Open' }

   `thumb` is the dock thumbnail (auto-falls-back to the icon).
   ============================================================ */
const projects = [
  {
    id: 1,
    title: 'SHELLS — USC Screenplay Pitch',
    meta: 'Screenplay · 2023',
    year: '2023',
    icon: '📜',
    desc:
      "Shells is a short film screenplay I wrote during my sophomore year of college. It follows Amara, a sharp but emotionally guarded teenager navigating grief, pressure, and identity in the wake of her sister's death. Set between school offices, flashbacks, and a haunting memory from a gang-related night out, the story unfolds as a raw conversation about loss, family dynamics, and defining yourself when everyone else has already tried to. Shells blends dark humor, dialogue, and tense realism into a quiet portrait of survival.",
    media: { type: 'pdf', src: '/screenplays/SHELLS FINAL DRAFT.pdf' },
  },
  {
    id: 2,
    title: 'Summer Physics Intern — Georgetown University',
    meta: 'Research · Summer 2024',
    year: '2024',
    icon: '🔬',
    desc:
      'At the Del Gado Group in the Department of Physics, I conducted independent research on amorphous materials and shear banding phenomena. The project centered on interpreting landmark data from foundational studies and comparing it with contemporary simulations. I analyzed discrepancies between expected and actual material behavior under varied shear rates using MATLAB and QtGrace for plotting. My findings contradicted previous results, suggesting factors such as experimental setup, temperature variance, or human error. The project explored engineering applications in product design, petrochemical processes, and civil infrastructure, and emphasized future potential in sustainability and environmental resilience.',
    media: { type: 'pdf', src: '/Presented by Kondwani Phiri.pdf' },
  },
  {
    id: 3,
    title: 'Autonomous Toy Drone Design',
    meta: 'CAD Design · 2024',
    year: '2024',
    icon: '✈️',
    desc:
      'Junior-year project for a computer-aided design course at USC. Collaborated on the full design of a toy drone, including CAD modeling, material selection, FEA stress testing, and motion analysis. Led part design and final model verification.',
    media: { type: 'pdf', src: '/projects/AME 308 Final Project.pdf' },
  },
];

/* ============================================================
   Media renderer — switches on media.type
   ============================================================ */
function MediaViewer({ media, title }) {
  if (!media) return <MediaFallback label="No media attached" />;

  switch (media.type) {
    case 'pdf':
      return (
        <LoadingIframe
          key={media.src}
          src={`${media.src}#toolbar=0&navpanes=0&view=FitH`}
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
      return <MediaFallback label="Preview unavailable" />;
  }
}

function MediaFallback({ label }) {
  return (
    <div className="aero-slide-fallback">
      <span>{label}</span>
    </div>
  );
}

/* ============================================================
   Open-in-new-tab helper (only meaningful for file-based media)
   ============================================================ */
function externalHref(media) {
  if (!media) return null;
  if (media.type === 'pdf' || media.type === 'video' || media.type === 'image') return media.src;
  if (media.type === 'youtube') return `https://youtu.be/${media.embedId}`;
  if (media.type === 'link') return media.href;
  return null;
}

/* ============================================================
   Tiny tag chip — shows next to the title bar (pdf/video/etc.)
   ============================================================ */
function MediaTag({ media }) {
  if (!media) return null;
  const map = {
    pdf: 'PDF',
    youtube: 'YouTube',
    video: 'Video',
    image: 'Image',
    link: 'Link',
  };
  return <span className="aero-slide-tag">{map[media.type] || media.type}</span>;
}

/* ============================================================
   Main client component
   ============================================================ */
export default function ProjectsClient() {
  const [active, setActive] = useState(0);
  const total = projects.length;

  const go = useCallback(
    (delta) => {
      setActive((prev) => (prev + delta + total) % total);
    },
    [total]
  );

  const jumpTo = useCallback((i) => setActive(i), []);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const project = projects[active];
  const link = externalHref(project.media);

  return (
    <section className="aero-projects">
      {/* Page header */}
      <header className="aero-projects-head">
        <h1 className="aero-projects-title">projects</h1>
        <p className="aero-projects-sub">
          A rolling reel of engineering, writing, and design work. Slide
          through with the arrows, the dock, or your keyboard.
        </p>
      </header>

      {/* Slider — stacked aero-glass windows */}
      <div className="aero-slider" role="region" aria-roledescription="carousel" aria-label="Projects">
        {/* Decorative stacked panels peeking behind, like the inspo */}
        <div className="aero-slider-stack" aria-hidden="true">
          <span className="aero-slider-stack-card aero-slider-stack-card--back" />
          <span className="aero-slider-stack-card aero-slider-stack-card--mid" />
        </div>

        {/* Front window */}
        <div className="aero-slider-window">
          {/* OS-style chrome */}
          <div className="aero-slider-chrome">
            <span className="aero-slider-dots">
              <span className="aero-slider-dot aero-slider-dot--r" />
              <span className="aero-slider-dot aero-slider-dot--y" />
              <span className="aero-slider-dot aero-slider-dot--g" />
            </span>
            <span className="aero-slider-url" title={project.title}>
              <span className="aero-slider-url-lock">⌬</span>
              kondwaniphiri.com / projects / {String(project.id).padStart(2, '0')}
            </span>
            <span className="aero-slider-counter">
              {String(active + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </span>
          </div>

          {/* Media stage */}
          <div className="aero-slider-stage">
            <MediaViewer media={project.media} title={project.title} />

            {/* Side arrows */}
            <button
              type="button"
              className="aero-slider-arrow aero-slider-arrow--prev"
              onClick={() => go(-1)}
              aria-label="Previous project"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              className="aero-slider-arrow aero-slider-arrow--next"
              onClick={() => go(1)}
              aria-label="Next project"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Description card */}
      <article className="aero-slider-info">
        <div className="aero-slider-info-head">
          <div>
            <h2 className="aero-slider-info-title">
              <span className="aero-slider-info-num">
                {String(active + 1).padStart(2, '0')}
              </span>
              {project.title}
              <MediaTag media={project.media} />
            </h2>
            <p className="aero-slider-info-meta">{project.meta}</p>
          </div>

          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="aero-slider-info-open"
            >
              Open in new tab ↗
            </a>
          )}
        </div>
        <p className="aero-slider-info-desc">{project.desc}</p>
      </article>

      {/* Floating dock */}
      <nav className="aero-slider-dock" aria-label="Project navigation">
        <button
          type="button"
          className="aero-slider-dock-arrow"
          onClick={() => go(-1)}
          aria-label="Previous project"
        >
          ‹
        </button>

        <ul className="aero-slider-dock-list">
          {projects.map((p, i) => (
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
          onClick={() => go(1)}
          aria-label="Next project"
        >
          ›
        </button>
      </nav>
    </section>
  );
}
