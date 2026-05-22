import { NextResponse } from 'next/server';
import { checkPassword, makeSessionToken, cookieAttributes } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad request' }, { status: 400 });
  }

  // Small artificial delay — discourages brute-forcing
  await new Promise((r) => setTimeout(r, 250));

  if (!checkPassword(body?.password)) {
    return NextResponse.json({ ok: false, error: 'invalid password' }, { status: 401 });
  }

  const token = makeSessionToken();
  const cookieAttrs = cookieAttributes();

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: cookieAttrs.name,
    value: token,
    httpOnly: cookieAttrs.httpOnly,
    sameSite: cookieAttrs.sameSite,
    secure: cookieAttrs.secure,
    path: cookieAttrs.path,
    maxAge: cookieAttrs.maxAge,
  });
  return res;
}
