'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import { toast } from 'sonner'
import {
  Trophy, Plus, Copy, Play, Pencil, BarChart3,
  Loader2, CheckCircle2, Archive, FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuizItem {
  id: string
  title: string
  joinCode: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  _count: { questions: number; sessions: number }
  sessions: { phase: string; id: string }[]
  createdAt: string
}

export default function QuizDashboardPage() {
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<QuizItem[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState<string | null>(null)

  useEffect(() => {
    axios.get('/api/quiz')
      .then((res) => setQuizzes(res.data.data))
      .catch(() => toast.error('Failed to load quizzes'))
      .finally(() => setLoading(false))
  }, [])

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Join code copied!')
  }

  const startQuiz = async (quizId: string) => {
    setStarting(quizId)
    try {
      const res = await axios.post(`/api/quiz/${quizId}/session`, { action: 'start_lobby' })
      toast.success('Lobby started!')
      router.push(`/dashboard/quiz/${quizId}/conduct`)
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        if (err.response.data.error === 'A session is already active') {
          router.push(`/dashboard/quiz/${quizId}/conduct`)
          return
        }
        toast.error(err.response.data.error)
      } else {
        toast.error('Failed to start quiz')
      }
    } finally {
      setStarting(null)
    }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      DRAFT:     { cls: 'badge-default', label: 'Draft' },
      PUBLISHED: { cls: 'badge-success', label: 'Published' },
      ARCHIVED:  { cls: 'badge-warning', label: 'Archived' },
    }
    const s = map[status] ?? map.DRAFT
    return <span className={cn('badge', s.cls)}>{s.label}</span>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-semibold text-white flex items-center gap-3">
            <Trophy className="w-6 h-6 text-white/60" />
            Quizzes
          </h1>
          <p className="text-white/40 font-body text-sm mt-1">
            Create and conduct live quizzes with real-time scoring
          </p>
        </div>
        <Link href="/dashboard/quiz/create" className="btn-primary">
          <Plus className="w-4 h-4" />
          Create Quiz
        </Link>
      </div>

      {/* Empty state */}
      {quizzes.length === 0 && (
        <div className="card-base p-16 flex flex-col items-center justify-center gap-4 text-center">
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
            <BarChart3 className="w-8 h-8 text-white/20" />
          </div>
          <div>
            <p className="text-white/60 font-display font-semibold text-lg">No quizzes yet</p>
            <p className="text-white/30 font-body text-sm mt-1">
              Create your first quiz to get started
            </p>
          </div>
          <Link href="/dashboard/quiz/create" className="btn-primary mt-2">
            <Plus className="w-4 h-4" />
            Create Quiz
          </Link>
        </div>
      )}

      {/* Quiz grid */}
      <div className="grid gap-4">
        {quizzes.map((quiz) => {
          const activeSession = quiz.sessions[0]
          const isLive = activeSession && ['LOBBY', 'QUESTION_ACTIVE', 'QUESTION_ENDED'].includes(activeSession.phase)

          return (
            <div
              key={quiz.id}
              className="card-base p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-display font-semibold text-white truncate text-lg">
                    {quiz.title}
                  </h3>
                  {statusBadge(quiz.status)}
                  {isLive && (
                    <span className="badge badge-success flex items-center gap-1.5">
                      <span className="live-dot" />
                      Live
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => copyCode(quiz.joinCode)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg
                              bg-white/[0.04] border border-white/[0.08]
                              hover:bg-white/[0.08] transition-colors cursor-pointer"
                  >
                    <span className="font-mono text-sm text-white/70 tracking-wider">
                      {quiz.joinCode}
                    </span>
                    <Copy className="w-3 h-3 text-white/30" />
                  </button>
                  <span className="text-white/30 text-xs font-body">
                    {quiz._count.questions} question{quiz._count.questions !== 1 ? 's' : ''}
                  </span>
                  <span className="text-white/30 text-xs font-body">
                    {quiz._count.sessions} session{quiz._count.sessions !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {isLive ? (
                  <Link
                    href={`/dashboard/quiz/${quiz.id}/conduct`}
                    className="btn-primary btn-sm"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Continue
                  </Link>
                ) : (
                  <button
                    onClick={() => startQuiz(quiz.id)}
                    disabled={starting === quiz.id}
                    className="btn-primary btn-sm"
                  >
                    {starting === quiz.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    Start Quiz
                  </button>
                )}
                <Link
                  href={`/dashboard/quiz/${quiz.id}/results`}
                  className="btn-secondary btn-sm"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Results
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
