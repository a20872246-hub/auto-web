import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/remote-store';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('remote_session')?.value ?? '';
  if (!(await validateSession(token))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
