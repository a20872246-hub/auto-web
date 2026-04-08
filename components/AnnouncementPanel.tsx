'use client';

import { useState, useCallback } from 'react';
import { useStore } from '@/lib/store';
import type { Announcement } from '@/lib/types';

interface AnnouncementPanelProps {
  onAnnounce: (announcement: Announcement, categoryId: string) => Promise<void>;
  isAnnouncing: boolean;
}

export function AnnouncementPanel({ onAnnounce, isAnnouncing }: AnnouncementPanelProps) {
  const { categories } = useStore();
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || '');

  const activeCategory = categories.find((c) => c.id === selectedCategory) || categories[0];

  const handleAnnounce = useCallback(
    async (item: Announcement) => {
      if (isAnnouncing) return;
      await onAnnounce(item, activeCategory?.id || '');
    },
    [isAnnouncing, onAnnounce, activeCategory]
  );

  const handleEmergency = () => {
    const emergencyCategory = categories.find((c) => c.id === 'emergency');
    const emergencyItem = emergencyCategory?.items[0];
    if (emergencyItem) {
      onAnnounce(emergencyItem, 'emergency');
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 flex flex-col gap-4 h-full">
      <div className="flex items-center gap-2">
        <span className="text-blue-400 text-xl">📢</span>
        <h2 className="text-lg font-semibold">안내방송</h2>
        {isAnnouncing && (
          <span className="ml-auto text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full animate-pulse">
            방송 중
          </span>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.filter(c => c.id !== 'emergency').map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Announcement buttons */}
      <div className="grid grid-cols-2 gap-3 flex-1 auto-rows-fr">
        {activeCategory?.items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleAnnounce(item)}
            disabled={isAnnouncing}
            className={`p-3 rounded-xl text-sm font-medium text-left transition-all ${
              isAnnouncing
                ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                : 'bg-slate-700 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 text-white'
            }`}
          >
            <span className="block font-semibold">{item.label}</span>
            <span className="block text-xs text-slate-400 mt-1 line-clamp-2">{item.text}</span>
          </button>
        ))}
      </div>

      {/* Emergency button */}
      <button
        onClick={handleEmergency}
        disabled={isAnnouncing}
        className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
          isAnnouncing
            ? 'bg-red-900/30 text-red-700 cursor-not-allowed'
            : 'bg-red-600 hover:bg-red-500 active:scale-95 text-white shadow-lg shadow-red-900/30'
        }`}
      >
        🚨 긴급 방송
      </button>
    </div>
  );
}
