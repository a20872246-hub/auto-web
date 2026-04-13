// Voice presets — server & client shared (no 'use client')
// Only 3 Korean voices actually produce audio via msedge-tts:
// ko-KR-SunHiNeural, ko-KR-InJoonNeural, ko-KR-HyunsuNeural
// We create 10 distinct characters by varying pitch and rate.

export interface VoicePreset {
  voice: string;
  pitch: string; // e.g. "+0Hz", "-15Hz", "+8Hz"
  rate: number;  // multiplier applied on top of announcement rate (1.0 = normal)
}

export const VOICE_PRESETS: Record<string, VoicePreset> = {
  // ── 여성 (선희 베이스) ─────────────────────────────────────
  'sunhi-default':  { voice: 'ko-KR-SunHiNeural',  pitch: '+0Hz',  rate: 1.0  },
  'sunhi-calm':     { voice: 'ko-KR-SunHiNeural',  pitch: '-12Hz', rate: 0.88 },
  'sunhi-bright':   { voice: 'ko-KR-SunHiNeural',  pitch: '+10Hz', rate: 1.1  },
  'sunhi-warm':     { voice: 'ko-KR-SunHiNeural',  pitch: '+6Hz',  rate: 0.94 },
  'sunhi-deep':     { voice: 'ko-KR-SunHiNeural',  pitch: '-6Hz',  rate: 0.92 },
  // ── 남성 (인준 베이스) ─────────────────────────────────────
  'injoon-default': { voice: 'ko-KR-InJoonNeural', pitch: '+0Hz',  rate: 1.0  },
  'injoon-deep':    { voice: 'ko-KR-InJoonNeural', pitch: '-18Hz', rate: 0.88 },
  'injoon-bright':  { voice: 'ko-KR-InJoonNeural', pitch: '+10Hz', rate: 1.1  },
  // ── 남성 (현수 베이스) ─────────────────────────────────────
  'hyunsu-default': { voice: 'ko-KR-HyunsuNeural', pitch: '+0Hz',  rate: 1.0  },
  'hyunsu-calm':    { voice: 'ko-KR-HyunsuNeural', pitch: '-12Hz', rate: 0.87 },
};

// Fallback for raw Azure voice names saved in old data
const RAW_VOICE_FALLBACK: Record<string, string> = {
  'ko-KR-SunHiNeural':    'sunhi-default',
  'ko-KR-JiMinNeural':    'sunhi-bright',
  'ko-KR-YuJinNeural':    'sunhi-warm',
  'ko-KR-SeoHyeonNeural': 'sunhi-calm',
  'ko-KR-SoonBokNeural':  'sunhi-deep',
  'ko-KR-NamiNeural':     'sunhi-bright',
  'ko-KR-InJoonNeural':   'injoon-default',
  'ko-KR-HyunsuNeural':   'hyunsu-default',
  'ko-KR-HyunsuMultilingualNeural': 'hyunsu-default',
  'ko-KR-GookMinNeural':  'injoon-deep',
  'ko-KR-BonginNeural':   'injoon-deep',
};

export function resolvePreset(voiceKey: string): VoicePreset {
  if (VOICE_PRESETS[voiceKey]) return VOICE_PRESETS[voiceKey];
  const mapped = RAW_VOICE_FALLBACK[voiceKey];
  if (mapped && VOICE_PRESETS[mapped]) return VOICE_PRESETS[mapped];
  return VOICE_PRESETS['sunhi-default'];
}
