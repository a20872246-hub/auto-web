'use client';

// Returns best available Korean voice, preferring Neural/Online voices
export function getBestKoreanVoice(targetName?: string): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined') return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  // Priority: exact match → Neural/Online Korean → any ko-KR → any ko
  if (targetName) {
    const exact = voices.find((v) => v.name === targetName);
    if (exact) return exact;
    // Partial match (e.g. "SunHi" in name)
    const partial = voices.find((v) => v.lang.startsWith('ko') && v.name.includes(targetName.split('-').pop() || ''));
    if (partial) return partial;
  }
  const neural = voices.find((v) => v.lang === 'ko-KR' && /Natural|Neural|Online/i.test(v.name));
  if (neural) return neural;
  const korean = voices.find((v) => v.lang === 'ko-KR');
  if (korean) return korean;
  return voices.find((v) => v.lang.startsWith('ko')) || null;
}

// List all available Korean voices on this device
export function getKoreanVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined') return [];
  return window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith('ko'));
}

// Speak text using Web Speech API
export function speak(text: string, voiceName: string, rate = 1.0): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') { resolve(); return; }
    const synth = window.speechSynthesis;
    synth.cancel();

    // Chrome sometimes needs a tiny delay after cancel
    setTimeout(() => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ko-KR';
      u.rate = rate;
      const voice = getBestKoreanVoice(voiceName);
      if (voice) u.voice = voice;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      synth.speak(u);
    }, 50);
  });
}
