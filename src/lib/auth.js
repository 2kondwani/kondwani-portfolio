/* ============================================================
   Lightweight admin auth — HMAC-signed cookie + env-var password
   ------------------------------------------------------------
   Why hand-rolled:
     - No new package needed beyond Node's built-in crypto.
     - Single admin (you), no user accounts.
     - HTTP-only cookie + signed timestamp = stateless, no DB
       lookups for session validation.

   Setup (Vercel → Settings → Environment Variables):
     ADMIN_PASSWORD  = a strong password (DON'T reuse anything)
     ADMIN_SECRET    = a long random string (used to sign the cookie)

   For local dev, drop the same vars into .env.local.
   ============================================================ */

import crypto from 'crypto';

export const ADMIN_COOKIE = 'kp_admin';
const COOKIE_MAX_AGE_DAYS = 30;

function getSecret() {
  return (
    process.env.ADMIN_SECRET ||
    'dev-only-fallback-secret-please-set-ADMIN_SECRET-in-env'
  );
}

function sign(payload) {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
}

/** Build a signed session token: "<unix-ms>.<hmac>" */
export function makeSessionToken() {
  const payload = String(Date.now());
  return `${payload}.${sign(payload)}`;
}

/** Verify a session token: signature must match and not be expired. */
export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return false;
  const dot = token.indexOf('.');
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(payload);
  // Constant-time signature comparison
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return false;
    }
  } catch {
    return false;
  }
  const ts = parseInt(payload, 10);
  if (!ts || Number.isNaN(ts)) return false;
  const age = Date.now() - ts;
  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  return age >= 0 && age < maxAge;
}

/** Constant-time password check against ADMIN_PASSWORD env var. */
export function checkPassword(provided) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof provided !== 'string') return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Standard cookie attributes for the admin session. */
export function cookieAttributes() {
  const maxAgeSec = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  return {
    name: ADMIN_COOKIE,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSec,
  };
}

/** Helper: pull the session cookie from a Next.js cookies() instance. */
export function isAuthed(cookies) {
  const c = cookies.get(ADMIN_COOKIE);
  return verifySessionToken(c?.value);
}
