'use client'

import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'

interface LiveCounterProps {
  initialCount: number
  pollId: string
}

export function LiveCounter({ initialCount, pollId: _pollId }: LiveCounterProps) {
  const [count, setCount] = useState(initialCount)

  useEffect(() => {
    setCount(initialCount)
  }, [initialCount])

  return (
    <div className="flex items-center gap-3 px-4 py-2 glass-card rounded-2xl rounded-full w-fit">
      <span className="live-dot" aria-hidden />
      <Users className="size-4 text-brand-400" />
      <span className="text-sm font-semibold text-foreground">{count.toLocaleString()}</span>
      <span className="text-xs text-white/50">responses</span>
    </div>
  )
}
