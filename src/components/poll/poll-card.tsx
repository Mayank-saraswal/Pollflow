import Link from 'next/link'
import { BarChart3, Clock, Users, Globe, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { cn, formatRelative, isPollExpired } from '@/lib/utils'
import type { Poll } from '@/types'

interface PollCardProps {
  poll: Poll
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-500/10 text-green-400 border-green-500/20',
  EXPIRED: 'bg-muted/30 text-white/50 border-white/[0.08]',
  PUBLISHED: 'bg-brand-600/10 text-brand-400 border-brand-600/20',
}

export function PollCard({ poll }: PollCardProps) {
  const expired = isPollExpired(poll.expiresAt)
  const status = expired && poll.status === 'ACTIVE' ? 'EXPIRED' : poll.status

  return (
    <Card className="glass-card rounded-2xl border-white/[0.08] hover:border-brand-600/30 transition-all duration-200 hover:scale-[1.01]">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold truncate">{poll.title}</CardTitle>
          <Badge className={cn('text-xs shrink-0 border', STATUS_STYLES[status])}>
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </Badge>
        </div>
        {poll.description && (
          <CardDescription className="text-xs line-clamp-2">{poll.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap gap-4 text-xs text-white/50">
          <span className="flex items-center gap-1">
            <Users className="size-3" />
            {poll._count?.responses ?? 0} responses
          </span>
          <span className="flex items-center gap-1">
            <BarChart3 className="size-3" />
            {poll.questions.length} questions
          </span>
          {poll.expiresAt && (
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {expired ? 'Expired' : `Expires ${formatRelative(poll.expiresAt)}`}
            </span>
          )}
          {poll.isPublished && (
            <span className="flex items-center gap-1 text-brand-400">
              <Globe className="size-3" />
              Public
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="gap-2">
        <Link href={`/dashboard/polls/${poll.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full gap-1 text-xs">
            <BarChart3 className="size-3" />
            Analytics
          </Button>
        </Link>
        <Link href={`/p/${poll.shareToken}`} target="_blank">
          <Button variant="ghost" size="sm" className="gap-1 text-xs text-white/50">
            <ExternalLink className="size-3" />
            View
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
