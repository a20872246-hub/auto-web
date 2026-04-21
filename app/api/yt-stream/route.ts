import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

function isYouTubeUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ['youtube.com', 'www.youtube.com', 'youtu.be', 'music.youtube.com'].includes(hostname);
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url || !isYouTubeUrl(url)) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    const { stdout } = await execFileAsync(
      'yt-dlp',
      ['-f', 'bestaudio', '--print', 'url', '--print', 'title', '--no-playlist', '--no-warnings', url],
      { timeout: 20000 }
    );
    const lines = stdout.trim().split('\n');
    const streamUrl = lines[0];
    const title = lines[1] || '';
    if (!streamUrl) throw new Error('no url');
    return NextResponse.json({ url: streamUrl, title });
  } catch {
    return NextResponse.json({ error: 'yt-dlp unavailable' }, { status: 503 });
  }
}
