'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Copy, ExternalLink, Globe, Radio, Clock,
  MessageSquare, BarChart3, TrendingUp,
  Share2, RefreshCw, TimerOff, Users,
  EyeOff, ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { usePollSocket }    from '@/hooks/use-socket'
import { usePublishPoll }   from '@/hooks/use-poll'
import { ResponseChart }    from '@/components/analytics/response-chart'
import { LiveCounter }      from '@/components/analytics/live-counter'
import { cn }               from '@/lib/utils'
import { formatRelative }   from '@/lib/utils'
import type { Poll, QuestionStat, LiveUpdatePayload } from '@/types'

interface Props {
  poll:         Poll & { _count: { responses: number }; questions: Array<{ id: string; text: string; isMandatory: boolean; options: Array<{ id: string; text: string; imageUrl?: string | null }> }> }
  initialStats: QuestionStat[]
  initialTotal: number
  shareUrl:     string
}

const STATUS_CONFIG = {
  ACTIVE:    { label: 'Live',      icon: Radio,    color: 'text-green-400',  bg: 'bg-green-400/[0.08] border-green-400/[0.15]' },
  EXPIRED:   { label: 'Expired',   icon: TimerOff, color: 'text-white/40',   bg: 'bg-white/[0.04] border-white/[0.08]'     },
  PUBLISHED: { label: 'Published', icon: Globe,    color: 'text-blue-400',   bg: 'bg-blue-400/[0.08] border-blue-400/[0.15]'  },
} as const

export function AnalyticsDashboard({
  poll, initialStats, initialTotal, shareUrl
}: Props) {
  const router  = useRouter()
  const publish = usePublishPoll()

  const [total,      setTotal]      = useState(initialTotal)
  const [stats,      setStats]      = useState<QuestionStat[]>(initialStats)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [pulseKey,   setPulseKey]   = useState(0)

  // Real-time socket updates
  usePollSocket({
    pollId:    poll.id,
    onUpdate:  useCallback((payload: LiveUpdatePayload) => {
      if (payload.totalResponses !== undefined) {
        setTotal(payload.totalResponses)
        setPulseKey((k) => k + 1)
        setLastUpdate(new Date())
      }
      if (payload.questionStats) {
        setStats(payload.questionStats)
      }
    }, []),
    onPublished: useCallback(() => {
      toast.success('Poll has been published!')
      router.refresh()
    }, [router]),
    onExpired: useCallback(() => {
      toast.info('Poll has expired.')
      router.refresh()
    }, [router]),
  })

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    toast.success('Share link copied!')
  }

  const handlePublish = async () => {
    if (total === 0) {
      toast.error('Cannot publish — no responses yet')
      return
    }
    try {
      await publish.mutateAsync(poll.id)
      toast.success('Results published! Anyone can now view them.')
      router.refresh()
    } catch {
      toast.error('Failed to publish. Try again.')
    }
  }

  const statusCfg = STATUS_CONFIG[poll.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.ACTIVE
  const StatusIcon = statusCfg.icon

  return (
    <div className="flex flex-col gap-6">

      {/* ── Top action bar ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center
                      gap-3 justify-between">

        {/* Status pill */}
        <div className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm',
          statusCfg.bg
        )}>
          <StatusIcon className={cn('w-3.5 h-3.5', statusCfg.color)} />
          <span className={cn('font-body font-medium', statusCfg.color)}>
            {statusCfg.label}
          </span>
          {poll.status === 'ACTIVE' && (
            <>
              <span className="live-dot" />
              <span className="font-body text-white/30 text-xs">Real-time</span>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={copyLink}
            className="gap-2 font-body"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Link
          </Button>

          <a href={shareUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="sm" className="gap-2 font-body">
              <ExternalLink className="w-3.5 h-3.5" />
              View Poll
            </Button>
          </a>

          {poll.status !== 'PUBLISHED' && (
            <Button
              size="sm"
              onClick={handlePublish}
              loading={publish.isPending}
              disabled={total === 0}
              className="gap-2 font-display"
              title={total === 0 ? 'Need at least 1 response to publish' : ''}
            >
              <Globe className="w-3.5 h-3.5" />
              Publish Results
            </Button>
          )}

          {poll.status === 'PUBLISHED' && (
            <a href={`/p/${poll.shareToken}/results`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="secondary" className="gap-2 font-body">
                <Globe className="w-3.5 h-3.5" />
                View Public Results
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Live response counter with pulse animation */}
        <LiveCounter
          key={pulseKey}
          value={total}
          label="Total Responses"
          icon={MessageSquare}
          pulse={poll.status === 'ACTIVE'}
        />
        <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-4
                       flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-white/40" />
            <span className="font-body text-white/40 text-xs">Questions</span>
          </div>
          <span className="font-display font-semibold text-white text-3xl">
            {poll.questions.length}
          </span>
        </div>
        <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-4
                       flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {poll.isAnonymous
              ? <EyeOff className="w-4 h-4 text-white/40" />
              : <ShieldCheck className="w-4 h-4 text-white/40" />}
            <span className="font-body text-white/40 text-xs">Mode</span>
          </div>
          <span className="font-display font-semibold text-white text-sm leading-tight mt-auto">
            {poll.isAnonymous ? 'Anonymous' : 'Identified'}
          </span>
        </div>
        <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-4
                       flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-white/40" />
            <span className="font-body text-white/40 text-xs">Access</span>
          </div>
          <span className="font-display font-semibold text-white text-sm leading-tight mt-auto">
            {poll.voterMode === 'ANYONE' ? 'Open' : 'Auth Only'}
          </span>
        </div>
      </div>

      {/* Last update ticker */}
      {lastUpdate && (
        <div className="flex items-center gap-2 text-white/25 text-xs font-body">
          <RefreshCw className="w-3 h-3 animate-spin" />
          Last update {formatRelative(lastUpdate)}
        </div>
      )}

      {/* Expiry info */}
      {poll.expiresAt && poll.status === 'ACTIVE' && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl
                       bg-white/[0.02] border border-white/[0.06]
                       text-white/40 text-sm font-body">
          <Clock className="w-4 h-4 shrink-0" />
          Poll closes {formatRelative(poll.expiresAt)}
        </div>
      )}

      {/* ── Question stats ── */}
      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-20
                        text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/[0.04] border border-white/[0.06]
                         flex items-center justify-center">
            <TrendingUp className="w-7 h-7 text-white/20" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-display font-semibold text-white/50 text-base">
              Waiting for responses
            </p>
            <p className="font-body text-white/25 text-sm">
              Share the link to start collecting votes.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={copyLink}
            className="gap-2 font-body"
          >
            <Share2 className="w-3.5 h-3.5" />
            Copy share link
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <h2 className="font-display font-semibold text-white text-lg">
            Question Breakdown
          </h2>
          {stats.map((qs) => (
            <ResponseChart
              key={qs.questionId}
              stat={qs}
              totalResponses={total}
            />
          ))}
        </div>
      )}
    </div>
  )
}
