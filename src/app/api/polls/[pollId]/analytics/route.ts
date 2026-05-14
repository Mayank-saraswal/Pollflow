import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { CACHE, cacheGet, cacheSet } from '@/lib/redis'
import { apiSuccess, apiError, handleServerError } from '@/lib/api-response'
import type { PollAnalytics } from '@/types'

interface RouteParams {
  params: Promise<{ pollId: string }>
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { pollId } = await params
    const session = await auth()
    if (!session?.user?.id) return apiError('Unauthorized', 401)

    const cacheKey = CACHE.keys.analytics(pollId)
    const cached   = await cacheGet<PollAnalytics>(cacheKey)
    if (cached) return apiSuccess(cached)

    const poll = await prisma.poll.findUnique({ where: { id: pollId } })
    if (!poll)                              return apiError('Poll not found', 404)
    if (poll.creatorId !== session.user.id) return apiError('Forbidden', 403)

    // Aggregate all answers grouped by question + option in one query
    const answers = await prisma.answer.groupBy({
      by:     ['questionId', 'optionId'],
      _count: { id: true },
      where:  { response: { pollId } },
    })

    const [totalResponses, questions] = await Promise.all([
      prisma.response.count({ where: { pollId } }),
      prisma.question.findMany({
        where:   { pollId },
        include: { options: true },
        orderBy: { order: 'asc' },
      }),
    ])

    const questionStats = questions.map((q) => {
      const qAnswers    = answers.filter((a) => a.questionId === q.id)
      const totalAnswers = qAnswers.reduce((sum, a) => sum + a._count.id, 0)

      const optionStats = q.options.map((opt) => {
        const match = qAnswers.find((a) => a.optionId === opt.id)
        const count = match?._count.id ?? 0
        return {
          optionId:   opt.id,
          optionText: opt.text,
          count,
          percentage: totalAnswers > 0
            ? Math.round((count / totalAnswers) * 100)
            : 0,
        }
      })

      return {
        questionId:   q.id,
        questionText: q.text,
        isMandatory:  q.isMandatory,
        totalAnswers,
        optionStats,
      }
    })

    // Participation: % mandatory questions vs total
    const mandatoryCount    = questions.filter((q) => q.isMandatory).length
    const participationRate = totalResponses > 0 && questions.length > 0
      ? Math.round((mandatoryCount / questions.length) * 100)
      : 0

    // Recent activity: responses in last 24 hours grouped by hour
    const yesterday      = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentResponses = await prisma.response.findMany({
      where:   { pollId, submittedAt: { gte: yesterday } },
      select:  { submittedAt: true },
      orderBy: { submittedAt: 'asc' },
    })

    const hourlyMap = new Map<string, number>()
    recentResponses.forEach((r) => {
      const hour = new Date(r.submittedAt)
      hour.setMinutes(0, 0, 0)
      const key = hour.toISOString()
      hourlyMap.set(key, (hourlyMap.get(key) ?? 0) + 1)
    })
    const recentActivity = Array.from(hourlyMap.entries()).map(
      ([timestamp, count]) => ({ timestamp, count })
    )

    const analytics: PollAnalytics = {
      totalResponses,
      participationRate,
      questionStats,
      recentActivity,
    }

    await cacheSet(cacheKey, analytics, CACHE.ttl.analytics)
    return apiSuccess(analytics)
  } catch (err) {
    return handleServerError(err)
  }
}
