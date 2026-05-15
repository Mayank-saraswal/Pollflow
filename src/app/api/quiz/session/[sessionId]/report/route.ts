import { NextRequest }  from 'next/server'
import { auth }         from '@/lib/auth'
import prisma           from '@/lib/prisma'
import { apiSuccess, apiError, handleServerError } from '@/lib/api-response'

// GET — personal or admin full report
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const userSession = await auth()
    if (!userSession?.user?.id) return apiError('Unauthorized', 401)

    const session = await prisma.quizSession.findUnique({
      where:   { id: sessionId },
      include: { quiz: { include: { questions: { include: { options: true }, orderBy: { order: 'asc' } } } } },
    })
    if (!session) return apiError('Session not found', 404)
    if (session.phase !== 'QUIZ_ENDED') return apiError('Quiz not ended yet', 403)

    const isHost = session.hostId === userSession.user.id

    // ── ADMIN report ──────────────────────────────────────────────
    if (isHost) {
      const participants = await prisma.sessionParticipant.findMany({
        where:   { sessionId },
        include: {
          answers: {
            include: { selectedOptions: true },
            orderBy: { submittedAt: 'asc' },
          },
        },
        orderBy: [{ score: 'desc' }],
      })

      const questionStats = session.quiz.questions.map((q) => {
        const allAnswers = participants.flatMap((p) =>
          p.answers.filter((a) => a.questionId === q.id)
        )
        const correctCount = allAnswers.filter((a) => a.isCorrect).length
        const avgTime      = allAnswers.length
          ? Math.round(allAnswers.reduce((s, a) => s + a.answerTimeMs, 0) / allAnswers.length)
          : 0
        const optionCounts: Record<string, number> = {}
        q.options.forEach((o) => { optionCounts[o.id] = 0 })
        allAnswers.forEach((a) =>
          a.selectedOptions.forEach((o) => { optionCounts[o.id] = (optionCounts[o.id] ?? 0) + 1 })
        )
        return {
          questionId:      q.id,
          questionText:    q.text,
          type:            q.type,
          totalAnswers:    allAnswers.length,
          correctCount,
          correctRate:     allAnswers.length ? Math.round((correctCount / allAnswers.length) * 100) : 0,
          avgAnswerTimeMs: avgTime,
          optionCounts,
          options:         q.options.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
          correctOptionIds: q.options.filter((o) => o.isCorrect).map((o) => o.id),
        }
      })

      return apiSuccess({
        role:              'admin',
        session:           { id: session.id, startedAt: session.startedAt, endedAt: session.endedAt },
        quiz:              { title: session.quiz.title, totalQuestions: session.quiz.questions.length },
        totalParticipants: participants.length,
        leaderboard:       participants.slice(0, 50).map((p) => ({
          rank:            p.rank,
          participantId:   p.id,
          displayName:     p.displayName,
          avatarUrl:       p.avatarUrl,
          score:           p.score,
          correctCount:    p.answers.filter((a) => a.isCorrect).length,
          avgAnswerTimeMs: p.answers.length
            ? Math.round(p.answers.reduce((s, a) => s + a.answerTimeMs, 0) / p.answers.length)
            : 0,
        })),
        questionStats,
      })
    }

    // ── PARTICIPANT personal report ────────────────────────────────
    const participant = await prisma.sessionParticipant.findFirst({
      where:   { sessionId, userId: userSession.user.id },
      include: {
        answers: {
          include: { question: true, selectedOptions: true },
          orderBy: { question: { order: 'asc' } },
        },
      },
    })
    if (!participant) return apiError('You did not participate in this quiz', 403)

    const totalParticipants = await prisma.sessionParticipant.count({
      where: { sessionId },
    })

    const questionBreakdown = participant.answers.map((a) => {
      const q              = session.quiz.questions.find((q) => q.id === a.questionId)!
      const correctOptions = q.options.filter((o) => o.isCorrect)
      return {
        questionId:      a.questionId,
        questionText:    a.question.text,
        type:            a.question.type,
        selectedOptions: a.selectedOptions.map((o) => ({ id: o.id, text: o.text })),
        correctOptions:  correctOptions.map((o) => ({ id: o.id, text: o.text })),
        isCorrect:       a.isCorrect,
        pointsEarned:    a.pointsEarned,
        answerTimeMs:    a.answerTimeMs,
        streak:          a.streak,
      }
    })

    const correctCount = questionBreakdown.filter((q) => q.isCorrect).length
    const accuracy     = questionBreakdown.length
      ? Math.round((correctCount / questionBreakdown.length) * 100)
      : 0
    const percentile   = totalParticipants > 1
      ? Math.round(((totalParticipants - (participant.rank ?? 1)) / (totalParticipants - 1)) * 100)
      : 100

    return apiSuccess({
      role:              'participant',
      participant:       { displayName: participant.displayName, score: participant.score, rank: participant.rank },
      quiz:              { title: session.quiz.title, totalQuestions: session.quiz.questions.length },
      totalParticipants,
      correctCount,
      accuracy,
      percentile,
      questionBreakdown,
    })
  } catch (err) { return handleServerError(err) }
}
