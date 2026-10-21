// Gallery tab. The first time it opens, a passport plays in: the cover swings
// open, four photos thunk onto the visa page as postage stamps, postmarks land
// on them dated today, and the photos fly down into the first spots of the grid.
// After that it's simply every photo in a grid, opened one at a time.
// site.js calls Gallery.open() when the tab is shown and Gallery.leave() when it isn't.
(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ids = window.PHOTO_IDS;
  const PROFILE = window.PROFILE_PHOTO;

  const $ = (id) => document.getElementById(id);
  const thumb = (id, w) => `https://drive.google.com/thumbnail?id=${id}&sz=w${w}`;
  const pad = (n, size = 3) => String(n).padStart(size, '0');
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const frame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
  const frameNo = (id) => ids.indexOf(id) + 1;

  // Postmarks: his two home bases, where he grew up, and Lusaka. Decoration,
  // not a claim about where any photo was taken.
  const MARKS = [
    { city: 'LOS ANGELES', code: 'LAX', ink: '#b3392b' },
    { city: 'WASHINGTON DC', code: 'DCA', ink: '#24427a' },
    { city: 'LUSAKA', code: 'LUN', ink: '#2f6b4f' },
    { city: 'SILVER SPRING', code: 'MD', ink: '#5b3d7a' },
  ];

  // Where the photo-stamps sit on the visa page (percent of the page) and their tilt,
  // and where each postmark lands, overlapping a stamp's corner.
  const SLOTS = [
    { x: 8, y: 9, w: 39, r: -6 },
    { x: 53, y: 6, w: 37, r: 5 },
    { x: 11, y: 49, w: 37, r: 4 },
    { x: 54, y: 46, w: 38, r: -4 },
  ];
  const MARK_AT = [
    { x: 27, y: 27, r: -14 },
    { x: 49, y: 25, r: 9 },
    { x: 24, y: 66, r: 7 },
    { x: 52, y: 63, r: -11 },
  ];

  // Four photos stamp the passport each visit; they lead the grid, the rest follow in order.
  const picks = [...ids].sort(() => Math.random() - 0.5).slice(0, 4);
  const order = [...picks, ...ids.filter((id) => !picks.includes(id))];

  let grid;
  let rendered = false;
  let played = false;

  // ---------- Grid ----------

  function renderGrid({ held }) {
    grid.innerHTML = order
      .map(
        (id, i) => `
          <li class="frame${held ? ' is-held' : ''}" style="--i:${Math.min(i, 24)}">
            <button class="frame__btn" type="button" data-at="${i}" aria-label="Open frame ${frameNo(id)}">
              <img class="frame__img" src="${thumb(id, 600)}" alt="Photograph ${frameNo(id)} by Kondwani Phiri" loading="${i < 16 ? 'eager' : 'lazy'}" decoding="async" referrerpolicy="no-referrer">
            </button>
            <span class="frame__no">·${pad(frameNo(id))}·</span>
          </li>`
      )
      .join('');
  }

  // Bring the held-back tiles in, top to bottom.
  function revealGrid(from = 0) {
    [...grid.children].slice(from).forEach((li) => li.classList.remove('is-held'));
  }

  function render() {
    if (rendered) return;
    rendered = true;
    grid = $('gal-grid');
    $('gal-total').textContent = pad(ids.length);
    renderGrid({ held: !reduceMotion });

    // Images fade in as they arrive (load doesn't bubble, so listen on the way down).
    grid.addEventListener('load', (e) => e.target.classList?.add('is-loaded'), true);
    grid.addEventListener('click', (e) => {
      const button = e.target.closest('.frame__btn');
      if (button) openPhoto(Number(button.dataset.at));
    });
    $('gal-replay').addEventListener('click', () => playIntro());
  }

  // ---------- Passport intro ----------

  const intro = $('passport-intro');
  let running = null; // the play in progress; a newer play or a skip replaces it

  const today = new Date();
  const dayMonth = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase();
  const year = String(today.getFullYear());

  function postmark(m, i) {
    const p = MARK_AT[i];
    return `
      <svg class="postmark" viewBox="0 0 220 110" style="left:${p.x}%;top:${p.y}%;--r:${p.r}deg;color:${m.ink}" aria-hidden="true">
        <defs>
          <path id="pm-top-${i}" d="M 18 55 A 37 37 0 0 1 92 55" />
          <path id="pm-bot-${i}" d="M 14 55 A 41 41 0 0 0 96 55" />
        </defs>
        <g filter="url(#ink-rough)">
          <circle cx="55" cy="55" r="48" fill="none" stroke="currentColor" stroke-width="2.6" />
          <circle cx="55" cy="55" r="28" fill="none" stroke="currentColor" stroke-width="1.4" />
          ${[33, 45, 57, 69, 81].map((y) => `<path d="M112 ${y} q 13 -7 26 0 t 26 0 t 26 0 t 26 0" fill="none" stroke="currentColor" stroke-width="2.2" />`).join('')}
          <text class="postmark__text" font-size="10.5" letter-spacing="1.4"><textPath href="#pm-top-${i}" startOffset="50%" text-anchor="middle">${m.city}</textPath></text>
          <text class="postmark__text" font-size="10.5" letter-spacing="3"><textPath href="#pm-bot-${i}" startOffset="50%" text-anchor="middle">${m.code}</textPath></text>
          <text class="postmark__text" x="55" y="53" text-anchor="middle" font-size="11.5">${dayMonth}</text>
          <text class="postmark__text" x="55" y="67" text-anchor="middle" font-size="11.5">${year}</text>
        </g>
      </svg>`;
  }

  function stamp(id, i) {
    const s = SLOTS[i];
    return `
      <div class="pstamp" style="left:${s.x}%;top:${s.y}%;width:${s.w}%;--r:${s.r}deg">
        <div class="pstamp__paper">
          <img src="${thumb(id, 600)}" alt="" referrerpolicy="no-referrer">
          <span class="pstamp__value">400</span>
        </div>
      </div>`;
  }

  function introMarkup() {
    return `
      <svg class="passport-defs" width="0" height="0" aria-hidden="true">
        <filter id="ink-rough"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" /><feDisplacementMap in="SourceGraphic" scale="1.8" /></filter>
      </svg>
      <div class="aura" aria-hidden="true"><span></span><span></span><span></span></div>

      <div class="passport" role="img" aria-label="A passport opens and four photographs are stamped inside it">
        <div class="passport__body">
          <div class="passport__page passport__visa">
            <p class="passport__pagehead"><span>Visas · Entries</span><span>07</span></p>
            ${picks.map(stamp).join('')}
            ${MARKS.map(postmark).join('')}
            <div class="visa-stamp"><span>Admitted</span><strong>Gallery</strong><span>${dayMonth} ${year}</span></div>
          </div>

          <div class="passport__cover">
            <div class="passport__front">
              <p class="cover__word">Passport</p>
              <svg class="cover__emblem" viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="50" r="34" /><ellipse cx="50" cy="50" rx="15" ry="34" /><path d="M16 50h68M22 32h56M22 68h56M50 16v68" />
                <circle cx="50" cy="50" r="44" stroke-dasharray="2 4" />
              </svg>
              <p class="cover__word cover__word--small">Photographs</p>
              <p class="cover__name">Kondwani Phiri</p>
            </div>

            <div class="passport__page passport__id">
              <p class="passport__pagehead"><span>Photo passport</span><span>KP · ${year}</span></p>
              <div class="id-main">
                <div class="id-photo"><img src="${PROFILE.src}" alt=""></div>
                <dl class="id-fields">
                  <div><dt>Surname</dt><dd>Phiri</dd></div>
                  <div><dt>Given names</dt><dd>Kondwani</dd></div>
                  <div><dt>Profession</dt><dd>Engineer · Filmmaker</dd></div>
                  <div><dt>Based in</dt><dd>Los Angeles · DC</dd></div>
                  <div><dt>Frames</dt><dd>${pad(ids.length)}</dd></div>
                  <div><dt>Issued</dt><dd>2023</dd></div>
                </dl>
              </div>
              <p class="id-sign">Kondwani Phiri</p>
              <p class="id-mrz">P&lt;PHOTOS&lt;PHIRI&lt;&lt;KONDWANI&lt;&lt;&lt;&lt;&lt;&lt;<br>${pad(ids.length)}FRAMES&lt;&lt;2023&lt;&lt;LAX&lt;DCA&lt;LUN&lt;&lt;</p>
            </div>
          </div>
        </div>
      </div>

      <p class="passport-intro__skip">Click anywhere to skip</p>`;
  }

  const loadImage = (src) =>
    new Promise((resolve) => {
      const img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.onload = img.onerror = resolve;
      img.src = src;
    });

  // Tilt toward the pointer, and slide the holographic sheen with it.
  function onTilt(e) {
    const passport = intro.querySelector('.passport');
    if (!passport) return;
    const x = e.clientX / innerWidth - 0.5;
    const y = e.clientY / innerHeight - 0.5;
    passport.style.setProperty('--tx', `${(-y * 8).toFixed(2)}deg`);
    passport.style.setProperty('--ty', `${(x * 10).toFixed(2)}deg`);
    passport.style.setProperty('--sheen', `${(50 + x * 60).toFixed(1)}%`);
  }

  async function playIntro() {
    if (reduceMotion) return;
    const token = {};
    running = token;
    const alive = () => running === token;

    window.scrollTo({ top: 0, behavior: 'instant' });
    renderGrid({ held: true });
    intro.innerHTML = introMarkup();
    intro.hidden = false;
    intro.classList.remove('is-on', 'is-leaving');
    document.documentElement.classList.add('is-intro');
    intro.addEventListener('click', skip);
    addEventListener('keydown', skip);
    addEventListener('pointermove', onTilt, { passive: true });

    const passport = intro.querySelector('.passport');
    const jolt = () => {
      passport.classList.remove('is-jolt');
      void passport.offsetWidth;
      passport.classList.add('is-jolt');
    };
    // Same size as the grid tiles, so a stamp's photo is already loaded when it lands in its tile.
    const photosReady = Promise.race([Promise.all([...picks.map((id) => thumb(id, 600)), PROFILE.src].map(loadImage)), wait(2200)]);

    await frame();
    intro.classList.add('is-on');
    passport.classList.add('is-in');

    await Promise.all([wait(700), photosReady]);
    if (!alive()) return;
    passport.classList.add('is-open');

    await wait(1050);
    for (const el of intro.querySelectorAll('.pstamp')) {
      if (!alive()) return;
      el.classList.add('is-down');
      jolt();
      await wait(230);
    }
    await wait(120);
    for (const el of intro.querySelectorAll('.postmark')) {
      if (!alive()) return;
      el.classList.add('is-down');
      jolt();
      await wait(170);
    }
    await wait(140);
    intro.querySelector('.visa-stamp').classList.add('is-down');
    jolt();

    await wait(1000);
    if (!alive()) return;
    await flyToGrid(token);
    if (alive()) cleanup();
  }

  // The four stamps peel off the page and land as the first tiles of the grid.
  async function flyToGrid(token) {
    const stamps = [...intro.querySelectorAll('.pstamp img')];
    const tiles = [...grid.children].slice(0, stamps.length);
    intro.classList.add('is-leaving');

    const flights = stamps.map((img, i) => {
      const from = img.getBoundingClientRect();
      const to = tiles[i].querySelector('.frame__btn').getBoundingClientRect();
      const clone = document.createElement('img');
      clone.className = 'flying-stamp';
      clone.src = img.src;
      clone.alt = '';
      Object.assign(clone.style, { left: `${to.left}px`, top: `${to.top}px`, width: `${to.width}px`, height: `${to.height}px` });
      document.body.appendChild(clone);
      img.style.visibility = 'hidden';

      const dx = from.left + from.width / 2 - (to.left + to.width / 2);
      const dy = from.top + from.height / 2 - (to.top + to.height / 2);
      const scale = img.offsetWidth / to.width;
      const flight = clone.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(${scale}) rotate(${SLOTS[i].r}deg)` },
          { transform: `translate(${dx * 0.4}px, ${dy * 0.55 - 40}px) scale(${(scale + 1) / 2}) rotate(${-SLOTS[i].r}deg)`, offset: 0.45 },
          { transform: 'none' },
        ],
        { duration: 1000, delay: i * 90, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'both' }
      );
      return flight.finished
        .catch(() => {})
        .then(() => {
          tiles[i].classList.remove('is-held');
          clone.remove();
        });
    });

    revealGrid(stamps.length);
    await Promise.all(flights);
  }

  // Skip straight to the gallery.
  function skip() {
    if (!running) return;
    running = null;
    document.querySelectorAll('.flying-stamp').forEach((el) => el.remove());
    revealGrid(0);
    intro.classList.add('is-leaving');
    setTimeout(cleanup, 450);
  }

  function cleanup() {
    running = null;
    intro.removeEventListener('click', skip);
    removeEventListener('keydown', skip);
    removeEventListener('pointermove', onTilt);
    intro.hidden = true;
    intro.innerHTML = '';
    document.documentElement.classList.remove('is-intro');
  }

  // ---------- Lightbox ----------

  const lightbox = $('lightbox');
  const shot = $('lightbox-img');
  const count = $('lightbox-count');
  let at = 0;

  function openPhoto(i) {
    at = i;
    showPhoto(0);
    if (!lightbox.open) lightbox.showModal();
  }

  // Shows the grid's copy at once (already loaded), then swaps in the full size.
  function showPhoto(direction) {
    at = (at + order.length) % order.length;
    const id = order[at];
    shot.src = thumb(id, 600);
    shot.alt = `Photograph ${frameNo(id)} by Kondwani Phiri`;
    count.textContent = `Frame ${pad(frameNo(id))} of ${pad(ids.length)}`;

    const full = new Image();
    full.referrerPolicy = 'no-referrer';
    full.onload = () => order[at] === id && (shot.src = full.src);
    full.src = thumb(id, 2000);
    // Warm up the neighbours so arrowing through feels instant.
    [order[(at + 1) % order.length], order[(at - 1 + order.length) % order.length]].forEach((n) => loadImage(thumb(n, 2000)));

    if (!reduceMotion && direction) {
      shot.animate(
        [{ opacity: 0, transform: `translateX(${direction * 28}px)` }, { opacity: 1, transform: 'none' }],
        { duration: 380, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
      );
    }
  }

  const step = (direction) => {
    at += direction;
    showPhoto(direction);
  };

  $('lightbox-prev').addEventListener('click', () => step(-1));
  $('lightbox-next').addEventListener('click', () => step(1));
  $('lightbox-close').addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
  });
  // Clicking anywhere but the photo or a button closes it.
  lightbox.addEventListener('click', (e) => {
    if (!e.target.closest('.lightbox__img, .lightbox__btn')) lightbox.close();
  });
  // Swipe on touch screens.
  let swipeX = null;
  lightbox.addEventListener('pointerdown', (e) => (swipeX = e.pointerType === 'touch' ? e.clientX : null));
  lightbox.addEventListener('pointerup', (e) => {
    if (swipeX === null) return;
    const dx = e.clientX - swipeX;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    swipeX = null;
  });

  // ---------- Tab hooks ----------

  window.Gallery = {
    open() {
      render();
      if (!played) {
        played = true;
        playIntro();
      }
    },
    leave() {
      if (running) skip();
    },
  };
})();
