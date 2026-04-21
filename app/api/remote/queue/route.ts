import { NextRequest, NextResponse } from 'next/server';
import { validateSession, queueAnnouncement } from '@/lib/remote-store';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('remote_session')?.value ?? '';
  if (!(await validateSession(token))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const { ref, bgmAction } = await req.json();
  if (!ref) return NextResponse.json({ ok: false }, { status: 400 });
  const id = await queueAnnouncement(ref, bgmAction ?? 'none');
  return NextResponse.json({ ok: true, id });
}
