/* ============================================================
   Letterboxd RSS fetcher (server-only)
   ------------------------------------------------------------
   Letterboxd has no public API, but every profile exposes an
   RSS feed at /{username}/rss/ that includes:
     - <title>             "Film Title, 2024 - ★★★★½"
     - <link>              direct link to the review
     - <pubDate>
     - <description>       HTML: poster <img> + review paragraphs
     - <letterboxd:filmTitle>
     - <letterboxd:filmYear>
     - <letterboxd:memberRating>   0.5 – 5.0
     - <letterboxd:watchedDate>
     - <letterboxd:rewatch>        Yes | No
     - <tmdb:movieId>

   We fetch with Next.js revalidate so the data refreshes
   automatically on a schedule with no rebuild.
   ============================================================ */

const USERNAME = 'kondwaniphiri';
const FEED_URL = `https://letterboxd.com/${USERNAME}/rss/`;

/** Extract the inner text of an XML tag, stripping any CDATA wrapper. */
function pickTag(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
  const m = xml.match(re);
  if (!m) return null;
  let val = m[1];
  val = val.replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1');
  return val.trim();
}

/** Parse one <item>...</item> chunk into a clean object. */
function parseItem(itemXml) {
  const description = pickTag(itemXml, 'description') || '';
  const filmTitle =
    pickTag(itemXml, 'letterboxd:filmTitle') ||
    (pickTag(itemXml, 'title') || '').replace(/,?\s*\d{4}\s*-\s*[★½]+.*$/, '').trim();
  const filmYearStr = pickTag(itemXml, 'letterboxd:filmYear');
  const ratingStr = pickTag(itemXml, 'letterboxd:memberRating');
  const watchedDate = pickTag(itemXml, 'letterboxd:watchedDate');
  const rewatch = pickTag(itemXml, 'letterboxd:rewatch') === 'Yes';
  const link = pickTag(itemXml, 'link');
  const pubDate = pickTag(itemXml, 'pubDate');

  // Poster image lives in the first <img> in the description HTML.
  const posterMatch = description.match(/<img[^>]*src=["']([^"']+)["']/i);
  const poster = posterMatch ? posterMatch[1] : null;

  // Strip wrapping image + the "Watched on …" preamble Letterboxd adds.
  let review = description
    .replace(/<p>\s*<img[^>]*\/?>\s*<\/p>/gi, '')
    .replace(/<p>\s*Watched on[^<]*<\/p>/gi, '')
    .trim();

  // Convert paragraph breaks to double newlines, then strip all tags.
  review = review
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<\/?p[^>]*>/gi, '')
    .replace(/<br\s*\/?>(\s*<br\s*\/?>)?/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return {
    title: filmTitle,
    year: filmYearStr ? parseInt(filmYearStr, 10) : null,
    rating: ratingStr ? parseFloat(ratingStr) : null,
    review: review || null,
    watchedDate,
    rewatch,
    link,
    pubDate,
    poster,
  };
}

function parseRss(xml) {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
  return items.map(parseItem);
}

/**
 * Fetch recent Letterboxd activity — both reviewed and unreviewed logs.
 * Returns up to `limit` items in feed order (newest first) so the UI
 * can let the visitor page back through history with prev/next arrows.
 * Returns [] on failure so the page never breaks.
 */
export async function getRecentLetterboxd(limit = 12) {
  try {
    const res = await fetch(FEED_URL, {
      next: { revalidate: 3600 }, // refresh hourly
      headers: {
        'User-Agent': 'KondwaniPhiriPortfolio/1.0 (+https://kondwaniphiri.com)',
      },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = parseRss(xml);
    // Keep only entries that have at least a title — sometimes lists or
    // following-activity entries slip into a profile feed.
    return items.filter((i) => i.title).slice(0, limit);
  } catch (err) {
    // Silent — we don't want a Letterboxd outage to break the page.
    console.warn('Letterboxd RSS fetch failed:', err?.message || err);
    return [];
  }
}
