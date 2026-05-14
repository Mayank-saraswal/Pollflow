import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { CACHE, cacheGet, cacheSet } from '@/lib/redis'
import { apiSuccess, apiError, handleServerError } from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ shareToken: string }>
}

// GET /api/p/[shareToken] — public poll fetch for respondents
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { shareToken } = await params

    const cacheKey = CACHE.keys.pollToken(shareToken)
    const cached   = await cacheGet(cacheKey)
    if (cached) return apiSuccess(cached)

    const poll = await prisma.poll.findUnique({
      where:   { shareToken },
      include: {
        questions: {
          include: {
            options: {
              select: { id: true, text: true, imageUrl: true },
            },
          },
          orderBy: { order: 'asc' },
        },
        creator: { select: { name: true } },
      },
    })

    if (!poll) return apiError('Poll not found', 404)

    // Auto-expire check
    if (poll.status === 'ACTIVE' && poll.expiresAt && poll.expiresAt < new Date()) {
      await prisma.poll.update({ where: { id: poll.id }, data: { status: 'EXPIRED' } })
      poll.status = 'EXPIRED'
    }

    // If auth-only poll, require session
    if (poll.voterMode === 'AUTHENTICATED_ONLY') {
      const session = await auth()
      if (!session?.user?.id) {
        return apiError('Authentication required to view this poll', 401)
      }
    }

    // Strip response count from public view if not published
    const publicPoll = {
      id:          poll.id,
      title:       poll.title,
      description: poll.description,
      status:      poll.status,
      voterMode:   poll.voterMode,
      isAnonymous: poll.isAnonymous,
      isPublished: poll.isPublished,
      expiresAt:   poll.expiresAt,
      creatorName: poll.creator.name,
      questions:   poll.questions,
      shareToken:  poll.shareToken,
    }

    await cacheSet(cacheKey, publicPoll, CACHE.ttl.poll)
    return apiSuccess(publicPoll)
  } catch (err) {
    return handleServerError(err)
  }
}
