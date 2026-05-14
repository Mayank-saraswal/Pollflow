import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { cacheDel, publishPollUpdate, CACHE } from '@/lib/redis'
import { apiSuccess, apiError, handleServerError } from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ pollId: string }>
}

export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const { pollId } = await params
    const session = await auth()
    if (!session?.user?.id) return apiError('Unauthorized', 401)

    const poll = await prisma.poll.findUnique({ where: { id: pollId } })
    if (!poll)                              return apiError('Poll not found', 404)
    if (poll.creatorId !== session.user.id) return apiError('Forbidden', 403)

    const responseCount = await prisma.response.count({ where: { pollId } })
    if (responseCount === 0) {
      return apiError('Cannot publish a poll with no responses', 400)
    }

    const updated = await prisma.poll.update({
      where: { id: pollId },
      data:  { status: 'PUBLISHED', isPublished: true },
    })

    // Clear all caches and notify live dashboards
    await Promise.all([
      cacheDel(CACHE.keys.poll(pollId)),
      cacheDel(CACHE.keys.pollToken(poll.shareToken)),
      cacheDel(CACHE.keys.analytics(pollId)),
      publishPollUpdate(pollId, {
        pollId,
        event: 'poll:published',
      }),
    ])

    return apiSuccess(updated, 'Poll published successfully')
  } catch (err) {
    return handleServerError(err)
  }
}
