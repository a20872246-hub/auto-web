'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { extractVideoId, extractPlaylistId } from '@/lib/youtube';

declare global {
  interface Window {
    YT: {
      Player: new (id: string, config: object) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number; BUFFERING: number; CUED: number };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

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

interface BGMPlayerProps {
  onDuck: (duck: boolean) => Promise<void>;
  playerRef: React.MutableRefObject<YTPlayer | null>;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  currentTitle: string;
  setCurrentTitle: (v: string) => void;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function BGMPlayer({ onDuck, playerRef, isPlaying, setIsPlaying, currentTitle, setCurrentTitle }: BGMPlayerProps) {
  const { settings, updateBGMSettings } = useStore();
  const [isReady, setIsReady] = useState(false);
  const [volume, setVolumeState] = useState(settings.bgm.volume);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [urlInput, setUrlInput] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [dragOver, setDragOver] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const playlist = settings.bgm.playlist;

  const initPlayer = useCallback(() => {
    if (!containerRef.current || playerRef.current) return;
    playerRef.current = new window.YT.Player('yt-player', {
      height: '1',
      width: '1',
      playerVars: { autoplay: 0, controls: 0, playsinline: 1 },
      events: {
        onReady: () => setIsReady(true),
        onStateChange: (e: { data: number }) => {
          const YT = window.YT;
          const playing = e.data === YT.PlayerState.PLAYING;
          setIsPlaying(playing);
          if (playing) {
            const data = playerRef.current?.getVideoData();
            setCurrentTitle(data?.title || '재생 중...');
            // Start progress polling
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = setInterval(() => {
              const ct = playerRef.current?.getCurrentTime() ?? 0;
              const dur = playerRef.current?.getDuration() ?? 0;
              setCurrentTime(ct);
              setDuration(dur);
            }, 500);
          } else {
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }
          }
          if (e.data === YT.PlayerState.ENDED) {
            // Auto-advance playlist
            setCurrentIndex((prev) => {
              const next = (prev + 1) % Math.max(playlist.length, 1);
              const videoId = extractVideoId(playlist[next] || '');
              if (videoId) playerRef.current?.loadVideoById(videoId);
              setTimeout(() => playerRef.current?.playVideo(), 300);
              return next;
            });
          }
        },
        onError: () => {
          // Skip to next on error
          setCurrentIndex((prev) => {
            const next = (prev + 1) % Math.max(playlist.length, 1);
            const videoId = extractVideoId(playlist[next] || '');
            if (videoId) playerRef.current?.loadVideoById(videoId);
            setTimeout(() => playerRef.current?.playVideo(), 300);
            return next;
          });
        },
      },
    });
  }, [playerRef, setIsPlaying, setCurrentTitle, playlist]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.YT?.Player) {
      initPlayer();
      return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = initPlayer;
    return () => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
    };
  }, [initPlayer, playerRef]);

  const handlePlay = () => {
    if (!isReady || !playerRef.current) return;
    if (playlist.length === 0) return;
    const videoId = extractVideoId(playlist[currentIndex] || '');
    if (videoId) {
      playerRef.current.loadVideoById(videoId);
      playerRef.current.playVideo();
    }
  };

  const handlePause = () => playerRef.current?.pauseVideo();
  const handleStop = () => {
    playerRef.current?.stopVideo();
    setCurrentTitle('');
    setCurrentTime(0);
    setDuration(0);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const handleNext = () => {
    if (playlist.length === 0) return;
    const next = (currentIndex + 1) % playlist.length;
    setCurrentIndex(next);
    const videoId = extractVideoId(playlist[next] || '');
    if (videoId) {
      playerRef.current?.loadVideoById(videoId);
      playerRef.current?.playVideo();
    }
  };

  const handlePrev = () => {
    if (playlist.length === 0) return;
    const prev = (currentIndex - 1 + playlist.length) % playlist.length;
    setCurrentIndex(prev);
    const videoId = extractVideoId(playlist[prev] || '');
    if (videoId) {
      playerRef.current?.loadVideoById(videoId);
      playerRef.current?.playVideo();
    }
  };

  const handleVolume = (v: number) => {
    setVolumeState(v);
    updateBGMSettings({ volume: v });
    if (playerRef.current) playerRef.current.setVolume(v);
  };

  const handleAddUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    const videoId = extractVideoId(url);
    const playlistId = extractPlaylistId(url);
    if (videoId || playlistId) {
      updateBGMSettings({ playlist: [...playlist, url] });
      setUrlInput('');
    } else {
      alert('올바른 YouTube URL을 입력해주세요.');
    }
  };

  const handlePlayUrl = () => {
    const url = urlInput.trim();
    if (!url || !isReady || !playerRef.current) return;
    const videoId = extractVideoId(url);
    if (videoId) {
      playerRef.current.loadVideoById(videoId);
      playerRef.current.playVideo();
      setCurrentTitle('로딩 중...');
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 flex flex-col gap-4 h-full">
      <div ref={containerRef} className="absolute opacity-0 pointer-events-none w-px h-px overflow-hidden">
        <div id="yt-player" />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-green-400 text-xl">♪</span>
        <h2 className="text-lg font-semibold">BGM 플레이어</h2>
        {isPlaying && (
          <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full animate-pulse">
            재생 중
          </span>
        )}
      </div>

      {/* Track info */}
      <div className="bg-slate-900/50 rounded-lg p-3 min-h-[48px] flex items-center">
        <p className="text-sm text-slate-300 truncate">
          {currentTitle || (isReady ? '재생할 항목을 선택하세요' : 'YouTube 플레이어 로딩 중...')}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={handlePrev}
          disabled={!isReady || playlist.length === 0}
          className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-lg"
          title="이전"
        >⏮</button>
        <button
          onClick={isPlaying ? handlePause : handlePlay}
          disabled={!isReady || playlist.length === 0}
          className="p-3 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xl w-14 h-14"
          title={isPlaying ? '일시정지' : '재생'}
        >{isPlaying ? '⏸' : '▶'}</button>
        <button
          onClick={handleStop}
          disabled={!isReady}
          className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-lg"
          title="정지"
        >⏹</button>
        <button
          onClick={handleNext}
          disabled={!isReady || playlist.length === 0}
          className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-lg"
          title="다음"
        >⏭</button>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-3">
        <span className="text-slate-400 text-sm w-6">🔊</span>
        <input
          type="range" min={0} max={100} value={volume}
          onChange={(e) => handleVolume(Number(e.target.value))}
          className="flex-1 accent-green-500"
        />
        <span className="text-slate-400 text-sm w-8 text-right">{volume}%</span>
      </div>

      {/* Progress bar */}
      <div className="flex flex-col gap-1">
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={1}
          value={isSeeking ? seekValue : currentTime}
          disabled={!isPlaying && duration === 0}
          onChange={(e) => {
            setIsSeeking(true);
            setSeekValue(Number(e.target.value));
          }}
          onMouseUp={(e) => {
            const val = Number((e.target as HTMLInputElement).value);
            playerRef.current?.seekTo(val, true);
            setCurrentTime(val);
            setIsSeeking(false);
          }}
          onTouchEnd={(e) => {
            const val = Number((e.target as HTMLInputElement).value);
            playerRef.current?.seekTo(val, true);
            setCurrentTime(val);
            setIsSeeking(false);
          }}
          className="w-full accent-green-500 disabled:opacity-30 cursor-pointer"
          style={{
            background:
              duration > 0
                ? `linear-gradient(to right, #22c55e ${((isSeeking ? seekValue : currentTime) / duration) * 100}%, #334155 0%)`
                : '#334155',
          }}
        />
        <div className="flex justify-between text-xs text-slate-500 tabular-nums">
          <span>{formatTime(isSeeking ? seekValue : currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Quick URL input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handlePlayUrl()}
          placeholder="YouTube URL 입력"
          className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500"
        />
        <button
          onClick={handlePlayUrl}
          disabled={!isReady || !urlInput}
          className="px-3 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 rounded-lg text-sm font-medium transition-colors"
        >▶ 재생</button>
        <button
          onClick={handleAddUrl}
          disabled={!urlInput}
          className="px-3 py-2 bg-slate-600 hover:bg-slate-500 disabled:opacity-40 rounded-lg text-sm font-medium transition-colors"
          title="재생목록에 추가"
        >+</button>
      </div>

      {/* Playlist */}
      {playlist.length > 0 && (
        <div className="flex flex-col gap-2 flex-1 min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between shrink-0">
            <span className="text-xs text-slate-400 font-medium">재생목록 ({playlist.length}곡)</span>
            <div className="flex items-center gap-3">
              {selected.size > 0 && (
                <button
                  onClick={() => {
                    const { setPlaylist } = useStore.getState();
                    const next = playlist.filter((_, i) => !selected.has(i));
                    // adjust currentIndex
                    const removedBefore = [...selected].filter(i => i < currentIndex).length;
                    setCurrentIndex(Math.max(0, currentIndex - removedBefore));
                    setPlaylist(next);
                    setSelected(new Set());
                  }}
                  className="text-xs bg-red-600/30 hover:bg-red-600/50 text-red-400 px-2 py-0.5 rounded-md transition-colors"
                >
                  선택 삭제 ({selected.size})
                </button>
              )}
              <button
                onClick={() => {
                  if (selected.size === playlist.length) {
                    setSelected(new Set());
                  } else {
                    setSelected(new Set(playlist.map((_, i) => i)));
                  }
                }}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                {selected.size === playlist.length ? '전체 해제' : '전체 선택'}
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex flex-col gap-1 overflow-y-auto pr-1 flex-1 min-h-0">
            {playlist.map((url, idx) => {
              const videoId = extractVideoId(url);
              const isActive = idx === currentIndex;
              const isSelected = selected.has(idx);
              const isDragTarget = dragOver === idx;

              return (
                <div
                  key={idx}
                  draggable
                  onDragStart={() => { dragIndexRef.current = idx; }}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(idx); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={() => {
                    const from = dragIndexRef.current;
                    if (from === null || from === idx) { setDragOver(null); return; }
                    const { setPlaylist } = useStore.getState();
                    const next = [...playlist];
                    const [moved] = next.splice(from, 1);
                    next.splice(idx, 0, moved);
                    setPlaylist(next);
                    // update currentIndex
                    if (currentIndex === from) setCurrentIndex(idx);
                    else if (from < currentIndex && idx >= currentIndex) setCurrentIndex(currentIndex - 1);
                    else if (from > currentIndex && idx <= currentIndex) setCurrentIndex(currentIndex + 1);
                    // update selected
                    setSelected((prev) => {
                      const arr = [...prev].map(i => {
                        if (i === from) return idx;
                        if (from < idx && i > from && i <= idx) return i - 1;
                        if (from > idx && i < from && i >= idx) return i + 1;
                        return i;
                      });
                      return new Set(arr);
                    });
                    dragIndexRef.current = null;
                    setDragOver(null);
                  }}
                  onDragEnd={() => { dragIndexRef.current = null; setDragOver(null); }}
                  className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer select-none transition-all group ${
                    isDragTarget
                      ? 'border-2 border-green-500 bg-green-500/10'
                      : isSelected
                      ? 'bg-blue-600/20 border border-blue-600/40'
                      : isActive
                      ? 'bg-green-600/20 border border-green-600/40'
                      : 'bg-slate-900/40 hover:bg-slate-700/60 border border-transparent'
                  }`}
                >
                  {/* Drag handle */}
                  <span className="shrink-0 text-slate-600 group-hover:text-slate-400 cursor-grab active:cursor-grabbing text-base leading-none px-0.5">
                    ⠿
                  </span>

                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      setSelected((prev) => {
                        const next = new Set(prev);
                        next.has(idx) ? next.delete(idx) : next.add(idx);
                        return next;
                      });
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-3.5 h-3.5 accent-blue-500 shrink-0 cursor-pointer"
                  />

                  {/* Play button / index */}
                  <button
                    onClick={() => {
                      if (!isReady || !playerRef.current) return;
                      setCurrentIndex(idx);
                      const vid = extractVideoId(url);
                      if (vid) { playerRef.current.loadVideoById(vid); playerRef.current.playVideo(); }
                    }}
                    className={`shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-colors ${
                      isActive ? 'bg-green-500 text-black' : 'bg-slate-700 text-slate-400 hover:bg-green-600 hover:text-white'
                    }`}
                  >
                    {isActive && isPlaying ? '♪' : idx + 1}
                  </button>

                  {/* Thumbnail */}
                  {videoId && (
                    <img
                      src={`https://img.youtube.com/vi/${videoId}/default.jpg`}
                      alt=""
                      className="w-10 h-7 rounded object-cover shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}

                  {/* Title */}
                  <span
                    className={`text-xs truncate flex-1 ${isActive ? 'text-green-300' : 'text-slate-300'}`}
                    onClick={() => {
                      if (!isReady || !playerRef.current) return;
                      setCurrentIndex(idx);
                      const vid = extractVideoId(url);
                      if (vid) { playerRef.current.loadVideoById(vid); playerRef.current.playVideo(); }
                    }}
                  >
                    {isActive && currentTitle ? currentTitle : (videoId ? `youtu.be/${videoId}` : url)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
