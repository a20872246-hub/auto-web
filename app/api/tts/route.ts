import { NextRequest, NextResponse } from 'next/server';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

export const runtime = 'nodejs';
export const maxDuration = 30;

function rateToPercent(rate: number): string {
  const pct = Math.round((rate - 1) * 100);
  return pct >= 0 ? `+${pct}%` : `${pct}%`;
}

export async function POST(req: NextRequest) {
  try {
    const { text, voice, rate } = await req.json() as {
      text: string;
      voice: string;
      rate: number;
    };

    if (!text) {
      return NextResponse.json({ error: 'text required' }, { status: 400 });
    }

    const tts = new MsEdgeTTS();
    await tts.setMetadata(
      voice || 'ko-KR-SunHiNeural',
      OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3
    );

    const rateStr = rateToPercent(rate || 1.0);

    const { audioStream } = tts.toStream(text, { rate: rateStr });

    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      audioStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      audioStream.on('end', resolve);
      audioStream.on('error', reject);
    });

    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(buffer.length),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('TTS error:', err);
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 });
  }
}
