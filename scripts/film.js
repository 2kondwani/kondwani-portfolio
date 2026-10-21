// Film tab: a reel that shows one film at a time. Swipe, drag, use the arrows,
// or press ← →; neighbours peek in at the edges in black and white. Under it, a
// clapperboard slate with the front film's credits, an index of titles, and the
// screenplays. site.js calls Film.render() when the tab first opens and
// Film.pause() when it's left.
(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const films = window.FILMS;
  const scripts = window.SCREENPLAYS;
  const FPS = 24; // for the timecode readout

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const pad = (n, size = 2) => String(n).padStart(size, '0');
  const ratio = (aspect) => {
    const [w, h] = aspect.split('/').map(Number);
    return w / h;
  };

  let view, track, slides, frames, strip, slate, now;
  let active = -1;

  // ---------- Markup ----------

  // An opening title card, for films without a still yet.
  function titleCard(f) {
    return `
      <div class="titlecard">
        <p class="titlecard__client">${esc(f.client)}</p>
        <p class="titlecard__title">${esc(f.title)}</p>
        <p class="titlecard__by">${esc(f.byline)}</p>
      </div>`;
  }

  const ICON = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/></svg>',
    sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="none"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/></svg>',
    muted: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="none"/><path d="m16 9.5 5 5M21 9.5l-5 5"/></svg>',
    full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  };

  // Our own controls for films hosted on the site.
  const playerMarkup = () => `
    <div class="player">
      <button class="player__btn" type="button" data-act="toggle" aria-label="Play">${ICON.play}</button>
      <span class="player__tc" data-tc>00:00:00:00</span>
      <input class="player__scrub" type="range" min="0" max="1000" value="0" step="1" aria-label="Seek" data-scrub>
      <span class="player__dur" data-dur>--:--</span>
      <button class="player__btn" type="button" data-act="mute" aria-label="Mute">${ICON.sound}</button>
      <button class="player__btn" type="button" data-act="full" aria-label="Full screen">${ICON.full}</button>
    </div>`;

  function slideMarkup(f, i) {
    const media = f.src
      ? `<video class="screen__video" src="${esc(f.src)}" ${f.poster ? `poster="${esc(f.poster)}"` : ''} preload="metadata" playsinline></video>`
      : f.poster
        ? `<img class="screen__poster" src="${esc(f.poster)}" alt="" draggable="false">`
        : titleCard(f);
    return `
      <article class="slide" data-index="${i}" style="--ar:${ratio(f.aspect)}" aria-roledescription="slide" aria-label="${i + 1} of ${films.length}: ${esc(f.title)}">
        <div class="screen">
          <div class="screen__glow" aria-hidden="true">
            ${f.poster ? `<img src="${esc(f.poster)}" alt="">` : ''}
            ${f.src ? '<canvas width="32" height="18"></canvas>' : ''}
          </div>
          <div class="screen__frame">
            ${media}
            <button class="screen__play" type="button" aria-label="Play ${esc(f.title)}">${ICON.play}</button>
            ${f.src ? playerMarkup() : ''}
          </div>
        </div>
      </article>`;
  }

  function frameMarkup(f, i) {
    return `
      <button class="strip__item" type="button" role="tab" data-index="${i}" aria-selected="false">
        <span class="strip__no">${pad(i + 1)}</span>
        <span class="strip__title">${esc(f.title)}</span>
      </button>`;
  }

  function slateMarkup(f) {
    return `
      <div class="slate__clapper" aria-hidden="true"><span></span></div>
      <div class="slate__body">
        <div class="slate__main">
          <p class="slate__meta">${esc(f.client)} · ${esc(f.when)}</p>
          <h2 class="slate__title">${esc(f.title)}</h2>
          <p class="slate__byline">${esc(f.byline)}</p>
          <p class="slate__summary">${esc(f.summary)}</p>
          <a class="slate__link" href="${esc(f.fallback.url)}" target="_blank" rel="noopener">${esc(f.fallback.label)} ↗</a>
        </div>
        <dl class="slate__grid">
          <div><dt>Role</dt><dd>${esc(f.role)}</dd></div>
          <div><dt>Roll</dt><dd>${pad(films.indexOf(f) + 1)} / ${pad(films.length)}</dd></div>
          ${f.credits.map(([k, v]) => `<div class="slate__wide"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}
        </dl>
      </div>`;
  }

  function scriptMarkup(s) {
    return `
      <article class="script">
        <button class="script__page" type="button" data-script="${s.id}" aria-label="Read ${esc(s.title)}">
          <span class="script__title">${esc(s.title)}</span>
          <span class="script__by">written by</span>
          <span class="script__name">Kondwani Phiri</span>
          <span class="script__draft">Final Draft</span>
        </button>
        <div class="script__body">
          <p class="script__meta">${esc(s.kind)} · ${esc(s.context)} · ${esc(s.when)}</p>
          <h3 class="script__heading">${esc(s.title)}</h3>
          <p class="script__summary">${esc(s.summary)}</p>
          <button class="doc-btn" type="button" data-script="${s.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M6 2.5h8l4 4v15H6z"/><path d="M14 2.5v4h4M9 12h6M9 15.5h6"/></svg>
            Read the screenplay
          </button>
        </div>
      </article>`;
  }

  // ---------- Reel geometry ----------

  // Room at both ends so the first and last films can sit dead center.
  function fitTrack() {
    const w = track.clientWidth;
    track.style.paddingLeft = `${(w - slides[0].offsetWidth) / 2}px`;
    track.style.paddingRight = `${(w - slides[slides.length - 1].offsetWidth) / 2}px`;
    measure();
  }

  const centerOf = (s) => s.offsetLeft + s.offsetWidth / 2;

  // How far each slide is from center (0 = front, 1 = a whole step away) drives
  // its scale, fade, and grayscale in CSS; the closest one becomes the front film.
  let raf = 0;
  function measure() {
    raf = 0;
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    let bestD = Infinity;
    slides.forEach((s, i) => {
      const d = (centerOf(s) - mid) / (s.offsetWidth * 0.75 + 40);
      s.style.setProperty('--d', Math.min(1, Math.abs(d)).toFixed(3));
      if (Math.abs(d) < bestD) {
        bestD = Math.abs(d);
        best = i;
      }
    });
    if (best !== active) setActive(best);
  }

  function go(i, smooth = true) {
    i = Math.max(0, Math.min(films.length - 1, i));
    track.scrollTo({ left: centerOf(slides[i]) - track.clientWidth / 2, behavior: smooth && !reduceMotion ? 'smooth' : 'auto' });
  }

  function setActive(i) {
    if (active >= 0) stop(active);
    active = i;
    slides.forEach((s, n) => {
      s.classList.toggle('is-active', n === i);
      s.setAttribute('aria-hidden', String(n !== i));
      s.inert = n !== i;
    });
    frames.forEach((fr, n) => fr.setAttribute('aria-selected', String(n === i)));
    moveBar();
    now.textContent = pad(i + 1);
    document.getElementById('reel-prev').disabled = i === 0;
    document.getElementById('reel-next').disabled = i === films.length - 1;

    slate.innerHTML = slateMarkup(films[i]);
    if (!reduceMotion) {
      slate.classList.remove('is-clap');
      void slate.offsetWidth;
      slate.classList.add('is-clap');
    }
  }

  // The underline under the index slides to the film in front, like the tabs up top.
  function moveBar() {
    const item = frames[active];
    const bar = strip.querySelector('.strip__bar');
    if (!item || !bar) return;
    bar.style.width = `${item.offsetWidth}px`;
    bar.style.transform = `translateX(${item.offsetLeft}px)`;
  }

  // ---------- Playback ----------

  function play(i) {
    const f = films[i];
    const slide = slides[i];
    if (f.src) {
      slide.querySelector('video').play();
      return;
    }
    // Not hosted yet: play the existing upload in place.
    const fb = f.fallback;
    const iframe = document.createElement('iframe');
    iframe.className = 'screen__embed';
    iframe.title = f.title;
    iframe.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.src =
      fb.type === 'youtube'
        ? `https://www.youtube-nocookie.com/embed/${fb.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
        : `https://www.instagram.com/p/${fb.id}/embed/`;
    slide.querySelector('.screen__frame').appendChild(iframe);
    slide.classList.add('is-playing', 'is-embed');
  }

  function stop(i) {
    const slide = slides[i];
    slide.querySelector('video')?.pause();
    slide.querySelector('.screen__embed')?.remove();
    slide.classList.remove('is-embed');
    if (!films[i].src) slide.classList.remove('is-playing');
  }

  const timecode = (t) => {
    const s = Math.floor(t);
    return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(Math.floor((t % 1) * FPS))}`;
  };
  const clock = (t) => `${Math.floor(t / 60)}:${pad(Math.floor(t % 60))}`;

  // Our player for hosted films, with an ambient glow sampled from the picture.
  function bindPlayer(slide) {
    const video = slide.querySelector('video');
    if (!video) return;
    const q = (sel) => slide.querySelector(sel);
    const toggle = q('[data-act="toggle"]');
    const mute = q('[data-act="mute"]');
    const scrub = q('[data-scrub]');
    const canvas = q('.screen__glow canvas');
    const ctx = canvas.getContext('2d');
    let glowTimer = 0;
    let idle = 0;

    video.addEventListener('loadedmetadata', () => {
      slide.style.setProperty('--ar', video.videoWidth / video.videoHeight);
      q('[data-dur]').textContent = clock(video.duration);
      fitTrack();
    });
    video.addEventListener('play', () => {
      slide.classList.add('is-playing');
      toggle.innerHTML = ICON.pause;
      toggle.setAttribute('aria-label', 'Pause');
      glowTimer = setInterval(() => ctx.drawImage(video, 0, 0, canvas.width, canvas.height), 150);
    });
    video.addEventListener('pause', () => {
      toggle.innerHTML = ICON.play;
      toggle.setAttribute('aria-label', 'Play');
      clearInterval(glowTimer);
    });
    video.addEventListener('ended', () => slide.classList.remove('is-playing'));
    video.addEventListener('timeupdate', () => {
      q('[data-tc]').textContent = timecode(video.currentTime);
      if (video.duration) scrub.value = String(Math.round((video.currentTime / video.duration) * 1000));
    });

    toggle.addEventListener('click', () => (video.paused ? video.play() : video.pause()));
    video.addEventListener('click', () => (video.paused ? video.play() : video.pause()));
    mute.addEventListener('click', () => {
      video.muted = !video.muted;
      mute.innerHTML = video.muted ? ICON.muted : ICON.sound;
      mute.setAttribute('aria-label', video.muted ? 'Unmute' : 'Mute');
    });
    q('[data-act="full"]').addEventListener('click', () => q('.screen__frame').requestFullscreen?.());
    scrub.addEventListener('input', () => {
      if (video.duration) video.currentTime = (Number(scrub.value) / 1000) * video.duration;
    });

    // Controls tuck away while the film plays and the pointer rests.
    slide.addEventListener('pointermove', () => {
      slide.classList.remove('is-idle');
      clearTimeout(idle);
      idle = setTimeout(() => !video.paused && slide.classList.add('is-idle'), 2200);
    });
  }

  // ---------- Input ----------

  // Mouse users can drag the reel like a strip of film; a flick moves one film.
  function bindDrag() {
    let drag = null;
    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('button, input, iframe, video, a')) return;
      drag = { x: e.clientX, left: track.scrollLeft, from: active, moved: false };
      track.setPointerCapture(e.pointerId);
      track.classList.add('is-dragging');
    });
    track.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 4) drag.moved = true;
      track.scrollLeft = drag.left - dx;
    });
    let dragged = false;
    const end = (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      track.classList.remove('is-dragging');
      if (drag.moved) {
        go(Math.abs(dx) > 60 ? drag.from - Math.sign(dx) : active);
        dragged = true;
        setTimeout(() => (dragged = false));
      }
      drag = null;
    };
    track.addEventListener('pointerup', end);
    track.addEventListener('pointercancel', end);

    // A click or tap on a film off to the side brings it forward. Those films are
    // inert, so clicks pass through to the track; find the film under the pointer.
    track.addEventListener('click', (e) => {
      if (dragged) return;
      const i = slides.findIndex((s) => {
        const r = s.getBoundingClientRect();
        return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      });
      if (i >= 0 && i !== active) go(i);
    });
  }

  function bindKeys() {
    addEventListener('keydown', (e) => {
      if (view.hidden || e.target.closest('input, textarea, iframe') || document.querySelector('dialog[open]')) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(active + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(active - 1);
      } else if (e.key === 'k' || (e.key === ' ' && !e.target.closest('button'))) {
        const video = slides[active].querySelector('video');
        if (video) {
          e.preventDefault();
          video.paused ? video.play() : video.pause();
        }
      }
    });
  }

  // ---------- Render ----------

  let rendered = false;

  function render() {
    if (rendered) return;
    rendered = true;

    view = document.getElementById('view-film');
    track = document.getElementById('reel-track');
    slate = document.getElementById('reel-slate');
    now = document.getElementById('reel-now');
    strip = document.getElementById('reel-strip');
    document.getElementById('reel-total').textContent = pad(films.length);

    track.innerHTML = films.map(slideMarkup).join('');
    strip.innerHTML = `${films.map(frameMarkup).join('')}<span class="strip__bar" aria-hidden="true"></span>`;
    slides = [...track.children];
    frames = [...strip.querySelectorAll('.strip__item')];
    document.getElementById('screenplays').innerHTML = scripts.map(scriptMarkup).join('');

    slides.forEach((slide, i) => {
      bindPlayer(slide);
      slide.querySelector('.screen__play').addEventListener('click', () => play(i));
    });
    strip.addEventListener('click', (e) => {
      const frame = e.target.closest('.strip__item');
      if (frame) go(Number(frame.dataset.index));
    });
    document.getElementById('reel-prev').addEventListener('click', () => go(active - 1));
    document.getElementById('reel-next').addEventListener('click', () => go(active + 1));
    document.getElementById('screenplays').addEventListener('click', (e) => {
      const button = e.target.closest('[data-script]');
      if (!button) return;
      const s = scripts.find((x) => x.id === button.dataset.script);
      window.openViewer({ title: `${s.title} · ${s.kind}`, pdf: s.pdf });
    });

    track.addEventListener('scroll', () => raf || (raf = requestAnimationFrame(measure)), { passive: true });
    new ResizeObserver(fitTrack).observe(track);
    document.fonts.ready.then(moveBar);
    bindDrag();
    bindKeys();
    fitTrack();
    go(0, false);
  }

  window.Film = {
    render,
    pause: () => active >= 0 && stop(active),
  };
})();
