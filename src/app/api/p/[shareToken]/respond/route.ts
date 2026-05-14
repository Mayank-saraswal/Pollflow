import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { pollSubmitRatelimit, cacheDel, publishPollUpdate, CACHE } from '@/lib/redis'
import { submitResponseSchema } from '@/lib/validations/response'
import {
  apiSuccess, apiError, handleZodError, handleServerError,
  getClientIp, hashIdentifier,
} from '@/lib/api-response'
import { ZodError } from 'zod'

interface RouteParams {
  params: Promise<{ shareToken: string }>
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { shareToken } = await params
    const ip = getClientIp(req)

    // Rate limit by IP
    const { success: allowed } = await pollSubmitRatelimit.limit(ip)
    if (!allowed) return apiError('Too many submissions. Please wait.', 429)

    // Fetch poll with questions and options
    const poll = await prisma.poll.findUnique({
      where:   { shareToken },
      include: {
        questions: {
          include: { options: { select: { id: true } } },
        },
      },
    })

    if (!poll) return apiError('Poll not found', 404)
    if (poll.status !== 'ACTIVE') {
      return apiError('This poll is no longer accepting responses', 410)
    }
    if (poll.expiresAt && poll.expiresAt < new Date()) {
      await prisma.poll.update({ where: { id: poll.id }, data: { status: 'EXPIRED' } })
      return apiError('This poll has expired', 410)
    }

    // Auth gate
    const session = await auth()
    if (poll.voterMode === 'AUTHENTICATED_ONLY' && !session?.user?.id) {
      return apiError('You must be logged in to respond to this poll', 401)
    }

    // Parse and validate body
    const body   = await req.json()
    const parsed = submitResponseSchema.parse(body)

    // Build lookup maps for fast validation
    const questionMap = new Map(poll.questions.map((q) => [q.id, q]))

    // Validate: check mandatory questions answered
    const mandatoryIds     = poll.questions.filter((q) => q.isMandatory).map((q) => q.id)
    const answeredIds      = new Set(parsed.answers.map((a) => a.questionId))
    const missingMandatory = mandatoryIds.filter((id) => !answeredIds.has(id))

    if (missingMandatory.length > 0) {
      return apiError('Please answer all required questions', 400, {
        missingQuestions: missingMandatory,
      })
    }

    // Validate each answer belongs to correct question with a valid option
    for (const answer of parsed.answers) {
      const question = questionMap.get(answer.questionId)
      if (!question) {
        return apiError(`Invalid question ID: ${answer.questionId}`, 400)
      }
      const optionBelongs = question.options.some((o) => o.id === answer.optionId)
      if (!optionBelongs) {
        return apiError(
          `Option ${answer.optionId} does not belong to question ${answer.questionId}`,
          400
        )
      }
    }

    // Dedup: prevent duplicate submissions
    if (session?.user?.id) {
      const existing = await prisma.response.findUnique({
        where: { pollId_respondentId: { pollId: poll.id, respondentId: session.user.id } },
      })
      if (existing) return apiError('You have already responded to this poll', 409)
    } else {
      const ipHash   = await hashIdentifier(ip, poll.id)
      const existing = await prisma.response.findFirst({
        where: { pollId: poll.id, ipHash, respondentId: null },
      })
      if (existing) return apiError('You have already responded to this poll', 409)
    }

    // Store ipHash only for anonymous dedup or when poll.isAnonymous is true
    const ipHash = poll.isAnonymous
      ? await hashIdentifier(ip, poll.id)
      : session?.user?.id
        ? null
        : await hashIdentifier(ip, poll.id) // store for anon dedup even if not anonymous poll

    const response = await prisma.$transaction(async (tx) => {
      return tx.response.create({
        data: {
          pollId:      poll.id,
          respondentId: session?.user?.id ?? null,
          ipHash,
          answers: {
            create: parsed.answers.map((a) => ({
              questionId: a.questionId,
              optionId:   a.optionId,
            })),
          },
        },
      })
    })

    // Get updated total for real-time push
    const totalResponses = await prisma.response.count({ where: { pollId: poll.id } })

    // Invalidate analytics cache + publish real-time update
    await cacheDel(CACHE.keys.analytics(poll.id))
    await publishPollUpdate(poll.id, {
      pollId: poll.id,
      totalResponses,
      event: 'response:new',
    })

    return apiSuccess(
      { responseId: response.id },
      'Response submitted successfully',
      201
    )
  } catch (err) {
    if (err instanceof ZodError) return handleZodError(err)
    return handleServerError(err)
  }
}
