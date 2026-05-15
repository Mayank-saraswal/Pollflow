import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

// Singleton Redis client
export const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Rate limiter: 10 poll submissions per IP per 1 minute
export const pollSubmitRatelimit = new Ratelimit({
  redis,
  limiter:   Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix:    'pollflow:ratelimit:submit',
})

// Rate limiter: 5 poll creates per user per 10 minutes
export const pollCreateRatelimit = new Ratelimit({
  redis,
  limiter:   Ratelimit.slidingWindow(5, '10 m'),
  analytics: true,
  prefix:    'pollflow:ratelimit:create',
})

// Cache key helpers
export const CACHE = {
  keys: {
    poll:      (id: string)     => `poll:${id}`,
    pollToken: (token: string)  => `poll:token:${token}`,
    analytics: (id: string)     => `poll:analytics:${id}`,
    userPolls: (userId: string) => `user:polls:${userId}`,
  },
  ttl: {
    poll:      300, // 5 min
    analytics: 15,  // 15 sec — fast refresh for live dashboard
    userPolls: 60,  // 1 min
  },
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get<T>(key)
    return data ?? null
  } catch {
    return null
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value))
  } catch {
    // Cache failures are non-fatal — degrade gracefully
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    await redis.del(key)
  } catch {
    // Non-fatal
  }
}

// Pub/Sub publisher for real-time updates
export async function publishPollUpdate(
  pollId: string,
  payload: object
): Promise<void> {
  try {
    await redis.publish(
      `pollflow:poll:${pollId}`,
      JSON.stringify(payload)
    )
  } catch {
    // Non-fatal
  }
}

// ── Quiz session keys ─────────────────────────────────────────────
export const QUIZ_KEYS = {
  state:        (sid: string) => `quiz:${sid}:state`,
  scores:       (sid: string) => `quiz:${sid}:scores`,
  streaks:      (sid: string) => `quiz:${sid}:streaks`,
  leaderboard:  (sid: string) => `quiz:${sid}:lb`,
  participants: (sid: string) => `quiz:${sid}:participants`,
  qAnswers:     (sid: string, qid: string) => `quiz:${sid}:q:${qid}:answers`,
  qAnswerCount: (sid: string, qid: string) => `quiz:${sid}:q:${qid}:count`,
}

export const QUIZ_TTL = 60 * 60 * 6 // 6 hours

// ── Atomic answer submission ──────────────────────────────────────
// Returns false if answer already exists (HSETNX is atomic)
export async function submitAnswerAtomic(
  sessionId:     string,
  questionId:    string,
  participantId: string,
  payload:       string // JSON
): Promise<boolean> {
  const key    = QUIZ_KEYS.qAnswers(sessionId, questionId)
  const result = await redis.hsetnx(key, participantId, payload)
  if (result === 1) {
    await redis.incr(QUIZ_KEYS.qAnswerCount(sessionId, questionId))
    await redis.expire(key, QUIZ_TTL)
  }
  return result === 1
}

// ── Update leaderboard sorted set ────────────────────────────────
export async function updateLeaderboard(
  sessionId:     string,
  participantId: string,
  score:         number
): Promise<void> {
  await redis.zadd(
    QUIZ_KEYS.leaderboard(sessionId),
    { score, member: participantId }
  )
  await redis.expire(QUIZ_KEYS.leaderboard(sessionId), QUIZ_TTL)
}

// ── Get top N from leaderboard ────────────────────────────────────
export async function getTopLeaderboard(
  sessionId: string,
  topN:      number = 10
): Promise<{ participantId: string; score: number }[]> {
  const results = await redis.zrange(
    QUIZ_KEYS.leaderboard(sessionId),
    0, topN - 1,
    { rev: true, withScores: true }
  )
  // Upstash returns alternating [member, score, member, score, ...]
  const entries: { participantId: string; score: number }[] = []
  for (let i = 0; i < results.length; i += 2) {
    entries.push({
      participantId: results[i] as string,
      score:         Number(results[i + 1]),
    })
  }
  return entries
}

// ── Session state helpers ─────────────────────────────────────────
export async function setQuizState(
  sessionId: string,
  state:     Record<string, string | number | null>
): Promise<void> {
  const key = QUIZ_KEYS.state(sessionId)
  const flat: Record<string, string> = {}
  for (const [k, v] of Object.entries(state)) {
    flat[k] = v === null ? '' : String(v)
  }
  await redis.hset(key, flat)
  await redis.expire(key, QUIZ_TTL)
}

export async function getQuizState(
  sessionId: string
): Promise<Record<string, string> | null> {
  const state = await redis.hgetall(QUIZ_KEYS.state(sessionId))
  if (!state || Object.keys(state).length === 0) return null
  return state as Record<string, string>
}

// ── Streak helpers ────────────────────────────────────────────────
export async function incrementStreak(
  sessionId:     string,
  participantId: string
): Promise<number> {
  const key    = QUIZ_KEYS.streaks(sessionId)
  const streak = await redis.hincrby(key, participantId, 1)
  await redis.expire(key, QUIZ_TTL)
  return streak
}

export async function resetStreak(
  sessionId:     string,
  participantId: string
): Promise<void> {
  await redis.hset(QUIZ_KEYS.streaks(sessionId), { [participantId]: '0' })
}

export async function getStreak(
  sessionId:     string,
  participantId: string
): Promise<number> {
  const val = await redis.hget(QUIZ_KEYS.streaks(sessionId), participantId)
  return val ? parseInt(val as string) : 0
}

// ── Publish quiz event ────────────────────────────────────────────
export async function publishQuizEvent(
  sessionId: string,
  event:     object
): Promise<void> {
  try {
    await redis.publish(
      `quiz:${sessionId}:events`,
      JSON.stringify(event)
    )
  } catch {
    // non-fatal
  }
}
