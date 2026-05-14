import type { Metadata } from 'next'
import { PageHeader } from '@/components/shared/page-header'

export const metadata: Metadata = { title: 'Poll Analytics' }

interface Props {
  params: Promise<{ pollId: string }>
}

export default async function PollAnalyticsPage({ params }: Props) {
  const { pollId } = await params
  return (
    <div>
      <PageHeader
        title="Poll Analytics"
        description={`Analytics for poll ${pollId}`}
      />
      <div className="glass-card rounded-2xl p-8 text-center text-white/50 text-sm">
        Analytics dashboard coming in Step 2
      </div>
    </div>
  )
}
