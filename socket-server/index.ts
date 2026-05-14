import { createServer } from 'http'
import { Server } from 'socket.io'
import Redis from 'ioredis'

const PORT       = parseInt(process.env.SOCKET_PORT ?? '3001')
const CLIENT_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const REDIS_URL  = process.env.UPSTASH_REDIS_REST_URL ?? ''

const httpServer = createServer()

const io = new Server(httpServer, {
  cors: {
    origin:      CLIENT_URL,
    methods:     ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})

// Redis subscriber for Upstash pub/sub
const subscriber = new Redis(REDIS_URL)

io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`)

  socket.on('join:poll', ({ pollId }: { pollId: string }) => {
    if (!pollId) return
    socket.join(`poll:${pollId}`)
    console.log(`[socket] ${socket.id} joined poll:${pollId}`)
  })

  socket.on('leave:poll', ({ pollId }: { pollId: string }) => {
    if (!pollId) return
    socket.leave(`poll:${pollId}`)
  })

  socket.on('disconnect', () => {
    console.log(`[socket] disconnected: ${socket.id}`)
  })
})

// Listen to Redis channel and broadcast to room
subscriber.psubscribe('pollflow:poll:*', (err) => {
  if (err) console.error('[redis] psubscribe error:', err)
  else     console.log('[redis] subscribed to pollflow:poll:*')
})

subscriber.on(
  'pmessage',
  (_pattern: string, channel: string, message: string) => {
    const pollId  = channel.replace('pollflow:poll:', '')
    const payload = JSON.parse(message) as Record<string, unknown>

    io.to(`poll:${pollId}`).emit(
      (payload.event as string) ?? 'response:new',
      payload
    )

    console.log(
      `[socket] broadcast to poll:${pollId} →`,
      payload.event ?? 'response:new'
    )
  }
)

httpServer.listen(PORT, () => {
  console.log(`[socket-server] running on port ${PORT}`)
})
