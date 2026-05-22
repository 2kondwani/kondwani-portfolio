/* ============================================================
   Journal store
   ------------------------------------------------------------
   - In production (Vercel KV connected): persists in Redis.
   - In local dev (no KV env): persists in data/journal-dev.json
     so edits survive `npm run dev` restarts. That file is
     gitignored.

   The same `getJournal` / `saveJournal` API is used by all the
   API routes, so consumers don't care which backend is live.

   First call seeds the store with the entries from
   src/app/more/data.js (SEED_JOURNAL).
   ============================================================ */

import { SEED_JOURNAL } from '@/app/more/data';

const KV_KEY = 'journal:entries:v1';

function isKvConfigured() {
  return !!(
    process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  );
}

/* ---------- KV path ----------
   The `webpackIgnore` magic comment + try/catch wrapper makes the
   build succeed even if @vercel/kv isn't installed locally yet.
   In that case the dev environment quietly falls back to the file
   store below. Production has KV connected, so this resolves. */
async function loadKv() {
  try {
    const mod = await import(/* webpackIgnore: true */ '@vercel/kv');
    return mod.kv;
  } catch {
    return null;
  }
}
async function kvGet() {
  const kv = await loadKv();
  if (!kv) return null;
  return await kv.get(KV_KEY);
}
async function kvSet(value) {
  const kv = await loadKv();
  if (!kv) throw new Error('@vercel/kv not available');
  await kv.set(KV_KEY, value);
}

/* ---------- Local file fallback (dev only) ---------- */
async function fileGet() {
  const fs = await import('fs');
  const path = await import('path');
  const file = path.join(process.cwd(), 'data', 'journal-dev.json');
  try {
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
async function fileSet(value) {
  const fs = await import('fs');
  const path = await import('path');
  const dir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'journal-dev.json');
  fs.writeFileSync(file, JSON.stringify(value, null, 2), 'utf8');
}

/* ---------- Public API ---------- */

/** Returns the current journal entries as an array, newest first. */
export async function getJournal() {
  let entries = null;
  if (isKvConfigured()) {
    try { entries = await kvGet(); } catch { entries = null; }
  }
  if (!Array.isArray(entries)) {
    try { entries = await fileGet(); } catch { entries = null; }
  }
  if (!Array.isArray(entries) || entries.length === 0) {
    entries = SEED_JOURNAL;
    try { await saveJournal(entries); } catch { /* read-only env, fine */ }
  }
  return entries;
}

/** Replaces the entire journal with the given array. */
export async function saveJournal(entries) {
  if (isKvConfigured()) {
    try {
      await kvSet(entries);
      return;
    } catch {
      // fall through to file store
    }
  }
  await fileSet(entries);
}

/** True if the editor will be able to persist writes from this runtime. */
export function isWritable() {
  return isKvConfigured() || process.env.NODE_ENV !== 'production';
}
