'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { VOICE_OPTIONS, CHIME_OPTIONS } from '@/lib/types';

export function SettingsTab() {
  const { settings, updateBGMSettings, updateTTSSettings } = useStore();
  const [saved, setSaved] = useState(false);

  const [bgmVolume, setBgmVolume] = useState(settings.bgm.volume);
  const [duckedVolume, setDuckedVolume] = useState(settings.bgm.duckedVolume);
  const [fadeDuration, setFadeDuration] = useState(settings.bgm.fadeDuration);
  const [voice, setVoice] = useState(settings.tts.voice);
  const [chimeEnabled, setChimeEnabled] = useState(settings.tts.chimeEnabled);
  const [chimeType, setChimeType] = useState(settings.tts.chimeType);
  const [postDelay, setPostDelay] = useState(settings.tts.postDelay);

  const handleSave = () => {
    updateBGMSettings({ volume: bgmVolume, duckedVolume, fadeDuration });
    updateTTSSettings({ voice, chimeEnabled, chimeType, postDelay });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const testChime = () => {
    const audio = new Audio(`/${chimeType}.wav`);
    audio.play().catch(() => {});
  };

  const testVoice = async () => {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '안녕하세요, ITN 피트니스입니다.', voice, rate: 1.0 }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      audio.play();
    } catch {}
  };

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto">
      {/* BGM */}
      <section className="bg-slate-700/40 rounded-xl p-5 flex flex-col gap-4">
        <h2 className="font-semibold flex items-center gap-2">🎵 BGM 설정</h2>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">기본 볼륨: {bgmVolume}%</label>
          <input type="range" min={0} max={100} value={bgmVolume}
            onChange={(e) => setBgmVolume(Number(e.target.value))} className="w-full accent-green-500" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">방송 중 BGM 볼륨 (덕킹): {duckedVolume}%</label>
          <input type="range" min={0} max={50} value={duckedVolume}
            onChange={(e) => setDuckedVolume(Number(e.target.value))} className="w-full accent-green-500" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">페이드 시간: {fadeDuration}ms</label>
          <input type="range" min={300} max={5000} step={100} value={fadeDuration}
            onChange={(e) => setFadeDuration(Number(e.target.value))} className="w-full accent-green-500" />
        </div>
      </section>

      {/* TTS */}
      <section className="bg-slate-700/40 rounded-xl p-5 flex flex-col gap-4">
        <h2 className="font-semibold flex items-center gap-2">📢 안내방송 설정</h2>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">기본 음성</label>
          <div className="flex gap-2">
            <select value={voice} onChange={(e) => setVoice(e.target.value)} className="input-field flex-1">
              {VOICE_OPTIONS.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
            </select>
            <button onClick={testVoice} className="btn-secondary shrink-0">🔊 테스트</button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={chimeEnabled} onChange={(e) => setChimeEnabled(e.target.checked)}
              className="w-4 h-4 accent-green-500" />
            <span className="text-sm">차임벨 사용</span>
          </label>
        </div>
        {chimeEnabled && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">차임벨 종류</label>
            <div className="flex gap-2">
              <select value={chimeType} onChange={(e) => setChimeType(e.target.value)} className="input-field flex-1">
                {CHIME_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <button onClick={testChime} className="btn-secondary shrink-0">▶ 미리듣기</button>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">방송 후 딜레이: {postDelay}ms</label>
          <input type="range" min={0} max={5000} step={100} value={postDelay}
            onChange={(e) => setPostDelay(Number(e.target.value))} className="w-full accent-green-500" />
        </div>
      </section>

      <button
        onClick={handleSave}
        className={`btn-primary py-3 text-base font-semibold transition-colors shrink-0 ${saved ? '!bg-green-700' : ''}`}
      >
        {saved ? '✓ 저장 완료' : '설정 저장'}
      </button>
    </div>
  );
}
