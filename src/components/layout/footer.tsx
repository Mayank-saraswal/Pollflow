import Link from 'next/link'
import { Zap } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-10 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row
                      items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-white/50" />
          <span className="font-display font-semibold text-white/50 text-sm">
            PollFlow
          </span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-6">
          {[
            { label: 'Privacy', href: '#' },
            { label: 'Terms',   href: '#' },
            { label: 'GitHub',  href: 'https://github.com' },
          ].map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="font-body text-white/30 text-xs
                         hover:text-white/60 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Copyright */}
        <p className="font-body text-white/20 text-xs">
          © {new Date().getFullYear()} PollFlow. Built for makers.
        </p>
      </div>
    </footer>
  )
}
