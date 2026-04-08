'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { extractVideoId } from '@/lib/youtube';

export function PlaylistTab() {
  const { settings, setPlaylist } = useStore();
  const [input, setInput] = useState('');
  const playlist = settings.bgm.playlist;

  const handleAdd = () => {
    const url = input.trim();
    if (!url) return;
    setPlaylist([...playlist, url]);
    setInput('');
  };

  const handleRemove = (idx: number) => setPlaylist(playlist.filter((_, i) => i !== idx));

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...playlist];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setPlaylist(next);
  };

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      <p className="text-sm text-slate-400 shrink-0">YouTube URL을 추가하면 순서대로 자동 재생됩니다.</p>

      <div className="flex gap-2 shrink-0">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="YouTube URL 입력" className="input-field flex-1" />
        <button onClick={handleAdd} disabled={!input} className="btn-primary shrink-0">추가</button>
      </div>

      {playlist.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
          재생목록이 비어있습니다.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {playlist.map((url, idx) => {
            const videoId = extractVideoId(url);
            return (
              <div key={idx} className="bg-slate-700/40 rounded-xl p-3 flex items-center gap-3 group">
                <span className="text-slate-500 text-sm w-6 text-center shrink-0 font-mono">{idx + 1}</span>
                {videoId && (
                  <img src={`https://img.youtube.com/vi/${videoId}/default.jpg`} alt=""
                    className="w-12 h-8 rounded object-cover shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
                <span className="flex-1 text-sm truncate text-slate-300">
                  {videoId ? `youtu.be/${videoId}` : url}
                </span>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => move(idx, -1)} disabled={idx === 0}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-20 transition-colors">↑</button>
                  <button onClick={() => move(idx, 1)} disabled={idx === playlist.length - 1}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-20 transition-colors">↓</button>
                  <button onClick={() => handleRemove(idx)}
                    className="p-1.5 text-slate-500 hover:text-red-400 transition-colors">✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
