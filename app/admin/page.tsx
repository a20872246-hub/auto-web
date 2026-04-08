'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { VOICE_OPTIONS, CHIME_OPTIONS, DAY_LABELS } from '@/lib/types';
import type { Announcement, Category, Schedule } from '@/lib/types';
import { nanoid } from '@/lib/nanoid';

type Tab = 'announcements' | 'schedules' | 'playlist' | 'settings';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('announcements');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center gap-4 sticky top-0 z-50">
        <Link href="/" className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300">
          ← 돌아가기
        </Link>
        <h1 className="text-base font-bold">관리 설정</h1>
      </header>

      {/* Tabs */}
      <div className="bg-slate-800 border-b border-slate-700 px-4">
        <div className="flex gap-1 overflow-x-auto">
          {([
            ['announcements', '📢 안내방송'],
            ['schedules', '🕐 스케줄'],
            ['playlist', '🎵 재생목록'],
            ['settings', '⚙️ 설정'],
          ] as [Tab, string][]).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-green-500 text-green-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 container mx-auto p-4 max-w-3xl">
        {activeTab === 'announcements' && <AnnouncementsTab />}
        {activeTab === 'schedules' && <SchedulesTab />}
        {activeTab === 'playlist' && <PlaylistTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>
    </div>
  );
}

// ── Announcements Tab ─────────────────────────────────────────────────────────

function AnnouncementsTab() {
  const { categories, addAnnouncement, updateAnnouncement, deleteAnnouncement, addCategory } = useStore();
  const [selectedCat, setSelectedCat] = useState(categories[0]?.id || '');
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [editingCatId, setEditingCatId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newCatId, setNewCatId] = useState('');
  const [newCatLabel, setNewCatLabel] = useState('');
  const [showCatForm, setShowCatForm] = useState(false);

  const activeCategory = categories.find((c) => c.id === selectedCat);

  const handleSave = (data: Omit<Announcement, 'id'>) => {
    if (editing && editingCatId) {
      updateAnnouncement(editingCatId, editing.id, data);
    } else {
      addAnnouncement(selectedCat, data);
    }
    setEditing(null);
    setEditingCatId('');
    setShowForm(false);
  };

  const handleEdit = (catId: string, item: Announcement) => {
    setEditing(item);
    setEditingCatId(catId);
    setShowForm(true);
  };

  const handleAddCat = () => {
    if (!newCatId.trim() || !newCatLabel.trim()) return;
    addCategory(newCatId.trim(), newCatLabel.trim());
    setSelectedCat(newCatId.trim());
    setNewCatId('');
    setNewCatLabel('');
    setShowCatForm(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Category select */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCat(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedCat === cat.id ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {cat.label}
          </button>
        ))}
        <button
          onClick={() => setShowCatForm(!showCatForm)}
          className="px-3 py-1.5 rounded-lg text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
        >
          + 카테고리 추가
        </button>
      </div>

      {showCatForm && (
        <div className="bg-slate-800 rounded-xl p-4 flex flex-col gap-3 border border-slate-600">
          <h3 className="text-sm font-semibold text-slate-300">새 카테고리</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="ID (영문, 예: event)"
              value={newCatId}
              onChange={(e) => setNewCatId(e.target.value)}
              className="input-field"
            />
            <input
              type="text"
              placeholder="이름 (예: 이벤트 안내)"
              value={newCatLabel}
              onChange={(e) => setNewCatLabel(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCatForm(false)} className="btn-secondary">취소</button>
            <button onClick={handleAddCat} className="btn-primary">추가</button>
          </div>
        </div>
      )}

      {/* Announcement list */}
      {activeCategory && (
        <div className="flex flex-col gap-2">
          {activeCategory.items.map((item) => (
            <div key={item.id} className="bg-slate-800 rounded-xl p-4 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-sm text-slate-400 mt-1 line-clamp-2">{item.text}</p>
                <p className="text-xs text-slate-500 mt-1">
                  음성: {VOICE_OPTIONS.find((v) => v.value === item.voice)?.label || item.voice} · 속도: {item.rate}x
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => handleEdit(activeCategory.id, item)}
                  className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >편집</button>
                <button
                  onClick={() => deleteAnnouncement(activeCategory.id, item.id)}
                  className="px-2 py-1 text-xs bg-red-900/40 hover:bg-red-800/60 text-red-400 rounded-lg transition-colors"
                >삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => { setEditing(null); setEditingCatId(''); setShowForm(true); }}
        className="btn-primary w-full"
      >
        + 안내방송 추가
      </button>

      {showForm && (
        <AnnouncementForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => { setEditing(null); setShowForm(false); }}
        />
      )}
    </div>
  );
}

function AnnouncementForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Announcement | null;
  onSave: (data: Omit<Announcement, 'id'>) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(initial?.label || '');
  const [text, setText] = useState(initial?.text || '');
  const [voice, setVoice] = useState(initial?.voice || 'ko-KR-SunHiNeural');
  const [rate, setRate] = useState(initial?.rate || 1.0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !text.trim()) return;
    onSave({ label: label.trim(), text: text.trim(), voice, rate });
  };

  const handleTest = () => {
    if (!text.trim() || typeof window === 'undefined') return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = rate;
    const voices = synth.getVoices();
    const v = voices.find((v) => v.name === voice) || voices.find((v) => v.lang === 'ko-KR');
    if (v) utterance.voice = v;
    synth.speak(utterance);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-5 flex flex-col gap-4 border border-slate-600">
      <h3 className="font-semibold">{initial ? '안내방송 편집' : '새 안내방송'}</h3>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-400">제목</label>
        <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} className="input-field" placeholder="예: 개장 안내" required />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-400">방송 내용</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} className="input-field min-h-[80px] resize-y" placeholder="방송할 내용을 입력하세요" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">음성</label>
          <select value={voice} onChange={(e) => setVoice(e.target.value)} className="input-field">
            {VOICE_OPTIONS.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">속도: {rate}x</label>
          <input type="range" min={0.5} max={2} step={0.05} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full accent-green-500 mt-2" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={handleTest} className="btn-secondary">🔊 테스트</button>
        <button type="button" onClick={onCancel} className="btn-secondary">취소</button>
        <button type="submit" className="btn-primary">저장</button>
      </div>
    </form>
  );
}

