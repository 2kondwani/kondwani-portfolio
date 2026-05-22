import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getJournal, saveJournal } from '@/lib/journal-store';
import { isAuthed } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST — admin — reorder entries.
 *  Body: { id, direction: 'up' | 'down' }  OR  { ids: [...orderedIds] } */
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

  const entries = await getJournal();
  let next;

  if (Array.isArray(body?.ids)) {
    // Full reorder by id list
    const byId = new Map(entries.map((e) => [e.id, e]));
    next = body.ids.map((id) => byId.get(id)).filter(Boolean);
    // Append any entries the client forgot (defensive)
    const known = new Set(next.map((e) => e.id));
    for (const e of entries) if (!known.has(e.id)) next.push(e);
  } else if (body?.id && (body.direction === 'up' || body.direction === 'down')) {
    const idx = entries.findIndex((e) => e.id === body.id);
    if (idx < 0) return NextResponse.json({ error: 'not found' }, { status: 404 });
    const swap = body.direction === 'up' ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= entries.length) {
      return NextResponse.json({ ok: true, entries }); // no-op at edges
    }
    next = [...entries];
    [next[idx], next[swap]] = [next[swap], next[idx]];
  } else {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }

  await saveJournal(next);
  return NextResponse.json({ ok: true, entries: next });
}
