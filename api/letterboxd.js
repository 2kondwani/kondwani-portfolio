// Recent Letterboxd diary entries as JSON, for the Extra tab's "Now watching"
// stack (scripts/site.js). Letterboxd has no public API, so this reads the
// profile's RSS feed. Vercel's edge keeps each answer for an hour and serves the
// last good one for a day while it refreshes, so the feed is read about hourly.
const FEED = 'https://letterboxd.com/kondwaniphiri/rss/';
const LIMIT = 12;

const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decode = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] !== '#') return NAMED[e.toLowerCase()] ?? m;
    return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
  });

function tag(xml, name) {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? m[1].replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1').trim() : null;
}

// The description is HTML: the poster in the first paragraph, then the review
// (or "Watched on …" when there isn't one).
function review(html) {
  const text = html
    .replace(/<p>\s*<img[^>]*>\s*<\/p>/gi, '')
    .replace(/<p>\s*Watched on[^<]*<\/p>/gi, '')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  return decode(text).replace(/\n{3,}/g, '\n\n').trim() || null;
}

// One feed item in the shape of window.EXTRA.letterboxd; lists and other
// activity have no film title and are skipped.
function entry(item) {
  const title = tag(item, 'letterboxd:filmTitle');
  if (!title) return null;
  const html = tag(item, 'description') || '';
  const year = tag(item, 'letterboxd:filmYear');
  const rating = tag(item, 'letterboxd:memberRating');
  const poster = html.match(/<img[^>]*src="([^"]+)"/i);
  return {
    title: decode(title),
    year: year ? Number(year) : null,
    rating: rating ? Number(rating) : null,
    watched: tag(item, 'letterboxd:watchedDate'),
    review: review(html),
    link: decode(tag(item, 'link') || ''),
    poster: poster ? decode(poster[1]) : null,
  };
}

module.exports = async function handler(req, res) {
  try {
    const feed = await fetch(FEED, {
      headers: { 'User-Agent': 'KondwaniPhiriPortfolio/1.0 (+https://kondwaniphiri.com)' },
    });
    if (!feed.ok) throw new Error(`Letterboxd answered ${feed.status}`);
    const xml = await feed.text();
    const films = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
      .map((m) => entry(m[1]))
      .filter(Boolean)
      .slice(0, LIMIT);
    if (!films.length) throw new Error('No films in the feed');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({ films });
  } catch (err) {
    // The page falls back to its snapshot; try the feed again in a minute.
    res.setHeader('Cache-Control', 'public, s-maxage=60');
    res.status(502).json({ error: String(err?.message || err) });
  }
};
