'use client';

// Speak using server-side msedge-tts (Microsoft Neural voices — high quality)
export async function speak(text: string, voiceName: string, rate = 1.0): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice: voiceName, rate }),
    });

    if (!res.ok) throw new Error(`TTS API ${res.status}`);

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    return new Promise((resolve) => {
      const audio = new Audio(url);
      audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
      audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
      audio.play().catch(() => { URL.revokeObjectURL(url); resolve(); });
    });
  } catch (err) {
    console.warn('서버 TTS 실패, Web Speech API로 대체:', err);
    return speakFallback(text, voiceName, rate);
  }
}

// Fallback: Web Speech API (브라우저 내장)
function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) return Promise.resolve(voices);
  return new Promise((resolve) => {
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      resolve(window.speechSynthesis.getVoices());
    }, { once: true });
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 3000);
  });
}

async function speakFallback(text: string, voiceName: string, rate = 1.0): Promise<void> {
  const synth = window.speechSynthesis;
  synth.cancel();
  await new Promise((r) => setTimeout(r, 80));

  const voices = await waitForVoices();
  const voice = voices.find((v) => v.name === voiceName)
    ?? voices.find((v) => v.lang === 'ko-KR')
    ?? voices.find((v) => v.lang.startsWith('ko'))
    ?? null;

  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = rate;
    if (voice) u.voice = voice;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    synth.speak(u);
  });
}
