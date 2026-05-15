import { TimerOff, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { Poll } from '@/types'

interface Props {
  poll: Poll & { creator: { name: string | null } }
}

export function PollExpiredView({ poll }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]
                    text-center gap-6 animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-white/[0.04]
                     border border-white/[0.08]
                     flex items-center justify-center">
        <TimerOff className="w-8 h-8 text-white/30" />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-display font-semibold text-white text-2xl">
          Poll has ended
        </h2>
        <p className="font-body text-white/45 text-sm max-w-sm leading-relaxed">
          &ldquo;{poll.title}&rdquo; is no longer accepting responses.
          {poll.expiresAt && (
            <> It closed on {formatDate(poll.expiresAt)}.</>
          )}
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        {poll.isPublished && (
          <Link href={`/p/${poll.shareToken}/results`}>
            <Button className="gap-2 font-display">
              View Results
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        )}
        <Link href="/">
          <Button variant="ghost" className="text-white/40">
            Create your own poll →
          </Button>
        </Link>
      </div>
    </div>
  )
}
