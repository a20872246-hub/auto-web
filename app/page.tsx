'use client';

import { useRef, useState, useCallback, useEffect, type ReactNode } from 'react';
import { BGMPlayer } from '@/components/BGMPlayer';
import { AnnouncementPanel } from '@/components/AnnouncementPanel';
import { ScheduleStatus } from '@/components/ScheduleStatus';
import { AnnouncementsTab } from '@/components/tabs/AnnouncementsTab';
import { SchedulesTab } from '@/components/tabs/SchedulesTab';
import { PlaylistTab } from '@/components/tabs/PlaylistTab';
import { SettingsTab } from '@/components/tabs/SettingsTab';
import { useStore } from '@/lib/store';
import type { Announcement } from '@/lib/types';

type Tab = 'control' | 'announcements' | 'schedules' | 'playlist' | 'settings';

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
  const [activeTab, setActiveTab] = useState<Tab>('control');
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

  // TTS speak — Microsoft Azure Neural TTS via API route
  const speakTTS = useCallback(async (text: string, voice: string, rate: number): Promise<void> => {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice, rate }),
      });
      if (!res.ok) throw new Error('TTS API error');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      await new Promise<void>((resolve) => {
        const audio = new Audio(url);
        audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
        audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
        audio.play().catch(() => resolve());
      });
    } catch {
      // Fallback to Web Speech API
      await new Promise<void>((resolve) => {
        const synth = window.speechSynthesis;
        synth.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR';
        utterance.rate = rate;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        synth.speak(utterance);
      });
    }
  }, []);

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

  const TABS = [
    { id: 'control',       icon: '🎮', label: '제어판' },
    { id: 'announcements', icon: '📢', label: '안내방송' },
    { id: 'schedules',     icon: '🕐', label: '스케줄' },
    { id: 'playlist',      icon: '🎵', label: '재생목록' },
    { id: 'settings',      icon: '⚙️', label: '설정' },
  ] as const;

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center text-xs font-bold text-black">
            ITN
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight">ITN Fitness</h1>
            <p className="text-xs text-slate-400 leading-tight">안내방송 시스템</p>
          </div>
        </div>
        {isAnnouncing && (
          <div className="flex items-center gap-2 text-sm text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse inline-block" />
            방송 중: {lastAnnouncement}
          </div>
        )}
      </header>

      {/* Tab bar */}
      <nav className="bg-slate-800 border-b border-slate-700 px-2 shrink-0">
        <div className="flex overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 min-h-0 overflow-hidden">
        {/* 제어판 */}
        <div className={`h-full px-5 py-4 ${activeTab === 'control' ? 'flex' : 'hidden'}`}>
          <div className="h-full w-full grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-7xl mx-auto">
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
        </div>

        {/* 안내방송 관리 */}
        <div className={`h-full px-5 py-4 max-w-3xl mx-auto w-full ${activeTab === 'announcements' ? 'block' : 'hidden'}`}>
          <AnnouncementsTab />
        </div>

        {/* 스케줄 */}
        <div className={`h-full px-5 py-4 max-w-3xl mx-auto w-full ${activeTab === 'schedules' ? 'block' : 'hidden'}`}>
          <SchedulesTab />
        </div>

        {/* 재생목록 */}
        <div className={`h-full px-5 py-4 max-w-3xl mx-auto w-full ${activeTab === 'playlist' ? 'block' : 'hidden'}`}>
          <PlaylistTab />
        </div>

        {/* 설정 */}
        <div className={`h-full px-5 py-4 max-w-3xl mx-auto w-full ${activeTab === 'settings' ? 'block' : 'hidden'}`}>
          <SettingsTab />
        </div>
      </main>

      {/* Schedule status bar — always visible */}
      <ScheduleStatus onScheduleFire={handleScheduleFire} firedRef={firedRef} />
    </div>
  );
}
