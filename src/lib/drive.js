/* ============================================================
   Google Drive — public folder listing (no API key needed)
   ------------------------------------------------------------
   Uses the long-standing embeddedfolderview endpoint:
       https://drive.google.com/embeddedfolderview?id={folderId}#list

   The HTML format isn't documented and has shifted between
   variants, so we parse leniently: find every folder/file ID
   in the page, then look for the nearest readable name (title
   attr, alt attr, or plain text inside the anchor).

   The folder must be shared as "Anyone with the link · Viewer".
   ============================================================ */

const FOLDER_ID = '1V4REsj1XxPxEHAv-zGUEdlFfyomIhNeI';
const DEBUG = process.env.NODE_ENV !== 'production';

function decode(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

/** Find the readable name for an anchor that contains the given ID + pathFragment. */
function findName(html, id, pathFragment) {
  // Strategy 1: capture inside <a>...</a> (Drive's older markup)
  const reAnchor = new RegExp(
    `<a[^>]*href=["'][^"']*${pathFragment}/${id}[^"']*["'][^>]*>([\\s\\S]{0,4000}?)</a>`,
    'i'
  );
  // Strategy 2: capture 600 chars *around* the URL (newer flat markup)
  const reSurround = new RegExp(
    `[\\s\\S]{0,600}${pathFragment}/${id}[\\s\\S]{0,600}`,
    'i'
  );

  const candidates = [];
  const a = html.match(reAnchor);
  if (a) candidates.push(a[1]);
  const s = html.match(reSurround);
  if (s) candidates.push(s[0]);

  for (const chunk of candidates) {
    // 1) any title/alt/aria-label attribute
    const attr = chunk.match(/(?:title|aria-label|alt)=["']([^"']{1,300})["']/i);
    if (attr && attr[1].trim()) return decode(attr[1].trim());
    // 2) data-tooltip / data-name attributes Drive sometimes uses
    const data = chunk.match(/data-(?:tooltip|name|title)=["']([^"']{1,300})["']/i);
    if (data && data[1].trim()) return decode(data[1].trim());
    // 3) anything that looks like a filename: word + .ext
    const file = chunk.match(/>\s*([\w .,'()&\-]{1,200}\.[A-Za-z0-9]{2,5})\s*</);
    if (file) return decode(file[1].trim());
  }

  // Strategy 3: scan whole HTML for any "X.ext" string close to the ID
  const window = html.match(new RegExp(`${id}[\\s\\S]{0,800}?([\\w .,'()&\\-]{2,200}\\.(?:jpe?g|png|gif|webp|heic|heif|mp4|mov|m4v|webm|pdf))`, 'i'));
  if (window) return decode(window[1].trim());

  return null;
}

async function fetchFolder(folderId) {
  const url = `https://drive.google.com/embeddedfolderview?id=${folderId}#list`;
  let html = '';
  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    if (!res.ok) {
      if (DEBUG) console.warn(`[drive] ${folderId} HTTP ${res.status}`);
      return { folders: [], files: [], debug: { status: res.status, length: 0 } };
    }
    html = await res.text();
  } catch (err) {
    if (DEBUG) console.warn(`[drive] ${folderId} fetch failed:`, err.message);
    return { folders: [], files: [], debug: { status: 'error', length: 0 } };
  }

  // Find every unique folder ID + file ID. Don't require /view at the end —
  // Drive's current markup sometimes uses /file/d/{id} without the suffix.
  const folderIds = new Set();
  const fileIds = new Set();
  const folderRe = /\/drive\/folders\/([a-zA-Z0-9_-]{15,})/g;
  const fileRe = /\/file\/d\/([a-zA-Z0-9_-]{15,})/g;

  let m;
  while ((m = folderRe.exec(html)) !== null) {
    if (m[1] !== folderId) folderIds.add(m[1]);
  }
  while ((m = fileRe.exec(html)) !== null) {
    fileIds.add(m[1]);
  }

  // Resolve each ID to a name (best-effort; falls back to a short ID)
  const folders = [...folderIds].map((id) => ({
    id,
    name: findName(html, id, 'folders') || id.slice(0, 8),
  }));
  const files = [...fileIds].map((id) => ({
    id,
    name: findName(html, id, 'd') || id.slice(0, 8),
  }));

  if (DEBUG) {
    const sampleNames = files.slice(0, 4).map((f) => f.name).join(', ');
    console.log(
      `[drive] ${folderId} → ${folders.length} folders, ${files.length} files ` +
        `(html ${html.length}b)${files.length ? ` · samples: ${sampleNames}` : ''}`
    );
  }
  return { folders, files, debug: { status: 200, length: html.length } };
}

function classify(name) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (['mp4', 'mov', 'm4v', 'webm'].includes(ext)) return 'video';
  if (
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'tif', 'tiff', 'bmp', 'avif']
      .includes(ext)
  ) return 'image';
  return 'pdf';
}

function toMedia(file) {
  const type = classify(file.name);
  if (type === 'image') {
    return {
      type: 'image',
      src: `https://drive.google.com/thumbnail?id=${file.id}&sz=w1600`,
      alt: file.name,
      label: file.name,
    };
  }
  return {
    type: 'pdf',
    src: `https://drive.google.com/file/d/${file.id}/preview`,
    label: file.name,
  };
}

/**
 * Recursively collect every image inside a public Drive folder
 * (walks into subfolders too, max ~3 levels deep to avoid runaway).
 * Returns objects with a thumbnail + full-size URL.
 * Returns [] silently on failure.
 *
 *   [{ id, name, thumb, full }]
 */
export async function getDriveImages(folderId, depth = 0, seen = new Set()) {
  if (depth > 3 || seen.has(folderId)) return [];
  seen.add(folderId);
  try {
    const folder = await fetchFolder(folderId);

    // Try strict classification first; if nothing matches, fall back to
    // treating everything in the folder as an image (gallery folders are
    // image-only by convention, and Drive's thumbnail endpoint silently
    // converts most formats — TIFF/HEIC/PNG/JPEG/etc. — to web JPEGs).
    let imageFiles = folder.files.filter((f) => classify(f.name) === 'image');
    if (imageFiles.length === 0 && folder.files.length > 0) {
      imageFiles = folder.files;
    }
    const direct = imageFiles.map((f) => ({
      id: f.id,
      name: f.name,
      thumb: `https://drive.google.com/thumbnail?id=${f.id}&sz=w800`,
      full: `https://drive.google.com/thumbnail?id=${f.id}&sz=w2400`,
    }));

    // Recurse into subfolders
    const nested = await Promise.all(
      folder.folders.map((sub) => getDriveImages(sub.id, depth + 1, seen))
    );

    const all = [...direct, ...nested.flat()];
    if (DEBUG && depth === 0) {
      console.log(
        `[drive] getDriveImages(${folderId}) → ${all.length} images ` +
          `(${direct.length} at root, ${folder.folders.length} subfolders)`
      );
    }
    return all;
  } catch (err) {
    console.warn('[drive] getDriveImages failed:', err?.message || err);
    return [];
  }
}

/**
 * Fetch the public Drive root and return one project per subfolder.
 * Returns [] silently on any failure so the page never breaks.
 */
export async function getDriveProjects() {
  try {
    const root = await fetchFolder(FOLDER_ID);
    if (DEBUG) {
      console.log(
        `[drive] root: ${root.folders.length} subfolders, ${root.files.length} loose files`
      );
    }
    const projects = await Promise.all(
      root.folders.map(async (folder) => {
        const inside = await fetchFolder(folder.id);
        return {
          id: folder.id,
          folderName: folder.name,
          media: inside.files.map(toMedia),
        };
      })
    );
    const kept = projects.filter((p) => p.media.length > 0);
    if (DEBUG) {
      console.log(
        `[drive] kept ${kept.length}/${projects.length} projects (folders with at least one file)`
      );
    }
    return kept;
  } catch (err) {
    console.warn('[drive] getDriveProjects failed:', err?.message || err);
    return [];
  }
}
