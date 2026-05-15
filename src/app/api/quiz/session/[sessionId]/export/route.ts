import { NextRequest, NextResponse } from 'next/server'
import { auth }  from '@/lib/auth'
import prisma    from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params
  const userSession = await auth()
  if (!userSession?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const session = await prisma.quizSession.findUnique({
    where:   { id: sessionId },
    include: {
      participants: {
        include: {
          answers: { include: { question: true, selectedOptions: true } },
        },
        orderBy: { score: 'desc' },
      },
      quiz: { include: { questions: { orderBy: { order: 'asc' } } } },
    },
  })
  if (!session) return new NextResponse('Not found', { status: 404 })
  if (session.hostId !== userSession.user.id) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const questions = session.quiz.questions

  const headers = [
    'Rank', 'Name', 'Total Score', 'Correct', 'Accuracy %',
    ...questions.map((_, i) => `Q${i + 1} Points`),
    ...questions.map((_, i) => `Q${i + 1} Time(ms)`),
  ]

  const rows = session.participants.map((p, i) => {
    const correctCount = p.answers.filter((a) => a.isCorrect).length
    const accuracy     = p.answers.length
      ? Math.round((correctCount / p.answers.length) * 100)
      : 0
    const qPoints = questions.map((q) => {
      const ans = p.answers.find((a) => a.questionId === q.id)
      return ans ? ans.pointsEarned : 0
    })
    const qTimes = questions.map((q) => {
      const ans = p.answers.find((a) => a.questionId === q.id)
      return ans ? ans.answerTimeMs : ''
    })
    return [
      i + 1, p.displayName, p.score, correctCount, accuracy,
      ...qPoints, ...qTimes
    ]
  })

  const csv = [headers, ...rows]
    .map((row) => row.map((v) => `"${v}"`).join(','))
    .join('\n')

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type':        'text/csv',
      'Content-Disposition': `attachment; filename="quiz-results-${sessionId}.csv"`,
    },
  })
}
