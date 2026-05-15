import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { CACHE, cacheGet, cacheSet, cacheDel, pollCreateRatelimit } from '@/lib/redis'
import { createPollSchema } from '@/lib/validations/poll'
import {
  apiSuccess, apiError, handleZodError, handleServerError,
} from '@/lib/api-response'
import { nanoid } from 'nanoid'
import { ZodError } from 'zod'

// GET /api/polls — fetch authenticated user's polls
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return apiError('Unauthorized', 401)

    const { searchParams } = new URL(req.url)
    const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1'))
    const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '100'))
    const skip  = (page - 1) * limit

    const [polls, total] = await Promise.all([
      prisma.poll.findMany({
        where:   { creatorId: session.user.id },
        include: {
          questions: { select: { id: true } },
          _count:    { select: { responses: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.poll.count({ where: { creatorId: session.user.id } }),
    ])

    // Auto-expire polls that have passed their expiresAt
    const now      = new Date()
    const toExpire = polls.filter(
      (p) => p.status === 'ACTIVE' && p.expiresAt && p.expiresAt < now
    )
    if (toExpire.length > 0) {
      await prisma.poll.updateMany({
        where: { id: { in: toExpire.map((p) => p.id) } },
        data:  { status: 'EXPIRED' },
      })
      toExpire.forEach((p) => {
        cacheDel(CACHE.keys.poll(p.id))
        cacheDel(CACHE.keys.pollToken(p.shareToken))
      })
    }

    return apiSuccess({
      polls,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (err) {
    return handleServerError(err)
  }
}

// POST /api/polls — create new poll
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return apiError('Unauthorized', 401)

    // Rate limit per user
    const { success: allowed } = await pollCreateRatelimit.limit(session.user.id)
    if (!allowed) return apiError('Too many polls created. Please wait.', 429)

    const body   = await req.json()
    const parsed = createPollSchema.parse(body)

    const shareToken = nanoid(10)

    const poll = await prisma.poll.create({
      data: {
        title:       parsed.title,
        description: parsed.description,
        shareToken,
        creatorId:   session.user.id,
        voterMode:   parsed.voterMode,
        isAnonymous: parsed.isAnonymous,
        expiresAt:   parsed.expiresAt ? new Date(parsed.expiresAt) : null,
        questions: {
          create: parsed.questions.map((q, qIdx) => ({
            text:        q.text,
            imageUrl:    q.imageUrl,
            isMandatory: q.isMandatory,
            order:       q.order ?? qIdx,
            options: {
              create: q.options.map((o) => ({
                text:     o.text,
                imageUrl: o.imageUrl,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          include: { options: true },
          orderBy: { order: 'asc' },
        },
        _count: { select: { responses: true } },
      },
    })

    // Invalidate user polls cache
    cacheDel(CACHE.keys.userPolls(session.user.id))

    return apiSuccess(poll, 'Poll created successfully', 201)
  } catch (err) {
    if (err instanceof ZodError) return handleZodError(err)
    return handleServerError(err)
  }
}
