/* ============================================================
   "More" page data — single file for everything
   ------------------------------------------------------------
   Drop in a new journal entry, swap a "currently" item, edit
   interests, change the Spotify embed — all from here.
   ============================================================ */

/* ------- right now ------- */
export const currently = {
  // Used as a fallback if the Letterboxd RSS fetch fails.
  // The page pulls live activity from
  //   https://letterboxd.com/kondwaniphiri/rss/
  // at runtime and lets visitors page back through it.
  watching: {
    title: "The Bear — S3",
    year: 2024,
    note: "Watching it slowly. Carmy's dad-issues arc this season is brutal.",
    cover: null,
  },
  listening: {
    // Drop a Spotify share link here (playlist, album, or track).
    // From Spotify: Share → Copy link. Anything like
    //   https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
    // works — the embed URL is generated automatically below.
    spotifyUrl: "https://open.spotify.com/playlist/5mHIddJLLx04Fo2ipB0Yp8",
    title: "rotation",
    note: "what's always on.",
  },
};

/* ------- journal ------- */
/* Seed data — used to bootstrap the KV store on first request.
   After the editor is set up, ongoing edits live in the database;
   you don't need to edit this list manually anymore. */
export const SEED_JOURNAL = [
  {
    id: "2026-05-20",
    date: "2026-05-20",
    title: "rebuilt the site, again",
    tags: ["meta", "design"],
    body: `Spent the weekend rewriting the portfolio. I keep telling myself this is the last redesign and then I learn a new CSS trick and immediately want to start over.

The current direction — Frutiger Aero, glass on sky, bubbles — is the first time the visual language has actually matched how I think about my own work. Engineering and film both feel like that to me: clear surfaces over messy systems.

If you're reading this and the site is broken, that's on me. Hit me up.`,
  },
  {
    id: "2026-04-12",
    date: "2026-04-12",
    title: "notes from a long flight",
    tags: ["travel", "writing"],
    body: `Wrote most of a short story between LAX and DCA. Something about an engineer who builds machines that translate grief into sound.

Probably won't finish it. That's fine. The discipline is in the starting.`,
  },
  {
    id: "2026-03-02",
    date: "2026-03-02",
    title: "on being from two places",
    tags: ["identity", "essay"],
    body: `My dad came to the US in '94. I was born here in '04. The math works out to exactly one decade between the two of us arriving — him to a country, me to a life.

Every time I go back to Lusaka I'm reminded that I'm the version of him that got the easy route. That's not guilt exactly. It's more like an obligation to keep moving.`,
  },
];

/* ------- interests ------- */
export const interests = [
  { icon: "📸", label: "photography", note: "35mm, contact-sheet brain" },
  { icon: "🎬", label: "film", note: "screenplays, then storyboards" },
  { icon: "⚽", label: "soccer", note: "spurs til I die" },
  { icon: "🍳", label: "cooking", note: "zambian + sichuan crossover" },
  { icon: "🛠️", label: "CAD", note: "SolidWorks / Fusion" },
  { icon: "🎧", label: "crate-digging", note: "rap, neo-soul, ambient" },
  { icon: "✈️", label: "long flights", note: "best place to think" },
  { icon: "🧠", label: "neuroscience", note: "casual reading habit" },
];
