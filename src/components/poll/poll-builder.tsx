'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  PlusCircle, Trash2, GripVertical, Calendar,
  ShieldCheck, EyeOff, Asterisk, ChevronDown,
  ChevronUp, ArrowRight, AlertTriangle, ListChecks,
  ImagePlus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createPollSchema, type CreatePollInput } from '@/lib/validations/poll'
import { useCreatePoll } from '@/hooks/use-poll'
import { cn } from '@/lib/utils'

// ── Default values ──────────────────────────────────
const DEFAULT_QUESTION = () => ({
  text:        '',
  imageUrl:    null,
  isMandatory: true,
  order:       0,
  options:     [
    { text: '', imageUrl: null },
    { text: '', imageUrl: null },
  ],
})

// ── Poll Builder Component ───────────────────────────
export function PollBuilder() {
  const router      = useRouter()
  const createPoll  = useCreatePoll()
  const [step, setStep] = useState<1 | 2>(1)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreatePollInput>({
    resolver: zodResolver(createPollSchema),
    defaultValues: {
      title:       '',
      description: '',
      voterMode:   'ANYONE',
      isAnonymous: false,
      expiresAt:   null,
      questions:   [DEFAULT_QUESTION()],
    },
  })

  const {
    fields:  questions,
    append:  appendQuestion,
    remove:  removeQuestion,
  } = useFieldArray({ control, name: 'questions' })

  const watchVoterMode   = watch('voterMode')
  const watchIsAnonymous = watch('isAnonymous')

  const addQuestion = useCallback(() => {
    appendQuestion({
      ...DEFAULT_QUESTION(),
      order: questions.length,
    })
  }, [appendQuestion, questions.length])

  const onSubmit = async (data: CreatePollInput) => {
    try {
      const poll = await createPoll.mutateAsync(data)
      toast.success('Poll created!')
      router.push(`/dashboard/polls/${poll.id}`)
    } catch {
      toast.error('Failed to create poll. Try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">

      {/* ── Step 1: Poll Settings ── */}
      <section className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6
                          flex flex-col gap-5">
        <h2 className="font-display font-semibold text-white text-base flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-white/[0.08] border border-white/[0.10]
                          flex items-center justify-center text-xs text-white/50">1</span>
          Poll Details
        </h2>

        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <Label className="font-body text-white/60 text-xs">Poll title *</Label>
          <input
            {...register('title')}
            placeholder="What do you want to ask?"
            className="w-full h-11 px-4 rounded-xl
                      bg-white/[0.04] border border-white/[0.08]
                      text-white text-sm font-body
                      placeholder:text-white/25
                      focus:outline-none focus:border-white/[0.20]
                      focus:ring-2 focus:ring-white/[0.05] transition-colors"
          />
          {errors.title && (
            <p className="text-red-400 text-xs flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {errors.title.message}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <Label className="font-body text-white/60 text-xs">
            Description
            <span className="text-white/25 ml-1">(optional)</span>
          </Label>
          <textarea
            {...register('description')}
            rows={2}
            placeholder="Add context for your respondents..."
            className="w-full px-4 py-3 rounded-xl
                      bg-white/[0.04] border border-white/[0.08]
                      text-white text-sm font-body leading-relaxed resize-none
                      placeholder:text-white/25
                      focus:outline-none focus:border-white/[0.20]
                      focus:ring-2 focus:ring-white/[0.05] transition-colors"
          />
        </div>

        {/* Settings row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

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
                  onClick={() => setValue('voterMode', mode)}
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
              <span className="text-white/25">(optional)</span>
            </Label>
            <input
              type="datetime-local"
              {...register('expiresAt')}
              className="w-full h-11 px-4 rounded-xl
                        bg-white/[0.04] border border-white/[0.08]
                        text-white/70 text-sm font-body
                        focus:outline-none focus:border-white/[0.20]
                        focus:ring-2 focus:ring-white/[0.05] transition-colors
                        [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Anonymous toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl
                       bg-white/[0.02] border border-white/[0.06]">
          <div className="flex items-center gap-3">
            <EyeOff className="w-4 h-4 text-white/40" />
            <div className="flex flex-col gap-0.5">
              <span className="font-body text-white text-sm font-medium">
                Anonymous responses
              </span>
              <span className="font-body text-white/35 text-xs">
                Respondent identities are not recorded
              </span>
            </div>
          </div>
          <Controller
            control={control}
            name="isAnonymous"
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>
      </section>

      {/* ── Step 2: Questions ── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-white text-base flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-white/[0.08] border border-white/[0.10]
                            flex items-center justify-center text-xs text-white/50">2</span>
            Questions
            <span className="font-body text-white/30 text-xs font-normal ml-1">
              ({questions.length}/20)
            </span>
          </h2>
        </div>

        {questions.map((question, qIdx) => (
          <QuestionBlock
            key={question.id}
            qIdx={qIdx}
            control={control}
            register={register}
            errors={errors}
            onRemove={() => removeQuestion(qIdx)}
            canRemove={questions.length > 1}
          />
        ))}

        {/* Add question */}
        {questions.length < 20 && (
          <button
            type="button"
            onClick={addQuestion}
            className="flex items-center justify-center gap-2 h-12 rounded-2xl
                      border border-dashed border-white/[0.10]
                      text-white/35 text-sm font-body
                      hover:border-white/[0.20] hover:text-white/60
                      hover:bg-white/[0.02] transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Add another question
          </button>
        )}
      </section>

      {/* ── Submit ── */}
      <div className="flex items-center justify-between pt-2">
        <p className="font-body text-white/30 text-xs">
          You can edit this poll after creating it.
        </p>
        <Button
          type="submit"
          size="lg"
          loading={isSubmitting || createPoll.isPending}
          className="gap-2 font-display"
        >
          Create Poll
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </form>
  )
}

// ── Question Block Sub-component ──────────────────────
function QuestionBlock({
  qIdx, control, register, errors, onRemove, canRemove
}: {
  qIdx: number
  control: any
  register: any
  errors: any
  onRemove: () => void
  canRemove: boolean
}) {
  const [collapsed, setCollapsed] = useState(false)

  const { fields: options, append: addOpt, remove: removeOpt } =
    useFieldArray({ control, name: `questions.${qIdx}.options` })

  const qErrors = errors.questions?.[qIdx]

  return (
    <div className="bg-[#111113] border border-white/[0.06] rounded-2xl
                   overflow-hidden transition-all">

      {/* Question header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.05]">
        <GripVertical className="w-4 h-4 text-white/15 shrink-0" />
        <span className="font-body text-white/30 text-xs shrink-0">Q{qIdx + 1}</span>
        <input
          {...register(`questions.${qIdx}.text`)}
          placeholder={`Question ${qIdx + 1}`}
          className="flex-1 bg-transparent border-none outline-none
                    text-white text-sm font-body placeholder:text-white/20"
        />
        <div className="flex items-center gap-2 shrink-0">
          {/* Mandatory toggle */}
          <Controller
            control={control}
            name={`questions.${qIdx}.isMandatory`}
            render={({ field }) => (
              <button
                type="button"
                onClick={() => field.onChange(!field.value)}
                title={field.value ? 'Required' : 'Optional'}
                className={cn(
                  'p-1.5 rounded-lg transition-all text-xs font-body',
                  field.value
                    ? 'text-white/60 bg-white/[0.06]'
                    : 'text-white/20 hover:text-white/40'
                )}
              >
                <Asterisk className="w-3.5 h-3.5" />
              </button>
            )}
          />

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-white/20 hover:text-white/50
                      hover:bg-white/[0.05] transition-all"
          >
            {collapsed
              ? <ChevronDown className="w-4 h-4" />
              : <ChevronUp   className="w-4 h-4" />}
          </button>

          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 rounded-lg text-white/20 hover:text-red-400
                        hover:bg-red-400/[0.08] transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Options */}
      {!collapsed && (
        <div className="px-5 py-4 flex flex-col gap-3">
          {qErrors?.text && (
            <p className="text-red-400 text-xs flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {qErrors.text.message}
            </p>
          )}

          <div className="flex items-center gap-2 mb-1">
            <ListChecks className="w-3.5 h-3.5 text-white/25" />
            <span className="font-body text-white/30 text-xs">
              Options ({options.length}/10)
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {options.map((opt, oIdx) => (
              <div key={opt.id} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full border border-white/[0.12]
                               flex items-center justify-center shrink-0">
                  <span className="w-2 h-2 rounded-full bg-white/15" />
                </div>
                <input
                  {...register(`questions.${qIdx}.options.${oIdx}.text`)}
                  placeholder={`Option ${oIdx + 1}`}
                  className="flex-1 h-9 px-3 rounded-lg
                            bg-white/[0.03] border border-white/[0.06]
                            text-white text-sm font-body
                            placeholder:text-white/20
                            focus:outline-none focus:border-white/[0.15]
                            transition-colors"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOpt(oIdx)}
                    className="p-1.5 text-white/15 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {qErrors?.options && (
            <p className="text-red-400 text-xs flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              At least 2 options required
            </p>
          )}

          {options.length < 10 && (
            <button
              type="button"
              onClick={() => addOpt({ text: '', imageUrl: null })}
              className="flex items-center gap-2 h-9 px-3 rounded-lg
                        border border-dashed border-white/[0.08]
                        text-white/25 text-xs font-body
                        hover:border-white/[0.15] hover:text-white/50
                        transition-all w-fit"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Add option
            </button>
          )}
        </div>
      )}
    </div>
  )
}
