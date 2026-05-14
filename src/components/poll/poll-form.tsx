'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Poll } from '@/types'

interface PollFormProps {
  poll: Poll
  onSubmit: (answers: { questionId: string; optionId: string }[]) => void
  isLoading?: boolean
}

export function PollForm({ poll, onSubmit, isLoading }: PollFormProps) {
  const [selections, setSelections] = useState<Record<string, string>>({})

  const handleSelect = (questionId: string, optionId: string) => {
    setSelections((prev) => ({ ...prev, [questionId]: optionId }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const answers = Object.entries(selections).map(([questionId, optionId]) => ({
      questionId,
      optionId,
    }))
    onSubmit(answers)
  }

  const mandatoryCount = poll.questions.filter((q) => q.isMandatory).length
  const answeredMandatory = poll.questions.filter(
    (q) => q.isMandatory && selections[q.id]
  ).length

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {poll.questions.map((question, idx) => (
        <div key={question.id} className="glass-card rounded-2xl gradient-border p-6">
          <div className="flex items-start gap-2 mb-4">
            <span className="text-xs font-medium text-white mt-0.5 shrink-0">
              Q{idx + 1}
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-white leading-relaxed">
                {question.text}
              </p>
              {question.isMandatory && (
                <Badge variant="secondary" className="text-xs mt-1">Required</Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 ml-5">
            {question.options.map((option) => {
              const isSelected = selections[question.id] === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(question.id, option.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                    isSelected
                      ? 'border-white/60 bg-white/10 text-white'
                      : 'border-white/[0.08] bg-white/[0.06] text-white/50 hover:border-white/30 hover:bg-white/[0.10]'
                  }`}
                >
                  {option.text}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <Button
        type="submit"
        className="btn-gradient w-full h-12 text-base font-semibold"
        disabled={isLoading || answeredMandatory < mandatoryCount}
      >
        {isLoading ? 'Submitting...' : 'Submit Response'}
      </Button>
    </form>
  )
}
