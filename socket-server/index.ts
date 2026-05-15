import { createServer, IncomingMessage, ServerResponse } from 'http'
import { Server } from 'socket.io'

const PORT       = parseInt(process.env.SOCKET_PORT ?? '3001')
const CLIENT_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const INTERNAL_SECRET = process.env.SOCKET_INTERNAL_SECRET ?? 'dev-secret'

const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
  // ── Health check ────────────────────────────────────────────────
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  // ── Internal event endpoint (replaces Redis pub/sub) ────────────
  if (req.method === 'POST' && req.url === '/internal/emit') {
    // Verify shared secret
    const authHeader = req.headers['authorization']
    if (authHeader !== `Bearer ${INTERNAL_SECRET}`) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Unauthorized' }))
      return
    }

    let body = ''
    req.on('data', (chunk: Buffer) => { body += chunk.toString() })
    req.on('end', () => {
      try {
        const { channel, payload } = JSON.parse(body) as {
          channel: string
          payload: string
        }
        handleEvent(channel, payload)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
      } catch (err) {
        console.error('[internal/emit] parse error:', err)
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Invalid JSON' }))
      }
    })
    return
  }

  // Default 404
  res.writeHead(404)
  res.end()
})

const io = new Server(httpServer, {
  cors: {
    origin:      CLIENT_URL,
    methods:     ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})

// ── Poll namespace (default) ──────────────────────────────────────
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

// ── Quiz namespace ─────────────────────────────────────────────────
const quizNs = io.of('/quiz')

quizNs.on('connection', (socket) => {
  console.log(`[quiz] connected: ${socket.id}`)

  // Participant or admin joins session room
  socket.on('quiz:join', ({ sessionId, role }: {
    sessionId: string
    role: 'participant' | 'admin'
  }) => {
    if (!sessionId) return
    socket.join(`quiz:${sessionId}`)
    if (role === 'admin') {
      socket.join(`quiz:${sessionId}:admin`)
    }
    console.log(`[quiz] ${socket.id} joined quiz:${sessionId} as ${role}`)
  })

  socket.on('quiz:leave', ({ sessionId }: { sessionId: string }) => {
    socket.leave(`quiz:${sessionId}`)
    socket.leave(`quiz:${sessionId}:admin`)
  })

  socket.on('disconnect', () => {
    console.log(`[quiz] disconnected: ${socket.id}`)
  })
})

// ── Event handler (replaces Redis pmessage listener) ──────────────
function handleEvent(channel: string, message: string) {
  // ── Quiz events ───────────────────────────────────────────────
  const quizMatch = channel.match(/^quiz:(.+):events$/)
  if (quizMatch) {
    const sessionId = quizMatch[1]
    const event     = JSON.parse(message) as {
      type:    string
      room?:   string
      payload: object
    }

    let room: string
    if (event.room === 'admin') {
      room = `quiz:${sessionId}:admin`
    } else if (event.room?.startsWith('p:')) {
      // Personal room for individual participant ACK
      room = `quiz:${sessionId}:${event.room}`
    } else {
      room = `quiz:${sessionId}`
    }

    quizNs.to(room).emit(event.type, event.payload)
    console.log(`[quiz] → ${room} : ${event.type}`)
    return
  }

  // ── Poll events ───────────────────────────────────────────────
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

httpServer.listen(PORT, () => {
  console.log(`[socket-server] running on port ${PORT}`)
})
