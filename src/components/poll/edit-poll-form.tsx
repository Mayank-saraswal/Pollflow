'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Save, ArrowLeft, AlertTriangle,
  Calendar, ShieldCheck, EyeOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import axios from 'axios'
import { updatePollSchema, type UpdatePollInput } from '@/lib/validations/poll'
import { cn } from '@/lib/utils'
import type { Poll } from '@/types'
import Link from 'next/link'

interface Props { poll: Poll & { questions: any[] } }

export function EditPollForm({ poll }: Props) {
  const router  = useRouter()
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<UpdatePollInput>({
    resolver: zodResolver(updatePollSchema),
    defaultValues: {
      title:       poll.title,
      description: poll.description ?? '',
      voterMode:   poll.voterMode,
      isAnonymous: poll.isAnonymous,
      expiresAt:   poll.expiresAt
        ? new Date(poll.expiresAt).toISOString().slice(0, 16)
        : undefined,
    },
  })

  const watchVoterMode = watch('voterMode')

  const onSubmit = async (data: UpdatePollInput) => {
    setSaving(true)
    try {
      await axios.patch(`/api/polls/${poll.id}`, data)
      toast.success('Poll updated!')
      router.push(`/dashboard/polls/${poll.id}`)
      router.refresh()
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error ?? 'Update failed'
        : 'Update failed'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">

      {/* Note about questions */}
      {poll.status === 'EXPIRED' && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl
                       bg-white/[0.02] border border-white/[0.08]
                       text-white/50 text-sm font-body">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-yellow-400/70" />
          This poll has expired. You can update settings but questions
          cannot be changed.
        </div>
      )}

      <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6
                     flex flex-col gap-5">
        <h2 className="font-display font-semibold text-white text-base">
          Poll Settings
        </h2>

        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <Label className="font-body text-white/60 text-xs">Poll title *</Label>
          <input
            {...register('title')}
            className="w-full h-11 px-4 rounded-xl
                      bg-white/[0.04] border border-white/[0.08]
                      text-white text-sm font-body
                      placeholder:text-white/25
                      focus:outline-none focus:border-white/[0.20]
                      focus:ring-2 focus:ring-white/[0.05] transition-colors"
          />
          {errors.title && (
            <p className="text-red-400 text-xs">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <Label className="font-body text-white/60 text-xs">Description</Label>
          <textarea
            {...register('description')}
            rows={2}
            className="w-full px-4 py-3 rounded-xl
                      bg-white/[0.04] border border-white/[0.08]
                      text-white text-sm font-body resize-none
                      placeholder:text-white/25
                      focus:outline-none focus:border-white/[0.20]
                      focus:ring-2 focus:ring-white/[0.05] transition-colors"
          />
        </div>

        {/* Voter mode */}
        <div className="flex flex-col gap-2">
          <Label className="font-body text-white/60 text-xs flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Who can vote?
          </Label>
          <div className="flex rounded-xl overflow-hidden border border-white/[0.08]">
            {(['ANYONE', 'AUTHENTICATED_ONLY'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setValue('voterMode', mode, { shouldDirty: true })}
                className={cn(
                  'flex-1 py-2.5 text-xs font-body font-medium transition-all',
                  watchVoterMode === mode
                    ? 'bg-white text-[#09090B]'
                    : 'bg-white/[0.03] text-white/40 hover:text-white/70'
                )}
              >
                {mode === 'ANYONE' ? 'Anyone' : 'Login required'}
              </button>
            ))}
          </div>
        </div>

        {/* Expiry */}
        <div className="flex flex-col gap-2">
          <Label className="font-body text-white/60 text-xs flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Expiry date
          </Label>
          <input
            type="datetime-local"
            {...register('expiresAt')}
            className="w-full h-11 px-4 rounded-xl
                      bg-white/[0.04] border border-white/[0.08]
                      text-white/70 text-sm font-body
                      focus:outline-none focus:border-white/[0.20]
                      transition-colors [color-scheme:dark]"
          />
        </div>

        {/* Anonymous */}
        <div className="flex items-center justify-between p-4 rounded-xl
                       bg-white/[0.02] border border-white/[0.06]">
          <div className="flex items-center gap-3">
            <EyeOff className="w-4 h-4 text-white/40" />
            <div className="flex flex-col gap-0.5">
              <span className="font-body text-white text-sm font-medium">
                Anonymous responses
              </span>
              <span className="font-body text-white/30 text-xs">
                Respondent identities not recorded
              </span>
            </div>
          </div>
          <Controller
            control={control}
            name="isAnonymous"
            render={({ field }) => (
              <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
            )}
          />
        </div>
      </div>

      {/* Questions read-only list */}
      <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6
                     flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-white text-base">
            Questions
            <span className="font-body text-white/30 text-sm font-normal ml-2">
              (read-only)
            </span>
          </h2>
          <span className="font-body text-white/30 text-xs">
            {poll.questions.length} questions
          </span>
        </div>
        <p className="font-body text-white/30 text-xs">
          To change questions, delete this poll and create a new one.
        </p>
        <div className="flex flex-col gap-2">
          {poll.questions.map((q: any, idx: number) => (
            <div
              key={q.id}
              className="px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06]"
            >
              <p className="font-body text-white/60 text-sm">
                <span className="text-white/25 mr-2">Q{idx + 1}</span>
                {q.text}
              </p>
              <p className="font-body text-white/25 text-xs mt-1">
                {q.options.length} options
                {q.isMandatory ? ' · Required' : ' · Optional'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Link href={`/dashboard/polls/${poll.id}`}>
          <Button variant="ghost" className="gap-2 font-body text-white/40">
            <ArrowLeft className="w-4 h-4" />
            Cancel
          </Button>
        </Link>
        <Button
          type="submit"
          loading={saving}
          disabled={!isDirty}
          className="gap-2 font-display"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>
    </form>
  )
}
