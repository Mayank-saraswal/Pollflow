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
