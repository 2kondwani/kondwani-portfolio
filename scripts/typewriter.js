// Types text onto the page as if someone is writing it live, with a cursor that
// rides along. Every character is split into its own span up front, so the
// finished text already holds its place and revealing it never moves the layout.
// The text stays in the DOM the whole time, so screen readers get all of it.
(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Milliseconds per character: slow enough to read the big lead line as it
  // types, quick for the paragraphs so the whole bio lands in a few seconds.
  const PACE = { eyebrow: 45, lead: 17, body: 3.4 };

  // Wrap each character of every text node in a span. Runs of whitespace become
  // one space (the browser collapses them anyway), and inline logos count as one
  // character, so the mark pops in right where its name starts.
  function split(block) {
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const frag = document.createDocumentFragment();
      for (const ch of node.textContent.replace(/\s+/g, ' ')) {
        const span = document.createElement('span');
        span.className = 'tw';
        span.textContent = ch;
        frag.appendChild(span);
      }
      node.replaceWith(frag);
    }
    for (const logo of block.querySelectorAll('.logo--inline')) logo.classList.add('tw');
    return [...block.querySelectorAll('.tw')];
  }

  /**
   * @param {HTMLElement} root  container that holds the blocks (clicks in it skip ahead)
   * @param {{el: HTMLElement, pace: keyof PACE}[]} blocks  typed in this order
   */
  window.Typewriter = function Typewriter(root, blocks) {
    let units = null;
    let paces = [];
    let raf = 0;
    let caretTimer = 0;
    let caretAt = null;

    function prepare() {
      if (units) return;
      units = [];
      for (const { el, pace } of blocks) {
        for (const u of split(el)) {
          units.push(u);
          paces.push(PACE[pace]);
        }
        paces[paces.length - 1] = -PACE[pace]; // marks the end of a block
      }
    }

    // A fresh, slightly uneven rhythm each time: faster and slower keystrokes,
    // a breath after punctuation, and a pause between blocks.
    function schedule() {
      let t = 0;
      return units.map((u, i) => {
        const pace = Math.abs(paces[i]);
        const ch = u.textContent;
        t += pace * (0.55 + Math.random() * 0.9);
        if (/[.!?]/.test(ch)) t += pace * 9 + 70;
        else if (/[,;:)]/.test(ch)) t += pace * 3 + 25;
        const at = t;
        if (paces[i] < 0) t += 240;
        return at;
      });
    }

    function moveCaret(u, { start = false } = {}) {
      if (caretAt) caretAt.classList.remove('is-caret', 'is-start');
      caretAt = u;
      if (u) u.classList.add('is-caret');
      if (u && start) u.classList.add('is-start');
    }

    // Hide everything and park the cursor at the start, ready to type.
    function hide() {
      prepare();
      if (reduceMotion) return;
      root.classList.add('tw-hide');
      for (const u of units) u.classList.remove('is-on');
      moveCaret(units[0], { start: true });
    }

    function finish() {
      cancelAnimationFrame(raf);
      raf = 0;
      for (const u of units) u.classList.add('is-on');
      root.classList.remove('tw-hide', 'is-typing');
      removeEventListener('keydown', finish);
      root.removeEventListener('click', finish);
      // Leave the cursor blinking at the end for a moment, then put it away.
      moveCaret(units[units.length - 1]);
      clearTimeout(caretTimer);
      caretTimer = setTimeout(() => moveCaret(null), 1800);
    }

    function play({ delay = 0 } = {}) {
      stop();
      hide();
      if (reduceMotion) return;
      root.classList.add('is-typing');
      const times = schedule();
      const start = performance.now() + delay;
      let i = 0;

      const step = (now) => {
        const elapsed = now - start;
        while (i < units.length && times[i] <= elapsed) units[i++].classList.add('is-on');
        if (i > 0) moveCaret(units[i - 1]);
        if (i < units.length) raf = requestAnimationFrame(step);
        else finish();
      };
      raf = requestAnimationFrame(step);

      // Anyone in a hurry can click or press a key to finish it.
      addEventListener('keydown', finish);
      root.addEventListener('click', finish);
    }

    function stop() {
      cancelAnimationFrame(raf);
      raf = 0;
      clearTimeout(caretTimer);
      removeEventListener('keydown', finish);
      root.removeEventListener('click', finish);
      root.classList.remove('is-typing');
    }

    return { hide, play, stop };
  };
})();
