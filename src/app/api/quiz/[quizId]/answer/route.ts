import { NextRequest } from 'next/server'
import { auth }   from '@/lib/auth'
import prisma     from '@/lib/prisma'
import {
  getQuizState, submitAnswerAtomic, updateLeaderboard,
  incrementStreak, resetStreak,
  redis, QUIZ_KEYS, publishQuizEvent
} from '@/lib/redis'
import { submitAnswerSchema } from '@/lib/validations/quiz'
import { apiSuccess, apiError, handleZodError, handleServerError } from '@/lib/api-response'
import { ZodError } from 'zod'

// POST /api/quiz/[quizId]/answer
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    await params // consume params (quizId not needed directly, sessionId comes from body)
    const userSession = await auth()
    const body   = await req.json()
    const parsed = submitAnswerSchema.parse(body)

    const { sessionId, questionId, selectedOptionIds } = parsed

    // 1. Validate session state
    const state = await getQuizState(sessionId)
    if (!state)                            return apiError('Session not found', 404)
    if (state.phase !== 'QUESTION_ACTIVE') return apiError('Question is not active', 409)
    if (state.questionId !== questionId)   return apiError('Wrong question', 400)

    // 2. DEADLINE CHECK (server-authoritative)
    const questionStartedAt = parseInt(state.questionStartedAt ?? '0')
    const timeLimitMs       = parseInt(state.timeLimitMs ?? '30000')
    const now               = Date.now()
    const answerTimeMs      = now - questionStartedAt
    const gracePeriodMs     = 500

    if (answerTimeMs > timeLimitMs + gracePeriodMs) {
      return apiError('Time is up! Answer not accepted.', 410)
    }

    // 3. Get participant
    const participant = await prisma.sessionParticipant.findFirst({
      where: {
        sessionId,
        ...(userSession?.user?.id ? { userId: userSession.user.id } : {}),
      },
    })
    if (!participant) return apiError('You are not a participant', 403)

    // 4. Get question + correct answers
    const question = await prisma.quizQuestion.findUnique({
      where:   { id: questionId },
      include: { options: true },
    })
    if (!question) return apiError('Question not found', 404)

    // Validate selectedOptionIds belong to this question
    const validOptionIds = new Set(question.options.map((o) => o.id))
    const invalid = selectedOptionIds.filter((id) => !validOptionIds.has(id))
    if (invalid.length > 0) return apiError('Invalid option IDs', 400)

    // Single-select: enforce only 1 option
    if (question.type === 'SINGLE' && selectedOptionIds.length > 1) {
      return apiError('This question only allows one selection', 400)
    }

    // 5. SCORING
    const correctOptionIds  = new Set(
      question.options.filter((o) => o.isCorrect).map((o) => o.id)
    )
    const totalCorrect      = correctOptionIds.size
    const correctSelected   = selectedOptionIds.filter((id) => correctOptionIds.has(id)).length
    const incorrectSelected = selectedOptionIds.filter((id) => !correctOptionIds.has(id)).length
    const isCorrect         = correctSelected === totalCorrect && incorrectSelected === 0

    // Time bonus
    const timeFraction = Math.max(0,
      (timeLimitMs - Math.min(answerTimeMs, timeLimitMs)) / timeLimitMs
    )
    // Multi-select partial credit
    const partialRatio = question.type === 'MULTIPLE'
      ? Math.max(0, (correctSelected - incorrectSelected) / totalCorrect)
      : isCorrect ? 1 : 0

    const baseScore = Math.round(question.points * timeFraction * partialRatio)

    // Streak bonus
    let streak = 0
    if (isCorrect || (question.type === 'MULTIPLE' && partialRatio > 0)) {
      streak = await incrementStreak(sessionId, participant.id)
    } else {
      await resetStreak(sessionId, participant.id)
    }
    const STREAK_BONUS = 50
    const streakBonus  = isCorrect && streak > 1 ? STREAK_BONUS * (streak - 1) : 0
    const finalScore   = baseScore + streakBonus

    // 6. ATOMIC write (HSETNX prevents double answers)
    const payload = JSON.stringify({
      selectedOptionIds,
      answerTimeMs,
      score:     finalScore,
      isCorrect,
      streak,
      baseScore,
      streakBonus,
      partialRatio,
    })

    const accepted = await submitAnswerAtomic(sessionId, questionId, participant.id, payload)
    if (!accepted) return apiError('You already answered this question', 409)

    // 7. Update leaderboard in Redis
    const currentScore = parseInt(
      (await redis.hget(QUIZ_KEYS.scores(sessionId), participant.id) as string) ?? '0'
    )
    const newTotal = currentScore + finalScore
    await redis.hset(QUIZ_KEYS.scores(sessionId), { [participant.id]: String(newTotal) })
    await updateLeaderboard(sessionId, participant.id, newTotal)

    // 8. Publish live answer tick to admin
    const answerCount = parseInt(
      (await redis.get(QUIZ_KEYS.qAnswerCount(sessionId, questionId)) as string) ?? '0'
    )

    await publishQuizEvent(sessionId, {
      type:    'quiz:admin_answer_tick',
      room:    'admin',
      payload: {
        questionId,
        answerCount,
        participantId: participant.id,
      },
    })

    // 9. ACK to this participant
    await publishQuizEvent(sessionId, {
      type:    'quiz:answer_ack',
      room:    `p:${participant.id}`,
      payload: {
        questionId,
        accepted:     true,
        isCorrect,
        partialRatio,
        pointsEarned: finalScore,
        baseScore,
        streakBonus,
        streak,
        answerTimeMs,
      },
    })

    return apiSuccess({
      accepted:     true,
      pointsEarned: finalScore,
      isCorrect,
      streak,
    })
  } catch (err) {
    if (err instanceof ZodError) return handleZodError(err)
    return handleServerError(err)
  }
}
