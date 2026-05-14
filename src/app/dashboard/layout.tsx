import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <div className="min-h-screen bg-[#09090B] flex">
      <DashboardSidebar user={session.user} />
      <main className="flex-1 min-h-screen overflow-y-auto
                       pl-0 md:pl-64 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
