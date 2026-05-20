/* Server-rendered skeleton shown while the More page fetches Letterboxd
   activity on first cold load. Cached by Next.js after that. */

export default function MoreLoading() {
  return (
    <section className="aero-more aero-more--loading" aria-busy="true" aria-live="polite">
      <header className="aero-more-head">
        <h1 className="aero-more-title">more</h1>
        <p className="aero-more-sub">loading…</p>
      </header>

      <section className="aero-more-now">
        <div className="aero-more-section-head">
          <h2 className="aero-more-section-title">currently</h2>
          <span className="aero-more-section-rule" />
        </div>
        <div className="aero-more-now-row">
          <div className="aero-more-skel aero-more-skel--watch">
            <span className="aero-more-img-shimmer" />
          </div>
          <div className="aero-more-skel aero-more-skel--mp3">
            <span className="aero-more-img-shimmer" />
          </div>
        </div>
      </section>
    </section>
  );
}
