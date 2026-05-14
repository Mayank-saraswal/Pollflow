import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

export function LoadingSpinner({ size = 'md', className, label }: LoadingSpinnerProps) {
  const sizes = { sm: 'size-4', md: 'size-6', lg: 'size-10' }
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn('animate-spin text-white/60', sizes[size])} />
      {label && <p className="text-sm text-white/50">{label}</p>}
    </div>
  )
}
