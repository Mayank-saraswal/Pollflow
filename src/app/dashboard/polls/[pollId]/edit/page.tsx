import type { Metadata } from 'next'
import { PageHeader } from '@/components/shared/page-header'

export const metadata: Metadata = { title: 'Edit Poll' }

interface Props {
  params: Promise<{ pollId: string }>
}

export default async function EditPollPage({ params }: Props) {
  const { pollId } = await params
  return (
    <div>
      <PageHeader
        title="Edit Poll"
        description={`Editing poll ${pollId}`}
      />
      <div className="glass-card rounded-2xl p-8 text-center text-white/50 text-sm">
        Poll editor coming in Step 2
      </div>
    </div>
  )
}
