import type { Metadata } from 'next'
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'

export const metadata: Metadata = { title: 'Dashboard' }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  )
}
