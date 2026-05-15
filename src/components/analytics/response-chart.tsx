'use client'

import { Asterisk } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuestionStat } from '@/types'

interface Props {
  stat:           QuestionStat
  totalResponses: number
  showResult?:    boolean
}

export function ResponseChart({ stat, totalResponses, showResult = false }: Props) {
  const maxCount  = Math.max(...stat.optionStats.map((o) => o.count), 1)
  const winner    = stat.optionStats.reduce(
    (best, cur) => (cur.count > best.count ? cur : best),
    stat.optionStats[0]
  )

  return (
    <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5
                   flex flex-col gap-4">

      {/* Question header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 flex-1">
          <h3 className="font-display font-semibold text-white text-base leading-snug">
            {stat.questionText}
          </h3>
          <span className="font-body text-white/30 text-xs">
            {stat.totalAnswers} {stat.totalAnswers === 1 ? 'response' : 'responses'}
            {!stat.isMandatory && (
              <span className="ml-2 text-white/20">(optional)</span>
            )}
          </span>
        </div>
        {stat.isMandatory && (
          <Asterisk className="w-3.5 h-3.5 text-white/20 shrink-0 mt-0.5" />
        )}
      </div>

      {/* Options bars */}
      <div className="flex flex-col gap-3">
        {[...stat.optionStats]
          .sort((a, b) => b.count - a.count)
          .map((opt) => {
            const isWinner   = winner && opt.optionId === winner.optionId && opt.count > 0
            const barWidth   = maxCount > 0 ? (opt.count / maxCount) * 100 : 0

            return (
              <div key={opt.optionId} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className={cn(
                    'font-body text-sm flex-1 leading-snug',
                    isWinner && showResult ? 'text-white font-medium' : 'text-white/70'
                  )}>
                    {opt.optionText}
                    {isWinner && showResult && (
                      <span className="ml-2 text-xs text-green-400 font-normal">
                        ← Winner
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-display font-semibold text-white text-sm">
                      {opt.percentage}%
                    </span>
                    <span className="font-body text-white/30 text-xs w-12 text-right">
                      {opt.count} votes
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-700',
                      isWinner && showResult
                        ? 'bg-white'
                        : 'bg-white/30'
                    )}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}
