'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Only log the digest (safe identifier) in production, never raw error details
    if (process.env.NODE_ENV === 'development') {
      console.error('[App Error]', error)
    }
  }, [error])

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center
                    justify-center px-4 text-center">
      <div className="flex flex-col items-center gap-6 max-w-md">
        <div className="w-16 h-16 rounded-full bg-red-400/[0.08]
                       border border-red-400/[0.15]
                       flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-400" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="font-display font-semibold text-white text-2xl">
            Something went wrong
          </h2>
          <p className="font-body text-white/45 text-sm">
            An unexpected error occurred. Please try again or contact support if
            the issue persists.
          </p>
          {error.digest && (
            <p className="font-body text-white/20 text-xs mt-1">
              Error reference: {error.digest}
            </p>
          )}
        </div>
        <Button onClick={reset} className="gap-2 font-display">
          <RefreshCw className="w-4 h-4" />
          Try again
        </Button>
      </div>
    </div>
  )
}