// ── Schedules Tab ─────────────────────────────────────────────────────────────

function SchedulesTab() {
  const { schedules, categories, addSchedule, updateSchedule, deleteSchedule, toggleSchedule } = useStore();
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [showForm, setShowForm] = useState(false);

  const getAnnouncementLabel = (ref: string) => {
    const [catId, itemId] = ref.split('/');
    const cat = categories.find((c) => c.id === catId);
    const item = cat?.items.find((i) => i.id === itemId);
    return `${cat?.label || catId} › ${item?.label || itemId}`;
  };

  const handleSave = (data: Omit<Schedule, 'id'>) => {
    if (editing) {
      updateSchedule(editing.id, data);
    } else {
      addSchedule(data);
    }
    setEditing(null);
    setShowForm(false);
  };

  const sortedSchedules = [...schedules].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="flex flex-col gap-3">
      {sortedSchedules.map((sc) => (
        <div key={sc.id} className={`bg-slate-800 rounded-xl p-4 flex items-start gap-3 ${!sc.enabled ? 'opacity-50' : ''}`}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-green-400">{sc.time}</span>
              <span className="text-sm font-medium">{sc.label}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{getAnnouncementLabel(sc.announcementRef)}</p>
            <div className="flex gap-1 mt-2 flex-wrap">
              {sc.days.map((d) => (
                <span key={d} className="text-xs bg-slate-700 px-1.5 py-0.5 rounded">{DAY_LABELS[d]}</span>
              ))}
              {sc.bgmAction !== 'none' && (
                <span className="text-xs bg-blue-900/40 text-blue-400 px-1.5 py-0.5 rounded">
                  BGM {sc.bgmAction === 'play' ? '재생' : '정지'}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-1 shrink-0 flex-col">
            <button onClick={() => toggleSchedule(sc.id)} className={`px-2 py-1 text-xs rounded-lg transition-colors ${sc.enabled ? 'bg-green-900/40 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
              {sc.enabled ? '활성' : '비활성'}
            </button>
            <button onClick={() => { setEditing(sc); setShowForm(true); }} className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">편집</button>
            <button onClick={() => deleteSchedule(sc.id)} className="px-2 py-1 text-xs bg-red-900/40 hover:bg-red-800/60 text-red-400 rounded-lg transition-colors">삭제</button>
          </div>
        </div>
      ))}

      <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary w-full">
        + 스케줄 추가
      </button>

      {showForm && (
        <ScheduleForm
          initial={editing}
          categories={categories}
          onSave={handleSave}
          onCancel={() => { setEditing(null); setShowForm(false); }}
        />
      )}
    </div>
  );
}

function ScheduleForm({
  initial,
  categories,
  onSave,
  onCancel,
}: {
  initial: Schedule | null;
  categories: Category[];
  onSave: (data: Omit<Schedule, 'id'>) => void;
  onCancel: () => void;
}) {
  const allDays = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  const defaultRef = categories[0]?.items[0] ? `${categories[0].id}/${categories[0].items[0].id}` : '';

  const [time, setTime] = useState(initial?.time || '09:00');
  const [label, setLabel] = useState(initial?.label || '');
  const [announcementRef, setAnnouncementRef] = useState(initial?.announcementRef || defaultRef);
  const [days, setDays] = useState<string[]>(initial?.days || ['monday','tuesday','wednesday','thursday','friday']);
  const [bgmAction, setBgmAction] = useState<'play' | 'stop' | 'none'>(initial?.bgmAction || 'none');
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);

  const toggleDay = (day: string) => {
    setDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!time || !announcementRef || days.length === 0) return;
    onSave({ time, label: label || announcementRef, announcementRef, days, bgmAction, enabled });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-5 flex flex-col gap-4 border border-slate-600">
      <h3 className="font-semibold">{initial ? '스케줄 편집' : '새 스케줄'}</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">시간</label>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input-field" required />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">이름 (선택)</label>
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} className="input-field" placeholder="자동 설정됨" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-400">안내방송</label>
        <select value={announcementRef} onChange={(e) => setAnnouncementRef(e.target.value)} className="input-field" required>
          {categories.map((cat) =>
            cat.items.map((item) => (
              <option key={`${cat.id}/${item.id}`} value={`${cat.id}/${item.id}`}>
                {cat.label} › {item.label}
              </option>
            ))
          )}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs text-slate-400">요일</label>
        <div className="flex gap-1.5 flex-wrap">
          {allDays.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${days.includes(day) ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
            >
              {DAY_LABELS[day]}
            </button>
          ))}
          <button type="button" onClick={() => setDays(allDays.slice(0, 5))} className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded-lg">평일</button>
          <button type="button" onClick={() => setDays(['saturday','sunday'])} className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded-lg">주말</button>
          <button type="button" onClick={() => setDays(allDays)} className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded-lg">매일</button>
        </div>
      </div>
      <div className="flex gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">BGM 동작</label>
          <select value={bgmAction} onChange={(e) => setBgmAction(e.target.value as 'play' | 'stop' | 'none')} className="input-field">
            <option value="none">없음</option>
            <option value="play">재생</option>
            <option value="stop">정지</option>
          </select>
        </div>
        <div className="flex items-end pb-0.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="w-4 h-4 accent-green-500" />
            <span className="text-sm">활성화</span>
          </label>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="btn-secondary">취소</button>
        <button type="submit" className="btn-primary">저장</button>
      </div>
    </form>
  );
}

// ── Playlist Tab ──────────────────────────────────────────────────────────────

function PlaylistTab() {
  const { settings, setPlaylist } = useStore();
  const [input, setInput] = useState('');
  const playlist = settings.bgm.playlist;

  const handleAdd = () => {
    const url = input.trim();
    if (!url) return;
    setPlaylist([...playlist, url]);
    setInput('');
  };

  const handleRemove = (idx: number) => {
    setPlaylist(playlist.filter((_, i) => i !== idx));
  };

  const handleMoveUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...playlist];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setPlaylist(next);
  };

  const handleMoveDown = (idx: number) => {
    if (idx === playlist.length - 1) return;
    const next = [...playlist];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    setPlaylist(next);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-400">YouTube URL을 추가하면 순서대로 재생됩니다.</p>

      {/* URL input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="YouTube URL 입력"
          className="input-field flex-1"
        />
        <button onClick={handleAdd} disabled={!input} className="btn-primary shrink-0">추가</button>
      </div>

      {/* Playlist */}
      {playlist.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm">
          재생목록이 비어있습니다.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {playlist.map((url, idx) => (
            <div key={idx} className="bg-slate-800 rounded-xl p-3 flex items-center gap-3">
              <span className="text-slate-500 text-sm w-6 text-center shrink-0">{idx + 1}</span>
              <span className="flex-1 text-sm truncate text-slate-300">{url}</span>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => handleMoveUp(idx)} disabled={idx === 0} className="p-1 text-slate-400 hover:text-white disabled:opacity-30">↑</button>
                <button onClick={() => handleMoveDown(idx)} disabled={idx === playlist.length - 1} className="p-1 text-slate-400 hover:text-white disabled:opacity-30">↓</button>
                <button onClick={() => handleRemove(idx)} className="p-1 text-red-400 hover:text-red-300">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Settings Tab ──────────────────────────────────────────────────────────────

function SettingsTab() {
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

  return (
    <div className="flex flex-col gap-6">
      {/* BGM settings */}
      <section className="bg-slate-800 rounded-xl p-5 flex flex-col gap-4">
        <h2 className="font-semibold">BGM 설정</h2>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">기본 볼륨: {bgmVolume}%</label>
          <input type="range" min={0} max={100} value={bgmVolume} onChange={(e) => setBgmVolume(Number(e.target.value))} className="w-full accent-green-500" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">방송 중 BGM 볼륨 (덕킹): {duckedVolume}%</label>
          <input type="range" min={0} max={50} value={duckedVolume} onChange={(e) => setDuckedVolume(Number(e.target.value))} className="w-full accent-green-500" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">페이드 시간: {fadeDuration}ms</label>
          <input type="range" min={500} max={5000} step={100} value={fadeDuration} onChange={(e) => setFadeDuration(Number(e.target.value))} className="w-full accent-green-500" />
        </div>
      </section>

      {/* TTS settings */}
      <section className="bg-slate-800 rounded-xl p-5 flex flex-col gap-4">
        <h2 className="font-semibold">안내방송 설정</h2>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">기본 음성</label>
          <select value={voice} onChange={(e) => setVoice(e.target.value)} className="input-field">
            {VOICE_OPTIONS.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={chimeEnabled} onChange={(e) => setChimeEnabled(e.target.checked)} className="w-4 h-4 accent-green-500" />
            <span className="text-sm">차임벨 사용</span>
          </label>
        </div>
        {chimeEnabled && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">차임벨 종류</label>
            <select value={chimeType} onChange={(e) => setChimeType(e.target.value)} className="input-field">
              {CHIME_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">방송 후 딜레이: {postDelay}ms</label>
          <input type="range" min={0} max={5000} step={100} value={postDelay} onChange={(e) => setPostDelay(Number(e.target.value))} className="w-full accent-green-500" />
        </div>
      </section>

      <button onClick={handleSave} className={`btn-primary w-full py-3 text-base ${saved ? 'bg-green-700' : ''}`}>
        {saved ? '✓ 저장됨' : '설정 저장'}
      </button>
    </div>
  );
}
