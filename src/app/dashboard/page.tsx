import type { Metadata } from 'next'
import Link from 'next/link'
import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/page-header'

export const metadata: Metadata = { title: 'My Polls' }

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="My Polls"
        description="Create and manage your polls"
        actions={
          <Link href="/dashboard/create">
            <Button className="btn-gradient gap-2">
              <PlusCircle className="size-4" />
              New Poll
            </Button>
          </Link>
        }
      />

      {/* Poll list — populated in Step 2 */}
      <div className="glass-card rounded-2xl p-16 text-center">
        <p className="text-white/50 text-sm">
          Your polls will appear here. Connect a database to get started.
        </p>
        <Link href="/dashboard/create" className="mt-4 inline-block">
          <Button className="btn-gradient gap-2 mt-4">
            <PlusCircle className="size-4" />
            Create your first poll
          </Button>
        </Link>
      </div>
    </div>
  )
}
