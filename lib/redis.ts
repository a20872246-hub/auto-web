import { Redis } from '@upstash/redis';

// UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN 환경변수가 설정된 경우에만 연결
// 없으면 null — API 라우트에서 in-memory 폴백으로 동작
export const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;
