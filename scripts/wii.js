// The Kondwani Shop Channel: a not-so-secret tribute to the Wii Shop Channel, opened
// from the Channels row at the bottom of Extra (#wii). Screens follow the Wii Shop
// Channel's layout as wiishopchannel.net rebuilds it, on its 608 × 456 stage scaled
// to the window. Everything is drawn here in HTML, CSS and SVG, and the music and
// sounds are synthesized in the browser: no Nintendo artwork or audio is used.
//
// site.js calls window.Wii.toggle(true / false) as the hash moves to and from #wii.
(() => {
  const W = 608;
  const H = 456;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const FONT = 'https://fonts.googleapis.com/css2?family=M+PLUS+1p:wght@400;800&display=swap';

  const layer = document.getElementById('wii');
  const stage = document.getElementById('wii-stage');
  const screen = document.getElementById('wii-screen');
  const portal = document.getElementById('wii-portal');
  const musicToggle = document.getElementById('wii-music');
  const cursor = document.getElementById('wii-cursor');

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const box = (x, y, w, h) => `left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
  const fmt = (n) => n.toLocaleString('en-US');
  const drive = (id, w) => `https://drive.google.com/thumbnail?id=${id}&sz=w${w}`;
  const openTab = (url) => window.open(url, '_blank', 'noopener');

  // ---------- Saved state ----------

  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(`wii-${key}`);
        return v == null ? fallback : JSON.parse(v);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(`wii-${key}`, JSON.stringify(value));
      } catch {}
    },
  };
  const settings = { music: store.get('music', true), sfx: store.get('sfx', true) };
  let points = store.get('points', 0);
  const downloaded = new Set();

  // ---------- Sound ----------

  let ctx = null;
  let sfxBus = null;
  let musicBus = null;
  let noise = null;

  function audio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      const master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
      sfxBus = ctx.createGain();
      sfxBus.connect(master);
      musicBus = ctx.createGain();
      musicBus.gain.value = 0;
      musicBus.connect(master);
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // One enveloped oscillator. `to` glides the pitch; `filter` is a lowpass cutoff.
  function tone(freq, t, dur, { type = 'sine', gain = 0.05, attack = 0.004, to, filter, out = sfxBus } = {}) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = o.connect(g);
    if (filter) {
      const f = ctx.createBiquadFilter();
      f.frequency.value = filter;
      node = g.connect(f);
    }
    node.connect(out);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function hiss(t, dur, gain, { type = 'highpass', freq = 6000, q = 0.7, out = musicBus } = {}) {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(out);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  const SFX = {
    select: (t) => tone(1760, t, 0.045, { gain: 0.018, to: 2093 }),
    decide: (t) => {
      tone(1046.5, t, 0.09, { type: 'triangle', gain: 0.05 });
      tone(1568, t + 0.055, 0.16, { type: 'triangle', gain: 0.045 });
    },
    cancel: (t) => {
      tone(880, t, 0.08, { type: 'triangle', gain: 0.045 });
      tone(587.3, t + 0.06, 0.14, { type: 'triangle', gain: 0.04 });
    },
    finish: (t) => [1046.5, 1318.5, 1568, 2093].forEach((f, i) => tone(f, t + i * 0.075, 0.3, { type: 'triangle', gain: 0.04 })),
    tick: (t) => tone(2637, t, 0.03, { gain: 0.012 }),
  };

  function sfx(name) {
    if (!settings.sfx || !ctx || ctx.state !== 'running') return;
    SFX[name](ctx.currentTime + 0.005);
  }

  // ---------- Music ----------

  // An original lounge loop (not the Wii Shop theme): eight bars of bossa in F,
  // vibraphone tune over soft electric-piano chords, bass, shaker, and rim clicks.
  const BPM = 112;
  const EIGHTH = 60 / BPM / 2;
  const hz = (m) => 440 * 2 ** ((m - 69) / 12);
  const CHORDS = [
    [53, 57, 60, 64], [50, 53, 57, 60], [55, 58, 62, 65], [55, 58, 60, 64],
    [57, 60, 64, 67], [54, 57, 60, 62], [55, 58, 62, 65], [55, 58, 60, 64],
  ];
  const BASS = [41, 38, 43, 36, 45, 38, 43, 36];
  // [eighth within the bar, note, length in eighths]
  const TUNE = [
    [[0, 72, 2], [2, 69, 1], [3, 72, 2], [6, 76, 2]],
    [[1, 74, 1], [2, 72, 2], [4, 69, 3]],
    [[0, 70, 2], [2, 74, 1], [3, 77, 3], [6, 74, 2]],
    [[0, 72, 3], [4, 70, 1], [5, 67, 3]],
    [[0, 76, 2], [2, 72, 1], [3, 76, 2], [6, 79, 2]],
    [[1, 78, 1], [2, 74, 2], [4, 72, 2], [6, 69, 2]],
    [[0, 70, 1], [1, 74, 1], [2, 77, 2], [4, 76, 1], [5, 74, 3]],
    [[0, 72, 4], [4, 67, 2], [6, 70, 2]],
  ];
  const CLAVE = [0, 3, 6, 10, 13];

  let musicTimer = null;
  let nextAt = 0;
  let step = 0;

  function playStep(s, t) {
    const bar = Math.floor(s / 8) % 8;
    const e = s % 8;
    hiss(t, 0.035, e % 2 ? 0.05 : 0.025);
    if (CLAVE.includes(s % 16)) hiss(t, 0.03, 0.12, { type: 'bandpass', freq: 1900, q: 5 });

    const root = BASS[bar];
    if (e === 0) tone(hz(root), t, EIGHTH * 2.8, { type: 'triangle', gain: 0.12, filter: 500, out: musicBus });
    if (e === 3 || e === 4) tone(hz(root + 7), t, EIGHTH * 0.9, { type: 'triangle', gain: 0.09, filter: 500, out: musicBus });

    const comp = bar % 2 ? [2, 5] : [0, 3, 6];
    if (comp.includes(e)) {
      for (const n of CHORDS[bar]) tone(hz(n), t, 0.32, { type: 'triangle', gain: 0.018, filter: 1800, out: musicBus });
    }
    for (const [at, n, len] of TUNE[bar]) {
      if (at !== e) continue;
      const d = Math.min(len * EIGHTH + 0.35, 1.4);
      tone(hz(n), t, d, { gain: 0.05, out: musicBus });
      tone(hz(n) * 4, t, 0.18, { gain: 0.012, out: musicBus });
    }
  }

  function startMusic() {
    if (musicTimer || !settings.music || !audio()) return;
    nextAt = ctx.currentTime + 0.1;
    step = 0;
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setTargetAtTime(1, ctx.currentTime, 0.3);
    musicTimer = setInterval(() => {
      while (nextAt < ctx.currentTime + 0.15) {
        playStep(step, nextAt);
        nextAt += EIGHTH;
        step = (step + 1) % 64;
      }
    }, 30);
  }

  function stopMusic() {
    if (!musicTimer) return;
    clearInterval(musicTimer);
    musicTimer = null;
    musicBus.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
  }

  function setMusic(on) {
    settings.music = on;
    store.set('music', on);
    musicToggle.textContent = `Music: ${on ? 'ON' : 'OFF'}`;
    musicToggle.setAttribute('aria-pressed', String(on));
    if (on && started && current()?.name !== 'theater') startMusic();
    else stopMusic();
  }

  // ---------- Content ----------

  // Every title in the channel, keyed `kind:id`, built the first time it opens.
  const items = new Map();
  const add = (item) => (items.set(item.key, item), item);

  function buildItems() {
    if (items.size) return;

    for (const p of window.ENGINEERING) {
      const doc = p.docs[0];
      add({
        key: `eng:${p.id}`,
        list: 'engineering',
        tab: 'Engineering',
        title: p.title,
        meta: `${p.course} · ${p.when}`,
        thumb: { svg: window.BLUEPRINTS[p.drawing]() },
        badge: { top: 'RATED', big: 'E', bottom: 'ENGINEER' },
        descriptor: p.kind,
        lines: [[`Completed ${p.when}`, p.team === 'Solo project' ? 'Solo' : 'Team'], [p.context], [p.methods.slice(0, 3).join(' · ')]],
        more: [...p.summary, `Team: ${p.team}`],
        action: doc && {
          label: 'Download',
          run: () =>
            doc.url
              ? window.openViewer({ title: `${p.title} · ${doc.label}`, pdf: doc.url })
              : window.openViewer({
                  title: `${p.title} · ${doc.label}`,
                  src: `https://drive.google.com/file/d/${doc.drive}/preview`,
                  href: `https://drive.google.com/file/d/${doc.drive}/view`,
                }),
        },
      });
    }

    for (const f of window.FILMS) {
      const plays = f.src || f.fallback?.type === 'youtube';
      add({
        key: `film:${f.id}`,
        list: 'film',
        tab: 'FilmWare',
        title: f.title,
        meta: `${f.client} · ${f.when}`,
        thumb: f.poster ? { img: f.poster } : { art: f.title },
        badge: { top: 'RATED', big: 'F', bottom: 'FILMMAKER' },
        descriptor: f.client,
        lines: [[`Released ${f.when}`, f.aspect === '9 / 16' ? 'Vertical' : 'Widescreen'], [f.byline], [f.role]],
        more: [f.summary],
        credits: f.credits,
        theater: plays ? f.id : null,
        action: { label: 'Watch', run: () => (plays ? go('theater', f.id) : openTab(f.fallback.url)) },
      });
    }

    for (const s of window.SCREENPLAYS) {
      add({
        key: `script:${s.id}`,
        list: 'film',
        tab: 'FilmWare',
        title: s.title,
        meta: `Screenplay · ${s.when}`,
        thumb: { script: s.title },
        badge: { top: 'RATED', big: 'W', bottom: 'WRITER' },
        descriptor: s.kind,
        lines: [[`Written ${s.when}`, ''], [s.context], [s.kind]],
        more: [s.summary],
        action: { label: 'Read', run: () => window.openViewer({ title: `${s.title} · ${s.kind}`, pdf: s.pdf }) },
      });
    }

    window.EXTRA.letterboxd.forEach((f, i) => {
      const watched = f.watched
        ? new Date(`${f.watched}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
        : null;
      add({
        key: `watched:${i}`,
        list: 'watched',
        tab: 'Letterboxd',
        title: f.title,
        meta: f.rating == null ? `${f.year}` : `${f.year} · ★ ${f.rating}`,
        thumb: { img: f.poster, poster: true },
        badge: { top: 'RATED', big: f.rating ?? '–', bottom: 'OUT OF 5' },
        descriptor: '',
        lines: [[watched ? `Watched ${watched}` : 'Logged late', ''], [`Released ${f.year}`], [f.rating == null ? 'No star rating' : `${f.rating} out of 5 stars`]],
        more: f.review ? f.review.split(/\n\s*\n/) : null,
        moreLabel: 'Read review',
        action: { label: 'Open Letterboxd', run: () => openTab(f.link), quick: true },
      });
    });

    window.EXTRA.interests.forEach((it, i) =>
      add({ key: `interest:${i}`, list: 'interests', title: it.name, meta: it.note, thumb: { emoji: it.emoji }, still: true })
    );

    // The résumé, read from About so the two never disagree.
    let n = 0;
    for (const section of document.querySelectorAll('.resume__section')) {
      const label = section.querySelector('.resume__label')?.textContent.trim();
      for (const entry of section.querySelectorAll('.entry')) {
        const q = (s) => entry.querySelector(s);
        const org = q('.entry__org');
        const where = org?.querySelector('span')?.textContent.replace(/^\s*·\s*/, '').trim() ?? '';
        const orgName = org ? [...org.childNodes].filter((c) => c.nodeType === 3).map((c) => c.textContent).join('').trim() : '';
        const href = q('a.logo')?.href;
        add({
          key: `activity:${n++}`,
          list: 'activity',
          tab: label,
          title: q('.entry__title')?.textContent.trim(),
          date: q('.entry__date')?.textContent.trim(),
          org: orgName,
          thumb: q('.logo img') ? { img: q('.logo img').src, logo: true } : { art: label },
          badge: { top: 'RATED', big: label?.[0] ?? 'K', bottom: label?.toUpperCase() },
          descriptor: where,
          lines: [[q('.entry__date')?.textContent.trim(), ''], [orgName], [where]],
          more: [...entry.querySelectorAll('.entry__points li')].map((li) => li.textContent.trim()),
          action: href && { label: 'Visit Website', run: () => openTab(href), quick: true },
        });
      }
    }
  }

  const ofList = (list) => [...items.values()].filter((it) => it.list === list);

  const LISTS = {
    engineering: { title: 'Engineering', sub: 'Projects I’ve designed, built and tested' },
    film: { title: 'FilmWare', sub: 'Shorts I’ve directed, and a screenplay' },
    watched: { title: 'Titles I’ve Watched', sub: 'Recently logged on Letterboxd' },
    interests: { title: 'Interests', sub: 'Things I could talk about for hours' },
  };
  const PICKS = ['film:last-lament', 'eng:turbine', 'film:one-hundred', 'eng:lightmeter'];

  // ---------- Drawing ----------

  const ICONS = {
    // A gear for Engineering, in the tile icons' blue.
    gear: (() => {
      const teeth = 9;
      const pts = [];
      for (let i = 0; i < teeth * 4; i++) {
        const a = (i / (teeth * 4)) * Math.PI * 2 - Math.PI / 2;
        const r = i % 4 < 2 ? 31 : 24;
        pts.push(`${(40 + r * Math.cos(a)).toFixed(1)} ${(36 + r * Math.sin(a)).toFixed(1)}`);
      }
      return `<svg viewBox="0 0 80 72" width="80" height="72" aria-hidden="true"><path fill="#34beed" fill-rule="evenodd" stroke="#34beed" stroke-width="4" stroke-linejoin="round" d="M${pts.join('L')}Z M40 26a10 10 0 1 0 0.01 0Z"/></svg>`;
    })(),
    // A grid of frames for the Photo Channel.
    photos: (() => {
      let cells = '';
      for (let r = 0; r < 3; r++)
        for (let c = 0; c < 4; c++) cells += `<rect x="${14 + c * 14}" y="${16 + r * 15}" width="10" height="10.5" rx="2.4" fill="#fff"/>`;
      return `<svg viewBox="0 0 80 72" width="82" height="74" aria-hidden="true"><rect x="2" y="2" width="76" height="68" rx="15" fill="#34beed"/>${cells}</svg>`;
    })(),
    top: '<svg viewBox="0 0 40 40" width="38" height="38" aria-hidden="true"><path d="M20 6 34 27H6Z" fill="#34beed" stroke="#34beed" stroke-width="2.5" stroke-linejoin="round"/><rect x="5" y="31" width="30" height="4" rx="1" fill="#34beed"/></svg>',
    help: '<svg viewBox="0 0 40 40" width="38" height="38" aria-hidden="true"><path d="M12.5 14.5a7.5 7.5 0 1 1 11.2 6.5c-2.4 1.4-3.7 2.6-3.7 5.2v1.3" fill="none" stroke="#34beed" stroke-width="5.2" stroke-linecap="round"/><circle cx="20" cy="34.5" r="3.1" fill="#34beed"/></svg>',
    chevron: (dir) =>
      `<svg viewBox="0 0 34 64" width="34" height="64" aria-hidden="true"><g transform="${dir < 0 ? '' : 'translate(34 0) scale(-1 1)'}"><path d="M25 7 9 32l16 25" fill="none" stroke="currentColor" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><path d="M25 7 9 32l16 25" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`,
    ring: '<svg viewBox="0 0 100 100" width="100" height="100" aria-hidden="true"><defs><linearGradient id="wii-ring-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9f3fd"/><stop offset="1" stop-color="#5cc8f0"/></linearGradient></defs><circle cx="50" cy="50" r="30" fill="none" stroke="url(#wii-ring-g)" stroke-width="8"/><circle cx="50" cy="50" r="30" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2"/><circle cx="50" cy="20" r="9" fill="#52c3ef"/><circle cx="47" cy="17" r="3.5" fill="#fff" fill-opacity=".75"/></svg>',
  };

  function thumb(t) {
    if (t.svg) return `<span class="wii-thumb wii-thumb--draw">${t.svg}</span>`;
    if (t.img) return `<span class="wii-thumb${t.poster ? ' wii-thumb--poster' : ''}${t.logo ? ' wii-thumb--logo' : ''}"><img src="${esc(t.img)}" alt="" loading="lazy" referrerpolicy="no-referrer"></span>`;
    if (t.emoji) return `<span class="wii-thumb wii-thumb--emoji">${t.emoji}</span>`;
    if (t.script) return `<span class="wii-thumb wii-thumb--script"><b>${esc(t.script)}</b><i>by Kondwani Phiri</i></span>`;
    return `<span class="wii-thumb wii-thumb--art"><b>${esc(t.art)}</b></span>`;
  }

  const dots = (...ys) => ys.map((y) => `<div class="wii-dots" style="top:${y}px" aria-hidden="true"></div>`).join('');

  function head(title, { main = false, sub } = {}) {
    return `
      <h1 class="wii-title${main ? '' : ' wii-title--dark'}">${esc(title)}</h1>
      ${main ? '' : `
        <button class="wb wb--sq" style="${box(477, 22, 55, 53)}" data-act="home" aria-label="Main menu">${ICONS.top}<span class="wii-tip wii-tip--right">Main Menu</span></button>
        <button class="wb wb--sq" style="${box(537, 22, 53, 53)}" data-act="help" aria-label="Help">${ICONS.help}<span class="wii-tip wii-tip--right">Help</span></button>`}
      ${sub ? `<p class="wii-sub">${esc(sub)}</p>` : ''}`;
  }

  const pointsBlock = () =>
    `<button class="wii-points" style="${box(241, 378, 130, 52)}" data-go="points" aria-label="${fmt(points)} Wii Points. Add Wii Points"><b class="wii-points__n">${fmt(points)}</b><span>Wii Points</span></button>`;

  function foot({ menu = false } = {}) {
    return `
      ${dots(68, 372)}
      <button class="wb" style="${box(25, 378, 187, 55)}" data-act="${menu ? 'exit' : 'back'}">${menu ? 'Wii Menu' : 'Back'}</button>
      ${pointsBlock()}`;
  }

  // Paged lists keep their page while you step into a title and back out.
  const pages = {};
  function pager(name, count, per) {
    const total = Math.max(1, Math.ceil(count / per));
    const page = Math.min(pages[name] ?? 0, total - 1);
    return { page, total, start: page * per };
  }

  const chevrons = (y, total) =>
    total > 1
      ? `<button class="wii-chev" style="${box(4, y, 34, 64)}" data-act="page" data-arg="-1" aria-label="Previous page">${ICONS.chevron(-1)}</button>
         <button class="wii-chev" style="${box(570, y, 34, 64)}" data-act="page" data-arg="1" aria-label="Next page">${ICONS.chevron(1)}</button>`
      : '';

  function itemCard(it, x, y, w, h) {
    const tag = it.still ? 'div' : 'button';
    return `
      <${tag} class="wii-item${it.thumb.poster ? ' wii-item--poster' : ''}" style="${box(x, y, w, h)}"${it.still ? '' : ` data-go="details" data-arg="${esc(it.key)}"`}>
        ${thumb(it.thumb)}
        <span class="wii-item__name">${esc(it.title)}</span>
        <span class="wii-item__meta">${esc(it.meta)}</span>
      </${tag}>`;
  }

  // ---------- Screens ----------

  const SCREENS = {
    ring: () => ({
      html: `
        <h1 class="wii-title">Kondwani Shop Channel</h1>
        ${dots(68, 372)}
        <p class="wii-lead" style="${box(0, 112, W, 30)}">Click the ring to continue.</p>
        <button class="wii-ring" style="${box(254, 200, 100, 100)}" data-act="start" aria-label="Continue">${ICONS.ring}</button>`,
    }),

    welcome: () => {
      const picks = PICKS.map((k) => items.get(k)).filter(Boolean);
      const at = [[30, 80], [312, 80], [30, 152], [312, 152]];
      return {
        html: `
          <h1 class="wii-hero" style="${box(0, 22, W, 50)}">Kondwani Shop Channel<small>Recommended Titles</small></h1>
          ${picks.map((it, i) => itemCard(it, at[i][0], at[i][1], 266, 68)).join('')}
          <div class="wii-info" style="${box(47, 234, 514, 129)}">
            <p class="wii-info__head">Important Info:</p>
            <button class="wii-info__row" data-go="info" data-arg="welcome">Welcome to the Kondwani Shop Channel!</button>
            <button class="wii-info__row" data-go="info" data-arg="faq">Frequently Asked Questions</button>
          </div>
          <button class="wb wb--big" style="${box(129, 376, 352, 58)}" data-act="shop">Start Shopping</button>`,
      };
    },

    menu: () => ({
      html: `
        ${head('Kondwani Shop Channel', { main: true })}
        <button class="wb wb--tile" style="${box(26, 81, 173, 131)}" data-go="list" data-arg="engineering">
          <span class="wb__icon">${ICONS.gear}</span><span class="wb__label">Engineering</span>
          <span class="wii-tip">Projects I’ve designed and built</span>
        </button>
        <button class="wb wb--tile" style="${box(219, 81, 173, 131)}" data-go="list" data-arg="film">
          <span class="wb__icon"><span class="wii-mark">Film<i>Ware</i><span>.</span></span></span><span class="wb__label">FilmWare</span>
          <span class="wii-tip">Shorts and screenplays</span>
        </button>
        <button class="wb wb--tile" style="${box(412, 81, 173, 131)}" data-go="photos">
          <span class="wb__icon">${ICONS.photos}</span><span class="wb__label">Photo Channel</span>
          <span class="wii-tip">Frames from my travels</span>
        </button>
        <button class="wb" style="${box(159, 224, 290, 66)}" data-go="points">Add Wii Points</button>
        <button class="wb wb--pill" style="${box(21, 304, 184, 56)}" data-go="activity">Account Activity</button>
        <button class="wb wb--pill" style="${box(212, 304, 184, 56)}" data-go="list" data-arg="watched">Titles I’ve<br>Watched</button>
        <button class="wb wb--pill" style="${box(403, 304, 184, 56)}" data-go="settings">Settings and<br>Features</button>
        ${foot({ menu: true })}`,
    }),

    list: (name) => {
      const all = ofList(name);
      const { page, total, start } = pager(name, all.length, 6);
      const cells = all.slice(start, start + 6);
      return {
        title: LISTS[name].title,
        html: `
          ${head(LISTS[name].title, { sub: LISTS[name].sub })}
          ${total > 1 ? `<p class="wii-page">Page ${page + 1} / ${total}</p>` : ''}
          ${cells.map((it, i) => itemCard(it, i % 2 ? 312 : 40, 104 + Math.floor(i / 2) * 86, 256, 82)).join('')}
          ${chevrons(200, total)}
          ${foot()}`,
      };
    },

    details: (key) => {
      const it = items.get(key);
      const [l1, l2, l3] = it.lines;
      const a = it.action;
      return {
        title: it.title,
        html: `
          ${head('Details')}
          <p class="wii-card__tab" style="${box(36, 74, 228, 22)}">${esc(it.tab)}</p>
          <div class="wii-card" style="${box(36, 95, 536, 195)}"></div>
          <div class="wii-card__thumb${it.thumb.poster ? ' is-poster' : ''}" style="${box(43, 103, 162, 122)}">${thumb(it.thumb)}</div>
          ${it.more?.length || it.credits ? `<button class="wb wb--small" style="${box(212, 105, 68, 58)}" data-act="more" data-arg="${esc(key)}">${esc(it.moreLabel ?? 'More Info').replace(' ', '<br>')}</button>` : ''}
          <div class="wii-badge" style="${box(287, 104, 46, 62)}" aria-hidden="true"><span>${esc(it.badge.top)}</span><b>${esc(it.badge.big)}</b><span>${esc(it.badge.bottom)}</span></div>
          <p class="wii-card__desc" style="${box(339, 103, 226, 60)}">${esc(it.descriptor)}</p>
          <p class="wii-card__line wii-card__line--split" style="${box(211, 168, 354, 22)}"><span>${esc(l1[0])}</span><span>${esc(l1[1])}</span></p>
          <p class="wii-card__line" style="${box(211, 189, 354, 22)}">${esc(l2[0])}</p>
          <p class="wii-card__line" style="${box(211, 210, 354, 22)}">${esc(l3[0])}</p>
          <div class="wii-card__rule" style="${box(47, 236, 514, 1)}"></div>
          <p class="wii-card__title" style="${box(40, 242, 528, 40)}">${esc(it.title)}</p>
          ${a ? `<button class="wb wb--buy" style="${box(190, 296, 230, 70)}" data-act="get" data-arg="${esc(key)}"><span>${esc(a.label)}</span><hr><span>0 Wii Points</span></button>` : ''}
          ${foot()}`,
      };
    },

    download: (key) => {
      const it = items.get(key);
      return {
        title: 'Downloading',
        html: `
          ${head('Download')}
          <p class="wii-lead wii-lead--dark" style="${box(40, 108, 528, 56)}">Downloading “${esc(it.title)}”…</p>
          <div class="wii-progress" style="${box(104, 178, 400, 30)}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
            ${'<i></i>'.repeat(20)}
          </div>
          <p class="wii-progress__pct" style="${box(104, 214, 400, 24)}">0%</p>
          <p class="wii-note" style="${box(40, 252, 528, 26)}">Please do not turn off the power.</p>
          <button class="wb" style="${box(210, 296, 188, 55)}" data-act="installed" data-arg="${esc(key)}" hidden>OK</button>
          ${dots(68, 372)}
          ${pointsBlock()}`,
        after: () => runDownload(key),
      };
    },

    theater: (id) => {
      const f = window.FILMS.find((x) => x.id === id);
      const media = f.src
        ? `<video src="${esc(f.src)}"${f.poster ? ` poster="${esc(f.poster)}"` : ''} controls autoplay playsinline></video>`
        : `<iframe src="https://www.youtube-nocookie.com/embed/${esc(f.fallback.id)}?autoplay=1&rel=0&modestbranding=1" title="${esc(f.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
      return {
        title: f.title,
        html: `
          ${head(f.title, { sub: f.byline })}
          <div class="wii-theater" style="${box(96, 102, 416, 234)}">${media}</div>
          ${foot()}`,
      };
    },

    photos: () => {
      const ids = window.PHOTO_IDS;
      const { page, total, start } = pager('photos', ids.length, 15);
      let cells = '';
      ids.slice(start, start + 15).forEach((id, i) => {
        const n = start + i;
        cells += `<button class="wii-photo" style="${box(48 + (i % 5) * 104, 104 + Math.floor(i / 5) * 86, 96, 74)}" data-go="photo" data-arg="${n}" aria-label="Photo ${n + 1}"><img src="${drive(id, 240)}" alt="" loading="lazy" referrerpolicy="no-referrer"></button>`;
      });
      return {
        title: 'Photo Channel',
        html: `
          ${head('Photo Channel', { sub: 'Frames from my travels' })}
          <p class="wii-page">Page ${page + 1} / ${total}</p>
          ${cells}
          ${chevrons(200, total)}
          ${foot()}`,
      };
    },

    photo: (n) => {
      const ids = window.PHOTO_IDS;
      const i = Number(n);
      return {
        title: 'Photo Channel',
        html: `
          ${head('Photo Channel', { sub: `Frame ${i + 1} of ${ids.length}` })}
          <div class="wii-still" style="${box(52, 100, 504, 264)}"><img src="${drive(ids[i], 400)}" data-full="${drive(ids[i], 1400)}" alt="Photograph by Kondwani Phiri" referrerpolicy="no-referrer"></div>
          <button class="wii-chev" style="${box(4, 200, 34, 64)}" data-act="photo" data-arg="-1" aria-label="Previous photo">${ICONS.chevron(-1)}</button>
          <button class="wii-chev" style="${box(570, 200, 34, 64)}" data-act="photo" data-arg="1" aria-label="Next photo">${ICONS.chevron(1)}</button>
          ${foot()}`,
        after: () => {
          const img = screen.querySelector('.wii-still img');
          const full = new Image();
          full.referrerPolicy = 'no-referrer';
          full.onload = () => img.isConnected && (img.src = full.src);
          full.src = img.dataset.full;
        },
      };
    },

    activity: () => {
      const rows = ofList('activity')
        .map(
          (it) => `
            <button class="wii-row" data-go="details" data-arg="${esc(it.key)}">
              <span class="wii-row__date">${esc(it.date)}</span>
              <span class="wii-row__what"><b>${esc(it.title)}</b><span>${esc(it.org)}</span></span>
            </button>`
        )
        .join('');
      return {
        title: 'Account Activity',
        html: `
          ${head('Account Activity', { sub: 'Where I’ve studied, worked and volunteered' })}
          <div class="wii-table" style="${box(36, 104, 536, 260)}">
            <p class="wii-table__head"><span>Date</span><span>Activity</span></p>
            <div class="wii-scroll wii-table__body">${rows}</div>
          </div>
          ${foot()}`,
      };
    },

    settings: () => ({
      title: 'Settings and Features',
      html: `
        ${head('Settings and Features', { sub: 'Make yourself at home' })}
        <button class="wb" style="${box(38, 116, 240, 64)}" data-act="music">Background Music: ${settings.music ? 'On' : 'Off'}</button>
        <button class="wb" style="${box(330, 116, 240, 64)}" data-act="sfx">Sound Effects: ${settings.sfx ? 'On' : 'Off'}</button>
        <button class="wb" style="${box(38, 200, 532, 64)}" data-go="list" data-arg="interests">Interests</button>
        <button class="wb" style="${box(38, 285, 532, 64)}" data-go="info" data-arg="welcome">About This Channel</button>
        ${foot()}`,
    }),

    points: () => ({
      title: 'Add Wii Points',
      html: `
        ${head('Add Wii Points', { sub: 'Choose how many Wii Points to add.' })}
        ${[500, 1000, 2000, 5000]
          .map((n, i) => `<button class="wb" style="${box(i % 2 ? 330 : 38, i < 2 ? 116 : 200, 240, 64)}" data-act="add" data-arg="${n}">${fmt(n)} Wii Points</button>`)
          .join('')}
        <p class="wii-copy" style="${box(40, 290, 528, 64)}">Wii Points are free here, and there’s nothing to spend them on. Everything in this channel already costs 0 Wii Points.</p>
        ${foot()}`,
    }),

    info: (topic) => {
      const page = INFO[topic];
      return {
        title: page.title,
        html: `
          ${head(page.title)}
          <div class="wii-scroll wii-copy" style="${box(36, 86, 536, 278)}">${page.html}</div>
          ${foot()}`,
      };
    },
  };

  const INFO = {
    welcome: {
      title: 'About This Channel',
      html: `
        <p>Welcome to the Kondwani Shop Channel! It’s a small tribute to the Wii Shop Channel, tucked into my portfolio. Everything in here is real: my engineering projects, films, photos, résumé, and what I’ve been watching.</p>
        <p>Nothing is for sale, every title costs 0 Wii Points, and Wii Points are free.</p>
        <p class="wii-copy__fine">A fan tribute, not an official Nintendo product, and not affiliated with or endorsed by Nintendo. Wii and Wii Shop Channel are trademarks of Nintendo. The layout follows the Wii Shop Channel as rebuilt by wiishopchannel.net; the artwork, music and sounds here are original.</p>`,
    },
    faq: {
      title: 'Frequently Asked Questions',
      html: `
        <p><b>Can I buy anything here?</b><br>No. Every title is free, and so are the Wii Points.</p>
        <p><b>What’s in here?</b><br>The same work as the rest of the site: engineering projects, films and a screenplay, photos, my résumé under Account Activity, and recent films under Titles I’ve Watched.</p>
        <p><b>Is the music the Wii Shop theme?</b><br>No. It’s an original loop played by your browser. Turn it off under Settings and Features.</p>
        <p><b>How do I get out?</b><br>Press Wii Menu on the main menu, or Esc.</p>`,
    },
  };

  // ---------- Navigation ----------

  let stack = [];
  let renderId = 0;
  let started = false;
  const current = () => stack[stack.length - 1];

  function go(name, arg, { replace = false } = {}) {
    if (replace) stack.pop();
    stack.push({ name, arg });
    return render();
  }

  function back() {
    const at = current()?.name;
    if (at === 'ring') return exit();
    if (at === 'menu') return exit();
    if (at === 'welcome') return shop();
    if (at === 'download') return;
    sfx('cancel');
    stack.pop();
    render();
  }

  function home() {
    stack = [{ name: 'menu' }];
    render();
  }

  function shop() {
    sfx('decide');
    stack = [{ name: 'menu' }];
    render();
  }

  const loading = document.getElementById('wii-loading');

  async function render({ instant = false } = {}) {
    const id = ++renderId;
    const { name, arg } = current();
    if (!instant && !reduceMotion && screen.childElementCount) {
      screen.classList.add('is-out');
      loading.classList.add('is-on');
      await wait(150);
      if (id !== renderId) return;
    }
    const view = SCREENS[name](arg);
    closeModal();
    screen.innerHTML = view.html;
    screen.classList.remove('is-out');
    loading.classList.remove('is-on');
    document.title = view.title ? `${view.title} · Kondwani Shop Channel` : 'Kondwani Shop Channel';

    if (name === 'theater') stopMusic();
    else if (started && settings.music) startMusic();

    view.after?.();
    const first = screen.querySelector('[data-act="start"], .wb--big, .wb:not(.wb--sq), .wii-item, .wii-photo');
    first?.focus({ preventScroll: true });
  }

  // Paging re-renders in place, without a history step.
  function turn(dir) {
    const { name, arg } = current();
    const key = name === 'photos' ? 'photos' : arg;
    const count = name === 'photos' ? window.PHOTO_IDS.length : ofList(arg).length;
    const per = name === 'photos' ? 15 : 6;
    const total = Math.ceil(count / per);
    if (total < 2) return;
    pages[key] = ((pages[key] ?? 0) + dir + total) % total;
    sfx('select');
    render();
  }

  function stepPhoto(dir) {
    const n = window.PHOTO_IDS.length;
    const i = (Number(current().arg) + dir + n) % n;
    pages.photos = Math.floor(i / 15);
    stack[stack.length - 1] = { name: 'photo', arg: i };
    sfx('select');
    render({ instant: true });
  }

  // ---------- Dialogs ----------

  let modalDone = null;

  function modal(html, buttons) {
    closeModal();
    const el = document.createElement('div');
    el.className = 'wii-modal';
    el.innerHTML = `
      <div class="wii-modal__box" role="alertdialog" aria-modal="true">
        <div class="wii-modal__text wii-scroll">${html}</div>
        <div class="wii-modal__btns">${buttons.map((b, i) => `<button class="wb" data-modal="${i}">${esc(b)}</button>`).join('')}</div>
      </div>`;
    stage.appendChild(el);
    el.querySelector('.wb:last-child').focus({ preventScroll: true });
    return new Promise((resolve) => {
      modalDone = resolve;
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-modal]');
        if (!b) return;
        sfx(Number(b.dataset.modal) === buttons.length - 1 ? 'decide' : 'cancel');
        closeModal(Number(b.dataset.modal));
      });
    });
  }

  function closeModal(choice = -1) {
    const el = stage.querySelector('.wii-modal');
    if (!el) return false;
    el.remove();
    const done = modalDone;
    modalDone = null;
    done?.(choice);
    return true;
  }

  // ---------- Points ----------

  function showPoints(n) {
    for (const el of stage.querySelectorAll('.wii-points__n')) el.textContent = fmt(n);
  }

  async function addPoints(amount) {
    const from = points;
    points += amount;
    store.set('points', points);
    if (reduceMotion) return showPoints(points);
    const t0 = performance.now();
    const dur = 1100;
    let lastTick = 0;
    await new Promise((done) => {
      const frame = (now) => {
        const k = Math.min(1, (now - t0) / dur);
        showPoints(Math.round(from + amount * (1 - (1 - k) ** 3)));
        if (now - lastTick > 70 && k < 1) {
          sfx('tick');
          lastTick = now;
        }
        if (k < 1) requestAnimationFrame(frame);
        else done();
      };
      requestAnimationFrame(frame);
    });
    sfx('finish');
  }

  // ---------- Downloads ----------

  async function runDownload(key) {
    const id = renderId;
    const bar = screen.querySelector('.wii-progress');
    const blocks = [...bar.children];
    const pct = screen.querySelector('.wii-progress__pct');
    const dur = reduceMotion ? 300 : 1700;
    const t0 = performance.now();
    await new Promise((done) => {
      const frame = (now) => {
        if (id !== renderId) return;
        const k = Math.min(1, (now - t0) / dur);
        const lit = Math.round(k * blocks.length);
        blocks.forEach((b, i) => b.classList.toggle('is-lit', i < lit));
        pct.textContent = `${Math.round(k * 100)}%`;
        bar.setAttribute('aria-valuenow', String(Math.round(k * 100)));
        if (k < 1) requestAnimationFrame(frame);
        else done();
      };
      requestAnimationFrame(frame);
    });
    if (id !== renderId) return;
    sfx('finish');
    screen.querySelector('.wii-lead').textContent = 'The download is complete!';
    screen.querySelector('.wii-note').textContent = `Press OK to open “${items.get(key).title}.”`;
    const ok = screen.querySelector('[data-act="installed"]');
    ok.hidden = false;
    ok.focus({ preventScroll: true });
  }

  function getItem(key) {
    const it = items.get(key);
    sfx('decide');
    if (it.action.quick || downloaded.has(key)) it.action.run();
    else go('download', key);
  }

  // ---------- Actions ----------

  const ACTIONS = {
    start() {
      started = true;
      audio();
      sfx('decide');
      startMusic();
      stack = [{ name: 'welcome' }];
      render();
    },
    shop,
    home() {
      sfx('decide');
      home();
    },
    back,
    exit,
    help() {
      sfx('decide');
      modal(
        '<p>Point at a button and click it to choose. Use ▲ to return to the main menu, and Back (or Esc) to go back a screen.</p>',
        ['OK']
      );
    },
    page: (dir) => turn(Number(dir)),
    photo: (dir) => stepPhoto(Number(dir)),
    more(key) {
      sfx('decide');
      const it = items.get(key);
      const credits = it.credits
        ? `<dl class="wii-credits">${it.credits.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`
        : '';
      const body = it.list === 'activity'
        ? `<ul>${it.more.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>`
        : (it.more ?? []).map((p) => `<p>${esc(p)}</p>`).join('');
      modal(`<h2>${esc(it.title)}</h2>${body}${credits}`, ['OK']);
    },
    get: (key) => getItem(key),
    installed(key) {
      downloaded.add(key);
      const it = items.get(key);
      sfx('decide');
      stack.pop();
      if (it.theater) return go('theater', it.theater);
      render({ instant: true });
      it.action.run();
    },
    music() {
      sfx('decide');
      setMusic(!settings.music);
      render({ instant: true });
    },
    sfx() {
      settings.sfx = !settings.sfx;
      store.set('sfx', settings.sfx);
      sfx('decide');
      render({ instant: true });
    },
    async add(n) {
      sfx('decide');
      const amount = Number(n);
      const yes = await modal(`<p>Add ${fmt(amount)} Wii Points?</p><p class="wii-copy__fine">They’re free.</p>`, ['Cancel', 'OK']);
      if (yes !== 1) return;
      await addPoints(amount);
      await modal(`<p>${fmt(amount)} Wii Points have been added.</p><p class="wii-copy__fine">You now have ${fmt(points)} Wii Points.</p>`, ['OK']);
    },
  };

  stage.addEventListener('click', (e) => {
    const el = e.target.closest('[data-go], [data-act]');
    if (!el || !screen.contains(el) || stage.querySelector('.wii-modal')) return;
    if (el.dataset.go) {
      sfx('decide');
      go(el.dataset.go, el.dataset.arg);
    } else ACTIONS[el.dataset.act]?.(el.dataset.arg, el);
  });

  // The cursor-over-a-button blip, for mouse and pen only.
  stage.addEventListener('pointerover', (e) => {
    if (e.pointerType === 'touch') return;
    const el = e.target.closest('.wb, .wii-item:is(button), .wii-chev, .wii-photo, .wii-row, .wii-info__row, .wii-points, .wii-ring');
    if (el && !el.contains(e.relatedTarget)) sfx('select');
  });

  musicToggle.addEventListener('click', () => {
    audio();
    setMusic(!settings.music);
    if (current()?.name === 'settings') render({ instant: true });
  });

  addEventListener('keydown', (e) => {
    if (layer.hidden || document.querySelector('dialog[open]')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      if (closeModal()) return sfx('cancel');
      back();
    } else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !stage.querySelector('.wii-modal')) {
      const dir = e.key === 'ArrowLeft' ? -1 : 1;
      const at = current()?.name;
      if (at === 'photo') stepPhoto(dir);
      else if (at === 'photos' || at === 'list') turn(dir);
    }
  });

  // ---------- The Wii Remote pointer ----------

  // A hand that leans the way it's moving, like a tilted remote.
  let tilt = 0;
  let lastX = 0;
  let cx = -100;
  let cy = -100;
  let raf = 0;

  function moveCursor(e) {
    if (e.pointerType !== 'mouse') return;
    const dx = e.clientX - lastX;
    lastX = cx = e.clientX;
    cy = e.clientY;
    tilt = Math.max(-22, Math.min(22, tilt * 0.6 + dx * 1.4));
    layer.classList.toggle('is-over-media', !!e.target.closest?.('.wii-theater'));
    if (!raf) raf = requestAnimationFrame(drawCursor);
  }

  function drawCursor() {
    raf = 0;
    tilt *= 0.86;
    cursor.style.transform = `translate(${cx - 13}px, ${cy - 3}px) rotate(${tilt.toFixed(2)}deg)`;
    if (Math.abs(tilt) > 0.3) raf = requestAnimationFrame(drawCursor);
  }

  if (finePointer && !reduceMotion) {
    layer.classList.add('has-cursor');
    layer.addEventListener('pointermove', moveCursor);
    layer.addEventListener('pointerleave', () => (cursor.style.transform = 'translate(-100px, -100px)'));
  }

  // ---------- Scale to the window ----------

  function fit() {
    const s = Math.min(innerWidth / W, (innerHeight - (innerWidth < 700 ? 64 : 0)) / H);
    layer.style.setProperty('--s', s.toFixed(4));
    layer.style.setProperty('--sw', `${(W * s).toFixed(1)}px`);
  }

  // ---------- Open and close ----------

  let fromPortal = false;
  let portalRect = null;
  let lastTitle = '';
  let isOpen = false;

  function warmFont() {
    if (document.querySelector('link[data-wii-font]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONT;
    link.dataset.wiiFont = '';
    document.head.appendChild(link);
  }

  function shell(open) {
    for (const el of document.querySelectorAll('.site > :not(dialog)')) el.inert = open;
    document.documentElement.classList.toggle('is-wii', open);
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    warmFont();
    buildItems();
    lastTitle = document.title;
    fit();
    started = false;
    setMusic(settings.music);
    stack = [{ name: 'ring' }];
    screen.innerHTML = '';
    layer.hidden = false;
    shell(true);
    render({ instant: true });

    if (reduceMotion) return;
    if (portalRect) {
      const r = portalRect;
      const from = `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round 14px)`;
      layer.animate([{ clipPath: from }, { clipPath: 'inset(0px 0px 0px 0px round 0px)' }], {
        duration: 700,
        easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
      });
      stage.animate([{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1 }], { duration: 900, easing: 'ease-out' });
    } else {
      layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: 'ease-out' });
    }
    portalRect = null;
  }

  async function close() {
    if (!isOpen) return;
    isOpen = false;
    stopMusic();
    closeModal();
    if (!reduceMotion) await layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: 'ease-in' }).finished.catch(() => {});
    if (isOpen) return;
    layer.hidden = true;
    screen.innerHTML = '';
    stack = [];
    shell(false);
    document.title = lastTitle;
    if (fromPortal) portal.focus({ preventScroll: true });
    fromPortal = false;
  }

  // Back to the Extra tab: one step back in history if the portal brought us here.
  function exit() {
    sfx('cancel');
    if (fromPortal) history.back();
    else location.replace('#extra');
  }

  portal.addEventListener('pointerenter', warmFont);
  portal.addEventListener('focus', warmFont);
  portal.addEventListener('click', () => {
    fromPortal = true;
    portalRect = portal.getBoundingClientRect();
  });
  addEventListener('resize', () => isOpen && fit());

  window.Wii = {
    toggle(on) {
      if (on) open();
      else close();
    },
  };
})();
