import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] mb-5">
        <Icon className="w-8 h-8 text-white/40" />
      </div>
      <h3 className="text-white font-display font-semibold mb-2">{title}</h3>
      <p className="text-white/50 font-body max-w-sm mb-6">{description}</p>
      {action}
    </div>
  )
}
