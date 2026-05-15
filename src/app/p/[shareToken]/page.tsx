import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { PollForm } from '@/components/poll/poll-form'
import { PollExpiredView } from '@/components/poll/poll-expired-view'
import { Zap } from 'lucide-react'
import Link from 'next/link'

interface Props {
  params: Promise<{ shareToken: string }>
}

export async function generateMetadata({ params }: Props) {
  const { shareToken } = await params
  try {
    const poll = await prisma.poll.findUnique({
      where:  { shareToken },
      select: { title: true, description: true },
    })
    return {
      title:       poll?.title ?? 'Poll',
      description: poll?.description ?? 'Answer this poll',
    }
  } catch {
    return { title: 'Poll', description: 'Answer this poll' }
  }
}

export default async function PublicPollPage({ params }: Props) {
  const { shareToken } = await params

  let poll
  try {
    poll = await prisma.poll.findUnique({
      where: { shareToken },
      include: {
        questions: {
          include: {
            options: { select: { id: true, text: true, imageUrl: true } },
          },
          orderBy: { order: 'asc' },
        },
        creator: { select: { name: true } },
      },
    })
  } catch {
    notFound()
  }

  if (!poll) notFound()

  // Auto-expire check
  if (poll.status === 'ACTIVE' && poll.expiresAt && poll.expiresAt < new Date()) {
    try {
      await prisma.poll.update({
        where: { id: poll.id },
        data:  { status: 'EXPIRED' },
      })
    } catch {
      // Non-fatal
    }
    poll.status = 'EXPIRED'
  }

  // If published, redirect to results
  if (poll.status === 'PUBLISHED') {
    redirect(`/p/${shareToken}/results`)
  }

  // If auth-only poll, check session
  if (poll.voterMode === 'AUTHENTICATED_ONLY') {
    const session = await auth()
    if (!session?.user) {
      redirect(`/login?callbackUrl=/p/${shareToken}`)
    }
  }

  // Check if current user already responded
  const session = await auth()
  let alreadyResponded = false
  if (session?.user?.id) {
    try {
      const existing = await prisma.response.findUnique({
        where: {
          pollId_respondentId: { pollId: poll.id, respondentId: session.user.id },
        },
      })
      alreadyResponded = !!existing
    } catch {
      // Non-fatal — assume not responded
    }
  }

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
          <span className="font-body text-white/25 text-xs">
            by {poll.creator.name}
          </span>
        </div>
      </div>

      {/* Main */}
      <main className="pt-20 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          {poll.status === 'EXPIRED' ? (
            <PollExpiredView poll={poll} />
          ) : (
            <PollForm
              poll={poll}
              alreadyResponded={alreadyResponded}
              isAuthenticated={!!session?.user}
            />
          )}
        </div>
      </main>
    </div>
  )
}
