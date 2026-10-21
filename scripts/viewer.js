// The document viewer shared by Engineering (reports) and Film (screenplays).
// PDFs are drawn by PDF.js onto paper sheets inside the site's own frame, so the
// browser's PDF toolbar never shows. Anything PDF.js can't fetch (Drive files,
// videos) is embedded in the same frame instead.
//
//   openViewer({ title, pdf })        a PDF the site is allowed to fetch
//   openViewer({ title, src, href })  an embeddable page, e.g. Drive's viewer
(() => {
  // Loaded when someone first heads for a document, not with the page.
  const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  const WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const ZOOMS = [0.5, 0.67, 0.8, 1, 1.25, 1.5, 2]; // multiples of "fit to width"
  const FIT = 3;
  const MAX_FIT = 860; // widest a page gets at Fit, so text stays a readable size

  const $ = (id) => document.getElementById(id);
  const dialog = $('viewer');
  const body = $('viewer-body');
  const titleEl = $('viewer-title');
  const meta = $('viewer-meta');
  const progress = $('viewer-progress');
  const zoomLabel = $('viewer-zoom');
  const openLink = $('viewer-open');

  let lib = null;
  function pdfjs() {
    lib ||= new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = PDFJS;
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER;
        resolve(window.pdfjsLib);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return lib;
  }

  // Start fetching the library as soon as a pointer or keyboard focus reaches a
  // document button, so it's usually ready by the time they click.
  const warm = (e) => {
    if (!e.target.closest?.('.doc-btn, .script__page')) return;
    pdfjs().catch(() => {});
    removeEventListener('pointerover', warm);
    removeEventListener('focusin', warm);
  };
  addEventListener('pointerover', warm, { passive: true });
  addEventListener('focusin', warm);

  let session = 0; // bumps on every open/close so stale loads quietly stop
  let doc = null;
  let pdfUrl = '';
  let pages = [];
  let zoom = FIT;
  let observer = null;

  // ---------- Opening ----------

  window.openViewer = ({ title, pdf, src, href }) => {
    reset();
    const token = ++session;
    titleEl.textContent = title;
    openLink.href = href || pdf || src;
    dialog.showModal();
    body.focus({ preventScroll: true });
    if (pdf) showPdf(pdf, token);
    else showFrame(src);
  };

  function showFrame(src) {
    dialog.classList.add('is-frame', 'is-loaded');
    meta.textContent = '';
    const frame = document.createElement('iframe');
    frame.className = 'viewer__frame';
    frame.src = src;
    frame.title = titleEl.textContent;
    frame.allow = 'autoplay; fullscreen';
    body.appendChild(frame);
  }

  async function showPdf(url, token) {
    pdfUrl = url;
    meta.textContent = 'Loading…';
    let loaded;
    try {
      const pdfLib = await pdfjs();
      const task = pdfLib.getDocument({ url });
      // Hosts that serve byte ranges open the document before the whole file has
      // arrived, and the download keeps reporting after that; by then the label
      // shows the page. Compressed responses can also count past 100%.
      task.onProgress = ({ loaded: done, total }) => {
        if (token !== session || !total || loaded) return;
        const k = Math.min(1, done / total);
        progress.style.setProperty('--p', String(k));
        meta.textContent = `Loading ${Math.round(k * 100)}%`;
      };
      loaded = await task.promise;
    } catch {
      // Couldn't fetch or read it here; let the browser show it after all.
      if (token === session) showFrame(url);
      return;
    }
    if (token !== session) return loaded.destroy();
    doc = loaded;

    // Page sizes first, so every sheet holds its place before it's drawn.
    const sizes = await Promise.all(
      Array.from({ length: doc.numPages }, (_, i) =>
        doc.getPage(i + 1).then((page) => {
          const v = page.getViewport({ scale: 1 });
          return { page, w: v.width, h: v.height };
        })
      )
    );
    if (token !== session) return;

    pages = sizes.map((s, i) => {
      const el = document.createElement('div');
      el.className = 'viewer__page';
      el.style.aspectRatio = `${s.w} / ${s.h}`;
      el.innerHTML = `<span class="viewer__num">${i + 1}</span>`;
      body.appendChild(el);
      return { ...s, el, drawnAt: 0, task: null };
    });

    dialog.classList.add('is-loaded');
    layout();
    const bySheet = new Map(pages.map((p) => [p.el, p]));
    observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && draw(bySheet.get(e.target))),
      { root: body, rootMargin: '1200px 0px' }
    );
    pages.forEach((p) => observer.observe(p.el));
    updatePage();
  }

  // ---------- Drawing ----------

  // Sharp at any zoom: each sheet is drawn at its on-screen width × pixel density,
  // and redrawn only when that width changes.
  async function draw(p) {
    if (!p) return;
    const width = p.el.clientWidth;
    if (!width || p.drawnAt === width) return;
    p.drawnAt = width;
    p.task?.cancel();

    const dpr = Math.min(devicePixelRatio || 1, 2);
    const viewport = p.page.getViewport({ scale: (width * dpr) / p.w });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    p.task = p.page.render({ canvasContext: canvas.getContext('2d'), viewport });
    try {
      await p.task.promise;
    } catch {
      if (p.drawnAt === width) p.drawnAt = 0; // cancelled by a newer draw
      return;
    }
    p.el.querySelector('canvas')?.remove();
    p.el.prepend(canvas);
    p.el.classList.add('is-drawn');
  }

  const near = (p) => {
    const top = p.el.offsetTop - body.scrollTop;
    return top < body.clientHeight + 1200 && top + p.el.offsetHeight > -1200;
  };

  // ---------- Zoom ----------

  const fitWidth = () => Math.min(body.clientWidth - 48, MAX_FIT);

  let redraw = 0;
  function layout() {
    const width = Math.round(fitWidth() * ZOOMS[zoom]);
    for (const p of pages) p.el.style.width = `${width}px`;
    zoomLabel.textContent = zoom === FIT ? 'Fit' : `${Math.round(ZOOMS[zoom] * 100)}%`;
    // Sheets resize at once (the old drawing stretches); crisp redraws follow.
    clearTimeout(redraw);
    redraw = setTimeout(() => pages.filter(near).forEach(draw), 160);
  }

  function setZoom(next) {
    next = Math.max(0, Math.min(ZOOMS.length - 1, next));
    if (next === zoom || !pages.length) return;
    // Keep the same spot of the document in view through the zoom.
    const ratio = (body.scrollTop + body.clientHeight / 2) / body.scrollHeight;
    zoom = next;
    layout();
    body.scrollTop = ratio * body.scrollHeight - body.clientHeight / 2;
  }

  $('viewer-tools').addEventListener('click', (e) => {
    const button = e.target.closest('[data-zoom]');
    if (!button) return;
    const step = Number(button.dataset.zoom);
    setZoom(step === 0 ? FIT : zoom + step);
  });

  // Pinch on a trackpad (or ctrl + scroll) zooms the document, not the page.
  let pinch = 0;
  body.addEventListener(
    'wheel',
    (e) => {
      if (!e.ctrlKey || !pages.length) return;
      e.preventDefault();
      pinch += e.deltaY;
      if (Math.abs(pinch) > 40) {
        setZoom(zoom + (pinch < 0 ? 1 : -1));
        pinch = 0;
      }
    },
    { passive: false }
  );

  new ResizeObserver(() => pages.length && layout()).observe(body);

  // ---------- Page tracking and keys ----------

  let current = 1;
  function updatePage() {
    if (!pages.length) return;
    const mark = body.scrollTop + body.clientHeight * 0.4;
    current = pages.reduce((n, p, i) => (p.el.offsetTop <= mark ? i + 1 : n), 1);
    meta.textContent = `Page ${current} of ${pages.length}`;
  }

  let scrollRaf = 0;
  body.addEventListener('scroll', () => (scrollRaf ||= requestAnimationFrame(() => ((scrollRaf = 0), updatePage()))), {
    passive: true,
  });

  function goTo(n) {
    const p = pages[Math.max(1, Math.min(pages.length, n)) - 1];
    if (p) body.scrollTo({ top: p.el.offsetTop - 24, behavior: 'smooth' });
  }

  dialog.addEventListener('keydown', (e) => {
    if (!pages.length) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') goTo(current + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') goTo(current - 1);
    else if (e.key === '+' || e.key === '=') setZoom(zoom + 1);
    else if (e.key === '-') setZoom(zoom - 1);
    else if (e.key === '0') setZoom(FIT);
    else return;
    e.preventDefault();
  });

  // ---------- Download ----------

  // The file lives on another site, where a plain download link would just open
  // it; hand over the bytes PDF.js already fetched instead.
  $('viewer-download').addEventListener('click', async () => {
    if (!doc) return;
    const data = await doc.getData();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
    link.download = decodeURIComponent(pdfUrl.split('/').pop() || 'document.pdf');
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 4000);
  });

  // ---------- Closing ----------

  function reset() {
    session++;
    observer?.disconnect();
    observer = null;
    pages.forEach((p) => p.task?.cancel());
    pages = [];
    doc?.destroy();
    doc = null;
    zoom = FIT;
    zoomLabel.textContent = 'Fit';
    body.textContent = '';
    body.scrollTop = 0;
    progress.style.setProperty('--p', '0');
    dialog.classList.remove('is-frame', 'is-loaded');
  }

  $('viewer-close').addEventListener('click', () => dialog.close());
  // A click on the dimmed backdrop lands on the dialog itself.
  dialog.addEventListener('click', (e) => e.target === dialog && dialog.close());
  dialog.addEventListener('close', reset);
})();
