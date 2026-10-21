// Site: tab routing, the landing → About hand-off, interactive logos, and the Extra tab.
(() => {
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const TABS = ['about', 'engineering', 'film', 'gallery', 'extra'];
  const TITLES = {
    about: 'Kondwani Phiri',
    engineering: 'Engineering · Kondwani Phiri',
    film: 'Film · Kondwani Phiri',
    gallery: 'Gallery · Kondwani Phiri',
    extra: 'Extra · Kondwani Phiri',
  };
  const PLACED_TILT = '-2.5deg';

  const polaroid = window.Landing.polaroid;
  const slot = document.getElementById('photo-slot');
  const main = document.getElementById('main');

  // The bio types itself out each time About opens (scripts/typewriter.js).
  const bio = document.querySelector('.about-hero__bio');
  const bioTyping = window.Typewriter(bio, [
    { el: bio.querySelector('.eyebrow'), pace: 'eyebrow' },
    { el: bio.querySelector('.lead'), pace: 'lead' },
    ...[...bio.querySelectorAll(':scope > p:not(.eyebrow):not(.lead)')].map((el) => ({ el, pace: 'body' })),
  ]);

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const paragraphs = (text) => text.split(/\n\s*\n/).map((p) => `<p>${esc(p.trim())}</p>`).join('');
  const utcDate = (iso) => new Date(`${iso}T00:00:00Z`);

  // ---------- Tabs ----------

  const links = [...document.querySelectorAll('.tabs__link')];
  const indicator = document.getElementById('tabs-indicator');
  const views = Object.fromEntries(TABS.map((t) => [t, document.getElementById(`view-${t}`)]));
  let current = null;

  // #wii is the Kondwani Shop Channel (scripts/wii.js), opened over Extra.
  const tabFromHash = () => {
    const tab = location.hash.slice(1);
    if (tab === 'wii') return 'extra';
    return TABS.includes(tab) ? tab : 'about';
  };

  function route() {
    show(tabFromHash());
    window.Wii.toggle(location.hash === '#wii');
  }

  function moveIndicator() {
    const active = links.find((l) => l.dataset.tab === current);
    if (!active) return;
    indicator.style.width = `${active.offsetWidth}px`;
    indicator.style.transform = `translateX(${active.offsetLeft}px)`;
  }

  function show(tab) {
    if (tab === current) return;
    const previous = current;
    current = tab;

    for (const t of TABS) views[t].hidden = t !== tab;
    for (const link of links) {
      if (link.dataset.tab === tab) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    document.title = TITLES[tab];
    moveIndicator();
    if (tab === 'extra') renderExtra();
    if (tab === 'engineering') window.renderEngineering();
    if (tab === 'film') window.Film.render();
    if (tab === 'gallery') window.Gallery.open();
    if (previous === 'gallery') window.Gallery.leave();
    if (previous === 'film') window.Film.pause();

    if (previous) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      main.focus({ preventScroll: true });
      if (!reduceMotion) {
        const view = views[tab];
        view.classList.add('is-switching');
        view.addEventListener('animationend', () => view.classList.remove('is-switching'), { once: true });
      }
    }

    if (previous === 'about') bioTyping.stop();
    if (tab === 'about' && previous) bioTyping.play({ delay: 180 });
  }

  addEventListener('hashchange', route);
  addEventListener('resize', moveIndicator);
  document.fonts.ready.then(moveIndicator);

  // ---------- Landing → About ----------

  function place() {
    slot.appendChild(polaroid);
    polaroid.classList.add('polaroid--placed');
  }

  // The polaroid flies from the middle of the mosaic into its slot at the top left
  // of About while the tiles fold away and the page rises in around it.
  let entered = false;
  async function enter() {
    if (entered) return;
    entered = true;

    const from = window.Landing.polaroidState();
    const leaving = window.Landing.leave();
    root.classList.remove('is-landing');
    // Starts typing just as the bio column fades up beside the landing polaroid.
    bioTyping.play({ delay: 700 });

    place();
    polaroid.classList.add('is-flying');
    const r = polaroid.getBoundingClientRect();
    const to = { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: polaroid.offsetWidth };

    if (!reduceMotion) {
      const flight = polaroid.animate(
        [
          { transform: `translate(${from.cx - to.cx}px, ${from.cy - to.cy}px) scale(${from.w / to.w}) rotate(${from.tilt})` },
          { transform: `translate(0px, 0px) scale(1) rotate(${PLACED_TILT})` },
        ],
        { duration: 1350, easing: 'cubic-bezier(0.76, 0, 0.24, 1)' }
      );
      await flight.finished.catch(() => {});
    }

    polaroid.classList.remove('is-flying');
    await leaving;
    main.focus({ preventScroll: true });
  }

  function listenForEnter() {
    const loader = document.getElementById('loader');
    let touchY = null;

    const go = () => {
      loader.removeEventListener('click', go);
      removeEventListener('keydown', onKey);
      removeEventListener('wheel', onWheel);
      removeEventListener('touchstart', onTouchStart);
      removeEventListener('touchend', onTouchEnd);
      enter();
    };
    const onKey = (e) => {
      if (['Enter', ' ', 'ArrowDown', 'PageDown'].includes(e.key)) {
        e.preventDefault();
        go();
      }
    };
    const onWheel = (e) => e.deltaY > 8 && go();
    const onTouchStart = (e) => (touchY = e.touches[0].clientY);
    const onTouchEnd = (e) => touchY !== null && touchY - e.changedTouches[0].clientY > 40 && go();

    loader.addEventListener('click', go);
    addEventListener('keydown', onKey);
    addEventListener('wheel', onWheel, { passive: true });
    addEventListener('touchstart', onTouchStart, { passive: true });
    addEventListener('touchend', onTouchEnd, { passive: true });
  }

  // ---------- Interactive logos: tilt toward the cursor ----------

  for (const el of document.querySelectorAll('.logo:not(.logo--inline)')) {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--rx', `${(-y * 28).toFixed(1)}deg`);
      el.style.setProperty('--ry', `${(x * 28).toFixed(1)}deg`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  }

  // ---------- Résumé ----------

  // Opens in the site's PDF reader, which can also download it. A modified click
  // (new tab, save) still gets the plain link.
  document.getElementById('resume-link').addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
    e.preventDefault();
    window.openViewer({ title: 'Résumé · Kondwani Phiri', pdf: e.currentTarget.getAttribute('href') });
  });

  // ---------- Extra ----------

  let extraRendered = false;

  // "Now watching" comes live from Letterboxd through api/letterboxd.js, which
  // Vercel caches for an hour. The snapshot in extra-data.js stands in when the
  // feed can't be reached in time, and on a local server with no API.
  let filmsLoad = null;
  function loadFilms() {
    filmsLoad ||= Promise.race([
      fetch('/api/letterboxd')
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => (data?.films?.length ? data.films : null))
        .catch(() => null),
      new Promise((resolve) => setTimeout(resolve, 2500, null)),
    ]).then((live) => {
      if (live) window.EXTRA.letterboxd = live;
      return window.EXTRA.letterboxd;
    });
    return filmsLoad;
  }

  function renderExtra() {
    if (extraRendered) return;
    extraRendered = true;
    loadFilms().then(renderFilms);
    renderInterests(window.EXTRA.interests);
  }

  // Posters in a Card swap stack (scripts/card-swap.js); the front film's notes sit beside it.
  function renderFilms(films) {
    const text = document.getElementById('film-text');
    const count = document.getElementById('film-count');
    const card = text.closest('.card');
    document.getElementById('film-total').textContent = String(films.length).padStart(2, '0');

    const rating = (r) =>
      r == null
        ? '<span class="film__date">No star rating</span>'
        : `<span class="stars" role="img" aria-label="${r} out of 5 stars">★★★★★<span class="stars__fill" style="width:${(r / 5) * 100}%">★★★★★</span></span><span>${r}</span>`;

    const watched = (iso) =>
      iso
        ? `<p class="film__date">Watched ${utcDate(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</p>`
        : '';

    // Only announce changes someone asked for, not every timed swap.
    function describe(i, byHand) {
      const f = films[i];
      text.setAttribute('aria-live', byHand ? 'polite' : 'off');
      text.innerHTML = `
        ${watched(f.watched)}
        <h3 class="film__title">${esc(f.title)} <span class="film__year">${f.year}</span></h3>
        <div class="film__rating">${rating(f.rating)}</div>
        ${f.review ? `<div class="film__review">${paragraphs(f.review)}</div>` : ''}
        <a class="film__link" href="${esc(f.link)}" target="_blank" rel="noopener">Read on Letterboxd ↗</a>`;
      count.textContent = String(i + 1).padStart(2, '0');

      // Long reviews are clipped; say so on the link that leads to the rest.
      const review = text.querySelector('.film__review');
      if (review && review.scrollHeight > review.clientHeight + 2) {
        text.querySelector('.film__link').textContent = 'Read the full review on Letterboxd ↗';
      }

      if (!reduceMotion) {
        text.classList.remove('is-changing');
        void text.offsetWidth;
        text.classList.add('is-changing');
      }
    }

    // Reading the notes (pointer or focus anywhere in the card) holds the stack still.
    const stack = window.CardSwap(
      document.getElementById('film-stack'),
      films.map((f) => ({ src: f.poster, alt: `${f.title} poster`, tag: f.rating == null ? '' : `★ ${f.rating}` })),
      { every: reduceMotion ? 0 : 6, holdOn: card, onChange: describe }
    );

    document.getElementById('film-prev').addEventListener('click', () => stack.prev());
    document.getElementById('film-next').addEventListener('click', () => stack.next());
    card.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') stack.prev();
      if (e.key === 'ArrowRight') stack.next();
    });

    describe(0, false);
    text.classList.remove('is-changing');
  }

  function renderInterests(items) {
    document.getElementById('interests').innerHTML = items
      .map(
        (item) => `
          <li class="interest">
            <span class="interest__emoji" aria-hidden="true">${item.emoji}</span>
            <span>
              <span class="interest__name">${esc(item.name)}</span><br>
              <span class="interest__note">${esc(item.note)}</span>
            </span>
          </li>`
      )
      .join('');
  }

  // ---------- Boot ----------

  // Fetched early, so the list is ready by the time Extra (or the Wii channel) opens.
  loadFilms();

  if (root.classList.contains('is-landing')) {
    bioTyping.hide();
    window.Landing.start();
    window.Landing.enterable.then(listenForEnter);
  } else {
    // Deep link to another tab: no intro, the polaroid just waits in its slot.
    place();
    window.Landing.skip();
  }
  route();
})();
