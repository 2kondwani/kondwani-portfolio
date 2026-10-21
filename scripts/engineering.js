// Engineering tab: the projects laid out on a blueprint you can move around like
// a map. Drag to pan, scroll or pinch to zoom, and click a drawing (or pick it in
// the Projects Section list) to fly there and open its write-up in the side panel.
// site.js calls window.renderEngineering() the first time the tab is shown.
(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const projects = window.ENGINEERING;
  const SHEET = window.ENGINEERING_SHEET;
  const DRAWINGS = window.BLUEPRINTS;
  const byId = Object.fromEntries(projects.map((p) => [p.id, p]));

  const DRAW_W = 420; // every drawing's box on the sheet (see scripts/blueprints.js)
  const DRAW_H = 320;
  const MAX_ZOOM = 2.6;
  const PROJECT_ZOOM = 1.15; // flying to a project stops here, so its neighbors stay in view
  const SHEET_RECT = [0, 0, SHEET.width, SHEET.height];

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const pad = (n, size = 2) => String(n).padStart(size, '0');
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const driveThumb = (id, w) => `https://drive.google.com/thumbnail?id=${id}&sz=w${w}`;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // A drawing sheet's grid reference for a point: columns 1–8 across, rows A–F down.
  const gridRef = (x, y) => `${'ABCDEF'[clamp(Math.floor((y / SHEET.height) * 6), 0, 5)]}${clamp(Math.floor((x / SHEET.width) * 8), 0, 7) + 1}`;
  const centerOf = (p) => ({ x: p.at.x + DRAW_W / 2, y: p.at.y + DRAW_H / 2 });
  const refOf = (p) => gridRef(centerOf(p).x, centerOf(p).y);
  // A project's drawing plus its tag, with a margin.
  const projectRect = (p) => [p.at.x - 30, p.at.y - 30, DRAW_W + 60, DRAW_H + 150];

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


  // ---------- The sheet ----------

  function zoneMarks() {
    const cols = Array.from({ length: 8 }, (_, i) => i + 1);
    const rows = [...'ABCDEF'];
    const at = (i, n) => `${((i + 0.5) / n) * 100}%`;
    return [
      ...cols.map((c, i) => `<span class="bp-zone bp-zone--top" style="left:${at(i, 8)}">${c}</span><span class="bp-zone bp-zone--bottom" style="left:${at(i, 8)}">${c}</span>`),
      ...rows.map((r, i) => `<span class="bp-zone bp-zone--left" style="top:${at(i, 6)}">${r}</span><span class="bp-zone bp-zone--right" style="top:${at(i, 6)}">${r}</span>`),
    ].join('');
  }

  function itemMarkup(p, i) {
    return `
      <button class="bp-item" type="button" data-id="${p.id}" style="left:${p.at.x}px;top:${p.at.y}px;--d:${400 + i * 280}" aria-label="${pad(i + 1)}, ${esc(p.title)}, ${esc(p.course)}, ${esc(p.when)}. Open its sheet.">
        ${DRAWINGS[p.drawing]()}
        <span class="bp-tag">
          <span class="bp-tag__no">${pad(i + 1)}</span>
          <span class="bp-tag__title">${esc(p.title)}</span>
          <span class="bp-tag__meta">${esc(p.course)} · ${esc(p.when)} · Grid ${refOf(p)}</span>
        </span>
      </button>`;
  }

  function sheetMarkup() {
    const sections = SHEET.sections
      .map((s) => {
        const [x, y, w, h] = s.rect;
        const count = projects.filter((p) => p.section === s.id).length;
        return `<div class="bp-section" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"><span class="bp-section__tab">${esc(s.label)}<small>${pad(count)}</small></span></div>`;
      })
      .join('');
    return `
      <svg class="bp-defs" width="0" height="0" aria-hidden="true">
        <defs><marker id="bp-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1L10 5L0 9Z" /></marker></defs>
      </svg>
      <div class="bp-border" aria-hidden="true">${zoneMarks()}</div>
      <header class="bp-heading">
        <p class="bp-heading__title">Engineering · Project sheet</p>
        <p class="bp-heading__sub">Coursework, research and builds · USC Viterbi · Georgetown · 2024–2026</p>
      </header>
      ${sections}
      ${projects.map(itemMarkup).join('')}
      <div class="bp-notes">
        <p class="bp-notes__title">General notes</p>
        <ol>
          <li>All work by K. Phiri unless noted; team projects credit every member.</li>
          <li>Coursework at USC Viterbi and physics research at Georgetown, 2024–2026.</li>
          <li>Click a drawing to open its sheet. Drag to move; scroll or pinch to zoom.</li>
          <li>Drawings are illustrative, not to scale.</li>
        </ol>
      </div>
      <dl class="bp-titleblock">
        <div class="bp-titleblock__name"><dt>Title</dt><dd>Engineering</dd></div>
        <div><dt>Drawn by</dt><dd>K. Phiri</dd></div>
        <div><dt>School</dt><dd>USC Viterbi</dd></div>
        <div><dt>Projects</dt><dd>${pad(projects.length)}</dd></div>
        <div><dt>Span</dt><dd>2024–2026</dd></div>
        <div><dt>Scale</dt><dd>NTS</dd></div>
        <div><dt>Sheet</dt><dd>1 of 1</dd></div>
      </dl>`;
  }

  // ---------- Write-up panel ----------

  function writeup(p) {
    return `
      <div class="bp-cover">
        ${sheet(p, 600)}
        <div class="doc-btns">${docs(p)}</div>
      </div>
      <p class="eng-detail__context">${esc(p.context)} · ${esc(p.when)}</p>
      ${p.summary.map((s, n) => `<p class="eng-detail__text${n ? '' : ' eng-detail__lead'}">${esc(s)}</p>`).join('')}
      <p class="eng-detail__team"><span>Team</span>${esc(p.team)}</p>
      ${readouts(p)}
      <ul class="chips">${p.methods.map((m) => `<li class="chip">${esc(m)}</li>`).join('')}</ul>
      ${p.meter ? meterMarkup() : ''}`;
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


  // ---------- Camera ----------

  // A point on the sheet shows at (point × k + x, point × k + y) in the viewport.
  let bp, viewport, world, panel, panelBody, hint;
  let cam = { x: 0, y: 0, k: 1 };
  let flight = 0;
  let glideFrame = 0;
  let touched = false; // has anyone moved the map yet?

  function apply() {
    world.style.transform = `translate(${cam.x}px, ${cam.y}px) scale(${cam.k})`;
    updateMini();
    document.getElementById('bp-zoom-level').textContent = `${Math.round(cam.k * 100)}%`;
  }

  // will-change keeps motion smooth; dropping it once still lets text redraw crisp.
  let settleTimer = 0;
  function moving() {
    world.classList.add('is-moving');
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => world.classList.remove('is-moving'), 180);
  }

  const sheetLayout = () => matchMedia('(max-width: 760px)').matches;

  // The part of the map that the open panel and Projects Section list don't cover.
  function area() {
    const w = viewport.clientWidth;
    const h = viewport.clientHeight;
    if (sheetLayout()) {
      const covered = panel.classList.contains('is-open') ? panel.offsetHeight + 16 : 0;
      return { left: 0, top: 0, width: w, height: Math.max(140, h - covered) };
    }
    const index = document.getElementById('bp-index');
    const left = index.classList.contains('is-open') ? index.offsetLeft + index.offsetWidth : 0;
    const right = panel.classList.contains('is-open') ? panel.offsetWidth + 24 : 0;
    return { left, top: 0, width: Math.max(180, w - left - right), height: h };
  }

  const minZoom = () => Math.min(viewport.clientWidth / SHEET.width, viewport.clientHeight / SHEET.height) * 0.85;

  // The camera that frames a rectangle of the sheet inside the visible area.
  function frame([x, y, w, h], padding = 40, a = area(), maxZoom = MAX_ZOOM) {
    const k = clamp(Math.min((a.width - padding * 2) / w, (a.height - padding * 2) / h), minZoom(), maxZoom);
    return { k, x: a.left + a.width / 2 - (x + w / 2) * k, y: a.top + a.height / 2 - (y + h / 2) * k };
  }

  // Keep the middle of the view over the sheet, so it can't be flung away.
  function bound(c) {
    const w = viewport.clientWidth;
    const h = viewport.clientHeight;
    const k = clamp(c.k, minZoom(), MAX_ZOOM);
    const cx = clamp((w / 2 - c.x) / k, 0, SHEET.width);
    const cy = clamp((h / 2 - c.y) / k, 0, SHEET.height);
    return { k, x: w / 2 - cx * k, y: h / 2 - cy * k };
  }

  function stop() {
    cancelAnimationFrame(flight);
    cancelAnimationFrame(glideFrame);
  }

  // Fly the point at the middle of the view to the target's, easing the zoom on a
  // log scale, and pull back a little on long trips so it reads as travel.
  function flyTo(target, duration = 950) {
    stop();
    if (reduceMotion || duration === 0) {
      cam = target;
      return apply();
    }
    const from = { ...cam };
    const w = viewport.clientWidth;
    const h = viewport.clientHeight;
    const c0 = { x: (w / 2 - from.x) / from.k, y: (h / 2 - from.y) / from.k };
    const c1 = { x: (w / 2 - target.x) / target.k, y: (h / 2 - target.y) / target.k };
    const pull = clamp(Math.hypot(c1.x - c0.x, c1.y - c0.y) / SHEET.width, 0, 0.45);
    const start = performance.now();

    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const e = ease(t);
      const k = Math.exp(Math.log(from.k) + (Math.log(target.k) - Math.log(from.k)) * e) * (1 - pull * Math.sin(Math.PI * e));
      const cx = c0.x + (c1.x - c0.x) * e;
      const cy = c0.y + (c1.y - c0.y) * e;
      cam = t < 1 ? { k, x: w / 2 - cx * k, y: h / 2 - cy * k } : target;
      apply();
      moving();
      if (t < 1) flight = requestAnimationFrame(step);
    };
    flight = requestAnimationFrame(step);
  }

  // Zoom by a factor, keeping the sheet point under (px, py) in place.
  function zoomAt(px, py, factor) {
    const k = clamp(cam.k * factor, minZoom(), MAX_ZOOM);
    const f = k / cam.k;
    cam = bound({ k, x: px - (px - cam.x) * f, y: py - (py - cam.y) * f });
    apply();
    moving();
    interacted();
  }

  const zoomCenter = (factor) => {
    const a = area();
    zoomAt(a.left + a.width / 2, a.top + a.height / 2, factor);
  };

  const fitAll = () => flyTo(frame(SHEET_RECT, 24), 800);

  // A flick keeps the sheet sliding, slowing like it's on a drafting table.
  function glide(vx, vy) {
    if (reduceMotion || Math.hypot(vx, vy) < 0.1) return;
    let last = performance.now();
    const step = (now) => {
      const dt = Math.min(40, now - last);
      last = now;
      cam = bound({ k: cam.k, x: cam.x + vx * dt, y: cam.y + vy * dt });
      apply();
      moving();
      const decay = Math.pow(0.93, dt / 16);
      vx *= decay;
      vy *= decay;
      if (Math.hypot(vx, vy) > 0.02) glideFrame = requestAnimationFrame(step);
    };
    glideFrame = requestAnimationFrame(step);
  }

  function interacted() {
    if (touched) return;
    touched = true;
    hint.classList.add('is-gone');
  }

  // ---------- Input ----------

  function bindInput() {
    const pointers = new Map();
    let gesture = null;
    let swallowClick = false;
    const local = (x, y) => {
      const r = viewport.getBoundingClientRect();
      return { x: x - r.left, y: y - r.top };
    };

    const begin = () => {
      const pts = [...pointers.values()];
      if (pts.length === 1) return { type: 'pan', x: pts[0].x, y: pts[0].y, from: { ...cam }, moved: false, lx: pts[0].x, ly: pts[0].y, t: performance.now(), vx: 0, vy: 0 };
      const [a, b] = pts;
      const mid = local((a.x + b.x) / 2, (a.y + b.y) / 2);
      return { type: 'pinch', d: Math.hypot(a.x - b.x, a.y - b.y), wx: (mid.x - cam.x) / cam.k, wy: (mid.y - cam.y) / cam.k, k: cam.k, moved: true };
    };

    viewport.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      stop();
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      gesture = begin();
    });

    viewport.addEventListener('pointermove', (e) => {
      // The coordinate readout follows any pointer over the sheet.
      const p = local(e.clientX, e.clientY);
      const wx = (p.x - cam.x) / cam.k;
      const wy = (p.y - cam.y) / cam.k;
      document.getElementById('bp-coords').textContent =
        wx >= 0 && wy >= 0 && wx <= SHEET.width && wy <= SHEET.height
          ? `${gridRef(wx, wy)} · X ${pad(Math.round(wx), 4)} · Y ${pad(Math.round(wy), 4)}`
          : 'Off sheet';

      if (!gesture || !pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (gesture.type === 'pan') {
        const dx = e.clientX - gesture.x;
        const dy = e.clientY - gesture.y;
        // Only a real drag takes over the pointer; a tap stays a click on the drawing.
        if (!gesture.moved && Math.hypot(dx, dy) > 5) {
          gesture.moved = true;
          viewport.setPointerCapture(e.pointerId);
          viewport.classList.add('is-dragging');
          interacted();
        }
        if (!gesture.moved) return;
        const now = performance.now();
        const dt = Math.max(1, now - gesture.t);
        gesture.vx = (e.clientX - gesture.lx) / dt;
        gesture.vy = (e.clientY - gesture.ly) / dt;
        gesture.lx = e.clientX;
        gesture.ly = e.clientY;
        gesture.t = now;
        cam = bound({ k: cam.k, x: gesture.from.x + dx, y: gesture.from.y + dy });
        apply();
        moving();
      } else {
        const [a, b] = [...pointers.values()];
        const mid = local((a.x + b.x) / 2, (a.y + b.y) / 2);
        const k = clamp(gesture.k * (Math.hypot(a.x - b.x, a.y - b.y) / gesture.d), minZoom(), MAX_ZOOM);
        cam = bound({ k, x: mid.x - gesture.wx * k, y: mid.y - gesture.wy * k });
        apply();
        moving();
        interacted();
      }
    });

    const end = (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      viewport.classList.remove('is-dragging');
      if (gesture?.moved) {
        swallowClick = true;
        setTimeout(() => (swallowClick = false));
      }
      if (gesture?.type === 'pan' && gesture.moved && performance.now() - gesture.t < 80) glide(gesture.vx, gesture.vy);
      gesture = pointers.size ? begin() : null;
    };
    viewport.addEventListener('pointerup', end);
    viewport.addEventListener('pointercancel', end);
    // A drag that ends over a drawing shouldn't also open it.
    viewport.addEventListener('click', (e) => swallowClick && (e.stopPropagation(), e.preventDefault()), true);

    // Pinch on a trackpad (ctrl + wheel) or a mouse wheel zooms; two-finger scroll pans.
    viewport.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        stop();
        const p = local(e.clientX, e.clientY);
        const dy = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY;
        const mouseWheel = e.deltaMode !== 0 || (e.deltaX === 0 && Math.abs(dy) >= 40 && Number.isInteger(dy));
        if (e.ctrlKey) zoomAt(p.x, p.y, Math.exp(-dy * 0.01));
        else if (mouseWheel) zoomAt(p.x, p.y, Math.exp(-clamp(dy, -120, 120) * 0.0025));
        else {
          cam = bound({ k: cam.k, x: cam.x - e.deltaX, y: cam.y - dy });
          apply();
          moving();
          interacted();
        }
      },
      { passive: false }
    );

    viewport.addEventListener('dblclick', (e) => {
      if (e.target.closest('.bp-item')) return;
      const p = local(e.clientX, e.clientY);
      const k = clamp(cam.k * 1.8, minZoom(), MAX_ZOOM);
      flyTo(bound({ k, x: p.x - ((p.x - cam.x) / cam.k) * k, y: p.y - ((p.y - cam.y) / cam.k) * k }), 450);
      interacted();
    });

    viewport.addEventListener('keydown', (e) => {
      const nudge = { ArrowLeft: [120, 0], ArrowRight: [-120, 0], ArrowUp: [0, 120], ArrowDown: [0, -120] }[e.key];
      if (nudge) flyTo(bound({ k: cam.k, x: cam.x + nudge[0], y: cam.y + nudge[1] }), 260);
      else if (e.key === '+' || e.key === '=') zoomCenter(1.3);
      else if (e.key === '-') zoomCenter(1 / 1.3);
      else if (e.key === '0') fitAll();
      else return;
      e.preventDefault();
      interacted();
    });

    // Esc closes the open sheet (unless a document is open on top of it).
    addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && active && !bp.closest('[hidden]') && !document.querySelector('dialog[open]')) closeProject();
    });

    // A flight's target was worked out for the old size, so drop it and reframe.
    new ResizeObserver(() => {
      if (!viewport.clientWidth) return;
      stop();
      if (!touched && !active) cam = frame(SHEET_RECT, 24);
      else if (active) cam = frame(projectRect(byId[active]), 48, area(), PROJECT_ZOOM);
      else cam = bound(cam);
      apply();
    }).observe(viewport);
  }

  // ---------- Heads-up display: index, minimap, zoom ----------

  function renderIndex() {
    const list = SHEET.sections
      .map((s) => {
        const items = projects
          .map((p, i) => (p.section === s.id ? `<li><button class="bp-index__item" type="button" data-id="${p.id}"><span>${pad(i + 1)}</span>${esc(p.title)}</button></li>` : ''))
          .join('');
        return `
          <li>
            <button class="bp-index__section" type="button" data-section="${s.id}">${esc(s.label)}</button>
            <ol>${items}</ol>
          </li>`;
      })
      .join('');
    const index = document.getElementById('bp-index');
    index.querySelector('.bp-index__list').innerHTML = list;
    const toggle = index.querySelector('.bp-index__toggle');
    // Folded away on small screens so the drawings get the room.
    const setOpen = (open) => {
      index.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    setOpen(!sheetLayout());
    toggle.addEventListener('click', () => setOpen(!index.classList.contains('is-open')));
    index.addEventListener('click', (e) => {
      const item = e.target.closest('.bp-index__item');
      const section = e.target.closest('.bp-index__section');
      if (item) openProject(item.dataset.id);
      if (section) {
        closeProject();
        flyTo(frame(SHEET.sections.find((s) => s.id === section.dataset.section).rect, 30), 900);
      }
      if ((item || section) && sheetLayout()) setOpen(false);
      interacted();
    });
  }

  let miniView;
  function renderMini() {
    const mini = document.getElementById('bp-mini');
    const pct = (v, total) => `${(v / total) * 100}%`;
    mini.innerHTML =
      SHEET.sections
        .map((s) => {
          const [x, y, w, h] = s.rect;
          return `<span class="bp-mini__section" style="left:${pct(x, SHEET.width)};top:${pct(y, SHEET.height)};width:${pct(w, SHEET.width)};height:${pct(h, SHEET.height)}"></span>`;
        })
        .join('') +
      projects.map((p) => `<span class="bp-mini__dot" data-id="${p.id}" style="left:${pct(centerOf(p).x, SHEET.width)};top:${pct(centerOf(p).y, SHEET.height)}"></span>`).join('') +
      '<span class="bp-mini__view"></span>';
    miniView = mini.querySelector('.bp-mini__view');

    // Click the minimap to travel there.
    mini.addEventListener('click', (e) => {
      const r = mini.getBoundingClientRect();
      const wx = ((e.clientX - r.left) / r.width) * SHEET.width;
      const wy = ((e.clientY - r.top) / r.height) * SHEET.height;
      const a = area();
      flyTo(bound({ k: cam.k, x: a.left + a.width / 2 - wx * cam.k, y: a.top + a.height / 2 - wy * cam.k }), 600);
      interacted();
    });
  }

  function updateMini() {
    if (!miniView) return;
    const w = viewport.clientWidth / cam.k;
    const h = viewport.clientHeight / cam.k;
    const x = -cam.x / cam.k;
    const y = -cam.y / cam.k;
    const left = clamp(x / SHEET.width, 0, 1);
    const top = clamp(y / SHEET.height, 0, 1);
    Object.assign(miniView.style, {
      left: `${left * 100}%`,
      top: `${top * 100}%`,
      width: `${(clamp((x + w) / SHEET.width, 0, 1) - left) * 100}%`,
      height: `${(clamp((y + h) / SHEET.height, 0, 1) - top) * 100}%`,
    });
  }

  // ---------- Opening a project ----------

  let active = null;
  let opener = null;

  function openProject(id) {
    const p = byId[id];
    const i = projects.indexOf(p);
    active = id;
    opener = world.querySelector(`.bp-item[data-id="${id}"]`);

    document.getElementById('bp-panel-no').textContent = pad(i + 1);
    document.getElementById('bp-panel-title').textContent = p.title;
    document.getElementById('bp-panel-meta').textContent = `${p.course} · ${p.when} · Grid ${refOf(p)}`;
    panelBody.innerHTML = writeup(p);
    panelBody.scrollTop = 0;

    panel.inert = false;
    panel.classList.add('is-open');
    bp.classList.add('has-active');
    world.querySelectorAll('.bp-item').forEach((el) => el.classList.toggle('is-active', el.dataset.id === id));
    document.querySelectorAll('.bp-index__item').forEach((el) => el.toggleAttribute('aria-current', el.dataset.id === id));
    document.querySelectorAll('.bp-mini__dot').forEach((el) => el.classList.toggle('is-active', el.dataset.id === id));

    countUp(panelBody);
    const meterEl = panelBody.querySelector('.meter');
    if (meterEl) initMeter(meterEl);

    flyTo(frame(projectRect(p), 48, area(), PROJECT_ZOOM), 1000);
    document.getElementById('bp-panel-title').focus({ preventScroll: true });
  }

  function closeProject() {
    if (!active) return;
    active = null;
    panel.classList.remove('is-open');
    panel.inert = true;
    bp.classList.remove('has-active');
    world.querySelectorAll('.bp-item.is-active').forEach((el) => el.classList.remove('is-active'));
    document.querySelectorAll('.bp-index__item[aria-current]').forEach((el) => el.removeAttribute('aria-current'));
    document.querySelectorAll('.bp-mini__dot.is-active').forEach((el) => el.classList.remove('is-active'));
    opener?.focus({ preventScroll: true });
  }

  const step = (dir) => {
    const i = projects.findIndex((p) => p.id === active);
    openProject(projects[(i + dir + projects.length) % projects.length].id);
  };

  function bindPanel() {
    document.getElementById('bp-close').addEventListener('click', closeProject);
    document.getElementById('bp-prev').addEventListener('click', () => step(-1));
    document.getElementById('bp-next').addEventListener('click', () => step(1));

    // Report buttons open in the shared viewer: PDFs (`url`) in the site's own
    // reader; Drive files can't be fetched from here, so Drive's viewer.
    panelBody.addEventListener('click', (e) => {
      const button = e.target.closest('.doc-btn');
      if (!button) return;
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

    bp = document.getElementById('bp');
    viewport = document.getElementById('bp-viewport');
    world = document.getElementById('bp-world');
    panel = document.getElementById('bp-panel');
    panelBody = document.getElementById('bp-panel-body');
    hint = document.getElementById('bp-hint');
    panel.inert = true;

    world.innerHTML = sheetMarkup();
    world.addEventListener('click', (e) => {
      const item = e.target.closest('.bp-item');
      if (item) {
        openProject(item.dataset.id);
        interacted();
      }
    });

    document.getElementById('bp-zoom-in').addEventListener('click', () => zoomCenter(1.35));
    document.getElementById('bp-zoom-out').addEventListener('click', () => zoomCenter(1 / 1.35));
    document.getElementById('bp-zoom-fit').addEventListener('click', () => {
      closeProject();
      fitAll();
    });

    renderIndex();
    renderMini();
    bindInput();
    bindPanel();

    cam = frame(SHEET_RECT, 24);
    apply();

    // First look: the drawings plot themselves in, a pen at a time.
    if (!reduceMotion) {
      world.classList.add('is-plotting');
      setTimeout(() => world.classList.remove('is-plotting'), 400 + projects.length * 280 + 1800);
    }
    setTimeout(interacted, 9000);
  };
})();
