import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  subtext?: string
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export function StatsCard({ icon: Icon, label, value, subtext, className }: StatsCardProps) {
  return (
    <Card className={cn('glass-card rounded-2xl border-white/[0.08]', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-white/50 font-medium mb-1">{label}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {subtext && <p className="text-xs text-white/50 mt-1">{subtext}</p>}
          </div>
          <div className="p-2.5 rounded-lg bg-brand-600/10">
            <Icon className="size-5 text-brand-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
