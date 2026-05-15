import { notFound, redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { ResponseChart } from '@/components/analytics/response-chart'
import { Globe, CheckCircle2, Clock, Users, Zap } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

interface Props {
  params: Promise<{ shareToken: string }>
}

export async function generateMetadata({ params }: Props) {
  const { shareToken } = await params
  try {
    const poll = await prisma.poll.findUnique({
      where:  { shareToken },
      select: { title: true },
    })
    return { title: `Results — ${poll?.title ?? 'Poll'}` }
  } catch {
    return { title: 'Results — Poll' }
  }
}

export default async function ResultsPage({ params }: Props) {
  const { shareToken } = await params

  let poll
  try {
    poll = await prisma.poll.findUnique({
      where:   { shareToken },
      include: {
        questions: {
          include: { options: true },
          orderBy: { order: 'asc' },
        },
        creator: { select: { name: true } },
        _count:  { select: { responses: true } },
      },
    })
  } catch {
    notFound()
  }

  if (!poll) notFound()
  if (!poll.isPublished) redirect(`/p/${shareToken}`)

  // Aggregate stats
  let answers: { questionId: string; optionId: string; _count: { id: number } }[] = []
  try {
    // @ts-expect-error — Prisma 7.x groupBy overload typing issue
    answers = await prisma.answer.groupBy({
      by:     ['questionId', 'optionId'],
      _count: { id: true },
      where:  { response: { pollId: poll.id } },
    })
  } catch {
    // Non-fatal — show page with zero stats
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

  return (
    <div className="min-h-screen bg-[#09090B]">

      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-30 h-14
                     bg-[#09090B]/80 backdrop-blur-xl border-b border-white/[0.06]
                     flex items-center px-4">
        <div className="max-w-2xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-white/50" />
            <span className="font-display font-semibold text-white/50 text-sm">
              PollFlow
            </span>
          </Link>
          <span className="inline-flex items-center gap-1.5 text-xs font-body
                          text-blue-400 bg-blue-400/[0.08] border border-blue-400/[0.15]
                          px-3 py-1 rounded-full">
            <Globe className="w-3 h-3" />
            Published Results
          </span>
        </div>
      </div>

      <main className="pt-20 pb-16 px-4">
        <div className="max-w-2xl mx-auto flex flex-col gap-8">

          {/* Hero */}
          <div className="flex flex-col gap-3 text-center py-8">
            <div className="w-12 h-12 rounded-full bg-blue-400/[0.08]
                           border border-blue-400/[0.15]
                           flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-6 h-6 text-blue-400" />
            </div>
            <h1 className="font-display font-semibold text-white text-3xl
                          leading-tight">
              {poll.title}
            </h1>
            {poll.description && (
              <p className="font-body text-white/45 text-sm max-w-md mx-auto">
                {poll.description}
              </p>
            )}

            {/* Stats row */}
            <div className="flex items-center justify-center gap-6 mt-4 flex-wrap">
              <div className="flex items-center gap-1.5 text-white/40 text-sm font-body">
                <Users className="w-4 h-4" />
                {poll._count.responses} total responses
              </div>
              {poll.expiresAt && (
                <div className="flex items-center gap-1.5 text-white/40 text-sm font-body">
                  <Clock className="w-4 h-4" />
                  Closed {formatDate(poll.expiresAt)}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-white/40 text-sm font-body">
                by {poll.creator.name}
              </div>
            </div>
          </div>

          {/* Question results */}
          <div className="flex flex-col gap-4">
            {questionStats.map((qs) => (
              <ResponseChart
                key={qs.questionId}
                stat={qs}
                totalResponses={poll._count.responses}
                showResult={true}
              />
            ))}
          </div>

          {/* CTA */}
          <div className="text-center flex flex-col items-center gap-3 pt-4
                         border-t border-white/[0.06]">
            <p className="font-body text-white/30 text-sm">
              Want to collect feedback too?
            </p>
            <Link href="/register">
              <Button className="gap-2 font-display">
                Create your own poll →
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
