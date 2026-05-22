import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isAuthed } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const jar = await cookies();
  return NextResponse.json({ authed: isAuthed(jar) });
}
