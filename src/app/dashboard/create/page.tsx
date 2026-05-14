import type { Metadata } from 'next'
import { PageHeader } from '@/components/shared/page-header'

export const metadata: Metadata = { title: 'Create Poll' }

export default function CreatePollPage() {
  return (
    <div>
      <PageHeader
        title="Create Poll"
        description="Build your poll and share it with the world"
      />
      {/* PollBuilder component — implemented in Step 2 */}
      <div className="glass-card rounded-2xl p-8 text-center text-white/50 text-sm">
        Poll builder coming in Step 2
      </div>
    </div>
  )
}
