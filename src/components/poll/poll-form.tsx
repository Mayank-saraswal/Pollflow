'use client'

import { useState, useCallback } from 'react'
import {
  CheckCircle2, AlertTriangle, Clock, ShieldCheck,
  EyeOff, ChevronRight, Asterisk,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useSubmitResponse } from '@/hooks/use-poll'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Poll } from '@/types'

interface Props {
  poll:             Poll & { creator: { name: string | null } }
  alreadyResponded: boolean
  isAuthenticated:  boolean
}

export function PollForm({ poll, alreadyResponded, isAuthenticated }: Props) {
  const submit  = useSubmitResponse(poll.shareToken)
  const [answers,   setAnswers]   = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(alreadyResponded)
  const [errors,    setErrors]    = useState<Record<string, boolean>>({})
  const [currentQ,  setCurrentQ]  = useState(0)

  // One-at-a-time question navigation
  const questions    = poll.questions
  const totalQ       = questions.length
  const progress     = Math.round(
    (Object.keys(answers).length / totalQ) * 100
  )

  const selectOption = useCallback(
    (questionId: string, optionId: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: optionId }))
      setErrors((prev)  => ({ ...prev, [questionId]: false }))
    },
    []
  )

  const handleNext = () => {
    const q = questions[currentQ]
    if (q.isMandatory && !answers[q.id]) {
      setErrors((prev) => ({ ...prev, [q.id]: true }))
      return
    }
    if (currentQ < totalQ - 1) setCurrentQ(currentQ + 1)
  }

  const handleBack = () => {
    if (currentQ > 0) setCurrentQ(currentQ - 1)
  }

  const handleSubmit = async () => {
    // Validate all mandatory questions
    const missing: Record<string, boolean> = {}
    questions.forEach((q) => {
      if (q.isMandatory && !answers[q.id]) missing[q.id] = true
    })
    if (Object.keys(missing).length > 0) {
      setErrors(missing)
      // Jump to first missing question
      const firstMissingIdx = questions.findIndex((q) => missing[q.id])
      setCurrentQ(firstMissingIdx)
      toast.error('Please answer all required questions')
      return
    }

    try {
      const answersArr = Object.entries(answers).map(
        ([questionId, optionId]) => ({ questionId, optionId })
      )
      await submit.mutateAsync(answersArr)
      setSubmitted(true)
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Submission failed. Please try again.'
      toast.error(msg)
    }
  }

  // ── Already responded ──
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]
                      text-center gap-6 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-green-400/[0.08]
                       border border-green-400/[0.15]
                       flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="font-display font-semibold text-white text-2xl">
            Response submitted!
          </h2>
          <p className="font-body text-white/45 text-sm max-w-sm">
            Thanks for participating in &ldquo;{poll.title}&rdquo;.
            Results will be shared once the poll closes.
          </p>
        </div>
        {poll.expiresAt && (
          <p className="font-body text-white/25 text-xs flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Poll closes {formatDistanceToNow(new Date(poll.expiresAt), { addSuffix: true })}
          </p>
        )}
      </div>
    )
  }

  const currentQuestion = questions[currentQ]
  const isLastQuestion  = currentQ === totalQ - 1
  const hasError        = errors[currentQuestion?.id]

  return (
    <div className="flex flex-col gap-6 animate-fade-in">

      {/* Poll header */}
      <div className="flex flex-col gap-2">
        <h1 className="font-display font-semibold text-white text-2xl md:text-3xl
                      leading-tight">
          {poll.title}
        </h1>
        {poll.description && (
          <p className="font-body text-white/45 text-sm leading-relaxed">
            {poll.description}
          </p>
        )}

        {/* Meta badges */}
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {poll.isAnonymous && (
            <span className="badge badge-default text-xs flex items-center gap-1">
              <EyeOff className="w-3 h-3" />
              Anonymous
            </span>
          )}
          {poll.voterMode === 'AUTHENTICATED_ONLY' && (
            <span className="badge badge-info text-xs flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Login required
            </span>
          )}
          {poll.expiresAt && (
            <span className="badge badge-default text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Closes {formatDistanceToNow(new Date(poll.expiresAt), { addSuffix: true })}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-body text-white/30 text-xs">
            Question {currentQ + 1} of {totalQ}
          </span>
          <span className="font-body text-white/30 text-xs">
            {progress}% complete
          </span>
        </div>
        <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${((currentQ) / totalQ) * 100}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      {currentQuestion && (
        <div
          key={currentQuestion.id}
          className="bg-[#111113] border border-white/[0.06] rounded-2xl
                     p-6 flex flex-col gap-5 animate-slide-up"
        >
          {/* Question text */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-start gap-2">
              <h2 className="font-display font-semibold text-white text-lg
                            leading-snug flex-1">
                {currentQuestion.text}
              </h2>
              {currentQuestion.isMandatory && (
                <Asterisk className="w-3.5 h-3.5 text-white/25 shrink-0 mt-1" />
              )}
            </div>
            {!currentQuestion.isMandatory && (
              <span className="font-body text-white/25 text-xs">Optional</span>
            )}
          </div>

          {/* Question image */}
          {currentQuestion.imageUrl && (
            <div className="rounded-xl overflow-hidden border border-white/[0.06]">
              <img
                src={currentQuestion.imageUrl}
                alt="Question visual"
                className="w-full max-h-64 object-cover"
              />
            </div>
          )}

          {/* Options */}
          <div className="flex flex-col gap-2">
            {currentQuestion.options.map((option) => {
              const selected = answers[currentQuestion.id] === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => selectOption(currentQuestion.id, option.id)}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-xl text-left',
                    'border transition-all duration-150 group',
                    selected
                      ? 'bg-white text-[#09090B] border-white'
                      : 'bg-white/[0.02] border-white/[0.08] text-white/70',
                    'hover:border-white/[0.20] hover:bg-white/[0.05]',
                    selected && 'hover:bg-white hover:text-[#09090B]'
                  )}
                >
                  {/* Radio indicator */}
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                    selected
                      ? 'border-[#09090B] bg-[#09090B]'
                      : 'border-white/20'
                  )}>
                    {selected && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>

                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    {option.imageUrl && (
                      <img
                        src={option.imageUrl}
                        alt={option.text}
                        className="w-full max-h-32 object-cover rounded-lg mb-2"
                      />
                    )}
                    <span className={cn(
                      'font-body text-sm font-medium',
                      selected ? 'text-[#09090B]' : 'text-white/80'
                    )}>
                      {option.text}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Validation error */}
          {hasError && (
            <div className="flex items-center gap-2 text-red-400 text-xs font-body">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              This question is required
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          size="default"
          onClick={handleBack}
          disabled={currentQ === 0}
          className="font-body text-white/40"
        >
          ← Back
        </Button>

        <div className="flex items-center gap-1.5">
          {questions.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentQ(idx)}
              className={cn(
                'rounded-full transition-all',
                idx === currentQ
                  ? 'w-6 h-2 bg-white'
                  : answers[questions[idx].id]
                    ? 'w-2 h-2 bg-white/40'
                    : 'w-2 h-2 bg-white/15'
              )}
            />
          ))}
        </div>

        {isLastQuestion ? (
          <Button
            type="button"
            size="default"
            onClick={handleSubmit}
            loading={submit.isPending}
            className="gap-2 font-display"
          >
            Submit
            {!submit.isPending && <CheckCircle2 className="w-4 h-4" />}
          </Button>
        ) : (
          <Button
            type="button"
            size="default"
            onClick={handleNext}
            className="gap-2 font-display"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
