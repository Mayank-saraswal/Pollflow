import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { CACHE, cacheGet, cacheSet, cacheDel } from '@/lib/redis'
import { updatePollSchema } from '@/lib/validations/poll'
import {
  apiSuccess, apiError, handleZodError, handleServerError,
} from '@/lib/api-response'
import { ZodError } from 'zod'

interface RouteParams {
  params: Promise<{ pollId: string }>
}

// GET /api/polls/[pollId] — get single poll (creator only)
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { pollId } = await params
    const session = await auth()
    if (!session?.user?.id) return apiError('Unauthorized', 401)

    const cacheKey = CACHE.keys.poll(pollId)
    const cached   = await cacheGet(cacheKey)
    if (cached) return apiSuccess(cached)

    const poll = await prisma.poll.findUnique({
      where:   { id: pollId },
      include: {
        questions: {
          include: { options: true },
          orderBy: { order: 'asc' },
        },
        _count: { select: { responses: true } },
      },
    })

    if (!poll)                        return apiError('Poll not found', 404)
    if (poll.creatorId !== session.user.id) return apiError('Forbidden', 403)

    // Auto-expire check
    if (poll.status === 'ACTIVE' && poll.expiresAt && poll.expiresAt < new Date()) {
      await prisma.poll.update({ where: { id: poll.id }, data: { status: 'EXPIRED' } })
      poll.status = 'EXPIRED'
    }

    await cacheSet(cacheKey, poll, CACHE.ttl.poll)
    return apiSuccess(poll)
  } catch (err) {
    return handleServerError(err)
  }
}

// PATCH /api/polls/[pollId] — update poll
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { pollId } = await params
    const session = await auth()
    if (!session?.user?.id) return apiError('Unauthorized', 401)

    const existing = await prisma.poll.findUnique({ where: { id: pollId } })
    if (!existing)                              return apiError('Poll not found', 404)
    if (existing.creatorId !== session.user.id) return apiError('Forbidden', 403)
    if (existing.status === 'PUBLISHED')        return apiError('Cannot edit a published poll', 400)

    const body   = await req.json()
    const parsed = updatePollSchema.parse(body)

    const updated = await prisma.poll.update({
      where: { id: pollId },
      data: {
        ...(parsed.title       !== undefined && { title: parsed.title }),
        ...(parsed.description !== undefined && { description: parsed.description }),
        ...(parsed.voterMode   !== undefined && { voterMode: parsed.voterMode }),
        ...(parsed.isAnonymous !== undefined && { isAnonymous: parsed.isAnonymous }),
        ...(parsed.expiresAt   !== undefined && {
          expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
        }),
      },
      include: {
        questions: { include: { options: true }, orderBy: { order: 'asc' } },
        _count:    { select: { responses: true } },
      },
    })

    cacheDel(CACHE.keys.poll(pollId))
    cacheDel(CACHE.keys.pollToken(existing.shareToken))

    return apiSuccess(updated, 'Poll updated')
  } catch (err) {
    if (err instanceof ZodError) return handleZodError(err)
    return handleServerError(err)
  }
}

// DELETE /api/polls/[pollId]
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const { pollId } = await params
    const session = await auth()
    if (!session?.user?.id) return apiError('Unauthorized', 401)

    const poll = await prisma.poll.findUnique({ where: { id: pollId } })
    if (!poll)                              return apiError('Poll not found', 404)
    if (poll.creatorId !== session.user.id) return apiError('Forbidden', 403)

    await prisma.poll.delete({ where: { id: pollId } })

    await Promise.all([
      cacheDel(CACHE.keys.poll(pollId)),
      cacheDel(CACHE.keys.pollToken(poll.shareToken)),
      cacheDel(CACHE.keys.analytics(pollId)),
      cacheDel(CACHE.keys.userPolls(session.user.id)),
    ])

    return apiSuccess(null, 'Poll deleted')
  } catch (err) {
    return handleServerError(err)
  }
}
