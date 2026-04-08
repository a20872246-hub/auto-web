'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { VOICE_OPTIONS } from '@/lib/types';
import type { Announcement, Category } from '@/lib/types';

export function AnnouncementsTab() {
  const { categories, addAnnouncement, updateAnnouncement, deleteAnnouncement, addCategory } = useStore();
  const [selectedCat, setSelectedCat] = useState(categories[0]?.id || '');
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [editingCatId, setEditingCatId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [newCatId, setNewCatId] = useState('');
  const [newCatLabel, setNewCatLabel] = useState('');

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

  const handleAddCat = () => {
    if (!newCatId.trim() || !newCatLabel.trim()) return;
    addCategory(newCatId.trim(), newCatLabel.trim());
    setSelectedCat(newCatId.trim());
    setNewCatId('');
    setNewCatLabel('');
    setShowCatForm(false);
  };

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap shrink-0">
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
          className="px-3 py-1.5 rounded-lg text-sm bg-slate-700 hover:bg-slate-600 text-slate-300"
        >
          + 카테고리 추가
        </button>
      </div>

      {showCatForm && (
        <div className="bg-slate-700/50 rounded-xl p-4 flex flex-col gap-3 border border-slate-600 shrink-0">
          <h3 className="text-sm font-semibold text-slate-300">새 카테고리</h3>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="ID (영문, 예: event)" value={newCatId}
              onChange={(e) => setNewCatId(e.target.value)} className="input-field" />
            <input type="text" placeholder="이름 (예: 이벤트 안내)" value={newCatLabel}
              onChange={(e) => setNewCatLabel(e.target.value)} className="input-field" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCatForm(false)} className="btn-secondary">취소</button>
            <button onClick={handleAddCat} className="btn-primary">추가</button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex flex-col gap-2">
        {activeCategory?.items.map((item) => (
          <div key={item.id} className="bg-slate-700/40 rounded-xl p-4 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{item.label}</p>
              <p className="text-sm text-slate-400 mt-1 line-clamp-2">{item.text}</p>
              <p className="text-xs text-slate-500 mt-1">
                {VOICE_OPTIONS.find((v) => v.value === item.voice)?.label?.split('—')[0].trim() || item.voice} · 속도 {item.rate}x
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => { setEditing(item); setEditingCatId(activeCategory.id); setShowForm(true); }}
                className="px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors"
              >편집</button>
              <button
                onClick={() => deleteAnnouncement(activeCategory.id, item.id)}
                className="px-2 py-1 text-xs bg-red-900/40 hover:bg-red-800/60 text-red-400 rounded-lg transition-colors"
              >삭제</button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => { setEditing(null); setEditingCatId(''); setShowForm(true); }}
        className="btn-primary shrink-0"
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
  initial, onSave, onCancel,
}: {
  initial: Announcement | null;
  onSave: (data: Omit<Announcement, 'id'>) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(initial?.label || '');
  const [text, setText] = useState(initial?.text || '');
  const [voice, setVoice] = useState(initial?.voice || 'ko-KR-SunHiNeural');
  const [rate, setRate] = useState(initial?.rate || 1.0);
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState('');

  // Web Speech API fallback
  const speakFallback = (t: string, r: number) => {
    return new Promise<void>((resolve) => {
      const synth = window.speechSynthesis;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(t);
      u.lang = 'ko-KR';
      u.rate = r;
      const voices = synth.getVoices();
      const ko = voices.find((v) => v.lang === 'ko-KR') || voices.find((v) => v.lang.startsWith('ko'));
      if (ko) u.voice = ko;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      synth.speak(u);
    });
  };

  const handleTest = async () => {
    if (!text.trim() || testing) return;
    setTesting(true);
    setTestError('');
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice, rate }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const blob = await res.blob();
      if (blob.size === 0) throw new Error('빈 응답');
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
        audio.onerror = () => { URL.revokeObjectURL(url); reject(new Error('재생 오류')); };
        audio.play().catch(reject);
      });
    } catch (e) {
      // Fallback to Web Speech API
      setTestError('Azure TTS 연결 실패 → 시스템 음성으로 재생합니다');
      await speakFallback(text, rate);
    } finally {
      setTesting(false);
    }
  };

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (!label.trim() || !text.trim()) return; onSave({ label, text, voice, rate }); }}
      className="bg-slate-700/50 rounded-xl p-5 flex flex-col gap-4 border border-slate-600 shrink-0"
    >
      <h3 className="font-semibold">{initial ? '안내방송 편집' : '새 안내방송'}</h3>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-400">제목</label>
        <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
          className="input-field" placeholder="예: 개장 안내" required />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-400">방송 내용</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)}
          className="input-field min-h-[72px] resize-y" placeholder="방송할 내용을 입력하세요" required />
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
          <input type="range" min={0.5} max={2} step={0.05} value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full accent-green-500 mt-2" />
        </div>
      </div>
      {testError && (
        <p className="text-xs text-yellow-400 bg-yellow-900/20 border border-yellow-800/40 rounded-lg px-3 py-2">
          ⚠️ {testError}
        </p>
      )}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={handleTest} disabled={testing}
          className="btn-secondary flex items-center gap-1.5 min-w-[90px] justify-center">
          {testing
            ? <><span className="w-3 h-3 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" /> 재생 중...</>
            : <>🔊 테스트</>}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">취소</button>
        <button type="submit" className="btn-primary">저장</button>
      </div>
    </form>
  );
}
