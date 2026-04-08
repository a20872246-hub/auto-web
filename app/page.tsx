'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { BGMPlayer } from '@/components/BGMPlayer';
import { AnnouncementPanel } from '@/components/AnnouncementPanel';
import { ScheduleStatus } from '@/components/ScheduleStatus';
import { useStore } from '@/lib/store';
import type { Announcement } from '@/lib/types';

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  loadVideoById(id: string): void;
  setVolume(v: number): void;
  getVolume(): number;
  getPlayerState(): number;
  getVideoData(): { title: string };
  getCurrentTime(): number;
  getDuration(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  nextVideo(): void;
  previousVideo(): void;
  destroy(): void;
}

interface FiredEntry {
  scheduleId: string;
  date: string;
}

export default function Home() {
  const { settings, categories } = useStore();
  const playerRef = useRef<YTPlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTitle, setCurrentTitle] = useState('');
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [lastAnnouncement, setLastAnnouncement] = useState('');
  const firedRef = useRef<FiredEntry[]>([]);

  // Smooth volume fade
  const fadeVolume = useCallback(async (from: number, to: number, duration: number) => {
    const steps = 20;
    const stepTime = duration / steps;
    const stepSize = (to - from) / steps;
    for (let i = 1; i <= steps; i++) {
      const vol = Math.round(from + stepSize * i);
      playerRef.current?.setVolume(Math.max(0, Math.min(100, vol)));
      await new Promise((r) => setTimeout(r, stepTime));
    }
  }, []);

  // Duck BGM for announcement
  const handleDuck = useCallback(async (duck: boolean) => {
    if (!playerRef.current) return;
    const { volume, duckedVolume, fadeDuration } = settings.bgm;
    if (duck) {
      await fadeVolume(volume, duckedVolume, fadeDuration);
    } else {
      await fadeVolume(duckedVolume, volume, fadeDuration);
    }
  }, [settings.bgm, fadeVolume]);

  // Play chime audio
  const playChime = useCallback(async () => {
    const { chimeEnabled, chimeType } = settings.tts;
    if (!chimeEnabled) return;
    await new Promise<void>((resolve) => {
      const audio = new Audio(`/${chimeType}.wav`);
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      audio.play().catch(() => resolve());
    });
  }, [settings.tts]);

  // Get best Korean voice
  const getKoreanVoice = useCallback((targetVoice: string): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    const exact = voices.find((v) => v.name === targetVoice);
    if (exact) return exact;
    const korean = voices.find((v) => v.lang === 'ko-KR');
    if (korean) return korean;
    const ko = voices.find((v) => v.lang.startsWith('ko'));
    return ko || null;
  }, []);

  // TTS speak
  const speakTTS = useCallback((text: string, voice: string, rate: number): Promise<void> => {
    return new Promise((resolve) => {
      const synth = window.speechSynthesis;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = rate;
      const selectedVoice = getKoreanVoice(voice);
      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      synth.speak(utterance);
    });
  }, [getKoreanVoice]);

  // Main announce flow
  const handleAnnounce = useCallback(async (announcement: Announcement, _categoryId: string) => {
    if (isAnnouncing) return;
    setIsAnnouncing(true);
    setLastAnnouncement(announcement.label);

    const bgmWasPlaying = isPlaying;

    try {
      if (bgmWasPlaying) await handleDuck(true);
      await playChime();
      await speakTTS(
        announcement.text,
        announcement.voice || settings.tts.voice,
        announcement.rate || 1.0
      );
      await new Promise((r) => setTimeout(r, settings.tts.postDelay));
      if (bgmWasPlaying) await handleDuck(false);
    } finally {
      setIsAnnouncing(false);
    }
  }, [isAnnouncing, isPlaying, handleDuck, playChime, speakTTS, settings.tts]);

  // Schedule fire handler
  const handleScheduleFire = useCallback((announcementRef: string, bgmAction: string) => {
    const [catId, itemId] = announcementRef.split('/');
    const cat = categories.find((c) => c.id === catId);
    const item = cat?.items.find((i) => i.id === itemId);
    if (!item) return;

    handleAnnounce(item, catId).then(() => {
      if (bgmAction === 'play' && !isPlaying) {
        playerRef.current?.playVideo();
      } else if (bgmAction === 'stop') {
        playerRef.current?.stopVideo();
        setCurrentTitle('');
        setIsPlaying(false);
      }
    });
  }, [categories, handleAnnounce, isPlaying]);

  // Warm up speech synthesis voices on first click
  useEffect(() => {
    const warmUp = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.getVoices();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('click', warmUp, { once: true });
      return () => window.removeEventListener('click', warmUp);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-sm font-bold text-black">
            ITN
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight">ITN Fitness</h1>
            <p className="text-xs text-slate-400 leading-tight">안내방송 시스템</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isAnnouncing && (
            <div className="flex items-center gap-2 text-sm text-blue-400">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse inline-block" />
              방송 중: {lastAnnouncement}
            </div>
          )}
          <Link
            href="/admin"
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
          >
            ⚙️ 관리
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto p-4 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BGMPlayer
            onDuck={handleDuck}
            playerRef={playerRef}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            currentTitle={currentTitle}
            setCurrentTitle={setCurrentTitle}
          />
          <AnnouncementPanel onAnnounce={handleAnnounce} isAnnouncing={isAnnouncing} />
        </div>
      </main>

      {/* Schedule status bar */}
      <ScheduleStatus onScheduleFire={handleScheduleFire} firedRef={firedRef} />
    </div>
  );
}
