'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import { toast } from 'sonner'
import { Zap, Loader2, LogIn } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'

export default function JoinQuizPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [code, setCode] = useState<string[]>(Array(6).fill(''))
  const [displayName, setDisplayName] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [needsAuth, setNeedsAuth] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleInput = (index: number, value: string) => {
    const char = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (!char) return

    const newCode = [...code]
    newCode[index] = char[0]
    setCode(newCode)
    setError('')

    // Auto-advance
    if (index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 6 filled
    if (index === 5 && newCode.every((c) => c)) {
      submitJoin(newCode.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (code[index]) {
        const newCode = [...code]
        newCode[index] = ''
        setCode(newCode)
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus()
        const newCode = [...code]
        newCode[index - 1] = ''
        setCode(newCode)
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    if (pasted.length === 6) {
      const newCode = pasted.split('')
      setCode(newCode)
      inputRefs.current[5]?.focus()
      submitJoin(pasted)
    }
  }

  const submitJoin = async (joinCode: string) => {
    setJoining(true)
    setError('')
    setNeedsAuth(false)

    try {
      const name = displayName.trim() || session?.user?.name || ''
      const res = await axios.post('/api/quiz/join', { joinCode, displayName: name })
      const { sessionId, participantId } = res.data.data
      // Store participantId in sessionStorage for the play page
      sessionStorage.setItem(`quiz:${sessionId}:pid`, participantId)
      toast.success('Joined!')
      router.push(`/quiz/${sessionId}/play`)
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.error ?? 'Failed to join'
        if (msg.includes('logged in')) {
          setNeedsAuth(true)
        }
        setError(msg)
      } else {
        setError('Failed to join')
      }
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-12 group">
        <img src="/logo.gif" alt="PollFlow Logo" className="h-10 w-auto" />
      </Link>

      {/* Heading */}
      <h1 className="font-display font-semibold text-white text-3xl mb-2">
        Enter Quiz Code
      </h1>
      <p className="text-white/40 font-body text-sm mb-8">
        Enter the 6-character code from your host
      </p>

      {/* PIN input */}
      <div className="flex gap-3 mb-6" onPaste={handlePaste}>
        {code.map((char, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el }}
            type="text"
            maxLength={1}
            value={char}
            onChange={(e) => handleInput(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={cn(
              'w-14 h-16 md:w-16 md:h-[72px] text-center font-display text-2xl font-semibold',
              'bg-white/[0.04] border rounded-xl text-white uppercase',
              'outline-none transition-all duration-150',
              'focus:border-white/[0.30] focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.05)]',
              char ? 'border-white/[0.15]' : 'border-white/[0.10]',
            )}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="badge badge-danger mb-4 text-sm px-4 py-1.5">
          {error}
        </div>
      )}

      {/* Auth required */}
      {needsAuth && (
        <Link
          href="/login"
          className="btn-primary mb-4"
        >
          <LogIn className="w-4 h-4" />
          Sign in to join
        </Link>
      )}

      {/* Display name */}
      <div className="w-full max-w-xs mb-6">
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={session?.user?.name ?? 'Your display name'}
          className="input-base text-center"
          maxLength={30}
        />
      </div>

      {/* Join button */}
      <button
        onClick={() => {
          const joinCode = code.join('')
          if (joinCode.length === 6) submitJoin(joinCode)
          else toast.error('Enter all 6 characters')
        }}
        disabled={joining || code.some((c) => !c)}
        className="btn-primary btn-lg"
      >
        {joining ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : null}
        Join Quiz →
      </button>
    </div>
  )
}
