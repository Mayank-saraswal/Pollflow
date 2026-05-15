'use client'

import { useEffect, useRef } from 'react'
import { io, Socket }        from 'socket.io-client'
import type {
  LiveQuizQuestion, LeaderboardEntry, AnswerAck
} from '@/types'

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001'

let quizSocket: Socket | null = null

function getQuizSocket(): Socket {
  if (!quizSocket || !quizSocket.connected) {
    quizSocket = io(`${SOCKET_URL}/quiz`, {
      transports:           ['websocket', 'polling'],
      reconnectionDelay:    500,
      reconnectionAttempts: 10,
      timeout:              8000,
    })
  }
  return quizSocket
}

interface QuizSocketOptions {
  sessionId:      string
  participantId?: string
  role:           'participant' | 'admin'
  onLobbyUpdate?:    (payload: { participantCount: number; latestJoin?: { displayName: string; avatarUrl?: string | null } }) => void
  onQuestionStart?:  (payload: { question: LiveQuizQuestion; questionIndex: number; totalQuestions: number; serverTime: number }) => void
  onQuestionEnd?:    (payload: { questionId: string; correctOptionIds: string[]; optionCounts: Record<string, number>; leaderboard: LeaderboardEntry[]; totalAnswered: number }) => void
  onAnswerAck?:      (payload: AnswerAck) => void
  onAdminTick?:      (payload: { questionId: string; answerCount: number; optionTickCounts: Record<string, number> }) => void
  onLeaderboard?:    (payload: { leaderboard: LeaderboardEntry[] }) => void
  onQuizEnd?:        (payload: { finalLeaderboard: LeaderboardEntry[]; sessionId: string }) => void
  onAdminStats?:     (payload: { questionId: string; correctCount: number; totalAnswered: number; totalParticipants: number; optionCounts: Record<string, number>; leaderboard: LeaderboardEntry[] }) => void
}

export function useQuizSocket({
  sessionId, participantId, role,
  onLobbyUpdate, onQuestionStart, onQuestionEnd,
  onAnswerAck, onAdminTick, onLeaderboard, onQuizEnd, onAdminStats,
}: QuizSocketOptions) {

  const refs = {
    onLobbyUpdate:   useRef(onLobbyUpdate),
    onQuestionStart: useRef(onQuestionStart),
    onQuestionEnd:   useRef(onQuestionEnd),
    onAnswerAck:     useRef(onAnswerAck),
    onAdminTick:     useRef(onAdminTick),
    onLeaderboard:   useRef(onLeaderboard),
    onQuizEnd:       useRef(onQuizEnd),
    onAdminStats:    useRef(onAdminStats),
  }

  // Keep refs fresh
  useEffect(() => { refs.onLobbyUpdate.current   = onLobbyUpdate   }, [onLobbyUpdate])
  useEffect(() => { refs.onQuestionStart.current = onQuestionStart }, [onQuestionStart])
  useEffect(() => { refs.onQuestionEnd.current   = onQuestionEnd   }, [onQuestionEnd])
  useEffect(() => { refs.onAnswerAck.current     = onAnswerAck     }, [onAnswerAck])
  useEffect(() => { refs.onAdminTick.current     = onAdminTick     }, [onAdminTick])
  useEffect(() => { refs.onLeaderboard.current   = onLeaderboard   }, [onLeaderboard])
  useEffect(() => { refs.onQuizEnd.current       = onQuizEnd       }, [onQuizEnd])
  useEffect(() => { refs.onAdminStats.current    = onAdminStats    }, [onAdminStats])

  useEffect(() => {
    if (!sessionId) return
    const socket = getQuizSocket()

    socket.emit('quiz:join', { sessionId, role })
    if (participantId) {
      // Join personal ACK room
      socket.emit('quiz:join', {
        sessionId: `${sessionId}:p:${participantId}`,
        role: 'participant'
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlers: [string, (...args: any[]) => void][] = [
      ['quiz:lobby_update',      (p) => refs.onLobbyUpdate.current?.(p)],
      ['quiz:question_start',    (p) => refs.onQuestionStart.current?.(p)],
      ['quiz:question_end',      (p) => refs.onQuestionEnd.current?.(p)],
      ['quiz:answer_ack',        (p) => refs.onAnswerAck.current?.(p)],
      ['quiz:admin_answer_tick', (p) => refs.onAdminTick.current?.(p)],
      ['quiz:leaderboard',       (p) => refs.onLeaderboard.current?.(p)],
      ['quiz:end',               (p) => refs.onQuizEnd.current?.(p)],
      ['quiz:admin_stats',       (p) => refs.onAdminStats.current?.(p)],
    ]
    handlers.forEach(([event, handler]) => socket.on(event, handler))

    return () => {
      socket.emit('quiz:leave', { sessionId })
      handlers.forEach(([event, handler]) => socket.off(event, handler))
    }
  }, [sessionId, participantId, role])
}
