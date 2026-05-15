import { NextRequest } from 'next/server'
import { auth }   from '@/lib/auth'
import prisma     from '@/lib/prisma'
import { redis, QUIZ_KEYS, QUIZ_TTL, publishQuizEvent } from '@/lib/redis'
import { apiSuccess, apiError, handleServerError } from '@/lib/api-response'

// POST /api/quiz/join
// body: { joinCode: string, displayName?: string }
export async function POST(req: NextRequest) {
  try {
    const userSession  = await auth()
    const { joinCode, displayName } = await req.json() as {
      joinCode: string
      displayName?: string
    }

    if (!joinCode) return apiError('Join code required', 400)

    const quiz = await prisma.quiz.findUnique({
      where: { joinCode: joinCode.toUpperCase().trim() },
    })
    if (!quiz)                       return apiError('Invalid join code', 404)
    if (quiz.status !== 'PUBLISHED') return apiError('Quiz is not available', 403)

    // Auth check
    if (quiz.accessMode === 'AUTHENTICATED_ONLY' && !userSession?.user?.id) {
      return apiError('You must be logged in to join this quiz', 401)
    }

    // Find active session in LOBBY phase
    const session = await prisma.quizSession.findFirst({
      where:   { quizId: quiz.id, phase: 'LOBBY' },
      orderBy: { createdAt: 'desc' },
    })
    if (!session) return apiError('No active quiz lobby. Ask the host to start.', 404)

    // Check participant cap
    const currentCount = await prisma.sessionParticipant.count({
      where: { sessionId: session.id },
    })
    if (currentCount >= quiz.maxParticipants) {
      return apiError('Quiz is full', 429)
    }

    // Upsert participant
    const name   = displayName?.trim() || userSession?.user?.name || 'Anonymous'
    const avatar = userSession?.user?.image || null

    const existing = userSession?.user?.id
      ? await prisma.sessionParticipant.findUnique({
          where: { sessionId_userId: { sessionId: session.id, userId: userSession.user.id } },
        })
      : null

    const participant = existing ?? await prisma.sessionParticipant.create({
      data: {
        sessionId:   session.id,
        userId:      userSession?.user?.id ?? null,
        displayName: name,
        avatarUrl:   avatar,
      },
    })

    // Add to Redis participant set
    await redis.sadd(QUIZ_KEYS.participants(session.id), participant.id)
    await redis.expire(QUIZ_KEYS.participants(session.id), QUIZ_TTL)

    // Update lobby count broadcast
    const count = await redis.scard(QUIZ_KEYS.participants(session.id))
    await publishQuizEvent(session.id, {
      type:    'quiz:lobby_update',
      room:    'all',
      payload: {
        phase:            'LOBBY',
        sessionId:        session.id,
        participantCount: count,
        latestJoin:       { displayName: name, avatarUrl: avatar },
      },
    })

    return apiSuccess({
      sessionId:     session.id,
      participantId: participant.id,
      quizTitle:     quiz.title,
      displayName:   name,
    }, 'Joined successfully')
  } catch (err) { return handleServerError(err) }
}
