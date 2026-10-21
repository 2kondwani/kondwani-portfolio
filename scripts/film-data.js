// Films for the Film tab's reel, one per slide, and screenplays below it.
// Credits come from the films' own posts and kondwaniphiri.com/projects.
//
// HOSTING A FILM ON THIS SITE: put the video in /videos (and a still for the
// poster), then set `src: 'videos/name.mp4'` and `poster: 'videos/name.jpg'`.
// The reel switches to its own player and reads the real shape from the file.
// Until then a slide plays the existing upload named in `fallback`.

window.FILMS = [
  {
    id: 'one-hundred',
    title: '100%',
    client: 'Nike',
    byline: 'A film by Abba Wada and Kondwani Phiri',
    role: 'Co-director & editor',
    when: 'Feb 2026',
    aspect: '9 / 16', // an Instagram reel
    src: null,
    poster: null,
    fallback: { type: 'instagram', id: 'DVRxD_ZEuOP', url: 'https://www.instagram.com/p/DVRxD_ZEuOP/', label: 'View on Instagram' },
    summary: 'A short-form ad piece for Nike I co-directed with a friend. Conceived, shot, and cut in a fast turnaround.',
    credits: [
      ['Directed by', 'Kondwani Phiri & Abba Wada'],
      ['Edited by', 'Kondwani Phiri'],
      ['Written by', 'Abba Wada'],
      ['Starring', 'Cate Hewitt & Abba Wada'],
      ['Color', 'filmboythefirst'],
      ['Music', 'Red Hot Chili Peppers'],
    ],
  },
  {
    id: 'last-lament',
    title: 'Last Lament',
    client: 'Short film',
    byline: 'Directed by Kondwani Phiri',
    role: 'Director',
    when: 'Apr 2025',
    aspect: '16 / 9',
    src: null,
    poster: 'https://i.ytimg.com/vi/sgLW7Bx0IWQ/maxresdefault.jpg',
    fallback: { type: 'youtube', id: 'sgLW7Bx0IWQ', url: 'https://www.youtube.com/watch?v=sgLW7Bx0IWQ', label: 'Watch on YouTube' },
    summary: 'A musical short I directed.',
    credits: [['Directed by', 'Kondwani Phiri']],
  },
];

window.SCREENPLAYS = [
  {
    id: 'shells',
    title: 'SHELLS',
    kind: 'Short film screenplay',
    context: 'USC Screenplay Pitch',
    when: 'Sep 2023',
    summary:
      "Shells is a short film screenplay I wrote during my sophomore year of college. It follows Amara, a sharp but emotionally guarded teenager navigating grief, pressure, and identity in the wake of her sister's death. Set between school offices, flashbacks, and a haunting memory from a gang-related night out, the story unfolds as a raw conversation about loss, family dynamics, and defining yourself when everyone else has already tried to. Shells blends dark humor, dialogue, and tense realism into a quiet portrait of survival.",
    pdf: 'screenplays/SHELLS%20FINAL%20DRAFT.pdf',
  },
];
