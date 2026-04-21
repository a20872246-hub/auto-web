// 원격 방송 큐 + 세션 관리
// Redis 환경변수 있으면 Upstash Redis 사용 (인터넷 원격 접속 가능)
// 없으면 in-memory 폴백 (로컬 네트워크 전용)

import { redis } from './redis';

// In-memory 폴백 (Redis 미설정 시)
declare global {
  // eslint-disable-next-line no-var
  var __remoteQueue: Array<{ id: string; ref: string; bgmAction: string; ts: number }> | undefined;
  // eslint-disable-next-line no-var
  var __remoteSessions: Map<string, number> | undefined;
  // eslint-disable-next-line no-var
  var __remoteSeq: number | undefined;
}
if (!global.__remoteQueue) global.__remoteQueue = [];
if (!global.__remoteSessions) global.__remoteSessions = new Map();
if (!global.__remoteSeq) global.__remoteSeq = 0;

const QUEUE_KEY = 'rq:queue';
const SESSION_PREFIX = 'rq:sess:';

// ─── 큐 ───────────────────────────────────────────────────────────────────────

export async function queueAnnouncement(ref: string, bgmAction = 'none'): Promise<string> {
  const id = String(Date.now());
  if (redis) {
    await redis.rpush(QUEUE_KEY, JSON.stringify({ id, ref, bgmAction }));
    await redis.expire(QUEUE_KEY, 3600);
  } else {
    global.__remoteQueue!.push({ id, ref, bgmAction, ts: Date.now() });
    if (global.__remoteQueue!.length > 20) global.__remoteQueue!.shift();
  }
  return id;
}

export async function getNextAnnouncement(): Promise<{ id: string; ref: string; bgmAction: string } | null> {
  if (redis) {
    const raw = await redis.lindex(QUEUE_KEY, 0);
    if (!raw) return null;
    return typeof raw === 'string' ? JSON.parse(raw) : (raw as { id: string; ref: string; bgmAction: string });
  }
  return global.__remoteQueue![0] ?? null;
}

export async function clearAnnouncement(id: string): Promise<void> {
  if (redis) {
    const all = await redis.lrange(QUEUE_KEY, 0, -1);
    for (const raw of all) {
      const item = typeof raw === 'string' ? JSON.parse(raw) : raw as { id: string };
      if (item.id === id) {
        await redis.lrem(QUEUE_KEY, 1, raw);
        break;
      }
    }
  } else {
    const i = global.__remoteQueue!.findIndex((a) => a.id === id);
    if (i >= 0) global.__remoteQueue!.splice(i, 1);
  }
}

// ─── 세션 ─────────────────────────────────────────────────────────────────────

export async function createSession(): Promise<string> {
  const token = crypto.randomUUID();
  if (redis) {
    await redis.set(`${SESSION_PREFIX}${token}`, '1', { ex: 86400 });
  } else {
    global.__remoteSessions!.set(token, Date.now());
    const cutoff = Date.now() - 86400_000;
    for (const [t, ts] of global.__remoteSessions!.entries()) {
      if (ts < cutoff) global.__remoteSessions!.delete(t);
    }
  }
  return token;
}

export async function validateSession(token: string): Promise<boolean> {
  if (!token) return false;
  if (redis) {
    return (await redis.exists(`${SESSION_PREFIX}${token}`)) === 1;
  }
  return global.__remoteSessions!.has(token);
}

export async function deleteSession(token: string): Promise<void> {
  if (redis) {
    await redis.del(`${SESSION_PREFIX}${token}`);
  } else {
    global.__remoteSessions!.delete(token);
  }
}
