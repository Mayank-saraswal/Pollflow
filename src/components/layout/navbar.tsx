'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import {
  Zap,
  Menu,
  LayoutDashboard,
  BarChart3,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Examples', href: '#examples' },
]

export function Navbar() {
  const { data: session } = useSession()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const isMarketing = pathname === '/'

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-[#09090B]/80 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_1px_0_rgba(255,255,255,0.04)]'
          : 'bg-transparent'
      )}
    >
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.gif" alt="PollFlow Logo" className="h-8 w-auto" />
        </Link>

        {/* Desktop Nav Links */}
        {isMarketing && (
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-body text-white/50 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-white/[0.06] transition-colors outline-none"
              >
                <Avatar className="size-8 ring-2 ring-white/20">
                  <AvatarImage src={session.user?.image ?? ''} />
                  <AvatarFallback className="bg-white/10 text-white text-xs font-medium">
                    {session.user?.name?.[0]?.toUpperCase() ?? 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:block text-sm font-medium text-foreground">
                  {session.user?.name?.split(' ')[0]}
                </span>
                <ChevronDown className="size-4 text-white/50 hidden md:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-[#111113] border-white/[0.08] text-white"
              >
                <div className="px-2 py-1.5">
                  <p className="text-xs text-white/50">Signed in as</p>
                  <p className="text-sm font-medium truncate">{session.user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  render={<Link href="/dashboard" />}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={<Link href="/dashboard" />}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <BarChart3 className="size-4" />
                  My Polls
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="size-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:flex"
                asChild
              >
                <Link href="/login">Sign In</Link>
              </Button>
              <Button
                variant="default"
                size="sm"
                asChild
              >
                <Link href="/register">Get Started</Link>
              </Button>
            </>
          )}

          {/* Mobile Menu */}
          {isMarketing && (
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <div className="md:hidden">
                <SheetTrigger
                  render={
                    <Button variant="ghost" size="icon" />
                  }
                >
                  <Menu className="size-5" />
                </SheetTrigger>
              </div>
              <SheetContent
                side="right"
                className="bg-[#111113] border-white/[0.08] w-72 text-white"
              >
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col gap-6 mt-8">
                  {NAV_LINKS.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="text-lg font-body text-white/50 hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  ))}
                  <div className="flex flex-col gap-3 pt-4 border-t border-white/[0.08]">
                    <Button
                      variant="ghost"
                      className="w-full"
                      asChild
                    >
                      <Link href="/login" onClick={() => setMobileOpen(false)}>Sign In</Link>
                    </Button>
                    <Button
                      variant="default"
                      className="w-full"
                      asChild
                    >
                      <Link href="/register" onClick={() => setMobileOpen(false)}>Get Started</Link>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </nav>
    </header>
  )
}
