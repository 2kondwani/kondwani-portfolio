# kondwaniphiri.com

Kondwani Phiri's portfolio: a static site with no build step. Plain HTML, CSS and
JavaScript, deployed on Vercel from `main`.

- `index.html`: every tab (About, Engineering, Film, Gallery, Extra) on one page,
  switched by the URL hash. `#wii` opens the Kondwani Shop Channel.
- `scripts/*-data.js`: the content (projects, films, photos, Letterboxd, interests).
  Edit these to update the site.
- `images/`, `reports/`, `screenplays/`, `projects/`: logos, photos and PDFs.

Run it locally from this folder with any static server:

    python3 -m http.server 5173

`vercel.json` turns off the old Next.js build and redirects the old
`/academic`, `/projects`, `/gallery` and `/more` pages to their new tabs.
