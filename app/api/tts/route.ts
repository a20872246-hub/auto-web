import { NextRequest, NextResponse } from 'next/server';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { resolvePreset } from '@/lib/voice-presets';

export const runtime = 'nodejs';
export const maxDuration = 30;

function toRateStr(rate: number): string {
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

    const preset = resolvePreset(voice || 'sunhi-default');
    // Announcement rate multiplied by preset base rate
    const finalRate = (rate || 1.0) * preset.rate;

    const tts = new MsEdgeTTS();
    await tts.setMetadata(preset.voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

    const { audioStream } = tts.toStream(text, {
      rate: toRateStr(finalRate),
      pitch: preset.pitch,
    });

    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      audioStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      audioStream.on('end', resolve);
      audioStream.on('error', reject);
    });

    const buffer = Buffer.concat(chunks);

    if (buffer.length === 0) {
      return NextResponse.json({ error: 'empty audio' }, { status: 500 });
    }

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
