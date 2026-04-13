'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { BGMPlayer } from '@/components/BGMPlayer';
import { AnnouncementPanel } from '@/components/AnnouncementPanel';
import { ScheduleStatus } from '@/components/ScheduleStatus';
import { AnnouncementsTab } from '@/components/tabs/AnnouncementsTab';
import { SchedulesTab } from '@/components/tabs/SchedulesTab';
import { PlaylistTab } from '@/components/tabs/PlaylistTab';
import { SettingsTab } from '@/components/tabs/SettingsTab';
import { useStore } from '@/lib/store';
import type { Announcement } from '@/lib/types';
import { speak } from '@/lib/tts';

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
  const { categories } = useStore();
  const playerRef = useRef<YTPlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTitle, setCurrentTitle] = useState('');
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const isAnnouncingRef = useRef(false);
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

  // Duck BGM — 항상 최신 settings를 Zustand에서 직접 읽음 (stale closure 방지)
  const handleDuck = useCallback(async (duck: boolean) => {
    if (!playerRef.current) return;
    const { settings } = useStore.getState();
    const { volume, duckedVolume, fadeDuration } = settings.bgm;
    if (duck) {
      const currentVol = playerRef.current.getVolume();
      await fadeVolume(currentVol, duckedVolume, fadeDuration);
    } else {
      await fadeVolume(duckedVolume, volume, fadeDuration);
    }
  }, [fadeVolume]);

  // Play chime audio — settings를 Zustand에서 직접 읽음
  const playChime = useCallback(async () => {
    const { settings } = useStore.getState();
    const { chimeEnabled, chimeType } = settings.tts;
    if (!chimeEnabled) return;
    await new Promise<void>((resolve) => {
      const audio = new Audio(`/${chimeType}.wav`);
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      audio.play().catch(() => resolve());
    });
  }, []);

  // TTS speak
  const speakTTS = useCallback(
    (text: string, voice: string, rate: number) => speak(text, voice, rate),
    []
  );

  // Main announce flow — isAnnouncingRef로 stale closure 완전 제거
  const handleAnnounce = useCallback(async (announcement: Announcement, _categoryId: string) => {
    if (isAnnouncingRef.current) return;
    isAnnouncingRef.current = true;
    setIsAnnouncing(true);
    setLastAnnouncement(announcement.label);

    // 항상 플레이어 상태를 직접 읽어서 덕킹 여부 결정
    const bgmWasPlaying = playerRef.current?.getPlayerState() === 1;

    try {
      if (bgmWasPlaying) await handleDuck(true);
      await playChime();
      const { settings } = useStore.getState();
      await speakTTS(
        announcement.text,
        announcement.voice || settings.tts.voice,
        announcement.rate || 1.0
      );
      await new Promise((r) => setTimeout(r, settings.tts.postDelay));
      if (bgmWasPlaying) await handleDuck(false);
    } finally {
      isAnnouncingRef.current = false;
      setIsAnnouncing(false);
    }
  }, [handleDuck, playChime, speakTTS]);

  // Schedule fire handler
  const handleScheduleFire = useCallback((announcementRef: string, bgmAction: string) => {
    const [catId, itemId] = announcementRef.split('/');
    const cat = categories.find((c) => c.id === catId);
    const item = cat?.items.find((i) => i.id === itemId);
    if (!item) return;

    handleAnnounce(item, catId).then(() => {
      if (bgmAction === 'play' && playerRef.current?.getPlayerState() !== 1) {
        playerRef.current?.playVideo();
      } else if (bgmAction === 'stop') {
        playerRef.current?.stopVideo();
        setCurrentTitle('');
        setIsPlaying(false);
      }
    });
  }, [categories, handleAnnounce]);

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
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center text-xs font-bold text-white">
            ITN
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight text-gray-800">ITN Fitness</h1>
            <p className="text-xs text-gray-500 leading-tight">안내방송 시스템</p>
          </div>
        </div>
        {isAnnouncing && (
          <div className="flex items-center gap-2 text-sm text-orange-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse inline-block" />
            방송 중: {lastAnnouncement}
          </div>
        )}
      </header>

      {/* Tab bar */}
      <nav className="bg-white border-b border-gray-200 px-2 shrink-0">
        <div className="flex overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
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
