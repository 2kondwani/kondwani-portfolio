import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getJournal, saveJournal } from '@/lib/journal-store';
import { isAuthed } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const jar = await cookies();
  return isAuthed(jar);
}

/** PUT — admin — update an existing entry */
export async function PUT(req, context) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { id } = await context.params;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }

  const entries = await getJournal();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx < 0) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const cur = entries[idx];
  const updated = {
    ...cur,
    title: typeof body.title === 'string' ? body.title.trim() : cur.title,
    date: typeof body.date === 'string' ? body.date.trim() : cur.date,
    body: typeof body.body === 'string' ? body.body.trim() : cur.body,
    tags: Array.isArray(body.tags)
      ? body.tags
          .map((t) => String(t).trim().toLowerCase().replace(/^#/, ''))
          .filter(Boolean)
      : cur.tags,
  };

  if (!updated.title || !updated.body) {
    return NextResponse.json(
      { error: 'title and body are required' },
      { status: 400 }
    );
  }

  const next = [...entries];
  next[idx] = updated;
  await saveJournal(next);
  return NextResponse.json({ ok: true, entry: updated, entries: next });
}

/** DELETE — admin — remove an entry */
export async function DELETE(_req, context) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { id } = await context.params;
  const entries = await getJournal();
  const next = entries.filter((e) => e.id !== id);
  if (next.length === entries.length) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  await saveJournal(next);
  return NextResponse.json({ ok: true, entries: next });
}
