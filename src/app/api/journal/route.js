import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getJournal, saveJournal } from '@/lib/journal-store';
import { isAuthed } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET — public — return the journal */
export async function GET() {
  const entries = await getJournal();
  return NextResponse.json(entries);
}

/** POST — admin — create a new entry (prepended to top) */
export async function POST(req) {
  const jar = await cookies();
  if (!isAuthed(jar)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }

  const title = (body?.title || '').trim();
  const dateStr = (body?.date || '').trim();
  const bodyText = (body?.body || '').trim();
  const tags = Array.isArray(body?.tags)
    ? body.tags.map((t) => String(t).trim().toLowerCase().replace(/^#/, '')).filter(Boolean)
    : [];

  if (!title || !bodyText) {
    return NextResponse.json(
      { error: 'title and body are required' },
      { status: 400 }
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const entry = {
    id: `${(dateStr || today)}-${Math.random().toString(36).slice(2, 8)}`,
    date: dateStr || today,
    title,
    tags,
    body: bodyText,
  };

  const current = await getJournal();
  const next = [entry, ...current];
  await saveJournal(next);
  return NextResponse.json({ ok: true, entry, entries: next });
}
