import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/navbar'

export const metadata: Metadata = { title: 'Results' }

interface Props {
  params: Promise<{ shareToken: string }>
}

export default async function PublicResultsPage({ params }: Props) {
  const { shareToken } = await params
  return (
    <div className="min-h-screen dot-pattern">
      <Navbar />
      <div className="container mx-auto px-4 py-24 max-w-2xl">
        <div className="glass-card rounded-2xl gradient-border p-8 text-center text-white/50 text-sm">
          Public results for <code className="text-brand-400">{shareToken}</code> — coming in Step 2
        </div>
      </div>
    </div>
  )
}
