'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  LayoutDashboard,
  PlusCircle,
  Settings,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Polls', href: '/dashboard', icon: BarChart3 },
  { label: 'Create Poll', href: '/dashboard/create', icon: PlusCircle },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col h-screen sticky top-0 border-r border-white/[0.08] bg-[#09090B]">
      {/* Logo */}
      <div className="p-6 border-b border-white/[0.08]">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-1.5 rounded-full bg-white/[0.06] group-hover:bg-white/[0.10] transition-colors">
            <Zap className="size-5 text-white" />
          </div>
          <span className="text-xl tracking-tight">
            <span className="text-white font-display font-semibold">Poll</span>
            <span className="text-white/50 font-display">Flow</span>
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-all',
                isActive
                  ? 'bg-white/[0.06] text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
              )}
            >
              <item.icon className="size-5 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
