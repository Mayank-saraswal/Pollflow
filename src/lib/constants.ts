export const SOCKET_EVENTS = {
  JOIN_POLL: 'join:poll',
  LEAVE_POLL: 'leave:poll',
  RESPONSE_NEW: 'response:new',
  POLL_PUBLISHED: 'poll:published',
  POLL_EXPIRED: 'poll:expired',
} as const

export const POLL_LIMITS = {
  MAX_QUESTIONS: 20,
  MAX_OPTIONS_PER_QUESTION: 10,
  MAX_TITLE_LENGTH: 100,
  MAX_QUESTION_LENGTH: 500,
  MAX_OPTION_LENGTH: 200,
  MAX_MEDIA_SIZE_MB: 50,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm'],
} as const

export const CACHE_KEYS = {
  POLL: (id: string) => `poll:${id}`,
  POLL_ANALYTICS: (id: string) => `poll:${id}:analytics`,
  POLL_BY_TOKEN: (token: string) => `poll:token:${token}`,
} as const

export const CACHE_TTL = {
  POLL: 300,      // 5 minutes
  ANALYTICS: 30, // 30 seconds
} as const
