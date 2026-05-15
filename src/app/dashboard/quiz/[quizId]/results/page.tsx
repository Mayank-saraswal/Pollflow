'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'sonner'
import {
  Trophy, Users, BarChart3, Download, Loader2,
  ArrowLeft, Check, X, Clock, Target, Award
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuestionStat {
  questionId: string
  questionText: string
  type: string
  totalAnswers: number
  correctCount: number
  correctRate: number
  avgAnswerTimeMs: number
  optionCounts: Record<string, number>
  options: { id: string; text: string; isCorrect: boolean }[]
  correctOptionIds: string[]
}

interface LeaderboardItem {
  rank: number
  participantId: string
  displayName: string
  avatarUrl?: string | null
  score: number
  correctCount: number
  avgAnswerTimeMs: number
}

interface AdminReportData {
  role: string
  session: { id: string; startedAt: string; endedAt: string }
  quiz: { title: string; totalQuestions: number }
  totalParticipants: number
  leaderboard: LeaderboardItem[]
  questionStats: QuestionStat[]
}

export default function AdminResultsPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<{ id: string; createdAt: string; phase: string }[]>([])
  const [selectedSession, setSelectedSession] = useState<string>('')
  const [data, setData] = useState<AdminReportData | null>(null)
  const [tab, setTab] = useState<'leaderboard' | 'questions'>('leaderboard')

  // Load sessions list
  useEffect(() => {
    axios.get(`/api/quiz/${quizId}/session`)
      .then((res) => {
        const session = res.data.data?.session
        if (session) {
          setSessions([session])
          // Try to load the ended session
          axios.get(`/api/quiz/session/${session.id}/report`)
            .then((r) => { setData(r.data.data); setSelectedSession(session.id) })
            .catch(() => {})
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [quizId])

  const loadReport = (sessionId: string) => {
    setSelectedSession(sessionId)
    setLoading(true)
    axios.get(`/api/quiz/session/${sessionId}/report`)
      .then((r) => setData(r.data.data))
      .catch(() => toast.error('Failed to load report'))
      .finally(() => setLoading(false))
  }

  const exportCsv = () => {
    if (selectedSession) {
      window.open(`/api/quiz/session/${selectedSession}/export`, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="animate-fade-in">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-white/40 hover:text-white/60 text-sm font-body mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="card-base p-12 text-center">
          <BarChart3 className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <p className="text-white/50 font-body">No completed sessions yet</p>
          <p className="text-white/30 text-sm font-body mt-1">Results will appear after ending a quiz session</p>
        </div>
      </div>
    )
  }

  const avgScore = data.leaderboard.length
    ? Math.round(data.leaderboard.reduce((s, p) => s + p.score, 0) / data.leaderboard.length)
    : 0
  const avgAccuracy = data.questionStats.length
    ? Math.round(data.questionStats.reduce((s, q) => s + q.correctRate, 0) / data.questionStats.length)
    : 0

  return (
    <div className="animate-fade-in">
      <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-white/40 hover:text-white/60 text-sm font-body mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-white flex items-center gap-3">
            <Trophy className="w-6 h-6 text-yellow-400" />
            {data.quiz.title} — Results
          </h1>
          <p className="text-white/40 font-body text-sm mt-1">
            Session ended {new Date(data.session.endedAt).toLocaleDateString()}
          </p>
        </div>
        <button onClick={exportCsv} className="btn-secondary">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card-base p-4">
          <Users className="w-5 h-5 text-white/40 mb-2" />
          <p className="font-display text-white text-2xl font-semibold">{data.totalParticipants}</p>
          <p className="text-white/30 text-xs font-body">Participants</p>
        </div>
        <div className="card-base p-4">
          <Award className="w-5 h-5 text-white/40 mb-2" />
          <p className="font-display text-white text-2xl font-semibold">{avgScore.toLocaleString()}</p>
          <p className="text-white/30 text-xs font-body">Avg Score</p>
        </div>
        <div className="card-base p-4">
          <Target className="w-5 h-5 text-green-400/60 mb-2" />
          <p className="font-display text-white text-2xl font-semibold">{avgAccuracy}%</p>
          <p className="text-white/30 text-xs font-body">Avg Accuracy</p>
        </div>
        <div className="card-base p-4">
          <BarChart3 className="w-5 h-5 text-blue-400/60 mb-2" />
          <p className="font-display text-white text-2xl font-semibold">{data.quiz.totalQuestions}</p>
          <p className="text-white/30 text-xs font-body">Questions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-white/[0.04] rounded-full p-0.5 border border-white/[0.06] w-fit">
        <button
          onClick={() => setTab('leaderboard')}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-body font-medium transition-all',
            tab === 'leaderboard' ? 'bg-white text-[#09090B]' : 'text-white/40 hover:text-white/60'
          )}
        >
          Leaderboard
        </button>
        <button
          onClick={() => setTab('questions')}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-body font-medium transition-all',
            tab === 'questions' ? 'bg-white text-[#09090B]' : 'text-white/40 hover:text-white/60'
          )}
        >
          Questions
        </button>
      </div>

      {/* Leaderboard tab */}
      {tab === 'leaderboard' && (
        <div className="card-base overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-white/40 font-body font-medium py-3 px-4">Rank</th>
                <th className="text-left text-white/40 font-body font-medium py-3 px-4">Name</th>
                <th className="text-right text-white/40 font-body font-medium py-3 px-4">Score</th>
                <th className="text-right text-white/40 font-body font-medium py-3 px-4">Correct</th>
                <th className="text-right text-white/40 font-body font-medium py-3 px-4">Avg Time</th>
              </tr>
            </thead>
            <tbody>
              {data.leaderboard.map((p) => (
                <tr key={p.participantId} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4">
                    <span className={cn(
                      'w-7 h-7 rounded-md flex items-center justify-center text-xs font-display font-semibold',
                      p.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                      p.rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                      p.rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-white/[0.04] text-white/30'
                    )}>
                      {p.rank}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-white/80 font-body">{p.displayName}</td>
                  <td className="py-3 px-4 text-right text-white/70 font-display font-semibold">{p.score.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-white/50">{p.correctCount}/{data.quiz.totalQuestions}</td>
                  <td className="py-3 px-4 text-right text-white/50">{(p.avgAnswerTimeMs / 1000).toFixed(1)}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Questions tab */}
      {tab === 'questions' && (
        <div className="space-y-4">
          {data.questionStats.map((q, i) => (
            <div key={q.questionId} className="card-base p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-display font-semibold text-white text-sm">
                  Q{i + 1}. {q.questionText}
                </h4>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn(
                    'badge text-xs',
                    q.correctRate >= 70 ? 'badge-success' : q.correctRate >= 40 ? 'badge-warning' : 'badge-danger'
                  )}>
                    {q.correctRate}% correct
                  </span>
                  <span className="text-white/30 text-xs font-body flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {(q.avgAnswerTimeMs / 1000).toFixed(1)}s avg
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {q.options.map((opt) => {
                  const count = q.optionCounts[opt.id] ?? 0
                  const total = Math.max(1, q.totalAnswers)
                  const pct = Math.round((count / total) * 100)

                  return (
                    <div key={opt.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          'text-xs font-body flex items-center gap-1',
                          opt.isCorrect ? 'text-green-400 font-medium' : 'text-white/50'
                        )}>
                          {opt.isCorrect && <Check className="w-3 h-3" />}
                          {opt.text}
                        </span>
                        <span className="text-white/30 text-xs font-body">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', opt.isCorrect ? 'bg-green-500/50' : 'bg-white/15')}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
