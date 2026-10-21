// Landing: a shuffled mosaic of gallery photos with the Instax portrait dropped on top.
// site.js drives it through window.Landing (start, skip, leave).
(() => {
  const loader = document.getElementById('loader');
  const mosaic = document.getElementById('mosaic');
  const polaroid = document.getElementById('polaroid');
  const polaroidPhoto = document.getElementById('polaroid-photo');
  const progressNum = document.getElementById('progress-num');

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  const PROFILE = window.PROFILE_PHOTO;
  const UNIT_ASPECT = 0.78;  // width / height of a single frame
  const BLANK_SHARE = 0;     // raise (e.g. 0.05) to leave a few empty frames, like the reference

  // Frame shapes, in grid units. Mostly single frames, with wide and large ones mixed in.
  const SPANS = [
    { w: 1, h: 1, weight: 0.6 },
    { w: 2, h: 1, weight: 0.18 },
    { w: 2, h: 2, weight: 0.15 },
    { w: 3, h: 2, weight: 0.07, minCols: 8 },
  ];

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const rand = (lo, hi) => lo + Math.random() * (hi - lo);
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const overlap = (a0, a1, b0, b1) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));
  // Commit an element's starting styles so the next class change animates from them.
  const commitStyles = (el) => void el.offsetWidth;

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---------- Photo pool ----------

  // A new order on every visit.
  const order = shuffle(window.PHOTO_IDS || []);
  const onScreen = new Set();
  const broken = new Set();
  let cursor = 0;

  function takeId() {
    for (let n = 0; n < order.length; n++) {
      const id = order[cursor++ % order.length];
      if (!onScreen.has(id) && !broken.has(id)) {
        onScreen.add(id);
        return id;
      }
    }
    return null;
  }

  function loadImage(src) {
    const img = new Image();
    img.className = 'tile__img';
    img.alt = '';
    img.draggable = false;
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    img.src = src;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout')), 10000);
      img.onload = () => {
        clearTimeout(timer);
        img.decode().catch(() => {}).then(() => resolve(img));
      };
      img.onerror = () => {
        clearTimeout(timer);
        reject(new Error('failed'));
      };
    });
  }

  // Next unused gallery photo, skipping any that fail to load.
  async function nextPhoto(width) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const id = takeId();
      if (!id) return null;
      try {
        return { id, img: await loadImage(`https://drive.google.com/thumbnail?id=${id}&sz=w${width}`) };
      } catch {
        onScreen.delete(id);
        broken.add(id);
      }
    }
    return null;
  }

  // ---------- Polaroid ----------

  let portrait = null;

  // Scale the scan so its cropped region (inside the white Instax border)
  // covers the photo window, sliding toward the focus point.
  function fitPortrait() {
    if (!portrait) return;
    const { crop, focus } = PROFILE;
    const w = polaroidPhoto.clientWidth;
    const h = polaroidPhoto.clientHeight;
    const nw = portrait.naturalWidth;
    const nh = portrait.naturalHeight;
    const scale = Math.max(w / (crop.w * nw), h / (crop.h * nh));
    Object.assign(portrait.style, {
      width: `${nw * scale}px`,
      height: `${nh * scale}px`,
      left: `${-(crop.x * nw * scale + (crop.w * nw * scale - w) * focus.x)}px`,
      top: `${-(crop.y * nh * scale + (crop.h * nh * scale - h) * focus.y)}px`,
    });
  }

  // The photo window changes size when the card moves into the About page, so refit on any resize.
  new ResizeObserver(fitPortrait).observe(polaroidPhoto);

  async function loadPortrait() {
    try {
      portrait = await loadImage(PROFILE.src);
    } catch {
      return;
    }
    portrait.className = 'polaroid__img';
    portrait.alt = 'Portrait of Kondwani Phiri';
    polaroidPhoto.appendChild(portrait);
    fitPortrait();
    commitStyles(portrait);
    portrait.classList.add('is-loaded');
  }

  // The card's footprint before its tilt, so tiles fully hidden underneath can be skipped.
  function polaroidRect(vw, vh) {
    const w = polaroid.offsetWidth;
    const h = polaroid.offsetHeight;
    return { l: (vw - w) / 2, r: (vw + w) / 2, t: (vh - h) / 2, b: (vh + h) / 2 };
  }

  // ---------- Layout ----------

  // Random packing on a unit grid: walk the cells and drop in a randomly
  // chosen frame shape wherever it fits. The grid starts at a random offset,
  // so every edge crops differently and no two visits look alike.
  function layout(vw, vh) {
    const gap = Math.round(clamp(vw * 0.0055, 4, 9));
    const u = clamp(vw * 0.115, 96, 190);
    const uh = u / UNIT_ASPECT;
    const ox = -rand(0.15, 0.85) * u;
    const oy = -rand(0.15, 0.85) * uh;
    const cols = Math.ceil((vw - ox + 12) / (u + gap));
    const rows = Math.ceil((vh - oy + 12) / (uh + gap));

    const spans = SPANS.filter((s) => !s.minCols || cols >= s.minCols);
    const taken = Array.from({ length: rows }, () => new Array(cols).fill(false));
    const fits = (r, c, s) => {
      if (r + s.h > rows || c + s.w > cols) return false;
      for (let y = r; y < r + s.h; y++) for (let x = c; x < c + s.w; x++) if (taken[y][x]) return false;
      return true;
    };
    const pick = (options) => {
      let roll = Math.random() * options.reduce((sum, s) => sum + s.weight, 0);
      for (const s of options) if ((roll -= s.weight) <= 0) return s;
      return options[options.length - 1];
    };

    const frames = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (taken[r][c]) continue;
        const s = pick(spans.filter((option) => fits(r, c, option)));
        for (let y = r; y < r + s.h; y++) for (let x = c; x < c + s.w; x++) taken[y][x] = true;

        const x = ox + c * (u + gap);
        const y = oy + r * (uh + gap);
        const w = s.w * u + (s.w - 1) * gap;
        const h = s.h * uh + (s.h - 1) * gap;
        const vis = (overlap(x, x + w, 0, vw) * overlap(y, y + h, 0, vh)) / (w * h);
        if (vis > 0) frames.push({ x, y, w, h, c, vis, single: s.w === 1 && s.h === 1 });
      }
    }
    return frames;
  }

  let tiles = [];
  let generation = 0;
  let lastSize = { w: 0, h: 0 };
  let leaving = false;

  function setProgress(done, total) {
    const pct = total ? Math.round((done / total) * 100) : 100;
    progressNum.textContent = String(pct).padStart(3, '0');
  }

  function build({ intro }) {
    const gen = ++generation;
    const vw = innerWidth;
    const vh = innerHeight;
    lastSize = { w: vw, h: vh };

    mosaic.textContent = '';
    tiles = [];
    onScreen.clear();
    cursor = 0;

    // Skip frames the polaroid hides completely (with room for its tilt), and
    // count partly hidden ones as less visible so swaps happen where they're seen.
    const card = polaroidRect(vw, vh);
    const tiltRoom = 24;
    let frames = layout(vw, vh).filter((f) => {
      const hidden =
        f.x > card.l + tiltRoom && f.x + f.w < card.r - tiltRoom &&
        f.y > card.t + tiltRoom && f.y + f.h < card.b - tiltRoom;
      f.vis -= (overlap(f.x, f.x + f.w, card.l, card.r) * overlap(f.y, f.y + f.h, card.t, card.b)) / (f.w * f.h);
      return !hidden;
    });

    if (BLANK_SHARE > 0) {
      const singles = shuffle(frames.filter((f) => f.single && f.vis > 0.9));
      const blanks = new Set(singles.slice(0, Math.round(frames.length * BLANK_SHARE)));
      frames = frames.filter((f) => !blanks.has(f));
    }

    const dpr = Math.min(devicePixelRatio || 1, 2);
    const dist = (f) => Math.hypot(f.x + f.w / 2 - vw / 2, f.y + f.h / 2 - vh / 2);
    const maxDist = Math.max(...frames.map(dist));
    let loaded = 0;
    setProgress(0, frames.length);

    const settled = frames.map((f) => {
      const el = document.createElement('div');
      el.className = 'tile';
      el.dataset.dir = f.c % 2 ? 'down' : 'up';
      el.style.cssText = `left:${f.x}px;top:${f.y}px;width:${f.w}px;height:${f.h}px`;
      mosaic.appendChild(el);

      // Wide enough for a 3:2 landscape photo cropped to fill the frame.
      const width = clamp(Math.ceil((Math.max(f.w, f.h * 1.5) * dpr) / 200) * 200, 400, 1600);
      const tile = { el, width, dist: dist(f) / maxDist, id: null, img: null, vis: f.vis, busy: false };
      tiles.push(tile);

      // Frames ripple outward from the center on a fixed schedule, loosened with
      // randomness. Each photo develops inside its frame whenever it finishes loading.
      const delay = intro ? 80 + tile.dist * 1200 + Math.random() * 700 : Math.random() * 250;
      setTimeout(() => el.classList.add('is-in'), delay);

      return nextPhoto(width).then((photo) => {
        if (gen !== generation) {
          if (photo) onScreen.delete(photo.id);
          return;
        }
        setProgress(++loaded, frames.length);
        if (!photo) {
          el.classList.add('is-empty');
          return;
        }
        tile.id = photo.id;
        tile.img = photo.img;
        el.appendChild(photo.img);
        commitStyles(photo.img);
        photo.img.classList.add('is-loaded');
      });
    });

    return Promise.all(settled);
  }

  // ---------- Living mosaic: one frame at a time swaps for a fresh one ----------

  let swapTimer = 0;

  function scheduleSwap() {
    clearTimeout(swapTimer);
    if (!leaving) swapTimer = setTimeout(swap, 1400 + Math.random() * 1200);
  }

  async function swap() {
    scheduleSwap();
    if (document.hidden) return;

    const pool = tiles.filter((t) => !t.busy && t.img && t.vis > 0.85);
    if (!pool.length) return;
    const tile = pool[Math.floor(Math.random() * pool.length)];
    tile.busy = true;

    const gen = generation;
    const photo = await nextPhoto(tile.width);
    if (!photo || gen !== generation || leaving) {
      if (photo) onScreen.delete(photo.id);
      tile.busy = false;
      return;
    }

    const old = { id: tile.id, img: tile.img };
    photo.img.classList.add('is-loaded', 'is-incoming');
    tile.el.appendChild(photo.img);
    commitStyles(photo.img);
    photo.img.classList.remove('is-incoming');

    await wait(1700);
    old.img.remove();
    onScreen.delete(old.id);
    tile.id = photo.id;
    tile.img = photo.img;
    tile.busy = false;
  }

  // ---------- Parallax: the mosaic drifts against the cursor while the polaroid holds still ----------

  function enableParallax() {
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;

    const step = () => {
      x += (tx - x) * 0.07;
      y += (ty - y) * 0.07;
      mosaic.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.05 ? requestAnimationFrame(step) : 0;
    };

    const onMove = (e) => {
      if (leaving) return removeEventListener('pointermove', onMove);
      tx = (0.5 - e.clientX / innerWidth) * 18;
      ty = (0.5 - e.clientY / innerHeight) * 12;
      if (!raf) raf = requestAnimationFrame(step);
    };
    addEventListener('pointermove', onMove, { passive: true });
  }

  // ---------- Resize ----------

  let resizeTimer = 0;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Ignore mobile toolbar show/hide, which only nudges the height.
      const widthChanged = innerWidth !== lastSize.w;
      const heightChanged = Math.abs(innerHeight - lastSize.h) > 120;
      if (widthChanged || heightChanged) build({ intro: false });
    }, 250);
  }

  // ---------- Public API ----------

  let resolveEnterable;
  const enterable = new Promise((resolve) => (resolveEnterable = resolve));

  // Play the intro. Resolves `enterable` once the caption is written.
  async function start() {
    // A slightly different tilt on every visit, like a print tossed on the table.
    loader.style.setProperty('--tilt', `${(Math.random() < 0.5 ? -1 : 1) * rand(1.6, 3.2)}deg`);
    loader.classList.add('is-started');
    addEventListener('resize', onResize);

    const settled = build({ intro: !reduceMotion });
    const portraitReady = loadPortrait();
    const fontReady = Promise.race([document.fonts.load('500 40px "EB Garamond"'), wait(1500)]);

    // The polaroid drops in once the portrait is ready, without waiting forever on a slow network.
    await Promise.all([Promise.race([portraitReady, wait(2500)]), wait(reduceMotion ? 0 : 450)]);
    loader.classList.add('is-polaroid');
    polaroid.classList.add('is-shown');

    // Then the caption is written on its bottom strip.
    await Promise.all([fontReady, wait(reduceMotion ? 0 : 700)]);
    polaroid.classList.add('is-written');

    await wait(reduceMotion ? 0 : 1300);
    if (!leaving) loader.classList.add('is-enterable');
    resolveEnterable();

    await Promise.all([settled, wait(reduceMotion ? 0 : 3400)]);
    loader.classList.add('is-ready');

    if (!reduceMotion && !leaving) {
      scheduleSwap();
      if (finePointer) enableParallax();
    }
  }

  // No intro (deep link to another tab): just make the polaroid ready to be placed.
  function skip() {
    leaving = true;
    loadPortrait();
    polaroid.classList.add('is-shown', 'is-written');
    loader.remove();
  }

  // Where the card sits right now, before it's moved: center, untilted width, and tilt.
  function polaroidState() {
    const r = polaroid.getBoundingClientRect();
    return {
      cx: r.left + r.width / 2,
      cy: r.top + r.height / 2,
      w: polaroid.offsetWidth,
      tilt: getComputedStyle(loader).getPropertyValue('--tilt').trim() || '0deg',
    };
  }

  // Fold the mosaic away from the center out, then remove the landing entirely.
  function leave() {
    leaving = true;
    clearTimeout(swapTimer);
    removeEventListener('resize', onResize);
    loader.classList.remove('is-enterable');

    for (const tile of tiles) tile.el.style.setProperty('--out', `${Math.round(tile.dist * 420)}ms`);
    loader.classList.add('is-leaving');

    return wait(reduceMotion ? 0 : 1150).then(() => loader.remove());
  }

  window.Landing = { start, skip, leave, enterable, polaroidState, polaroid };
})();
