# kondwaniphiri.com

Kondwani Phiri's portfolio: a static site with no build step. Plain HTML, CSS and
JavaScript, deployed on Vercel from `main`.

- `index.html`: every tab (About, Engineering, Film, Gallery, Extra) on one page,
  switched by the URL hash. `#wii` opens the Kondwani Shop Channel.
- `scripts/*-data.js`: the content (projects, films, photos, Letterboxd, interests).
  Edit these to update the site.
- `images/`, `reports/`, `screenplays/`, `projects/`: logos, photos and PDFs.
- `Kondwani-Phiri-Resume.pdf`: the résumé behind the button on About. To update
  it, replace the file and keep the name. The old Fall '24 address redirects here.
- `api/letterboxd.js`: a Vercel function that reads the Letterboxd RSS feed for
  Extra's "Now watching" list, cached for an hour. `scripts/extra-data.js` keeps a
  snapshot for when it can't be reached (and for local servers, which have no API).
- `images/og.jpg`: the 1200 × 630 picture that shows when the link is shared.

Run it locally from this folder with any static server:

    python3 -m http.server 5173

`vercel.json` turns off the old Next.js build and redirects the old
`/academic`, `/projects`, `/gallery` and `/more` pages to their new tabs.
