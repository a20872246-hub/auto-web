'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Category, Schedule, Settings, Announcement } from './types';
import { DEFAULT_CATEGORIES, DEFAULT_SCHEDULES, DEFAULT_SETTINGS } from './defaults';
import { nanoid } from './nanoid';

interface AppState {
  categories: Category[];
  schedules: Schedule[];
  settings: Settings;

  // Category actions
  addCategory: (id: string, label: string) => void;
  updateCategory: (id: string, label: string) => void;
  deleteCategory: (id: string) => void;

  // Announcement actions
  addAnnouncement: (categoryId: string, data: Omit<Announcement, 'id'>) => void;
  updateAnnouncement: (categoryId: string, id: string, data: Partial<Announcement>) => void;
  deleteAnnouncement: (categoryId: string, id: string) => void;

  // Schedule actions
  addSchedule: (data: Omit<Schedule, 'id'>) => void;
  updateSchedule: (id: string, data: Partial<Schedule>) => void;
  deleteSchedule: (id: string) => void;
  toggleSchedule: (id: string) => void;

  // Settings actions
  updateBGMSettings: (data: Partial<Settings['bgm']>) => void;
  updateTTSSettings: (data: Partial<Settings['tts']>) => void;
  setPlaylist: (playlist: string[]) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      categories: DEFAULT_CATEGORIES,
      schedules: DEFAULT_SCHEDULES,
      settings: DEFAULT_SETTINGS,

      addCategory: (id, label) =>
        set((s) => ({
          categories: [...s.categories, { id, label, items: [] }],
        })),

      updateCategory: (id, label) =>
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? { ...c, label } : c)),
        })),

      deleteCategory: (id) =>
        set((s) => ({
          categories: s.categories.filter((c) => c.id !== id),
        })),

      addAnnouncement: (categoryId, data) =>
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === categoryId
              ? { ...c, items: [...c.items, { ...data, id: nanoid() }] }
              : c
          ),
        })),

      updateAnnouncement: (categoryId, id, data) =>
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === categoryId
              ? { ...c, items: c.items.map((i) => (i.id === id ? { ...i, ...data } : i)) }
              : c
          ),
        })),

      deleteAnnouncement: (categoryId, id) =>
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === categoryId ? { ...c, items: c.items.filter((i) => i.id !== id) } : c
          ),
        })),

      addSchedule: (data) =>
        set((s) => ({
          schedules: [...s.schedules, { ...data, id: nanoid() }],
        })),

      updateSchedule: (id, data) =>
        set((s) => ({
          schedules: s.schedules.map((sc) => (sc.id === id ? { ...sc, ...data } : sc)),
        })),

      deleteSchedule: (id) =>
        set((s) => ({
          schedules: s.schedules.filter((sc) => sc.id !== id),
        })),

      toggleSchedule: (id) =>
        set((s) => ({
          schedules: s.schedules.map((sc) =>
            sc.id === id ? { ...sc, enabled: !sc.enabled } : sc
          ),
        })),

      updateBGMSettings: (data) =>
        set((s) => ({
          settings: { ...s.settings, bgm: { ...s.settings.bgm, ...data } },
        })),

      updateTTSSettings: (data) =>
        set((s) => ({
          settings: { ...s.settings, tts: { ...s.settings.tts, ...data } },
        })),

      setPlaylist: (playlist) =>
        set((s) => ({
          settings: { ...s.settings, bgm: { ...s.settings.bgm, playlist } },
        })),
    }),
    {
      name: 'itn-fitness-store',
    }
  )
);
