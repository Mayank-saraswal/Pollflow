'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  PlusCircle, Search, SlidersHorizontal,
  BarChart3, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/page-header'
import { PollCard } from '@/components/poll/poll-card'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { usePolls } from '@/hooks/use-poll'
import type { PollStatus } from '@/types'
import { cn } from '@/lib/utils'

const FILTERS: { label: string; value: PollStatus | 'ALL' }[] = [
  { label: 'All',       value: 'ALL'       },
  { label: 'Active',    value: 'ACTIVE'    },
  { label: 'Expired',   value: 'EXPIRED'   },
  { label: 'Published', value: 'PUBLISHED' },
]

export default function MyPollsPage() {
  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState<PollStatus | 'ALL'>('ALL')
  const [page,      setPage]      = useState(1)
  const { data, isLoading, isError, refetch } = usePolls(page)

  const filtered = useMemo(() => {
    if (!data?.polls) return []
    return data.polls.filter((p) => {
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase())
      const matchesFilter = filter === 'ALL' || p.status === filter
      return matchesSearch && matchesFilter
    })
  }, [data?.polls, search, filter])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Polls"
        description="Manage all your polls in one place."
        actions={
          <Link href="/dashboard/create">
            <Button className="gap-2 font-display" size="default">
              <PlusCircle className="w-4 h-4" />
              New Poll
            </Button>
          </Link>
        }
      />

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2
                            w-4 h-4 text-white/25 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search polls..."
            className="w-full h-10 pl-10 pr-10 rounded-full
                      bg-white/[0.04] border border-white/[0.08]
                      text-white text-sm font-body
                      placeholder:text-white/25
                      focus:outline-none focus:border-white/[0.18]
                      transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2
                        text-white/25 hover:text-white/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-full
                       bg-white/[0.04] border border-white/[0.06]">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-body font-medium',
                'transition-all duration-150',
                filter === f.value
                  ? 'bg-white text-[#09090B]'
                  : 'text-white/40 hover:text-white/70'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <LoadingSpinner className="py-20" label="Loading your polls..." />
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <p className="font-body text-white/40 text-sm">Failed to load polls.</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title={search || filter !== 'ALL' ? 'No polls match' : 'No polls yet'}
          description={
            search || filter !== 'ALL'
              ? 'Try adjusting your search or filter.'
              : 'Create your first poll and start collecting responses.'
          }
          action={
            !search && filter === 'ALL' ? (
              <Link href="/dashboard/create">
                <Button className="gap-2 font-display">
                  <PlusCircle className="w-4 h-4" />
                  Create your first poll
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="font-body text-white/30 text-xs">
            {filtered.length} poll{filtered.length !== 1 ? 's' : ''}
            {search && ` matching "${search}"`}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((poll) => (
              <PollCard key={poll.id} poll={poll as any} />
            ))}
          </div>

          {/* Pagination */}
          {data?.pagination && data.pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Previous
              </Button>
              <span className="font-body text-white/30 text-sm px-3">
                Page {page} of {data.pagination.pages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page === data.pagination.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
