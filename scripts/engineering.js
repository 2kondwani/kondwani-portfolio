// Engineering tab: the projects as a parts list on a blueprint sheet. Each row
// shows the project's line drawing (scripts/blueprints.js) and opens its write-up
// in place: report, count-up readouts, and, for the light meter, a working copy
// of its exposure math.
// site.js calls window.renderEngineering() the first time the tab is shown.
(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const projects = window.ENGINEERING;
  const DRAWINGS = window.BLUEPRINTS;
  const byId = Object.fromEntries(projects.map((p) => [p.id, p]));

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const pad = (n, size = 2) => String(n).padStart(size, '0');
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const driveThumb = (id, w) => `https://drive.google.com/thumbnail?id=${id}&sz=w${w}`;

  // ---------- Write-up pieces ----------

  // A report cover: the document's first page when it lives on Drive, otherwise a drawn one.
  function sheet(p, width) {
    if (p.cover) {
      return `<div class="sheet"><img class="sheet__img" src="${driveThumb(p.cover, width)}" alt="" referrerpolicy="no-referrer" loading="lazy"></div>`;
    }
    return `
      <div class="sheet">
        <div class="sheet__drawn">
          <p class="sheet__course">${esc(p.course)}</p>
          <p class="sheet__title">${esc(p.title)}</p>
          <p class="sheet__context">${esc(p.context)}</p>
          <dl class="sheet__block">
            <div><dt>Date</dt><dd>${esc(p.when)}</dd></div>
            <div><dt>By</dt><dd>K. Phiri</dd></div>
          </dl>
        </div>
      </div>`;
  }

  function readouts(p) {
    if (!p.readouts.length) return '';
    return `
      <dl class="readouts">
        ${p.readouts
          .map(
            (r) => `
              <div class="readout">
                <dt>${esc(r.label)}</dt>
                <dd><span class="readout__num" data-value="${r.value}" data-decimals="${r.decimals || 0}">${format(r.value, r.decimals || 0)}</span>${esc(r.unit || '')}${esc(r.suffix || '')}</dd>
              </div>`
          )
          .join('')}
      </dl>`;
  }

  function docs(p) {
    return p.docs
      .map(
        (d, i) => `
          <button class="doc-btn" type="button" data-project="${p.id}" data-doc="${i}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M6 2.5h8l4 4v15H6z"/><path d="M14 2.5v4h4M9 12h6M9 15.5h6"/></svg>
            ${esc(d.label)}
          </button>`
      )
      .join('');
  }

  // ---------- Count-up readouts ----------

  function format(value, decimals) {
    return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  function countUp(container) {
    if (reduceMotion) return;
    for (const el of container.querySelectorAll('.readout__num')) {
      const value = Number(el.dataset.value);
      const decimals = Number(el.dataset.decimals);
      const start = performance.now();
      const duration = 1100;
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        el.textContent = format(value * (1 - Math.pow(1 - t, 3)), decimals);
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }

  // ---------- The list ----------

  function row(p, i) {
    return `
      <li class="bp-row" data-id="${p.id}">
        <h2 class="bp-row__h">
          <button class="bp-row__head" type="button" aria-expanded="false" aria-controls="bp-${p.id}">
            <span class="bp-row__no">${pad(i + 1)}</span>
            <span class="bp-row__fig" style="--d:${300 + i * 220}">${DRAWINGS[p.drawing]()}</span>
            <span class="bp-row__main">
              <span class="bp-row__title">${esc(p.title)}</span>
              <span class="bp-row__kind">${esc(p.kind)}</span>
              <span class="bp-row__also">${esc(p.course)} · ${esc(p.when)}</span>
            </span>
            <span class="bp-row__course">${esc(p.course)}</span>
            <span class="bp-row__when">${esc(p.when)}</span>
            <span class="bp-row__toggle" aria-hidden="true"></span>
          </button>
        </h2>
        <div class="bp-detail" id="bp-${p.id}" inert>
          <div class="bp-detail__clip">
            <article class="bp-sheet">
              <div class="bp-sheet__aside">
                ${sheet(p, 600)}
                <div class="doc-btns">${docs(p)}</div>
              </div>
              <div class="bp-sheet__body">
                <p class="eng-detail__context">${esc(p.context)} · ${esc(p.when)}</p>
                ${p.summary.map((s, n) => `<p class="eng-detail__text${n ? '' : ' eng-detail__lead'}">${esc(s)}</p>`).join('')}
                <p class="eng-detail__team"><span>Team</span>${esc(p.team)}</p>
                ${readouts(p)}
                <ul class="chips">${p.methods.map((m) => `<li class="chip">${esc(m)}</li>`).join('')}</ul>
              </div>
              ${p.meter ? meterMarkup() : ''}
            </article>
          </div>
        </div>
      </li>`;
  }

  // ---------- Open and close ----------

  let list;

  function setOpen(li, open) {
    const detail = li.querySelector('.bp-detail');
    li.classList.toggle('is-open', open);
    li.querySelector('.bp-row__head').setAttribute('aria-expanded', String(open));
    detail.inert = !open;
    if (!open) return;
    countUp(detail);
    const meter = detail.querySelector('.meter');
    if (meter && !meter.dataset.ready) initMeter(meter);
  }

  // One write-up open at a time. Any other closes at once, and the page scrolls
  // to make up for it, so the row you clicked stays under the pointer.
  function toggle(li) {
    const head = li.querySelector('.bp-row__head');
    const before = head.getBoundingClientRect().top;
    const others = [...list.querySelectorAll('.bp-row.is-open')].filter((o) => o !== li);
    if (others.length) {
      list.classList.add('is-instant');
      others.forEach((o) => setOpen(o, false));
      void list.offsetHeight;
      list.classList.remove('is-instant');
    }
    setOpen(li, !li.classList.contains('is-open'));
    const moved = head.getBoundingClientRect().top - before;
    if (moved) scrollBy({ top: moved, behavior: 'instant' });
  }

  // Pointing at a row plots its drawing again, a pen stroke at a time.
  function replot(fig) {
    if (reduceMotion || list.classList.contains('is-plotting')) return;
    fig.classList.remove('is-replot');
    void fig.offsetWidth;
    fig.classList.add('is-replot');
  }

  // ---------- Report buttons ----------

  // PDFs (`url`) open in the site's own reader; Drive files can't be fetched from
  // here, so Drive's viewer.
  function openDoc(button) {
    const p = byId[button.dataset.project];
    const doc = p.docs[Number(button.dataset.doc)];
    const title = `${p.title} · ${doc.label}`;
    if (doc.url) window.openViewer({ title, pdf: doc.url });
    else
      window.openViewer({
        title,
        src: `https://drive.google.com/file/d/${doc.drive}/preview`,
        href: `https://drive.google.com/file/d/${doc.drive}/view`,
      });
  }

  // ---------- The light meter ----------

  // The Photon 2 meter's math: lux from the BH1750 → exposure value → the shutter
  // speed for the chosen aperture and ISO. EV100 = log2(lux / 2.5) is the usual
  // incident-light calibration. The LED thresholds here are this page's choice:
  // faster than 1/4000 s is over (no shutter that quick), slower than 1/30 s is
  // under (too slow to hold steady).
  const STOPS = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16];
  const ISOS = [100, 200, 400, 800, 1600, 3200];
  const SPEEDS = [1 / 4000, 1 / 2000, 1 / 1000, 1 / 500, 1 / 250, 1 / 125, 1 / 60, 1 / 30, 1 / 15, 1 / 8, 1 / 4, 1 / 2, 1, 2, 4, 8, 15, 30];
  const SCENES = [
    [1, 'Candlelight'],
    [50, 'Living room'],
    [400, 'Office'],
    [1000, 'Overcast'],
    [10000, 'Open shade'],
    [32000, 'Daylight'],
    [100000, 'Bright sun'],
  ];

  function meterMarkup() {
    return `
      <section class="meter" aria-labelledby="meter-title">
        <header class="meter__head">
          <h3 class="meter__title" id="meter-title">Try the meter</h3>
          <p class="meter__note">The exposure math from the build, running in your browser.</p>
        </header>
        <div class="meter__body">
          <div class="meter__device">
            <div class="meter__gauge">
              <svg viewBox="0 0 200 112" aria-hidden="true">
                <path class="meter__arc" d="M24 100 A76 76 0 0 1 176 100" />
                ${Array.from({ length: 13 }, (_, i) => {
                  const a = ((-60 + i * 10) * Math.PI) / 180;
                  const r1 = i % 3 === 0 ? 62 : 67;
                  return `<line class="meter__tick" x1="${100 + Math.sin(a) * r1}" y1="${100 - Math.cos(a) * r1}" x2="${100 + Math.sin(a) * 74}" y2="${100 - Math.cos(a) * 74}" />`;
                }).join('')}
                <text class="meter__label" x="30" y="66">−</text>
                <text class="meter__label" x="100" y="20">0</text>
                <text class="meter__label" x="170" y="66">+</text>
                <line class="meter__needle" x1="100" y1="100" x2="100" y2="34" />
                <circle class="meter__pivot" cx="100" cy="100" r="5" />
              </svg>
              <span class="meter__led" data-led></span>
            </div>
            <div class="meter__screen">
              <p class="meter__ev">EV <span data-ev></span></p>
              <p class="meter__speed"><span data-speed></span></p>
              <p class="meter__settings" data-settings></p>
              <p class="meter__status" data-status aria-live="polite"></p>
            </div>
          </div>
          <div class="meter__controls">
            <label class="meter__control">
              <span class="meter__name">Light</span>
              <input type="range" min="0" max="1000" value="700" data-lux>
              <output data-lux-out></output>
            </label>
            <label class="meter__control">
              <span class="meter__name">Aperture</span>
              <input type="range" min="0" max="${STOPS.length - 1}" value="5" step="1" data-aperture>
              <output data-aperture-out></output>
            </label>
            <fieldset class="meter__iso">
              <legend class="meter__name">ISO <small>set from a phone on the real one</small></legend>
              ${ISOS.map(
                (iso) => `
                  <label class="meter__iso-opt">
                    <input type="radio" name="meter-iso" value="${iso}" ${iso === 400 ? 'checked' : ''}>
                    <span>${iso}</span>
                  </label>`
              ).join('')}
            </fieldset>
          </div>
        </div>
      </section>`;
  }

  function initMeter(root) {
    root.dataset.ready = 'true';
    const q = (sel) => root.querySelector(sel);
    const luxIn = q('[data-lux]');
    const apIn = q('[data-aperture]');

    const speedLabel = (t) => (t < 1 ? `1/${Math.round(1 / t)} s` : `${t} s`);

    function update() {
      const lux = Math.pow(10, Number(luxIn.value) / 200); // 1 → 100,000 lux on a log scale
      const N = STOPS[Number(apIn.value)];
      const iso = Number(root.querySelector('input[name="meter-iso"]:checked').value);

      const ev = Math.log2(lux / 2.5) + Math.log2(iso / 100);
      const t = (N * N) / Math.pow(2, ev);
      const nearest = SPEEDS.reduce((best, s) => (Math.abs(Math.log2(s / t)) < Math.abs(Math.log2(best / t)) ? s : best));
      const state = t < 1 / 4000 ? 'over' : t > 1 / 30 ? 'under' : 'ok';

      // Needle: centered in the hand-holdable band, + toward too bright, − toward too dark.
      const angle = clamp((-Math.log2(t) - 8.5) * 9, -58, 58);
      q('.meter__needle').style.setProperty('--a', `${angle.toFixed(1)}deg`);
      q('[data-led]').dataset.state = state;

      q('[data-ev]').textContent = ev.toFixed(1);
      q('[data-speed]').textContent = state === 'over' ? '< 1/4000 s' : speedLabel(nearest);
      q('[data-settings]').textContent = `f/${N} · ISO ${iso}`;
      q('[data-status]').textContent = { ok: 'Exposure correct', over: 'Overexposed: stop down', under: 'Underexposed: open up' }[state];

      const scene = SCENES.reduce((best, s) => (lux >= s[0] ? s : best), SCENES[0])[1];
      q('[data-lux-out]').textContent = `${scene} · ${Math.round(lux).toLocaleString('en-US')} lux`;
      q('[data-aperture-out]').textContent = `f/${N}`;
    }

    root.addEventListener('input', update);
    update();
  }

  // ---------- Render ----------

  let rendered = false;

  window.renderEngineering = function render() {
    if (rendered) return;
    rendered = true;

    list = document.getElementById('bp-list');
    list.innerHTML = projects.map(row).join('');
    document.getElementById('bp-count').textContent = pad(projects.length);

    list.addEventListener('click', (e) => {
      const head = e.target.closest('.bp-row__head');
      if (head) return toggle(head.closest('.bp-row'));
      const button = e.target.closest('.doc-btn');
      if (button) openDoc(button);
    });
    list.addEventListener('pointerover', (e) => {
      const head = e.target.closest('.bp-row__head');
      if (head && !head.contains(e.relatedTarget)) replot(head.querySelector('.bp-row__fig'));
    });
    // Esc folds the open write-up back into its row.
    list.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const open = list.querySelector('.bp-row.is-open');
      if (!open) return;
      setOpen(open, false);
      open.querySelector('.bp-row__head').focus();
    });

    // First look: the drawings plot themselves in, one row after another.
    if (!reduceMotion) {
      list.classList.add('is-plotting');
      setTimeout(() => list.classList.remove('is-plotting'), 300 + projects.length * 220 + 1700);
    }
  };
})();
