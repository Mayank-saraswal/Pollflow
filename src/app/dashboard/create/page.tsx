import { PageHeader } from '@/components/shared/page-header'
import { PollBuilder } from '@/components/poll/poll-builder'

export const metadata = { title: 'Create Poll' }

export default function CreatePollPage() {
  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <PageHeader
        title="Create a Poll"
        description="Build your poll, set questions and options, then share the link."
      />
      <PollBuilder />
    </div>
  )
}
