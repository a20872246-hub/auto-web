import { NextRequest, NextResponse } from 'next/server';
import { createSession, deleteSession, validateSession } from '@/lib/remote-store';

export async function POST(req: NextRequest) {
  const { pin } = await req.json();
  // 환경변수 ADMIN_PIN 우선, 없으면 기본값 '0000'
  const correctPin = process.env.ADMIN_PIN ?? '0000';
  if (pin !== correctPin) {
    return NextResponse.json({ ok: false, error: '비밀번호가 틀렸습니다' }, { status: 401 });
  }
  const token = await createSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set('remote_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  });
  return res;
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get('remote_session')?.value ?? '';
  await deleteSession(token);
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('remote_session');
  return res;
}
