import Link from 'next/link'
import { auth } from '@/lib/auth'
import {
  PlusCircle, BarChart3, MessageSquare,
  ArrowRight, Vote, TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import prisma from '@/lib/prisma'
import { PollCard } from '@/components/poll/poll-card'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const [polls, totalResponses] = await Promise.all([
    prisma.poll.findMany({
      where:   { creatorId: session.user.id },
      include: { _count: { select: { responses: true } }, questions: { select: { id: true } } },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    prisma.response.count({
      where: { poll: { creatorId: session.user.id } },
    }),
  ])

  const activePolls    = polls.filter((p) => p.status === 'ACTIVE').length
  const publishedPolls = polls.filter((p) => p.status === 'PUBLISHED').length

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Good to see you, ${session.user.name?.split(' ')[0]} 👋`}
        description="Here's what's happening with your polls."
        actions={
          <Link href="/dashboard/create">
            <Button size="default" className="gap-2 font-display">
              <PlusCircle className="w-4 h-4" />
              New Poll
            </Button>
          </Link>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: Vote,
            label: 'Total Polls',
            value: polls.length,
            sub: `${activePolls} active`,
          },
          {
            icon: MessageSquare,
            label: 'Total Responses',
            value: totalResponses,
            sub: 'across all polls',
          },
          {
            icon: TrendingUp,
            label: 'Published',
            value: publishedPolls,
            sub: 'results public',
          },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5
                        flex items-start gap-4"
            >
              <div className="p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08]">
                <Icon className="w-5 h-5 text-white/60" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-body text-white/40 text-xs">{stat.label}</span>
                <span className="font-display font-semibold text-white text-2xl">
                  {stat.value}
                </span>
                <span className="font-body text-white/30 text-xs">{stat.sub}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent polls */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-white text-lg">
            Recent Polls
          </h2>
          {polls.length > 0 && (
            <Link href="/dashboard/polls">
              <Button variant="ghost" size="sm" className="gap-1 text-white/40 hover:text-white">
                View all
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          )}
        </div>

        {polls.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No polls yet"
            description="Create your first poll and start collecting responses in seconds."
            action={
              <Link href="/dashboard/create">
                <Button className="gap-2 font-display">
                  <PlusCircle className="w-4 h-4" />
                  Create your first poll
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {polls.map((poll) => (
              <PollCard key={poll.id} poll={poll as any} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
