'use client';

import { useEffect, useState, useCallback } from 'react';
import { useStore } from '@/lib/store';
import type { Category } from '@/lib/types';

type Screen = 'loading' | 'pin' | 'control';

export default function RemotePage() {
  const [screen, setScreen] = useState<Screen>('loading');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [announcing, setAnnouncing] = useState(false);
  const [lastLabel, setLastLabel] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const { categories } = useStore();

  useEffect(() => {
    fetch('/api/remote/check')
      .then((r) => setScreen(r.ok ? 'control' : 'pin'))
      .catch(() => setScreen('pin'));
  }, []);

  const handlePinDigit = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setPinError('');
    if (next.length === 4) submitPin(next);
  };

  const submitPin = async (value: string) => {
    const res = await fetch('/api/remote/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: value }),
    });
    if (res.ok) {
      setPin('');
      setScreen('control');
    } else {
      setPinError('비밀번호가 틀렸습니다');
      setPin('');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/remote/auth', { method: 'DELETE' });
    setScreen('pin');
  };

  const handleAnnounce = useCallback(async (ref: string, label: string) => {
    if (announcing) return;
    setAnnouncing(true);
    setLastLabel(label);
    try {
      await fetch('/api/remote/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref, bgmAction: 'none' }),
      });
    } finally {
      setTimeout(() => setAnnouncing(false), 2000);
    }
  }, [announcing]);

  const cats = categories.filter((c) => c.id !== 'emergency');
  const emergency = categories.find((c) => c.id === 'emergency')?.items[0];
  const activeCat: Category | undefined =
    cats.find((c) => c.id === selectedCat) ?? cats[0];

  if (screen === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 rounded-full border-4 border-orange-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (screen === 'pin') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 px-6 gap-8">
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
            ITN
          </div>
          <h1 className="text-xl font-bold text-gray-800">관리자 로그인</h1>
          <p className="text-sm text-gray-500">4자리 PIN을 입력하세요</p>
        </div>

        {/* PIN 도트 */}
        <div className="flex gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-colors ${
                i < pin.length ? 'bg-orange-500 border-orange-500' : 'border-gray-300 bg-white'
              }`}
            />
          ))}
        </div>

        {pinError && <p className="text-red-500 text-sm font-medium">{pinError}</p>}

        {/* 키패드 */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d) => (
            <button
              key={d}
              onClick={() => {
                if (d === '⌫') { setPin((p) => p.slice(0, -1)); setPinError(''); }
                else if (d !== '') handlePinDigit(d);
              }}
              className={`h-16 rounded-2xl text-xl font-semibold transition-all active:scale-95 ${
                d === '' ? 'invisible' :
                d === '⌫' ? 'bg-gray-100 text-gray-600' :
                'bg-white border border-gray-200 text-gray-800 shadow-sm hover:bg-gray-50'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
            ITN
          </div>
          <span className="font-semibold text-gray-800 text-sm">원격 방송</span>
        </div>
        {announcing ? (
          <span className="flex items-center gap-1.5 text-xs text-orange-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            방송 중: {lastLabel}
          </span>
        ) : (
          <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600">
            로그아웃
          </button>
        )}
      </header>

      {/* 카테고리 탭 */}
      <div className="bg-white border-b border-gray-200 px-3 flex gap-1 overflow-x-auto sticky top-[57px] z-10">
        {cats.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCat(cat.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeCat?.id === cat.id
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-gray-500'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 안내방송 버튼 */}
      <main className="flex-1 p-4 flex flex-col gap-3">
        {activeCat?.items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleAnnounce(`${activeCat.id}/${item.id}`, item.label)}
            disabled={announcing}
            className={`w-full p-4 rounded-2xl text-left border transition-all active:scale-[0.98] ${
              announcing
                ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white border-gray-200 hover:border-orange-300 hover:bg-orange-50 shadow-sm'
            }`}
          >
            <p className="font-semibold text-gray-800 text-base">{item.label}</p>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.text}</p>
          </button>
        ))}
      </main>

      {/* 긴급 방송 버튼 — 하단 고정 */}
      {emergency && (
        <div className="p-4 bg-white border-t border-gray-200">
          <button
            onClick={() => handleAnnounce(`emergency/${emergency.id}`, emergency.label)}
            disabled={announcing}
            className={`w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] ${
              announcing
                ? 'bg-red-100 text-red-300 cursor-not-allowed'
                : 'bg-red-500 text-white shadow-lg shadow-red-200'
            }`}
          >
            🚨 긴급 방송
          </button>
        </div>
      )}
    </div>
  );
}
