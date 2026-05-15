import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard'
import { generateShareUrl } from '@/lib/utils'

interface Props {
  params: Promise<{ pollId: string }>
}

export async function generateMetadata({ params }: Props) {
  const { pollId } = await params
  try {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId }, select: { title: true }
    })
    return { title: `Analytics — ${poll?.title ?? 'Poll'}` }
  } catch {
    return { title: 'Analytics — Poll' }
  }
}

export default async function PollAnalyticsPage({ params }: Props) {
  const { pollId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  let poll
  try {
    poll = await prisma.poll.findUnique({
      where:   { id: pollId },
      include: {
        questions: {
          include: { options: true },
          orderBy: { order: 'asc' },
        },
        _count: { select: { responses: true } },
      },
    })
  } catch {
    notFound()
  }

  if (!poll) notFound()
  if (poll.creatorId !== session.user.id) redirect('/dashboard')

  // Auto-expire check
  if (poll.status === 'ACTIVE' && poll.expiresAt && poll.expiresAt < new Date()) {
    try {
      await prisma.poll.update({ where: { id: poll.id }, data: { status: 'EXPIRED' } })
    } catch {
      // Non-fatal — status update failure shouldn't block page render
    }
    poll.status = 'EXPIRED'
  }

  // Pre-compute analytics server-side for initial load
  let answers: { questionId: string; optionId: string; _count: { id: number } }[] = []
  try {
    // @ts-expect-error — Prisma 7.x groupBy overload typing issue
    answers = await prisma.answer.groupBy({
      by:     ['questionId', 'optionId'],
      _count: { id: true },
      where:  { response: { pollId } },
    })
  } catch {
    // Non-fatal — show page with zero analytics
  }

  const questionStats = poll.questions.map((q) => {
    const qAnswers     = answers.filter((a) => a.questionId === q.id)
    const totalAnswers = qAnswers.reduce((s, a) => s + a._count.id, 0)
    return {
      questionId:   q.id,
      questionText: q.text,
      isMandatory:  q.isMandatory,
      totalAnswers,
      optionStats: q.options.map((opt) => {
        const match = qAnswers.find((a) => a.optionId === opt.id)
        const count = match?._count.id ?? 0
        return {
          optionId:   opt.id,
          optionText: opt.text,
          count,
          percentage: totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0,
        }
      }),
    }
  })

  const shareUrl = generateShareUrl(poll.shareToken)

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={poll.title}
        description="Live analytics dashboard — updates in real-time as responses arrive."
      />
      <AnalyticsDashboard
        poll={poll}
        initialStats={questionStats}
        initialTotal={poll._count.responses}
        shareUrl={shareUrl}
      />
    </div>
  )
}
