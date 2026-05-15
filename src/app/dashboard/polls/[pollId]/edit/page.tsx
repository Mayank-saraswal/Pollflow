import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { EditPollForm } from '@/components/poll/edit-poll-form'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BarChart3 } from 'lucide-react'

interface Props { params: Promise<{ pollId: string }> }

export default async function EditPollPage({ params }: Props) {
  const { pollId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  let poll
  try {
    poll = await prisma.poll.findUnique({
      where:   { id: pollId },
      include: {
        questions: {
          include: { options: true },
          orderBy: { order: 'asc' },
        },
      },
    })
  } catch {
    notFound()
  }

  if (!poll) notFound()
  if (poll.creatorId !== session.user.id) redirect('/dashboard')

  if (poll.status === 'PUBLISHED') {
    redirect(`/dashboard/polls/${pollId}`)
  }

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <PageHeader
        title="Edit Poll"
        description="Update your poll settings and questions."
        actions={
          <Link href={`/dashboard/polls/${pollId}`}>
            <Button variant="secondary" size="sm" className="gap-2 font-body">
              <BarChart3 className="w-3.5 h-3.5" />
              View Analytics
            </Button>
          </Link>
        }
      />
      <EditPollForm poll={poll as any} />
    </div>
  )
}
