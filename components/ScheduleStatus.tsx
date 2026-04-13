'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { DAY_LABELS } from '@/lib/types';

interface FiredEntry {
  scheduleId: string;
  date: string; // YYYY-MM-DD
}

interface ScheduleStatusProps {
  onScheduleFire: (announcementRef: string, bgmAction: string) => void;
  firedRef: React.MutableRefObject<FiredEntry[]>;
}

function getNow() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  return {
    time: `${hh}:${mm}`,
    day: days[now.getDay()],
    date: now.toISOString().slice(0, 10),
  };
}

export function ScheduleStatus({ onScheduleFire, firedRef }: ScheduleStatusProps) {
  const { schedules, categories } = useStore();
  const [currentTime, setCurrentTime] = useState('');
  const [nextSchedule, setNextSchedule] = useState<{ label: string; time: string } | null>(null);
  const [todaySchedules, setTodaySchedules] = useState<typeof schedules>([]);
  const lastCheckedMinuteRef = useRef('');

  const getAnnouncementLabel = (ref: string) => {
    const [catId, itemId] = ref.split('/');
    const cat = categories.find((c) => c.id === catId);
    const item = cat?.items.find((i) => i.id === itemId);
    return item?.label || ref;
  };

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hh}:${mm}:${ss}`);

      const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
      const today = days[now.getDay()];
      const todayDate = now.toISOString().slice(0, 10);
      const currentHHMM = `${hh}:${mm}`;

      const todayEntries = schedules
        .filter((sc) => sc.enabled && sc.days.includes(today))
        .sort((a, b) => a.time.localeCompare(b.time));
      setTodaySchedules(todayEntries);

      // Find next schedule
      const upcoming = todayEntries.find((sc) => sc.time >= currentHHMM);
      setNextSchedule(upcoming ? { label: getAnnouncementLabel(upcoming.announcementRef), time: upcoming.time } : null);

      // 분이 바뀌었을 때 스케줄 확인 (ss===00 체크 대신 — setInterval 오차로 00초를 건너뛸 수 있음)
      if (currentHHMM !== lastCheckedMinuteRef.current) {
        lastCheckedMinuteRef.current = currentHHMM;
        todayEntries.forEach((sc) => {
          if (sc.time === currentHHMM) {
            const alreadyFired = firedRef.current.some(
              (f) => f.scheduleId === sc.id && f.date === todayDate
            );
            if (!alreadyFired) {
              firedRef.current.push({ scheduleId: sc.id, date: todayDate });
              firedRef.current = firedRef.current.filter((f) => f.date === todayDate);
              onScheduleFire(sc.announcementRef, sc.bgmAction);
            }
          }
        });
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedules, categories]);

  return (
    <div className="bg-white border-t border-gray-200 shadow-sm p-4">
      <div className="container mx-auto flex flex-wrap items-center gap-4">
        {/* Clock */}
        <div className="font-mono text-2xl text-green-600 tabular-nums font-bold min-w-[120px]">
          {currentTime}
        </div>

        {/* Next schedule */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">다음 방송:</span>
          {nextSchedule ? (
            <span className="text-gray-800 font-medium">
              {nextSchedule.time} — {nextSchedule.label}
            </span>
          ) : (
            <span className="text-gray-400">오늘 예정된 방송 없음</span>
          )}
        </div>

        {/* Today's schedule dots */}
        {todaySchedules.length > 0 && (
          <div className="flex flex-wrap gap-1.5 ml-auto">
            {todaySchedules.map((sc) => {
              const now = new Date();
              const [h, m] = sc.time.split(':').map(Number);
              const scheduleDate = new Date();
              scheduleDate.setHours(h, m, 0);
              const passed = scheduleDate <= now;
              return (
                <span
                  key={sc.id}
                  title={`${sc.time} ${getAnnouncementLabel(sc.announcementRef)}`}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    passed
                      ? 'bg-gray-100 text-gray-400 line-through'
                      : 'bg-orange-100 text-orange-600'
                  }`}
                >
                  {sc.time}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
