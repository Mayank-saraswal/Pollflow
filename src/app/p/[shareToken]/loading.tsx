import { Zap, Loader2 } from 'lucide-react'

export default function PollLoading() {
  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col items-center
                    justify-center gap-4">
      <Zap className="w-8 h-8 text-white/20" />
      <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
      <p className="font-body text-white/25 text-sm">Loading poll...</p>
    </div>
  )
}
