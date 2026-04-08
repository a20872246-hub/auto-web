export interface Announcement {
  id: string;
  label: string;
  text: string;
  voice: string;
  rate: number;
}

export interface Category {
  id: string;
  label: string;
  items: Announcement[];
}

export interface Schedule {
  id: string;
  time: string;
  label: string;
  announcementRef: string; // "categoryId/itemId"
  days: string[];
  bgmAction: 'play' | 'stop' | 'none';
  enabled: boolean;
}

export interface Settings {
  bgm: {
    volume: number;
    duckedVolume: number;
    fadeDuration: number;
    playlist: string[];
  };
  tts: {
    voice: string;
    chimeEnabled: boolean;
    chimeType: string;
    postDelay: number;
  };
}

export const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
export const DAY_LABELS: Record<string, string> = {
  sunday: '일', monday: '월', tuesday: '화', wednesday: '수',
  thursday: '목', friday: '금', saturday: '토',
};

export const VOICE_OPTIONS = [
  { value: 'ko-KR-SunHiNeural', label: '선희 (여성)' },
  { value: 'ko-KR-InJoonNeural', label: '인준 (남성)' },
  { value: 'ko-KR-HyunsuNeural', label: '현수 (남성)' },
  { value: 'ko-KR', label: '시스템 한국어' },
];

export const CHIME_OPTIONS = [
  { value: 'piano', label: '피아노' },
  { value: 'school_bell', label: '학교 종' },
  { value: 'ding_dong', label: '딩동' },
  { value: 'soft_chime', label: '소프트 차임' },
  { value: 'broadcast', label: '방송' },
  { value: 'bright_melody', label: '밝은 멜로디' },
  { value: 'simple_bell', label: '단순 벨' },
  { value: 'xylophone', label: '실로폰' },
];
