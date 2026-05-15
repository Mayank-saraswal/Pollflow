'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import { toast } from 'sonner'
import { Zap, Users, Clock, Trophy, Check, X, Flame, Crown, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuizSocket } from '@/hooks/use-quiz-socket'
import type { LiveQuizQuestion, LeaderboardEntry, AnswerAck, QuizPhase } from '@/types'
import confetti from 'canvas-confetti'

const OPTION_COLORS = ['#E21B3C', '#1368CE', '#26890C', '#D89E00', '#9B59B6', '#E67E22', '#1ABC9C', '#E74C3C']

export default function PlayPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params)
  const router = useRouter()

  const [phase, setPhase] = useState<QuizPhase>('LOBBY')
  const [participantCount, setParticipantCount] = useState(0)
  const [question, setQuestion] = useState<LiveQuizQuestion | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [serverTime, setServerTime] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set())
  const [answerLocked, setAnswerLocked] = useState(false)
  const [ack, setAck] = useState<AnswerAck | null>(null)
  const [correctOptionIds, setCorrectOptionIds] = useState<string[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [finalLeaderboard, setFinalLeaderboard] = useState<LeaderboardEntry[]>([])
  const [totalScore, setTotalScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [quizTitle, setQuizTitle] = useState('')

  const participantId = typeof window !== 'undefined'
    ? sessionStorage.getItem(`quiz:${sessionId}:pid`) ?? ''
    : ''

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Timer countdown
  useEffect(() => {
    if (phase !== 'QUESTION_ACTIVE' || !question || !serverTime) return
    const endTime = serverTime + question.timeLimit * 1000

    const tick = () => {
      const remaining = Math.max(0, endTime - Date.now())
      setTimeLeft(remaining)
      if (remaining <= 0 && timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
    tick()
    timerRef.current = setInterval(tick, 100)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
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
    setTotalQuestions(payload.totalQuestions)
    setServerTime(payload.serverTime)
    setSelectedOptions(new Set())
    setAnswerLocked(false)
    setAck(null)
    setCorrectOptionIds([])
  }, [])

  const onQuestionEnd = useCallback((payload: {
    correctOptionIds: string[]
    leaderboard: LeaderboardEntry[]
  }) => {
    setPhase('QUESTION_ENDED')
    setCorrectOptionIds(payload.correctOptionIds)
    setLeaderboard(payload.leaderboard)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const onAnswerAck = useCallback((payload: AnswerAck) => {
    setAck(payload)
    setTotalScore((prev) => prev + payload.pointsEarned)
    if (payload.isCorrect) {
      setCorrectCount((prev) => prev + 1)
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } })
    }
  }, [])

  const onQuizEnd = useCallback((payload: { finalLeaderboard: LeaderboardEntry[] }) => {
    setPhase('QUIZ_ENDED')
    setFinalLeaderboard(payload.finalLeaderboard)
  }, [])

  useQuizSocket({
    sessionId,
    participantId,
    role: 'participant',
    onLobbyUpdate,
    onQuestionStart,
    onQuestionEnd,
    onAnswerAck,
    onQuizEnd,
  })

  // Submit answer
  const submitAnswer = async () => {
    if (answerLocked || selectedOptions.size === 0 || !question) return
    setAnswerLocked(true)

    try {
      await axios.post(`/api/quiz/${question.id}/answer`, {
        sessionId,
        questionId: question.id,
        selectedOptionIds: [...selectedOptions],
      })
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.error ?? 'Failed to submit')
      }
      setAnswerLocked(false)
    }
  }

  const toggleOption = (optionId: string) => {
    if (answerLocked) return
    if (!question) return

    if (question.type === 'SINGLE') {
      setSelectedOptions(new Set([optionId]))
      // Auto-submit for single
      setTimeout(() => {
        setAnswerLocked(true)
        axios.post(`/api/quiz/${question.id}/answer`, {
          sessionId,
          questionId: question.id,
          selectedOptionIds: [optionId],
        }).catch(() => setAnswerLocked(false))
      }, 200)
    } else {
      setSelectedOptions((prev) => {
        const next = new Set(prev)
        if (next.has(optionId)) next.delete(optionId)
        else next.add(optionId)
        return next
      })
    }
  }

  // Timer ring SVG
  const timerFraction = question ? timeLeft / (question.timeLimit * 1000) : 1
  const timerColor = timerFraction > 0.5 ? '#22C55E' : timerFraction > 0.2 ? '#F59E0B' : '#EF4444'
  const circumference = 2 * Math.PI * 44
  const dashOffset = circumference * (1 - timerFraction)

  // Find own rank
  const myRank = leaderboard.find((e) => e.participantId === participantId)
  const myFinalRank = finalLeaderboard.find((e) => e.participantId === participantId)

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col">
      {/* ── LOBBY ── */}
      {phase === 'LOBBY' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in">
          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] mb-6">
            <Zap className="w-8 h-8 text-white/40" />
          </div>
          {quizTitle && (
            <h2 className="font-display font-semibold text-white text-xl mb-2">{quizTitle}</h2>
          )}
          <div className="flex items-center gap-2 mb-8">
            <span className="live-dot" />
            <span className="badge badge-success">LIVE</span>
          </div>
          <p className="font-display text-white text-2xl font-semibold mb-4">
            Waiting for host to start...
          </p>
          <div className="flex items-center gap-2 text-white/50 font-body">
            <Users className="w-5 h-5" />
            <span className="text-lg">{participantCount} players joined</span>
          </div>
          <div className="mt-8 flex flex-wrap gap-2 justify-center max-w-md">
            {Array.from({ length: Math.min(participantCount, 30) }).map((_, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.08]
                           flex items-center justify-center animate-scale-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="text-white/30 text-xs font-display">
                  {String.fromCharCode(65 + (i % 26))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── QUESTION ACTIVE ── */}
      {phase === 'QUESTION_ACTIVE' && question && (
        <div className="flex-1 flex flex-col p-4 md:p-6 animate-fade-in">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="badge badge-default">
                Q{questionIndex + 1} / {totalQuestions}
              </span>
              <span className="badge badge-default">{question.points} pts</span>
            </div>
            {/* Timer ring */}
            <div className="relative w-14 h-14">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                <circle
                  cx="50" cy="50" r="44" fill="none"
                  stroke={timerColor}
                  strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s' }}
                />
              </svg>
              <span className={cn(
                'absolute inset-0 flex items-center justify-center font-display font-semibold text-sm',
                timerFraction < 0.2 ? 'text-red-400 animate-pulse' : 'text-white'
              )}>
                {Math.ceil(timeLeft / 1000)}
              </span>
            </div>
          </div>

          {/* Question */}
          <div className="text-center mb-6">
            <h2 className="font-display text-white text-xl md:text-2xl font-semibold leading-snug">
              {question.text}
            </h2>
            {question.imageUrl && (
              <div className="mt-4 flex justify-center">
                {question.imageUrl.includes('.mp4') || question.imageUrl.includes('.webm') ? (
                  <video src={question.imageUrl} controls className="max-h-48 rounded-xl" />
                ) : (
                  <img src={question.imageUrl} alt="" className="max-h-48 rounded-xl object-cover" />
                )}
              </div>
            )}
            {question.type === 'MULTIPLE' && (
              <p className="text-white/30 text-sm font-body mt-2">Select all correct answers</p>
            )}
          </div>

          {/* Options grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 max-w-2xl mx-auto w-full">
            {question.options.map((opt, i) => {
              const isSelected = selectedOptions.has(opt.id)
              const color = OPTION_COLORS[i % OPTION_COLORS.length]

              return (
                <button
                  key={opt.id}
                  onClick={() => toggleOption(opt.id)}
                  disabled={answerLocked}
                  className={cn(
                    'relative flex items-center gap-3 p-5 rounded-2xl font-body font-medium',
                    'text-white text-left transition-all duration-200',
                    'border-2',
                    answerLocked
                      ? isSelected
                        ? 'opacity-100 scale-[0.98]'
                        : 'opacity-30'
                      : 'hover:scale-[1.02] active:scale-[0.98] cursor-pointer',
                  )}
                  style={{
                    backgroundColor: isSelected ? color : `${color}22`,
                    borderColor: isSelected ? color : `${color}44`,
                  }}
                >
                  {opt.imageUrl && (
                    <img src={opt.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  )}
                  <span className="flex-1">{opt.text}</span>
                  {isSelected && answerLocked && (
                    <Check className="w-5 h-5 shrink-0" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Multi-select submit */}
          {question.type === 'MULTIPLE' && !answerLocked && selectedOptions.size > 0 && (
            <div className="mt-4 flex justify-center">
              <button onClick={submitAnswer} className="btn-primary btn-lg">
                <Check className="w-4 h-4" />
                Lock Answer ({selectedOptions.size} selected)
              </button>
            </div>
          )}

          {answerLocked && !ack && (
            <div className="mt-4 text-center">
              <span className="badge badge-success px-4 py-2 text-sm">
                <Check className="w-4 h-4" /> Answer locked in!
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── QUESTION ENDED ── */}
      {phase === 'QUESTION_ENDED' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in">
          {/* Result card */}
          {ack && (
            <div className={cn(
              'card-base p-8 text-center mb-8 max-w-sm w-full',
              ack.isCorrect ? 'border-green-400/20' : 'border-red-400/10'
            )}>
              {ack.isCorrect ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="font-display text-green-400 text-2xl font-semibold mb-2">Correct!</h3>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="font-display text-red-400 text-2xl font-semibold mb-2">Incorrect</h3>
                </>
              )}
              <p className="text-white font-display text-3xl font-semibold mb-2">
                +{ack.pointsEarned} pts
              </p>
              {ack.streakBonus > 0 && (
                <p className="text-yellow-400 font-body text-sm flex items-center justify-center gap-1.5">
                  <Flame className="w-4 h-4" />
                  {ack.streak} streak! +{ack.streakBonus} bonus
                </p>
              )}
              <p className="text-white/30 text-xs font-body mt-2">
                Answered in {(ack.answerTimeMs / 1000).toFixed(1)}s
              </p>
            </div>
          )}

          {/* Leaderboard top 5 */}
          {leaderboard.length > 0 && (
            <div className="card-base p-5 w-full max-w-sm">
              <h4 className="font-display font-semibold text-white/60 text-sm mb-3 flex items-center gap-2">
                <Crown className="w-4 h-4" /> Leaderboard
              </h4>
              <div className="space-y-2">
                {leaderboard.slice(0, 5).map((entry) => (
                  <div
                    key={entry.participantId}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-xl transition-all',
                      entry.participantId === participantId
                        ? 'bg-white/[0.08] border border-white/[0.15]'
                        : 'bg-white/[0.02]'
                    )}
                  >
                    <span className={cn(
                      'w-6 h-6 rounded-md flex items-center justify-center text-xs font-display font-semibold shrink-0',
                      entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                      entry.rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                      entry.rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-white/[0.04] text-white/30'
                    )}>
                      {entry.rank}
                    </span>
                    <span className="flex-1 text-white/80 text-sm font-body truncate">
                      {entry.displayName}
                    </span>
                    <span className="text-white/50 text-sm font-display font-semibold">
                      {entry.score.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-white/30 text-sm font-body mt-6 animate-pulse">
            Waiting for next question...
          </p>
        </div>
      )}

      {/* ── QUIZ ENDED ── */}
      {phase === 'QUIZ_ENDED' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in">
          <div className="card-base p-10 text-center max-w-md w-full">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            {myFinalRank && (
              <>
                <p className="text-white/40 font-body text-sm mb-1">Your Rank</p>
                <p className="font-display text-white text-5xl font-semibold mb-1">
                  #{myFinalRank.rank}
                </p>
                <p className="text-white/30 font-body text-sm mb-6">
                  of {finalLeaderboard.length} players
                </p>
              </>
            )}
            <div className="flex justify-center gap-6 mb-8">
              <div className="text-center">
                <p className="font-display text-white text-2xl font-semibold">
                  {totalScore.toLocaleString()}
                </p>
                <p className="text-white/30 text-xs font-body">Points</p>
              </div>
              <div className="text-center">
                <p className="font-display text-white text-2xl font-semibold">
                  {correctCount}/{totalQuestions}
                </p>
                <p className="text-white/30 text-xs font-body">Correct</p>
              </div>
            </div>

            <Link
              href={`/quiz/${sessionId}/results/me`}
              className="btn-primary w-full justify-center"
            >
              <Star className="w-4 h-4" />
              View Detailed Results →
            </Link>
          </div>

          {/* Final leaderboard */}
          {finalLeaderboard.length > 0 && (
            <div className="card-base p-5 w-full max-w-md mt-6">
              <h4 className="font-display font-semibold text-white/60 text-sm mb-3">
                Final Standings
              </h4>
              <div className="space-y-2">
                {finalLeaderboard.slice(0, 10).map((entry) => (
                  <div
                    key={entry.participantId}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-xl',
                      entry.participantId === participantId
                        ? 'bg-white/[0.08] border border-white/[0.15]'
                        : 'bg-white/[0.02]'
                    )}
                  >
                    <span className={cn(
                      'w-6 h-6 rounded-md flex items-center justify-center text-xs font-display font-semibold shrink-0',
                      entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                      entry.rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                      entry.rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-white/[0.04] text-white/30'
                    )}>
                      {entry.rank}
                    </span>
                    <span className="flex-1 text-white/80 text-sm font-body truncate">
                      {entry.displayName}
                    </span>
                    <span className="text-white/50 text-sm font-display font-semibold">
                      {entry.score.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
