'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import type { Poll, PollAnalytics } from '@/types'

const api = axios.create({ baseURL: '/api' })

// ── Fetch all my polls ──
export function usePolls(page = 1) {
  return useQuery({
    queryKey: ['polls', page],
    queryFn:  async () => {
      const { data } = await api.get(`/polls?page=${page}&limit=10`)
      return data.data as { polls: Poll[]; pagination: { pages: number } }
    },
  })
}

// ── Fetch single poll (creator) ──
export function usePoll(pollId: string) {
  return useQuery({
    queryKey: ['poll', pollId],
    queryFn:  async () => {
      const { data } = await api.get(`/polls/${pollId}`)
      return data.data as Poll
    },
    enabled: !!pollId,
  })
}

// ── Fetch public poll by share token ──
export function usePublicPoll(shareToken: string) {
  return useQuery({
    queryKey: ['public-poll', shareToken],
    queryFn:  async () => {
      const { data } = await api.get(`/p/${shareToken}`)
      return data.data as Poll
    },
    enabled: !!shareToken,
    retry:   false,
  })
}

// ── Analytics (auto-refreshes every 30s) ──
export function usePollAnalytics(pollId: string) {
  return useQuery({
    queryKey:        ['analytics', pollId],
    queryFn:         async () => {
      const { data } = await api.get(`/polls/${pollId}/analytics`)
      return data.data as PollAnalytics
    },
    enabled:         !!pollId,
    refetchInterval: 30_000,
  })
}

// ── Create poll ──
export function useCreatePoll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: unknown) => {
      const { data } = await api.post('/polls', payload)
      return data.data as Poll
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['polls'] })
    },
  })
}

// ── Delete poll ──
export function useDeletePoll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (pollId: string) => {
      await api.delete(`/polls/${pollId}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['polls'] })
    },
  })
}

// ── Publish poll ──
export function usePublishPoll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (pollId: string) => {
      const { data } = await api.post(`/polls/${pollId}/publish`)
      return data.data as Poll
    },
    onSuccess: (_data, pollId) => {
      qc.invalidateQueries({ queryKey: ['poll', pollId] })
      qc.invalidateQueries({ queryKey: ['analytics', pollId] })
      qc.invalidateQueries({ queryKey: ['polls'] })
    },
  })
}

// ── Submit response ──
export function useSubmitResponse(shareToken: string) {
  return useMutation({
    mutationFn: async (answers: { questionId: string; optionId: string }[]) => {
      const { data } = await api.post(`/p/${shareToken}/respond`, { answers })
      return data.data as { responseId: string }
    },
  })
}
