'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { toast } from 'sonner'
import {
  Trophy, Star, Check, X, Clock, Flame,
  BarChart3, ArrowLeft, Loader2, Award, Target
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuestionResult {
  questionId: string
  questionText: string
  type: string
  selectedOptions: { id: string; text: string }[]
  correctOptions: { id: string; text: string }[]
  isCorrect: boolean
  pointsEarned: number
  answerTimeMs: number
  streak: number
}

interface ReportData {
  role: string
  participant: { displayName: string; score: number; rank: number | null }
  quiz: { title: string; totalQuestions: number }
  totalParticipants: number
  correctCount: number
  accuracy: number
  percentile: number
  questionBreakdown: QuestionResult[]
}

export default function ParticipantResultsPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params)
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedQ, setExpandedQ] = useState<string | null>(null)

  useEffect(() => {
    axios.get(`/api/quiz/session/${sessionId}/report`)
      .then((res) => setData(res.data.data))
      .catch(() => toast.error('Failed to load results'))
      .finally(() => setLoading(false))
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
      </div>
    )
  }
  if (!data) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <p className="text-white/40">Results not available</p>
      </div>
    )
  }

  const scorePercentage = data.quiz.totalQuestions > 0
    ? Math.round((data.correctCount / data.quiz.totalQuestions) * 100)
    : 0

  return (
    <div className="min-h-screen bg-[#09090B] p-6 md:p-8">
      <div className="max-w-2xl mx-auto animate-fade-in">
        {/* Back */}
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/40 hover:text-white/60 text-sm font-body mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Scorecard */}
        <div className="card-base p-8 text-center mb-6">
          <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
          <h1 className="font-display font-semibold text-white text-xl mb-1">{data.quiz.title}</h1>
          <p className="text-white/40 font-body text-sm mb-6">{data.participant.displayName}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-white/[0.03]">
              <Award className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
              <p className="font-display text-white text-2xl font-semibold">#{data.participant.rank}</p>
              <p className="text-white/30 text-xs font-body">Rank</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03]">
              <Star className="w-5 h-5 text-white/50 mx-auto mb-2" />
              <p className="font-display text-white text-2xl font-semibold">{data.participant.score.toLocaleString()}</p>
              <p className="text-white/30 text-xs font-body">Score</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03]">
              <Target className="w-5 h-5 text-green-400 mx-auto mb-2" />
              <p className="font-display text-white text-2xl font-semibold">{data.accuracy}%</p>
              <p className="text-white/30 text-xs font-body">Accuracy</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03]">
              <BarChart3 className="w-5 h-5 text-blue-400 mx-auto mb-2" />
              <p className="font-display text-white text-2xl font-semibold">{data.percentile}%</p>
              <p className="text-white/30 text-xs font-body">Percentile</p>
            </div>
          </div>

          {/* Score bar */}
          <div className="h-3 bg-white/[0.04] rounded-full overflow-hidden max-w-xs mx-auto">
            <div
              className={cn('h-full rounded-full transition-all', scorePercentage >= 70 ? 'bg-green-500' : scorePercentage >= 40 ? 'bg-yellow-500' : 'bg-red-500')}
              style={{ width: `${scorePercentage}%` }}
            />
          </div>
          <p className="text-white/30 text-xs font-body mt-1">
            {data.correctCount} / {data.quiz.totalQuestions} correct
          </p>
        </div>

        {/* Question breakdown */}
        <div className="card-base p-5">
          <h3 className="font-display font-semibold text-white/60 text-sm mb-4">Question Breakdown</h3>
          <div className="space-y-2">
            {data.questionBreakdown.map((q, i) => (
              <div key={q.questionId}>
                <button
                  onClick={() => setExpandedQ(expandedQ === q.questionId ? null : q.questionId)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left',
                    'hover:bg-white/[0.04]',
                    q.isCorrect ? 'bg-green-400/[0.04]' : 'bg-red-400/[0.02]'
                  )}
                >
                  <span className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                    q.isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/10 text-red-400'
                  )}>
                    {q.isCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </span>
                  <span className="flex-1 text-white/80 text-sm font-body truncate">
                    Q{i + 1}. {q.questionText}
                  </span>
                  <span className="text-white/40 text-sm font-display font-semibold shrink-0">
                    +{q.pointsEarned}
                  </span>
                </button>

                {expandedQ === q.questionId && (
                  <div className="ml-10 mt-2 mb-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2 animate-fade-in">
                    <div className="flex items-center gap-4 text-xs text-white/40 font-body">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {(q.answerTimeMs / 1000).toFixed(1)}s
                      </span>
                      {q.streak > 1 && (
                        <span className="flex items-center gap-1 text-yellow-400">
                          <Flame className="w-3 h-3" />
                          {q.streak} streak
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-white/30 text-xs font-body mb-1">Your answer:</p>
                      {q.selectedOptions.map((o) => (
                        <span key={o.id} className={cn(
                          'inline-block mr-1 mb-1 px-2 py-0.5 rounded-md text-xs font-body',
                          q.correctOptions.some((c) => c.id === o.id)
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/10 text-red-400'
                        )}>
                          {o.text}
                        </span>
                      ))}
                    </div>
                    {!q.isCorrect && (
                      <div>
                        <p className="text-white/30 text-xs font-body mb-1">Correct answer:</p>
                        {q.correctOptions.map((o) => (
                          <span key={o.id} className="inline-block mr-1 mb-1 px-2 py-0.5 rounded-md text-xs font-body bg-green-500/20 text-green-400">
                            {o.text}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
