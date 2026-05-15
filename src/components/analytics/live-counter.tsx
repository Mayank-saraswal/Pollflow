'use client'

import { useEffect, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  value: number
  label: string
  icon:  LucideIcon
  pulse?: boolean
}

export function LiveCounter({ value, label, icon: Icon, pulse = false }: Props) {
  const [display,   setDisplay]   = useState(value)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (value === display) return
    setAnimating(true)
    const timer = setTimeout(() => {
      setDisplay(value)
      setAnimating(false)
    }, 150)
    return () => clearTimeout(timer)
  }, [value, display])

  return (
    <div className={cn(
      'bg-[#111113] border rounded-2xl p-4 flex flex-col gap-2',
      'transition-all duration-300',
      animating
        ? 'border-white/[0.20] shadow-[0_0_20px_rgba(255,255,255,0.04)]'
        : 'border-white/[0.06]'
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-white/40" />
          <span className="font-body text-white/40 text-xs">{label}</span>
        </div>
        {pulse && <span className="live-dot" />}
      </div>
      <span className={cn(
        'font-display font-semibold text-white text-3xl',
        'transition-all duration-300',
        animating ? 'scale-110 text-white' : 'scale-100'
      )}>
        {display.toLocaleString()}
      </span>
    </div>
  )
}
