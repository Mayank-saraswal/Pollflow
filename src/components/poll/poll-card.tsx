'use client'

import Link from 'next/link'
import {
  BarChart3, MessageSquare, Clock, Globe, TimerOff,
  Copy, ExternalLink, Pencil, Radio
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { formatRelative, generateShareUrl, isPollExpired } from '@/lib/utils'
import type { Poll } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  poll: Poll & { _count: { responses: number }; questions: { id: string }[] }
}

const STATUS_STYLES = {
  ACTIVE:    { label: 'Active',    class: 'badge-success' },
  EXPIRED:   { label: 'Expired',   class: 'badge-danger'  },
  PUBLISHED: { label: 'Published', class: 'badge-info'    },
} as const

const STATUS_ICONS = {
  ACTIVE:    Radio,
  EXPIRED:   TimerOff,
  PUBLISHED: Globe,
}

export function PollCard({ poll }: Props) {
  const expired = isPollExpired(poll.expiresAt)
  const status  = expired && poll.status === 'ACTIVE' ? 'EXPIRED' : poll.status
  const style   = STATUS_STYLES[status]
  const StatusIcon = STATUS_ICONS[status]
  const shareUrl = generateShareUrl(poll.shareToken)

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    toast.success('Link copied!')
  }

  return (
    <div className="group flex flex-col bg-[#111113] border border-white/[0.06]
                   rounded-2xl p-5 gap-4
                   hover:border-white/[0.12] hover:shadow-[0_4px_24px_rgba(0,0,0,0.5)]
                   transition-all duration-200">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <h3 className="font-display font-semibold text-white text-base
                        leading-snug truncate">
            {poll.title}
          </h3>
          {poll.description && (
            <p className="font-body text-white/40 text-xs leading-relaxed line-clamp-2">
              {poll.description}
            </p>
          )}
        </div>
        <span className={cn('badge shrink-0', style.class)}>
          <StatusIcon className="w-3 h-3" />
          {style.label}
        </span>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 text-white/30 text-xs font-body">
        <span className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" />
          {poll._count.responses} responses
        </span>
        <span className="flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5" />
          {poll.questions.length} questions
        </span>
        {poll.expiresAt && (
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {isPollExpired(poll.expiresAt) ? 'Expired' : `Expires ${formatRelative(poll.expiresAt)}`}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.05]" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link href={`/dashboard/polls/${poll.id}`} className="flex-1">
          <Button
            variant="secondary"
            size="sm"
            className="w-full gap-1.5 font-body text-xs"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Analytics
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={copyLink}
          title="Copy share link"
          className="text-white/30 hover:text-white"
        >
          <Copy className="w-3.5 h-3.5" />
        </Button>
        <a href={shareUrl} target="_blank" rel="noopener noreferrer">
          <Button
            variant="ghost"
            size="icon-sm"
            title="Open poll"
            className="text-white/30 hover:text-white"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </a>
        <Link href={`/dashboard/polls/${poll.id}/edit`}>
          <Button
            variant="ghost"
            size="icon-sm"
            title="Edit poll"
            className="text-white/30 hover:text-white"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {/* Created */}
      <p className="font-body text-white/20 text-xs">
        Created {formatRelative(poll.createdAt)}
      </p>
    </div>
  )
}
