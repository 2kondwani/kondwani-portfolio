/* ============================================================
   Projects data
   ------------------------------------------------------------
   Two sources are merged at request time:

   1) `localProjects` below — your three original projects with
      PDFs that live in /public. Edit titles/summaries directly.

   2) Files inside the public Google Drive folder defined in
      src/lib/drive.js. Each *subfolder* in that Drive folder is
      one project; all files inside that subfolder become its
      media (PDFs, images, videos — the slider handles each).

      For each Drive subfolder you want to surface, add a key
      to `driveMeta` below using the *Drive folder ID* (the long
      string in the folder's URL). That tells the site what
      title, category, date, and summary to show.

      Subfolders without a matching entry in `driveMeta` are
      still surfaced — they fall back to the folder name as the
      title with no summary, sorted to the bottom. So you can
      drop folders in Drive and they'll appear immediately; the
      blurb just shows once you fill it in here.
   ============================================================ */

export const CATEGORIES = [
  { id: 'film', label: 'Film & Screenwriting' },
  { id: 'science', label: 'Science & Technology' },
];

/* ---------- Existing local projects ---------- */
export const localProjects = [
  {
    id: 'nike-short-2025',
    category: 'film',
    title: 'Nike — Short Film Ad',
    subtitle: 'Co-directed with a friend',
    date: '2025-11',
    icon: '👟',
    summary:
      'A short-form ad piece for Nike I co-directed with a friend. Conceived, shot, and cut in a fast turnaround.',
    media: [
      { type: 'instagram', postId: 'DVRxD_ZEuOP', label: 'Watch on Instagram' },
    ],
  },
  {
    id: 'musical-film-2025',
    category: 'film',
    title: 'Musical Film',
    subtitle: 'Director',
    date: '2025-04',
    icon: '🎵',
    summary:
      'A musical short I directed. Full piece on YouTube.',
    media: [
      { type: 'youtube', embedId: 'sgLW7Bx0IWQ', label: 'Watch on YouTube' },
    ],
  },
  {
    id: 'shells-2023',
    category: 'film',
    title: 'SHELLS',
    subtitle: 'USC Screenplay Pitch',
    date: '2023-09',
    icon: '📜',
    summary:
      "Shells is a short film screenplay I wrote during my sophomore year of college. It follows Amara, a sharp but emotionally guarded teenager navigating grief, pressure, and identity in the wake of her sister's death. Set between school offices, flashbacks, and a haunting memory from a gang-related night out, the story unfolds as a raw conversation about loss, family dynamics, and defining yourself when everyone else has already tried to. Shells blends dark humor, dialogue, and tense realism into a quiet portrait of survival.",
    media: [
      { type: 'pdf', src: '/screenplays/SHELLS FINAL DRAFT.pdf', label: 'Final draft' },
    ],
  },
  {
    id: 'georgetown-physics-2024',
    category: 'science',
    title: 'Summer Physics Intern',
    subtitle: 'Georgetown University · Del Gado Group',
    date: '2024-06',
    icon: '🔬',
    summary:
      'At the Del Gado Group in the Department of Physics, I conducted independent research on amorphous materials and shear banding phenomena. The project centered on interpreting landmark data from foundational studies and comparing it with contemporary simulations. I analyzed discrepancies between expected and actual material behavior under varied shear rates using MATLAB and QtGrace for plotting. My findings contradicted previous results, suggesting factors such as experimental setup, temperature variance, or human error. The project explored engineering applications in product design, petrochemical processes, and civil infrastructure, and emphasized future potential in sustainability and environmental resilience.',
    media: [
      { type: 'pdf', src: '/Presented by Kondwani Phiri.pdf', label: 'Final presentation' },
    ],
  },
  {
    id: 'drone-2024',
    category: 'science',
    title: 'Autonomous Toy Drone Design',
    subtitle: 'AME 308 · USC',
    date: '2024-11',
    icon: '✈️',
    summary:
      'Junior-year project for a computer-aided design course at USC. Collaborated on the full design of a toy drone, including CAD modeling, material selection, FEA stress testing, and motion analysis. Led part design and final model verification.',
    media: [
      { type: 'pdf', src: '/projects/AME 308 Final Project.pdf', label: 'Final project' },
    ],
  },
];

/* ---------- Metadata for Drive subfolders ----------
   Paste a Drive folder ID as the key, then fill in the rest.
   To find a folder ID: open the subfolder in Drive, copy the
   long string at the end of the URL after /folders/.
   Example:
     'abc123XYZ...': {
       title: 'My Project',
       subtitle: 'optional',
       category: 'film' | 'science',
       date: 'YYYY-MM',     // used for chronological sort
       icon: '🎬',
       summary: 'one or two paragraphs.',
     },
   --------------------------------------------------- */
export const driveMeta = {
  // Add entries here as you create subfolders in your Drive root.
  // Example (commented):
  //
  // '1AbCdEfGhIjKlMnOpQrStUvWxYz': {
  //   title: 'Untitled Drone Project',
  //   subtitle: 'AME 410 · USC',
  //   category: 'science',
  //   date: '2025-04',
  //   icon: '🛩️',
  //   summary: 'Short description here.',
  // },
};
