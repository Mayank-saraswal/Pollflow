import { NextRequest } from 'next/server'
import { auth }     from '@/lib/auth'
import prisma       from '@/lib/prisma'
import { createQuizSchema } from '@/lib/validations/quiz'
import { apiSuccess, apiError, handleZodError, handleServerError } from '@/lib/api-response'
import { ZodError } from 'zod'

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

// GET /api/quiz — list host's quizzes
export async function GET(_req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return apiError('Unauthorized', 401)

    const quizzes = await prisma.quiz.findMany({
      where:   { hostId: session.user.id },
      include: {
        _count:   { select: { questions: true, sessions: true } },
        sessions: { orderBy: { createdAt: 'desc' }, take: 1, select: { phase: true, id: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return apiSuccess(quizzes)
  } catch (err) { return handleServerError(err) }
}

// POST /api/quiz — create quiz
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return apiError('Unauthorized', 401)

    const body   = await req.json()
    const parsed = createQuizSchema.parse(body)

    // Unique join code with collision retry
    let joinCode = generateJoinCode()
    let attempts = 0
    while (await prisma.quiz.findUnique({ where: { joinCode } }) && attempts < 5) {
      joinCode = generateJoinCode()
      attempts++
    }

    const quiz = await prisma.quiz.create({
      data: {
        title:           parsed.title,
        description:     parsed.description,
        joinCode,
        hostId:          session.user.id,
        accessMode:      parsed.accessMode,
        maxParticipants: parsed.maxParticipants,
        status:          'PUBLISHED',
        questions: {
          create: parsed.questions.map((q, qi) => ({
            text:      q.text,
            imageUrl:  q.imageUrl,
            type:      q.type,
            timeLimit: q.timeLimit,
            points:    q.points,
            order:     qi,
            options: {
              create: q.options.map((o, oi) => ({
                text:      o.text,
                imageUrl:  o.imageUrl,
                isCorrect: o.isCorrect,
                order:     oi,
              })),
            },
          })),
        },
      },
      include: { questions: { include: { options: true }, orderBy: { order: 'asc' } } },
    })
    return apiSuccess(quiz, 'Quiz created', 201)
  } catch (err) {
    if (err instanceof ZodError) return handleZodError(err)
    return handleServerError(err)
  }
}
