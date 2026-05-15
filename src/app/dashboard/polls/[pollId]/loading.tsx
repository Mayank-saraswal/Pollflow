import { LoadingSpinner } from '@/components/shared/loading-spinner'

export default function AnalyticsLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Skeleton header */}
      <div className="flex flex-col gap-2">
        <div className="h-8 w-64 bg-white/[0.04] rounded-xl animate-pulse" />
        <div className="h-4 w-96 bg-white/[0.03] rounded-xl animate-pulse" />
      </div>
      {/* Skeleton KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-white/[0.03] rounded-2xl
                                 border border-white/[0.04] animate-pulse" />
        ))}
      </div>
      {/* Skeleton charts */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-40 bg-white/[0.03] rounded-2xl
                               border border-white/[0.04] animate-pulse" />
      ))}
    </div>
  )
}
