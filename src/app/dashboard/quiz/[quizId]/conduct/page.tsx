'use client'

import { useState, useEffect, useCallback } from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'sonner'
import {
  Copy, Play, Users, Crown, Clock, SkipForward, Square, Download,
  BarChart3, Check, Loader2, Zap, Trophy, ChevronRight, FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuizSocket } from '@/hooks/use-quiz-socket'
import { QRCodeSVG } from 'qrcode.react'
import type { LeaderboardEntry, LiveQuizQuestion, QuizPhase } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'

interface QuizInfo {
  title: string
  joinCode: string
  totalQuestions: number
  questions: { id: string; text: string; type: string; timeLimit: number; points: number; order: number }[]
}

export default function ConductPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = use(params)
  const router = useRouter()

  const [sessionId, setSessionId] = useState('')
  const [quiz, setQuiz] = useState<QuizInfo | null>(null)
  const [phase, setPhase] = useState<QuizPhase>('LOBBY')
  const [participantCount, setParticipantCount] = useState(0)
  const [question, setQuestion] = useState<LiveQuizQuestion | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [answerCount, setAnswerCount] = useState(0)
  const [optionCounts, setOptionCounts] = useState<Record<string, number>>({})
  const [correctOptionIds, setCorrectOptionIds] = useState<string[]>([])
  const [adminStats, setAdminStats] = useState<{ correctCount: number; totalAnswered: number } | null>(null)
  const [serverTime, setServerTime] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [actionLoading, setActionLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const joinUrl = `${appUrl}/quiz/join`

  // Load session info
  useEffect(() => {
    axios.get(`/api/quiz/${quizId}/session`)
      .then((res) => {
        const data = res.data.data
        setSessionId(data.session.id)
        setPhase(data.session.phase)
        setParticipantCount(data.session.participants?.length ?? 0)
        setQuiz(data.quiz)
        setQuestionIndex(data.session.currentQuestion ?? 0)
      })
      .catch((err) => {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          // No active session — start lobby
          axios.post(`/api/quiz/${quizId}/session`, { action: 'start_lobby' })
            .then((res) => {
              setSessionId(res.data.data.sessionId)
              setPhase('LOBBY')
              // Reload quiz info
              return axios.get(`/api/quiz/${quizId}/session`)
            })
            .then((res) => {
              setQuiz(res.data.data.quiz)
            })
            .catch(() => toast.error('Failed to start session'))
        }
      })
      .finally(() => setLoading(false))
  }, [quizId])

  // Timer
  useEffect(() => {
    if (phase !== 'QUESTION_ACTIVE' || !question || !serverTime) return
    const endTime = serverTime + question.timeLimit * 1000
    const interval = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now())
      setTimeLeft(remaining)
    }, 100)
    return () => clearInterval(interval)
  }, [phase, question, serverTime])

  // Socket handlers
  const onLobbyUpdate = useCallback((payload: { participantCount: number }) => {
    setParticipantCount(payload.participantCount)
  }, [])

  const onQuestionStart = useCallback((payload: {
    question: LiveQuizQuestion
    questionIndex: number
    totalQuestions: number
    serverTime: number
  }) => {
    setPhase('QUESTION_ACTIVE')
    setQuestion(payload.question)
    setQuestionIndex(payload.questionIndex)
    setServerTime(payload.serverTime)
    setAnswerCount(0)
    setOptionCounts({})
    setCorrectOptionIds([])
    setAdminStats(null)
  }, [])

  const onQuestionEnd = useCallback((payload: {
    correctOptionIds: string[]
    leaderboard: LeaderboardEntry[]
    optionCounts: Record<string, number>
    totalAnswered: number
  }) => {
    setPhase('QUESTION_ENDED')
    setCorrectOptionIds(payload.correctOptionIds)
    setLeaderboard(payload.leaderboard)
    setOptionCounts(payload.optionCounts)
    setAnswerCount(payload.totalAnswered)
  }, [])

  const onAdminTick = useCallback((payload: { answerCount: number }) => {
    setAnswerCount(payload.answerCount)
  }, [])

  const onAdminStats = useCallback((payload: {
    correctCount: number
    totalAnswered: number
    leaderboard: LeaderboardEntry[]
    optionCounts: Record<string, number>
  }) => {
    setAdminStats({ correctCount: payload.correctCount, totalAnswered: payload.totalAnswered })
    setLeaderboard(payload.leaderboard)
    setOptionCounts(payload.optionCounts)
  }, [])

  const onQuizEnd = useCallback((payload: { finalLeaderboard: LeaderboardEntry[] }) => {
    setPhase('QUIZ_ENDED')
    setLeaderboard(payload.finalLeaderboard)
  }, [])

  useQuizSocket({
    sessionId,
    role: 'admin',
    onLobbyUpdate,
    onQuestionStart,
    onQuestionEnd,
    onAdminTick,
    onAdminStats,
    onQuizEnd,
  })

  // Admin actions
  const doAction = async (action: string) => {
    setActionLoading(true)
    try {
      await axios.post(`/api/quiz/${quizId}/session`, { action })
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) toast.error(err.response?.data?.error ?? 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  const copyCode = () => {
    if (quiz) {
      navigator.clipboard.writeText(quiz.joinCode)
      toast.success('Join code copied!')
    }
  }

  const exportCsv = () => {
    window.open(`/api/quiz/session/${sessionId}/export`, '_blank')
  }

  // Timer display
  const timerFraction = question ? timeLeft / (question.timeLimit * 1000) : 1
  const timerColor = timerFraction > 0.5 ? '#22C55E' : timerFraction > 0.2 ? '#F59E0B' : '#EF4444'
  const circumference = 2 * Math.PI * 44

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in -mx-4 md:-mx-8 -my-8">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-white/[0.06] bg-[#0D0D10]">
        <div className="flex items-center gap-3">
          <h2 className="font-display font-semibold text-white text-lg truncate">
            {quiz?.title ?? 'Quiz'}
          </h2>
          <span className={cn(
            'badge',
            phase === 'LOBBY' ? 'badge-warning' :
            phase === 'QUIZ_ENDED' ? 'badge-default' :
            'badge-success'
          )}>
            {phase === 'LOBBY' && 'Lobby'}
            {phase === 'QUESTION_ACTIVE' && <><span className="live-dot mr-1" /> Live</>}
            {phase === 'QUESTION_ENDED' && 'Results'}
            {phase === 'QUIZ_ENDED' && 'Ended'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-white/50 text-sm font-body">
            <Users className="w-4 h-4" />
            {participantCount}
          </div>
          {quiz && (
            <button onClick={copyCode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                        bg-white/[0.04] border border-white/[0.08]
                        hover:bg-white/[0.08] transition-colors font-mono text-sm text-white/70">
              {quiz.joinCode}
              <Copy className="w-3 h-3 text-white/30" />
            </button>
          )}
          {phase !== 'QUIZ_ENDED' && (
            <button onClick={() => doAction('end_quiz')} className="btn-danger btn-sm">
              <Square className="w-3.5 h-3.5" />
              End Quiz
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col lg:flex-row">
        {/* Left panel (2/3) */}
        <div className="flex-1 p-4 md:p-6 min-h-[60vh]">
          {/* ── LOBBY ── */}
          {phase === 'LOBBY' && (
            <div className="flex flex-col items-center justify-center h-full gap-8 py-12 animate-fade-in">
              <div className="p-4 bg-white rounded-2xl">
                <QRCodeSVG value={joinUrl} size={180} bgColor="#ffffff" fgColor="#09090B" />
              </div>
              <div className="text-center">
                <p className="text-white/40 font-body text-sm mb-2">Join at</p>
                <p className="font-body text-white/70 text-lg">{joinUrl}</p>
                <p className="text-white/40 font-body text-sm mt-2">Code:</p>
                <p className="font-display text-white text-4xl font-semibold tracking-[0.3em] mt-1">
                  {quiz?.joinCode}
                </p>
              </div>
              <div className="text-center">
                <p className="text-white/40 font-body">{participantCount} participants joined</p>
              </div>
              <button
                onClick={() => doAction('start_question')}
                disabled={actionLoading || participantCount === 0}
                className="btn-primary btn-lg"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Start Quiz →
              </button>
            </div>
          )}

          {/* ── QUESTION ACTIVE ── */}
          {phase === 'QUESTION_ACTIVE' && question && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <span className="badge badge-default">
                  Question {questionIndex + 1} of {quiz?.totalQuestions}
                </span>
                <div className="relative w-14 h-14">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                    <circle cx="50" cy="50" r="44" fill="none"
                      stroke={timerColor} strokeWidth="6" strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference * (1 - timerFraction)}
                      style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-display font-semibold text-sm text-white">
                    {Math.ceil(timeLeft / 1000)}
                  </span>
                </div>
              </div>

              <h3 className="font-display text-white text-xl font-semibold mb-6">{question.text}</h3>
              {question.imageUrl && (
                <div className="mb-6">
                  {question.imageUrl.includes('.mp4') || question.imageUrl.includes('.webm') ? (
                    <video src={question.imageUrl} controls className="max-h-40 rounded-xl" />
                  ) : (
                    <img src={question.imageUrl} alt="" className="max-h-40 rounded-xl object-cover" />
                  )}
                </div>
              )}

              {/* Live answer bars */}
              <div className="space-y-3 mb-6">
                {question.options.map((opt) => {
                  const count = optionCounts[opt.id] || 0
                  const maxCount = Math.max(1, ...Object.values(optionCounts))
                  const pct = Math.round((count / maxCount) * 100)

                  return (
                    <div key={opt.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 text-sm font-body">{opt.text}</span>
                        <span className="text-white/40 text-xs font-body">{count}</span>
                      </div>
                      <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-white/30 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-white/40 text-sm font-body">
                  {answerCount} / {participantCount} answered
                </span>
                <button
                  onClick={() => doAction('end_question')}
                  disabled={actionLoading}
                  className="btn-secondary btn-sm"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SkipForward className="w-3.5 h-3.5" />}
                  End Question Early
                </button>
              </div>
            </div>
          )}

          {/* ── QUESTION ENDED ── */}
          {phase === 'QUESTION_ENDED' && question && (
            <div className="animate-fade-in">
              <h3 className="font-display text-white text-xl font-semibold mb-2">{question.text}</h3>
              {adminStats && (
                <div className="flex gap-4 mb-6">
                  <span className="badge badge-success">
                    {adminStats.correctCount} / {adminStats.totalAnswered} correct
                    ({adminStats.totalAnswered > 0 ? Math.round((adminStats.correctCount / adminStats.totalAnswered) * 100) : 0}%)
                  </span>
                </div>
              )}

              {/* Results bars with correct highlighting */}
              <div className="space-y-3 mb-8">
                {question.options.map((opt) => {
                  const count = optionCounts[opt.id] || 0
                  const total = Math.max(1, answerCount)
                  const pct = Math.round((count / total) * 100)
                  const isCorrect = correctOptionIds.includes(opt.id)

                  return (
                    <div key={opt.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          'text-sm font-body flex items-center gap-1.5',
                          isCorrect ? 'text-green-400 font-medium' : 'text-white/50'
                        )}>
                          {isCorrect && <Check className="w-4 h-4" />}
                          {opt.text}
                        </span>
                        <span className="text-white/40 text-xs font-body">{count} ({pct}%)</span>
                      </div>
                      <div className="h-3 bg-white/[0.04] rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            isCorrect ? 'bg-green-500/60' : 'bg-white/20'
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              <button
                onClick={() => {
                  if (questionIndex >= (quiz?.totalQuestions ?? 0)) {
                    doAction('end_quiz')
                  } else {
                    doAction('start_question')
                  }
                }}
                disabled={actionLoading}
                className="btn-primary btn-lg"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> :
                  questionIndex >= (quiz?.totalQuestions ?? 0) ? (
                    <><Trophy className="w-4 h-4" /> End Quiz</>
                  ) : (
                    <><ChevronRight className="w-4 h-4" /> Next Question</>
                  )
                }
              </button>
            </div>
          )}

          {/* ── QUIZ ENDED ── */}
          {phase === 'QUIZ_ENDED' && (
            <div className="animate-fade-in py-8">
              <div className="text-center mb-8">
                <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                <h3 className="font-display text-white text-2xl font-semibold">Quiz Complete!</h3>
                <p className="text-white/40 font-body text-sm mt-1">{participantCount} participants</p>
              </div>

              {/* Full leaderboard */}
              <div className="card-base p-5 max-w-lg mx-auto">
                <h4 className="font-display font-semibold text-white/60 text-sm mb-3">Final Leaderboard</h4>
                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                  {leaderboard.map((entry) => (
                    <div key={entry.participantId}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.02]">
                      <span className={cn(
                        'w-7 h-7 rounded-md flex items-center justify-center text-xs font-display font-semibold shrink-0',
                        entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                        entry.rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                        entry.rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                        'bg-white/[0.04] text-white/30'
                      )}>
                        {entry.rank}
                      </span>
                      <span className="flex-1 text-white/80 text-sm font-body truncate">{entry.displayName}</span>
                      <span className="text-white/50 text-sm font-display font-semibold">{entry.score.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center gap-3 mt-6">
                <button onClick={exportCsv} className="btn-secondary">
                  <Download className="w-4 h-4" /> Export CSV
                </button>
                <button
                  onClick={() => router.push(`/dashboard/quiz/${quizId}/results`)}
                  className="btn-primary"
                >
                  <FileText className="w-4 h-4" /> Full Analytics
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right panel — leaderboard (always visible) */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-white/[0.06] p-4 md:p-5">
          <h4 className="font-display font-semibold text-white/50 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="live-dot" />
            Live Leaderboard
          </h4>
          <AnimatePresence>
            <div className="space-y-1.5">
              {leaderboard.slice(0, 10).map((entry) => (
                <motion.div
                  key={entry.participantId}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-white/[0.02]"
                >
                  <span className={cn(
                    'w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-display font-semibold shrink-0',
                    entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                    entry.rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                    entry.rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                    'bg-white/[0.04] text-white/25'
                  )}>
                    {entry.rank}
                  </span>
                  <span className="flex-1 text-white/70 text-xs font-body truncate">{entry.displayName}</span>
                  <span className="text-white/40 text-xs font-display font-semibold">{entry.score.toLocaleString()}</span>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
          {participantCount > 10 && (
            <p className="text-white/20 text-xs font-body mt-3 text-center">
              +{participantCount - 10} more
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
