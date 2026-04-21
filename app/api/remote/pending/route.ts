import { NextRequest, NextResponse } from 'next/server';
import { getNextAnnouncement, clearAnnouncement } from '@/lib/remote-store';

export async function GET() {
  const item = await getNextAnnouncement();
  return NextResponse.json(item ?? {});
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (id) await clearAnnouncement(id);
  return NextResponse.json({ ok: true });
}
