'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'

function LoginContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl  = searchParams.get('callbackUrl') ?? '/dashboard'

  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email:    data.email,
        password: data.password,
        redirect: false,
      })
      if (result?.error) {
        toast.error('Invalid email or password')
      } else {
        toast.success('Welcome back!')
        router.push(callbackUrl)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = async (provider: 'google' | 'github') => {
    setOauthLoading(provider)
    await signIn(provider, { callbackUrl })
  }

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center px-4">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="fixed top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: '600px', height: '300px',
          background: 'radial-gradient(ellipse, rgba(255,255,255,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-sm flex flex-col gap-8">

        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 group">
          <div className="p-2 rounded-xl bg-white/[0.06] border border-white/[0.08]
                         group-hover:bg-white/[0.10] transition-colors">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-semibold text-white text-xl">
            Poll<span className="text-white/40">Flow</span>
          </span>
        </Link>

        {/* Card */}
        <div className="bg-[#111113] border border-white/[0.08] rounded-2xl p-8 flex flex-col gap-6">

          {/* Heading */}
          <div className="text-center flex flex-col gap-1">
            <h1 className="font-display font-semibold text-white text-2xl">
              Welcome back
            </h1>
            <p className="font-body text-white/45 text-sm">
              Sign in to your PollFlow account
            </p>
          </div>

          {/* OAuth Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleOAuth('google')}
              disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-3
                        h-11 rounded-full border border-white/[0.10]
                        bg-white/[0.04] hover:bg-white/[0.08]
                        text-white/80 text-sm font-body font-medium
                        transition-all duration-200 disabled:opacity-50"
            >
              {oauthLoading === 'google' ? (
                <span className="w-4 h-4 border-2 border-white/20 border-t-white/70
                                rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </button>

            <button
              onClick={() => handleOAuth('github')}
              disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-3
                        h-11 rounded-full border border-white/[0.10]
                        bg-white/[0.04] hover:bg-white/[0.08]
                        text-white/80 text-sm font-body font-medium
                        transition-all duration-200 disabled:opacity-50"
            >
              {oauthLoading === 'github' ? (
                <span className="w-4 h-4 border-2 border-white/20 border-t-white/70
                                rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
              )}
              Continue with GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="font-body text-white/25 text-xs">or</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <Label className="font-body text-white/60 text-xs">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2
                                w-4 h-4 text-white/25 pointer-events-none" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full h-11 pl-10 pr-4 rounded-xl
                            bg-white/[0.04] border border-white/[0.08]
                            text-white text-sm font-body
                            placeholder:text-white/25
                            focus:outline-none focus:border-white/[0.20]
                            focus:ring-2 focus:ring-white/[0.05]
                            transition-colors"
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs font-body">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label className="font-body text-white/60 text-xs">Password</Label>
                <Link
                  href="#"
                  className="font-body text-white/30 text-xs hover:text-white/60 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2
                               w-4 h-4 text-white/25 pointer-events-none" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full h-11 pl-10 pr-12 rounded-xl
                            bg-white/[0.04] border border-white/[0.08]
                            text-white text-sm font-body
                            placeholder:text-white/25
                            focus:outline-none focus:border-white/[0.20]
                            focus:ring-2 focus:ring-white/[0.05]
                            transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2
                            text-white/25 hover:text-white/60 transition-colors"
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye    className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs font-body">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              loading={loading}
              size="lg"
              className="w-full mt-1 font-display"
            >
              Sign In
              {!loading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center font-body text-white/30 text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-white/60 hover:text-white transition-colors">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-white/20 border-t-white/70 rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
