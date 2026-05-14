'use client'

import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { SOCKET_EVENTS } from '@/lib/constants'
import type { LiveUpdatePayload } from '@/types'

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001'

let globalSocket: Socket | null = null

function getSocket(): Socket {
  if (!globalSocket || !globalSocket.connected) {
    globalSocket = io(SOCKET_URL, {
      transports:           ['websocket', 'polling'],
      reconnectionDelay:    1000,
      reconnectionAttempts: 5,
      timeout:              10000,
    })
  }
  return globalSocket
}

interface UseSocketOptions {
  pollId:       string
  onUpdate?:    (payload: LiveUpdatePayload) => void
  onPublished?: () => void
  onExpired?:   () => void
}

export function useSocket({
  pollId,
  onUpdate,
  onPublished,
  onExpired,
}: UseSocketOptions) {
  // Keep latest callbacks in refs to avoid re-subscribing
  const onUpdateRef    = useRef(onUpdate)
  const onPublishedRef = useRef(onPublished)
  const onExpiredRef   = useRef(onExpired)

  useEffect(() => { onUpdateRef.current    = onUpdate    }, [onUpdate])
  useEffect(() => { onPublishedRef.current = onPublished }, [onPublished])
  useEffect(() => { onExpiredRef.current   = onExpired   }, [onExpired])

  useEffect(() => {
    if (!pollId) return

    const socket = getSocket()

    socket.emit(SOCKET_EVENTS.JOIN_POLL, { pollId })

    const handleUpdate    = (payload: LiveUpdatePayload) => onUpdateRef.current?.(payload)
    const handlePublished = () => onPublishedRef.current?.()
    const handleExpired   = () => onExpiredRef.current?.()

    socket.on(SOCKET_EVENTS.RESPONSE_NEW,   handleUpdate)
    socket.on(SOCKET_EVENTS.POLL_PUBLISHED, handlePublished)
    socket.on(SOCKET_EVENTS.POLL_EXPIRED,   handleExpired)

    return () => {
      socket.emit(SOCKET_EVENTS.LEAVE_POLL, { pollId })
      socket.off(SOCKET_EVENTS.RESPONSE_NEW,   handleUpdate)
      socket.off(SOCKET_EVENTS.POLL_PUBLISHED, handlePublished)
      socket.off(SOCKET_EVENTS.POLL_EXPIRED,   handleExpired)
    }
  }, [pollId])
}

// Also export as usePollSocket for the original name from the spec
export { useSocket as usePollSocket }
