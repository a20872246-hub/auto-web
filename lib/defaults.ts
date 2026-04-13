import type { Category, Schedule, Settings } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'general',
    label: '일반 안내',
    items: [
      { id: 'opening', label: '개장 안내', text: '안녕하세요, ITN 피트니스입니다. 오늘도 활기찬 하루 되세요!', voice: 'sunhi-default', rate: 1.05 },
      { id: 'closing', label: '마감 안내', text: '마감 시간입니다. 오늘도 수고하셨습니다. 내일 뵙겠습니다!', voice: 'sunhi-default', rate: 1.05 },
      { id: 'closing_warning', label: '마감 30분전 안내', text: '마감 30분 전입니다. 운동 마무리 부탁드립니다.', voice: 'sunhi-default', rate: 1.05 },
      { id: 'opening_weekend', label: '주말 개장 안내', text: '안녕하세요, ITN 피트니스입니다. 주말에도 건강한 하루 보내세요!', voice: 'sunhi-default', rate: 1.05 },
    ],
  },
  {
    id: 'safety',
    label: '안전/위생 안내',
    items: [
      { id: 'general_safety', label: '일반 안전 수칙', text: '안전 수칙 안내입니다. 운동 전 충분한 스트레칭을 해주세요. 무거운 중량 사용 시 반드시 보조자와 함께해 주세요.', voice: 'sunhi-default', rate: 1.0 },
      { id: 'sanitize', label: '기구 소독 안내', text: '회원님, 기구 사용 후 소독 티슈로 닦아주세요. 깨끗한 환경은 모두의 노력입니다.', voice: 'sunhi-default', rate: 1.0 },
      { id: 'rack', label: '정리정돈 안내', text: '사용하신 덤벨과 플레이트는 제자리에 정리해 주세요.', voice: 'sunhi-default', rate: 1.0 },
    ],
  },
  {
    id: 'emergency',
    label: '긴급 방송',
    items: [
      { id: 'emergency', label: '긴급 안내', text: '긴급 안내 방송입니다. 즉시 시설 관리자의 안내에 따라주시기 바랍니다.', voice: 'injoon-default', rate: 0.9 },
    ],
  },
];

export const DEFAULT_SCHEDULES: Schedule[] = [
  { id: 's1', time: '06:00', label: '개장 안내', announcementRef: 'general/opening', days: ['monday','tuesday','wednesday','thursday','friday'], bgmAction: 'play', enabled: true },
  { id: 's2', time: '09:00', label: '안전 수칙 안내', announcementRef: 'safety/general_safety', days: ['monday','tuesday','wednesday','thursday','friday'], bgmAction: 'none', enabled: true },
  { id: 's3', time: '17:00', label: '기구 소독 안내', announcementRef: 'safety/sanitize', days: ['monday','tuesday','wednesday','thursday','friday'], bgmAction: 'none', enabled: true },
  { id: 's4', time: '18:30', label: '마감 30분전 안내', announcementRef: 'general/closing_warning', days: ['saturday'], bgmAction: 'none', enabled: true },
  { id: 's5', time: '19:00', label: '마감 안내', announcementRef: 'general/closing', days: ['saturday'], bgmAction: 'stop', enabled: true },
];

export const DEFAULT_SETTINGS: Settings = {
  bgm: {
    volume: 70,
    duckedVolume: 10,
    fadeDuration: 1500,
    playlist: [],
  },
  tts: {
    voice: 'sunhi-default',
    chimeEnabled: true,
    chimeType: 'piano',
    postDelay: 1000,
  },
};
