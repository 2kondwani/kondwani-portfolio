/* ══ Card swap ════════════════════════════════════════════
   From Bencho's CardSwap (MIT, bencho.dev/licence), ported from React to
   plain JS for this site, which has no React. Behavior is the same.

   A stack of photo cards in depth, each a step further back and up
   to the right, slanted. Every few seconds the front card goes
   straight to the back and the rest step forward. Pointing at the
   stack pauses it; press the front card, or drag and fling it, to
   send it back yourself.

   ── A CARD IS ITS SLOT ──────────────────────────────────
   The order is the only state: which card is in front, which is
   behind it. A slot is a fixed transform, so moving a card is
   changing its slot and letting the transition carry it — the card
   sent back takes the back slot's paint order AT ONCE and travels
   there behind the others. That needs the paint order to be the
   z-index and not the depth, so the stage is flat (no preserve-3d)
   and the perspective sits on the stage itself, aimed at the
   block's middle as it was when it sat on .csw.

   ── CHANGES FOR THIS SITE ───────────────────────────────
   Cards are film posters, so they're 2:3 and larger than the original's.
   With a dozen of them, only the front DEPTH + 1 are shown; the rest
   wait, invisible, in the deepest slot and fade in as they come up.
   Everything scales down together when the column is narrower than W.
   `prev()` brings the back card to the front, for arrow buttons/keys. */

(() => {
  const W = 400;
  const H = 490;
  const CW = 240;
  const CH = 360;
  const STEP_X = 30;
  const STEP_Y = 24;
  const STEP_Z = 64;
  const DEPTH = 3;
  const LEFT = 30;    // the stage's offset inside .csw
  const BOTTOM = 24;

  /**
   * @param {HTMLElement} root  element to build the stack in
   * @param {{src: string, alt?: string, tag?: string}[]} cards
   * @param {{every?: number, holdOn?: HTMLElement, onChange?: (index: number, byHand: boolean) => void}} options
   *   every: seconds between swaps (0 turns the timer off);
   *   holdOn: where pointing or focusing pauses it (defaults to the stack);
   *   onChange: called with the new front card's index.
   */
  function CardSwap(root, cards, { every = 4, holdOn, onChange = () => {} } = {}) {
    let order = cards.map((_, i) => i);
    let scale = 1;
    const st = { hover: false, focus: false, drag: null };

    const csw = document.createElement('div');
    csw.className = 'csw';
    const stage = document.createElement('div');
    stage.className = 'csw-stage';
    csw.appendChild(stage);

    const els = cards.map((c) => {
      const el = document.createElement('div');
      el.className = 'csw-card';
      const img = document.createElement('img');
      img.className = 'csw-photo';
      img.src = c.src;
      img.alt = c.alt || '';
      img.draggable = false;
      el.appendChild(img);
      if (c.tag) {
        const tag = document.createElement('div');
        tag.className = 'csw-tag';
        tag.textContent = c.tag;
        el.appendChild(tag);
      }
      stage.appendChild(el);
      return el;
    });
    root.appendChild(csw);

    const slot = (k) => {
      const d = Math.min(k, DEPTH) * scale;
      return `translate3d(${d * STEP_X}px, ${-d * STEP_Y}px, ${-d * STEP_Z}px) skewY(6deg)`;
    };

    function size() {
      scale = Math.min(1, (root.clientWidth || W) / W);
      csw.style.width = `${W * scale}px`;
      csw.style.height = `${H * scale}px`;
      Object.assign(stage.style, {
        width: `${CW * scale}px`,
        height: `${CH * scale}px`,
        left: `${LEFT * scale}px`,
        bottom: `${BOTTOM * scale}px`,
        // the block's middle, in the stage's own coordinates
        perspectiveOrigin: `${(W / 2 - LEFT) * scale}px ${(CH + BOTTOM - H / 2) * scale}px`,
      });
      paint();
    }

    /* the slot is a variable the stylesheet turns into the
       transform; the drag writes the transform itself, which
       wins until it is cleared */
    function paint() {
      els.forEach((el, i) => {
        const k = order.indexOf(i);
        el.style.zIndex = String(cards.length - k);
        el.style.setProperty('--t', slot(k));
        el.toggleAttribute('data-front', k === 0);
        el.toggleAttribute('data-hidden', k > DEPTH);
      });
    }

    /* send the front card to the back: it takes the back slot now, from
       wherever it is — the front slot, or where a drag left it */
    function swap(byHand = false) {
      const el = els[order[0]];
      el.style.transition = '';
      el.style.transform = '';
      order = [...order.slice(1), order[0]];
      paint();
      restart();
      onChange(order[0], byHand);
    }

    function prev() {
      order = [order[order.length - 1], ...order.slice(0, -1)];
      paint();
      restart();
      onChange(order[0], true);
    }

    /* the timer: one swap every few seconds, unless a hand is on it.
       Restarted after every change, so a manual swap gets a full wait */
    let timer = 0;
    function restart() {
      clearInterval(timer);
      if (!every) return;
      timer = setInterval(() => {
        const shown = csw.offsetParent !== null;
        if (shown && !st.hover && !st.focus && !st.drag && !document.hidden) swap();
      }, Math.max(1.5, every) * 1000);
    }

    const hold = holdOn || csw;
    hold.addEventListener('pointerenter', () => (st.hover = true));
    hold.addEventListener('pointerleave', () => (st.hover = false));
    hold.addEventListener('focusin', () => (st.focus = true));
    hold.addEventListener('focusout', () => (st.focus = false));

    stage.addEventListener('pointerdown', (e) => {
      const el = e.target.closest('.csw-card');
      if (!el || !el.hasAttribute('data-front') || e.button !== 0) return;
      try { el.setPointerCapture(e.pointerId); } catch { /* a scripted pointer */ }
      st.drag = { el, x: e.clientX, y: e.clientY, dx: 0, dy: 0, t: performance.now() };
      el.style.transition = 'none';
    });

    stage.addEventListener('pointermove', (e) => {
      const d = st.drag;
      if (!d) return;
      d.dx = e.clientX - d.x;
      d.dy = e.clientY - d.y;
      d.el.style.transform =
        `${slot(0)} translate(${d.dx}px, ${d.dy}px) rotate(${(d.dx * 0.05).toFixed(2)}deg)`;
    });

    stage.addEventListener('pointerup', (e) => {
      const d = st.drag;
      st.drag = null;
      if (!d) return;
      try { d.el.releasePointerCapture(e.pointerId); } catch { /* never captured */ }
      const far = Math.hypot(d.dx, d.dy);
      const quick = far / Math.max(1, performance.now() - d.t) > 0.6;
      /* a press, or a drag far or quick enough: to the back */
      if (far < 6 || far > 70 || (quick && far > 24)) { swap(true); return; }
      /* not far enough: it springs back into the front slot */
      d.el.style.transition = '';
      d.el.style.transform = '';
    });

    stage.addEventListener('pointercancel', () => {
      const d = st.drag;
      st.drag = null;
      if (!d) return;
      d.el.style.transition = '';
      d.el.style.transform = '';
    });

    new ResizeObserver(size).observe(root);
    size();
    restart();

    return {
      next: () => swap(true),
      prev,
      get front() { return order[0]; },
    };
  }

  window.CardSwap = CardSwap;
})();
