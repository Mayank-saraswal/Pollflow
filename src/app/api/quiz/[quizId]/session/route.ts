import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import prisma   from '@/lib/prisma'
import {
  setQuizState, getQuizState, publishQuizEvent,
  QUIZ_KEYS, redis, QUIZ_TTL,
  getTopLeaderboard
} from '@/lib/redis'
import { apiSuccess, apiError, handleServerError } from '@/lib/api-response'

// POST /api/quiz/[quizId]/session  — admin controls
// body: { action: 'start_lobby' | 'start_question' | 'end_question' | 'end_quiz' }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params
    const authSession = await auth()
    if (!authSession?.user?.id) return apiError('Unauthorized', 401)

    const quiz = await prisma.quiz.findUnique({
      where:   { id: quizId },
      include: { questions: { include: { options: true }, orderBy: { order: 'asc' } } },
    })
    if (!quiz)                               return apiError('Quiz not found', 404)
    if (quiz.hostId !== authSession.user.id)  return apiError('Forbidden', 403)

    const { action } = await req.json() as {
      action: 'start_lobby' | 'start_question' | 'end_question' | 'end_quiz'
    }

    // ── START LOBBY ────────────────────────────────────────────────
    if (action === 'start_lobby') {
      const existing = await prisma.quizSession.findFirst({
        where: { quizId, phase: { in: ['LOBBY', 'QUESTION_ACTIVE', 'QUESTION_ENDED'] } }
      })
      if (existing) return apiError('A session is already active', 409)

      const dbSession = await prisma.quizSession.create({
        data: {
          quizId,
          hostId:          authSession.user.id,
          phase:           'LOBBY',
          currentQuestion: 0,
        },
      })

      await setQuizState(dbSession.id, {
        phase:      'LOBBY',
        currentQ:   '0',
        quizId,
        totalQ:     String(quiz.questions.length),
        hostId:     authSession.user.id,
        startedAt:  '',
      })

      await publishQuizEvent(dbSession.id, {
        type:    'quiz:lobby_update',
        room:    'all',
        payload: { phase: 'LOBBY', sessionId: dbSession.id, joinCode: quiz.joinCode },
      })

      return apiSuccess({ sessionId: dbSession.id, joinCode: quiz.joinCode }, 'Lobby started')
    }

    // ── GET ACTIVE SESSION ─────────────────────────────────────────
    const activeSession = await prisma.quizSession.findFirst({
      where:   { quizId, phase: { notIn: ['QUIZ_ENDED'] } },
      include: { participants: true },
      orderBy: { createdAt: 'desc' },
    })
    if (!activeSession) return apiError('No active session', 404)
    const sid = activeSession.id

    // ── START QUESTION ─────────────────────────────────────────────
    if (action === 'start_question') {
      const state = await getQuizState(sid)
      if (!state) return apiError('Session state not found', 404)

      const currentQIdx = parseInt(state.currentQ ?? '0')
      if (currentQIdx >= quiz.questions.length) {
        return apiError('No more questions', 400)
      }

      const question          = quiz.questions[currentQIdx]
      const questionStartedAt = Date.now()

      await setQuizState(sid, {
        phase:              'QUESTION_ACTIVE',
        currentQ:           String(currentQIdx),
        questionId:         question.id,
        questionStartedAt:  String(questionStartedAt),
        timeLimitMs:        String(question.timeLimit * 1000),
      })

      await prisma.quizSession.update({
        where: { id: sid },
        data:  {
          phase:             'QUESTION_ACTIVE',
          currentQuestion:   currentQIdx,
          questionStartedAt: new Date(questionStartedAt),
          startedAt:         activeSession.startedAt ?? new Date(),
        },
      })

      // Broadcast question (NEVER include isCorrect!)
      const safeOptions = question.options.map(({ id, text, imageUrl, order }) => ({
        id, text, imageUrl, order
      }))

      await publishQuizEvent(sid, {
        type:    'quiz:question_start',
        room:    'all',
        payload: {
          sessionId:      sid,
          questionIndex:  currentQIdx,
          totalQuestions: quiz.questions.length,
          question: {
            id:        question.id,
            text:      question.text,
            imageUrl:  question.imageUrl,
            type:      question.type,
            timeLimit: question.timeLimit,
            points:    question.points,
            options:   safeOptions,
          },
          serverTime: questionStartedAt,
        },
      })

      return apiSuccess({ questionId: question.id, serverTime: questionStartedAt })
    }

    // ── END QUESTION ───────────────────────────────────────────────
    if (action === 'end_question') {
      const state = await getQuizState(sid)
      if (!state || state.phase !== 'QUESTION_ACTIVE') {
        return apiError('No active question', 400)
      }

      const currentQIdx  = parseInt(state.currentQ)
      const question     = quiz.questions[currentQIdx]
      const questionId   = question.id

      // Batch persist all answers from Redis → Postgres
      const rawAnswers = await redis.hgetall(QUIZ_KEYS.qAnswers(sid, questionId)) ?? {}
      const correctOptionIds = new Set(
        question.options.filter((o) => o.isCorrect).map((o) => o.id)
      )

      await prisma.$transaction(async (tx) => {
        for (const [participantId, rawVal] of Object.entries(rawAnswers)) {
          const raw = typeof rawVal === 'string' ? rawVal : JSON.stringify(rawVal)
          const data = JSON.parse(raw) as {
            selectedOptionIds: string[]
            answerTimeMs:      number
            score:             number
            isCorrect:         boolean
            streak:            number
          }

          const selectedOptions = question.options.filter(
            (o) => data.selectedOptionIds.includes(o.id)
          )

          await tx.sessionAnswer.upsert({
            where: {
              sessionId_participantId_questionId: {
                sessionId:     sid,
                participantId,
                questionId,
              },
            },
            create: {
              sessionId:     sid,
              participantId,
              questionId,
              isCorrect:     data.isCorrect,
              pointsEarned:  data.score,
              answerTimeMs:  data.answerTimeMs,
              streak:        data.streak,
              submittedAt:   new Date(),
              selectedOptions: {
                connect: selectedOptions.map((o) => ({ id: o.id }))
              },
            },
            update: {},
          })

          await tx.sessionParticipant.update({
            where: { id: participantId },
            data:  { score: { increment: data.score } },
          })
        }
      })

      // Compute per-option answer counts
      const optionCounts: Record<string, number> = {}
      question.options.forEach((o) => { optionCounts[o.id] = 0 })
      Object.values(rawAnswers).forEach((rawVal) => {
        const raw = typeof rawVal === 'string' ? rawVal : JSON.stringify(rawVal)
        const { selectedOptionIds } = JSON.parse(raw)
        selectedOptionIds.forEach((oid: string) => {
          optionCounts[oid] = (optionCounts[oid] ?? 0) + 1
        })
      })

      // Get top 10 leaderboard
      const topEntries   = await getTopLeaderboard(sid, 10)
      const participants = activeSession.participants
      const leaderboard  = topEntries.map((e, i) => {
        const p = participants.find((p) => p.id === e.participantId)
        return {
          rank:          i + 1,
          participantId: e.participantId,
          displayName:   p?.displayName ?? 'Unknown',
          avatarUrl:     p?.avatarUrl,
          score:         e.score,
        }
      })

      // Update state
      const nextQ = currentQIdx + 1
      await setQuizState(sid, {
        phase:     'QUESTION_ENDED',
        currentQ:  String(nextQ),
        questionId,
      })
      await prisma.quizSession.update({
        where: { id: sid },
        data:  { phase: 'QUESTION_ENDED', currentQuestion: nextQ },
      })

      // Broadcast results
      await publishQuizEvent(sid, {
        type:    'quiz:question_end',
        room:    'all',
        payload: {
          sessionId:        sid,
          questionId,
          correctOptionIds: [...correctOptionIds],
          optionCounts,
          totalAnswered:    Object.keys(rawAnswers).length,
          leaderboard,
        },
      })

      // Admin stats
      const totalParticipants = activeSession.participants.length
      await publishQuizEvent(sid, {
        type:    'quiz:admin_stats',
        room:    'admin',
        payload: {
          questionId,
          correctCount: Object.values(rawAnswers).filter((r) => {
            const raw = typeof r === 'string' ? r : JSON.stringify(r)
            return JSON.parse(raw).isCorrect
          }).length,
          totalAnswered: Object.keys(rawAnswers).length,
          totalParticipants,
          optionCounts,
          leaderboard,
        },
      })

      return apiSuccess({ leaderboard, nextQuestionIndex: nextQ })
    }

    // ── END QUIZ ───────────────────────────────────────────────────
    if (action === 'end_quiz') {
      const finalParticipants = await prisma.sessionParticipant.findMany({
        where:   { sessionId: sid },
        orderBy: [{ score: 'desc' }],
      })

      await prisma.$transaction([
        ...finalParticipants.map((p, i) =>
          prisma.sessionParticipant.update({
            where: { id: p.id },
            data:  { rank: i + 1 },
          })
        ),
        prisma.quizSession.update({
          where: { id: sid },
          data:  { phase: 'QUIZ_ENDED', endedAt: new Date() },
        }),
      ])

      await setQuizState(sid, { phase: 'QUIZ_ENDED' })

      const finalLeaderboard = finalParticipants.slice(0, 10).map((p, i) => ({
        rank:          i + 1,
        participantId: p.id,
        displayName:   p.displayName,
        avatarUrl:     p.avatarUrl,
        score:         p.score,
      }))

      await publishQuizEvent(sid, {
        type:    'quiz:end',
        room:    'all',
        payload: { sessionId: sid, finalLeaderboard },
      })

      return apiSuccess({ finalLeaderboard })
    }

    return apiError('Invalid action', 400)
  } catch (err) { return handleServerError(err) }
}

// GET /api/quiz/[quizId]/session — get active session info
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params
    const authSession = await auth()
    if (!authSession?.user?.id) return apiError('Unauthorized', 401)

    const session = await prisma.quizSession.findFirst({
      where:   { quizId, phase: { notIn: ['QUIZ_ENDED'] } },
      include: { participants: { select: { id: true, displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    })

    if (!session) return apiError('No active session', 404)

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { orderBy: { order: 'asc' }, select: { id: true, text: true, type: true, timeLimit: true, points: true, order: true } } }
    })

    return apiSuccess({
      session,
      quiz: quiz ? { title: quiz.title, joinCode: quiz.joinCode, totalQuestions: quiz.questions.length, questions: quiz.questions } : null,
    })
  } catch (err) { return handleServerError(err) }
}
