import { LoadingSpinner } from '@/components/shared/loading-spinner'

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <LoadingSpinner size="lg" label="Loading dashboard..." />
    </div>
  )
}
