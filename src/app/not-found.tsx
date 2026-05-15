import Link from 'next/link'
import { Zap, ArrowRight, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col items-center
                    justify-center px-4 text-center">

      {/* Background number */}
      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
      >
        <span className="font-display font-semibold text-[200px] md:text-[300px]
                        text-white/[0.025] leading-none">
          404
        </span>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-md">
        <Link href="/" className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-white/40" />
          <span className="font-display font-semibold text-white/40 text-lg">
            PollFlow
          </span>
        </Link>

        <div className="flex flex-col gap-3">
          <h1 className="font-display font-semibold text-white text-4xl">
            Page not found
          </h1>
          <p className="font-body text-white/40 text-base leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or may
            have been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link href="/">
            <Button className="gap-2 font-display">
              Go home
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary" className="gap-2 font-body">
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
