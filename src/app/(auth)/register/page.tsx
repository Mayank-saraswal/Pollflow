import type { Metadata } from 'next'
import Link from 'next/link'
import { Zap } from 'lucide-react'

export const metadata: Metadata = { title: 'Create Account' }

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 dot-pattern">
      <div
        aria-hidden
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-white/[0.03] blur-[100px] rounded-full pointer-events-none"
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-full bg-white/[0.06] group-hover:bg-white/[0.10] transition-colors">
              <Zap className="size-6 text-white" />
            </div>
            <span className="text-2xl tracking-tight">
              <span className="text-white font-display font-semibold">Poll</span>
              <span className="text-white/50 font-display">Flow</span>
            </span>
          </Link>
        </div>

        <div className="glass-card rounded-2xl gradient-border p-8">
          <h1 className="text-2xl font-display font-semibold text-white mb-2 text-center">Create account</h1>
          <p className="text-white/50 font-body text-sm text-center mb-8">
            Get started for free, no credit card required
          </p>

          {/* OAuth buttons placeholder — implemented in Step 2 */}
          <div className="flex flex-col gap-3">
            <div className="h-11 rounded-full bg-white/[0.06] animate-pulse" />
            <div className="h-11 rounded-full bg-white/[0.06] animate-pulse" />
          </div>

          <p className="text-center text-sm font-body text-white/50 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-white hover:text-white/80 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
