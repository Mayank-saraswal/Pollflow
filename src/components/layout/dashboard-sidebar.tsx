'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  Zap, LayoutDashboard, PlusCircle, BarChart3,
  Settings, LogOut, User, Menu, X, Trophy
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard',        icon: LayoutDashboard },
  { label: 'Create Poll', href: '/dashboard/create', icon: PlusCircle,
    highlight: true },
  { label: 'My Polls',   href: '/dashboard/polls',  icon: BarChart3 },
  { label: 'Quizzes',    href: '/dashboard/quiz',   icon: Trophy },
  { label: 'Settings',  href: '/dashboard/settings', icon: Settings },
]

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null }
}

export function DashboardSidebar({ user }: Props) {
  const pathname    = usePathname()
  const [open, setOpen] = useState(false)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          onClick={() => setOpen(false)}
        >
          <div className="p-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08]
                         group-hover:bg-white/[0.10] transition-colors">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-semibold text-white text-lg">
            Poll<span className="text-white/40">Flow</span>
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon      = item.icon
          const isActive  = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm',
                'font-body font-medium transition-all duration-150 group',
                item.highlight
                  ? isActive
                    ? 'bg-white text-[#09090B]'
                    : 'bg-white/[0.08] text-white hover:bg-white/[0.12] border border-white/[0.10]'
                  : isActive
                    ? 'bg-white/[0.08] text-white'
                    : 'text-white/45 hover:text-white hover:bg-white/[0.05]',
              )}
            >
              <Icon className={cn(
                'w-4 h-4 shrink-0 transition-colors',
                item.highlight && !isActive ? 'text-white/70' : ''
              )} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User card */}
      <div className="px-3 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 p-3 rounded-xl
                       bg-white/[0.03] border border-white/[0.06]">
          <Avatar className="w-8 h-8 ring-1 ring-white/10 shrink-0">
            <AvatarImage src={user.image ?? ''} />
            <AvatarFallback className="bg-white/[0.08] text-white/70 text-xs font-display font-semibold">
              {user.name?.[0]?.toUpperCase() ?? 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-display font-semibold truncate leading-tight">
              {user.name ?? 'User'}
            </p>
            <p className="text-white/35 text-xs font-body truncate">
              {user.email}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            title="Sign out"
            className="p-1.5 rounded-lg text-white/25 hover:text-white/60
                      hover:bg-white/[0.06] transition-all shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64
                        bg-[#0D0D10] border-r border-white/[0.06] z-30 flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40
                     bg-[#09090B]/90 backdrop-blur-xl border-b border-white/[0.06]
                     px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-white" />
          <span className="font-display font-semibold text-white text-base">
            Poll<span className="text-white/40">Flow</span>
          </span>
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-xl text-white/50 hover:text-white
                    hover:bg-white/[0.06] transition-all"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="md:hidden fixed left-0 top-0 bottom-0 w-72 z-50
                           bg-[#0D0D10] border-r border-white/[0.06] flex flex-col">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Mobile spacer */}
      <div className="md:hidden h-14" />
    </>
  )
}
