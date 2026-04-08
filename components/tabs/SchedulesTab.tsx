'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { DAY_LABELS } from '@/lib/types';
import type { Schedule, Category } from '@/lib/types';

export function SchedulesTab() {
  const { schedules, categories, addSchedule, updateSchedule, deleteSchedule, toggleSchedule } = useStore();
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [showForm, setShowForm] = useState(false);

  const getLabel = (ref: string) => {
    const [catId, itemId] = ref.split('/');
    const cat = categories.find((c) => c.id === catId);
    const item = cat?.items.find((i) => i.id === itemId);
    return `${cat?.label || catId} › ${item?.label || itemId}`;
  };

  const sorted = [...schedules].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto">
      {sorted.map((sc) => (
        <div key={sc.id}
          className={`bg-slate-700/40 rounded-xl p-4 flex items-start gap-3 transition-opacity ${!sc.enabled ? 'opacity-50' : ''}`}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-bold text-green-400 tabular-nums">{sc.time}</span>
              <span className="text-sm font-medium truncate">{sc.label}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{getLabel(sc.announcementRef)}</p>
            <div className="flex gap-1 mt-2 flex-wrap">
              {sc.days.map((d) => (
                <span key={d} className="text-xs bg-slate-600 px-1.5 py-0.5 rounded">{DAY_LABELS[d]}</span>
              ))}
              {sc.bgmAction !== 'none' && (
                <span className="text-xs bg-blue-900/40 text-blue-400 px-1.5 py-0.5 rounded">
                  BGM {sc.bgmAction === 'play' ? '재생' : '정지'}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-1 shrink-0 flex-col items-end">
            <button onClick={() => toggleSchedule(sc.id)}
              className={`px-2 py-1 text-xs rounded-lg transition-colors ${sc.enabled ? 'bg-green-900/40 text-green-400' : 'bg-slate-600 text-slate-400'}`}>
              {sc.enabled ? '켜짐' : '꺼짐'}
            </button>
            <div className="flex gap-1">
              <button onClick={() => { setEditing(sc); setShowForm(true); }}
                className="px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors">편집</button>
              <button onClick={() => deleteSchedule(sc.id)}
                className="px-2 py-1 text-xs bg-red-900/40 hover:bg-red-800/60 text-red-400 rounded-lg transition-colors">삭제</button>
            </div>
          </div>
        </div>
      ))}

      <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary shrink-0">
        + 스케줄 추가
      </button>

      {showForm && (
        <ScheduleForm
          initial={editing}
          categories={categories}
          onSave={(data) => {
            editing ? updateSchedule(editing.id, data) : addSchedule(data);
            setEditing(null);
            setShowForm(false);
          }}
          onCancel={() => { setEditing(null); setShowForm(false); }}
        />
      )}
    </div>
  );
}

function ScheduleForm({ initial, categories, onSave, onCancel }: {
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
  const [bgmAction, setBgmAction] = useState<'play'|'stop'|'none'>(initial?.bgmAction || 'none');
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);

  const toggleDay = (day: string) =>
    setDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (!time || !announcementRef || days.length === 0) return; onSave({ time, label: label || announcementRef, announcementRef, days, bgmAction, enabled }); }}
      className="bg-slate-700/50 rounded-xl p-5 flex flex-col gap-4 border border-slate-600 shrink-0"
    >
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
          {categories.map((cat) => cat.items.map((item) => (
            <option key={`${cat.id}/${item.id}`} value={`${cat.id}/${item.id}`}>
              {cat.label} › {item.label}
            </option>
          )))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs text-slate-400">요일</label>
        <div className="flex gap-1.5 flex-wrap">
          {allDays.map((day) => (
            <button key={day} type="button" onClick={() => toggleDay(day)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${days.includes(day) ? 'bg-green-600 text-white' : 'bg-slate-600 text-slate-400 hover:bg-slate-500'}`}>
              {DAY_LABELS[day]}
            </button>
          ))}
          <button type="button" onClick={() => setDays(allDays.slice(0,5))} className="px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 rounded-lg">평일</button>
          <button type="button" onClick={() => setDays(['saturday','sunday'])} className="px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 rounded-lg">주말</button>
          <button type="button" onClick={() => setDays(allDays)} className="px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 rounded-lg">매일</button>
        </div>
      </div>
      <div className="flex gap-4 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">BGM 동작</label>
          <select value={bgmAction} onChange={(e) => setBgmAction(e.target.value as 'play'|'stop'|'none')} className="input-field">
            <option value="none">없음</option>
            <option value="play">재생</option>
            <option value="stop">정지</option>
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer pb-1">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="w-4 h-4 accent-green-500" />
          <span className="text-sm">활성화</span>
        </label>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="btn-secondary">취소</button>
        <button type="submit" className="btn-primary">저장</button>
      </div>
    </form>
  );
}
