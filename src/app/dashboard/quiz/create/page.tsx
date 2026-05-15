'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'sonner'
import {
  ArrowLeft, ArrowRight, Plus, Trash2, Check, GripVertical,
  Clock, Zap, Trophy, Loader2, Image as ImageIcon, CheckCircle2, Sparkles, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MediaUploader } from '@/components/upload/media-uploader'

interface QuizOption {
  id?: string
  text: string
  imageUrl: string | null
  isCorrect: boolean
  order: number
}

interface QuizQuestion {
  id?: string
  text: string
  imageUrl: string | null
  type: 'SINGLE' | 'MULTIPLE'
  timeLimit: number
  points: number
  order: number
  options: QuizOption[]
}

const TIME_OPTIONS = [5, 10, 15, 20, 30, 45, 60, 120]
const POINTS_OPTIONS = [100, 200, 500, 1000, 1500, 2000]

function createEmptyOption(order: number): QuizOption {
  return { text: '', imageUrl: null, isCorrect: false, order }
}

function createEmptyQuestion(order: number): QuizQuestion {
  return {
    text: '',
    imageUrl: null,
    type: 'SINGLE',
    timeLimit: 30,
    points: 1000,
    order,
    options: [createEmptyOption(0), createEmptyOption(1), createEmptyOption(2), createEmptyOption(3)],
  }
}

export default function CreateQuizPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  // Step 1: Settings
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [accessMode, setAccessMode] = useState<'AUTHENTICATED_ONLY' | 'ANYONE'>('AUTHENTICATED_ONLY')
  const [maxParticipants, setMaxParticipants] = useState(1000)

  // Step 2: Questions
  const [questions, setQuestions] = useState<QuizQuestion[]>([createEmptyQuestion(0)])
  const [activeQ, setActiveQ] = useState(0)

  // AI State
  const [showAIModal, setShowAIModal] = useState(false)
  const [aiTopic, setAiTopic] = useState('')
  const [aiAmount, setAiAmount] = useState(5)
  const [isGenerating, setIsGenerating] = useState(false)

  const updateQuestion = useCallback((idx: number, updates: Partial<QuizQuestion>) => {
    setQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, ...updates } : q))
  }, [])

  const updateOption = useCallback((qIdx: number, oIdx: number, updates: Partial<QuizOption>) => {
    setQuestions((prev) => prev.map((q, qi) => {
      if (qi !== qIdx) return q
      const newOptions = q.options.map((o, oi) => {
        if (oi !== oIdx) return o
        return { ...o, ...updates }
      })
      // If SINGLE type and marking correct, unmark others
      if (q.type === 'SINGLE' && updates.isCorrect === true) {
        return { ...q, options: newOptions.map((o, oi) => ({ ...o, isCorrect: oi === oIdx })) }
      }
      return { ...q, options: newOptions }
    }))
  }, [])

  const addQuestion = () => {
    if (questions.length >= 50) return
    const newQ = createEmptyQuestion(questions.length)
    setQuestions((prev) => [...prev, newQ])
    setActiveQ(questions.length)
  }

  const removeQuestion = (idx: number) => {
    if (questions.length <= 1) return
    setQuestions((prev) => prev.filter((_, i) => i !== idx).map((q, i) => ({ ...q, order: i })))
    setActiveQ(Math.min(activeQ, questions.length - 2))
  }

  const addOption = (qIdx: number) => {
    if (questions[qIdx].options.length >= 8) return
    setQuestions((prev) => prev.map((q, i) =>
      i === qIdx ? { ...q, options: [...q.options, createEmptyOption(q.options.length)] } : q
    ))
  }

  const removeOption = (qIdx: number, oIdx: number) => {
    if (questions[qIdx].options.length <= 2) return
    setQuestions((prev) => prev.map((q, i) =>
      i === qIdx ? { ...q, options: q.options.filter((_, oi) => oi !== oIdx).map((o, oi) => ({ ...o, order: oi })) } : q
    ))
  }

  const generateWithAI = async () => {
    if (!aiTopic.trim()) {
      toast.error('Please enter a topic')
      return
    }
    setIsGenerating(true)
    try {
      const res = await axios.post('/api/quiz/generate', { topic: aiTopic, amount: aiAmount })
      const generated = res.data.data
      
      const newQuestions: QuizQuestion[] = generated.map((g: any, i: number) => ({
        text: g.text,
        imageUrl: null,
        type: g.type,
        timeLimit: 30,
        points: 1000,
        order: questions.length + i,
        options: g.options.map((o: any, oi: number) => ({
          text: o.text,
          imageUrl: null,
          isCorrect: o.isCorrect,
          order: oi,
        }))
      }))

      setQuestions(prev => {
        if (prev.length === 1 && !prev[0].text.trim()) {
          return newQuestions
        }
        return [...prev, ...newQuestions]
      })
      
      toast.success(`Generated ${generated.length} questions!`)
      setShowAIModal(false)
      setActiveQ(questions.length > 1 || questions[0].text.trim() ? questions.length : 0)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to generate questions')
    } finally {
      setIsGenerating(false)
    }
  }

  const validateStep1 = () => {
    if (!title.trim() || title.length < 3) { toast.error('Title must be at least 3 characters'); return false }
    return true
  }

  const validateStep2 = () => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.text.trim()) { toast.error(`Question ${i + 1} has no text`); setActiveQ(i); return false }
      if (q.options.filter((o) => o.text.trim()).length < 2) {
        toast.error(`Question ${i + 1} needs at least 2 options`); setActiveQ(i); return false
      }
      if (!q.options.some((o) => o.isCorrect)) {
        toast.error(`Question ${i + 1} needs at least one correct answer`); setActiveQ(i); return false
      }
      if (q.type === 'SINGLE' && q.options.filter((o) => o.isCorrect).length > 1) {
        toast.error(`Question ${i + 1} is single-select but has multiple correct answers`); setActiveQ(i); return false
      }
    }
    return true
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const body = {
        title: title.trim(),
        description: description.trim() || null,
        accessMode,
        maxParticipants,
        questions: questions.map((q, qi) => ({
          text: q.text,
          imageUrl: q.imageUrl || null,
          type: q.type,
          timeLimit: q.timeLimit,
          points: q.points,
          order: qi,
          options: q.options
            .filter((o) => o.text.trim())
            .map((o, oi) => ({
              text: o.text,
              imageUrl: o.imageUrl || null,
              isCorrect: o.isCorrect,
              order: oi,
            })),
        })),
      }
      const res = await axios.post('/api/quiz', body)
      toast.success('Quiz created!')
      router.push(`/dashboard/quiz/${res.data.data.id}/conduct`)
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.error ?? 'Failed to create quiz')
      } else {
        toast.error('Failed to create quiz')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const q = questions[activeQ]

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-display font-semibold text-white flex items-center gap-3">
          <Trophy className="w-6 h-6 text-white/60" />
          Create Quiz
        </h1>
      </div>

      {/* Step pills */}
      <div className="flex items-center gap-2 mb-8">
        {['Settings', 'Questions', 'Review'].map((label, i) => (
          <button
            key={label}
            onClick={() => {
              if (i + 1 < step || (i === 0)) setStep(i + 1)
            }}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-body font-medium transition-all',
              step === i + 1
                ? 'bg-white text-[#09090B]'
                : step > i + 1
                  ? 'bg-white/[0.08] text-white/70 border border-white/[0.12]'
                  : 'bg-white/[0.04] text-white/30 border border-white/[0.06]'
            )}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {/* Step 1: Settings */}
      {step === 1 && (
        <div className="card-base p-6 space-y-6 animate-fade-in">
          <div>
            <label className="block text-white/60 text-sm font-body mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. JavaScript Fundamentals Quiz"
              className="input-base"
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-white/60 text-sm font-body mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              className="input-base min-h-[80px] resize-none"
              maxLength={500}
            />
          </div>
          <div>
            <label className="block text-white/60 text-sm font-body mb-2">Access Mode</label>
            <div className="flex gap-2">
              {[
                { value: 'AUTHENTICATED_ONLY' as const, label: 'Login Required' },
                { value: 'ANYONE' as const, label: 'Anyone' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAccessMode(opt.value)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-body transition-all',
                    accessMode === opt.value
                      ? 'bg-white text-[#09090B] font-medium'
                      : 'bg-white/[0.04] text-white/50 border border-white/[0.08] hover:bg-white/[0.08]'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-white/60 text-sm font-body mb-2">Max Participants</label>
            <input
              type="number"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Math.min(1000, Math.max(1, parseInt(e.target.value) || 1)))}
              className="input-base w-32"
              min={1}
              max={1000}
            />
          </div>
          <div className="flex justify-end pt-4">
            <button
              onClick={() => { if (validateStep1()) setStep(2) }}
              className="btn-primary"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Questions */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4 animate-fade-in">
          {/* Question list sidebar */}
          <div className="card-base p-3 space-y-1 lg:max-h-[70vh] lg:overflow-y-auto">
            {questions.map((q, i) => (
              <button
                key={i}
                onClick={() => setActiveQ(i)}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-xl text-sm font-body transition-all',
                  'flex items-center gap-2',
                  activeQ === i
                    ? 'bg-white/[0.10] text-white'
                    : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
                )}
              >
                <span className="w-5 h-5 rounded-md bg-white/[0.06] flex items-center justify-center text-xs shrink-0">
                  {i + 1}
                </span>
                <span className="truncate flex-1">{q.text || 'Untitled'}</span>
                {q.options.some((o) => o.isCorrect) && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400/60 shrink-0" />
                )}
              </button>
            ))}
            <button
              onClick={addQuestion}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-body
                        text-white/30 hover:text-white/50 hover:bg-white/[0.04]
                        flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </button>
            <button
              onClick={() => setShowAIModal(true)}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-body
                        text-blue-400 hover:text-blue-300 hover:bg-blue-400/[0.08]
                        flex items-center gap-2 transition-all mt-1"
            >
              <Sparkles className="w-4 h-4" />
              AI Generate
            </button>
          </div>

          {/* Active question editor */}
          <div className="card-base p-6 space-y-5">
            {/* Question header */}
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-white">
                Question {activeQ + 1}
              </h3>
              {questions.length > 1 && (
                <button
                  onClick={() => removeQuestion(activeQ)}
                  className="btn-ghost btn-sm text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              )}
            </div>

            {/* Question text */}
            <div>
              <label className="block text-white/60 text-sm font-body mb-2">Question Text *</label>
              <textarea
                value={q.text}
                onChange={(e) => updateQuestion(activeQ, { text: e.target.value })}
                placeholder="Enter your question..."
                className="input-base min-h-[80px] resize-none"
                maxLength={500}
              />
            </div>

            {/* Question media */}
            <div>
              <label className="block text-white/60 text-sm font-body mb-2">
                <ImageIcon className="w-3.5 h-3.5 inline mr-1" />
                Question Media (optional)
              </label>
              <MediaUploader
                value={q.imageUrl}
                onChange={(url) => updateQuestion(activeQ, { imageUrl: url })}
                accept="any"
                label="Add image, GIF, or video"
              />
            </div>

            {/* Type + Time + Points row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Type toggle */}
              <div>
                <label className="block text-white/60 text-sm font-body mb-2">Answer Type</label>
                <div className="flex gap-1 bg-white/[0.04] rounded-full p-0.5 border border-white/[0.06]">
                  {(['SINGLE', 'MULTIPLE'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        updateQuestion(activeQ, { type })
                        // If switching to SINGLE and multiple correct, keep only first
                        if (type === 'SINGLE') {
                          const firstCorrect = q.options.findIndex((o) => o.isCorrect)
                          setQuestions((prev) => prev.map((qq, i) =>
                            i === activeQ ? {
                              ...qq,
                              type,
                              options: qq.options.map((o, oi) => ({
                                ...o,
                                isCorrect: oi === firstCorrect
                              }))
                            } : qq
                          ))
                        }
                      }}
                      className={cn(
                        'flex-1 px-3 py-1.5 rounded-full text-xs font-body font-medium transition-all',
                        q.type === type
                          ? 'bg-white text-[#09090B]'
                          : 'text-white/40 hover:text-white/60'
                      )}
                    >
                      {type === 'SINGLE' ? 'Single' : 'Multiple'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time limit */}
              <div>
                <label className="block text-white/60 text-sm font-body mb-2">
                  <Clock className="w-3.5 h-3.5 inline mr-1" />
                  Time Limit
                </label>
                <div className="flex flex-wrap gap-1">
                  {TIME_OPTIONS.map((t) => (
                    <button
                      key={t}
                      onClick={() => updateQuestion(activeQ, { timeLimit: t })}
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-body transition-all',
                        q.timeLimit === t
                          ? 'bg-white text-[#09090B] font-medium'
                          : 'bg-white/[0.04] text-white/40 border border-white/[0.06] hover:bg-white/[0.08]'
                      )}
                    >
                      {t}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Points */}
              <div>
                <label className="block text-white/60 text-sm font-body mb-2">
                  <Zap className="w-3.5 h-3.5 inline mr-1" />
                  Points
                </label>
                <div className="flex flex-wrap gap-1">
                  {POINTS_OPTIONS.map((p) => (
                    <button
                      key={p}
                      onClick={() => updateQuestion(activeQ, { points: p })}
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-body transition-all',
                        q.points === p
                          ? 'bg-white text-[#09090B] font-medium'
                          : 'bg-white/[0.04] text-white/40 border border-white/[0.06] hover:bg-white/[0.08]'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Options */}
            <div>
              <label className="block text-white/60 text-sm font-body mb-3">
                Options — click ✓ to mark correct
              </label>
              <div className="space-y-2">
                {q.options.map((opt, oIdx) => (
                  <div
                    key={oIdx}
                    className={cn(
                      'flex items-center gap-2 rounded-xl border p-3 transition-all',
                      opt.isCorrect
                        ? 'bg-green-400/[0.06] border-green-400/[0.20]'
                        : 'bg-white/[0.02] border-white/[0.08]'
                    )}
                  >
                    <GripVertical className="w-4 h-4 text-white/15 shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => updateOption(activeQ, oIdx, { text: e.target.value })}
                          placeholder={`Option ${oIdx + 1}`}
                          className="input-base flex-1 h-10"
                          maxLength={200}
                        />
                        {!opt.imageUrl && (
                          <button
                            onClick={() => {
                              // We can just use a hidden state or something, or we can just let MediaUploader be small
                              // Actually, let's keep MediaUploader but make it very compact or hidden
                            }}
                            className="hidden"
                          >
                          </button>
                        )}
                      </div>
                      
                      {/* Option media upload */}
                      {opt.imageUrl ? (
                        <div className="relative inline-block">
                          {opt.imageUrl.includes('.mp4') || opt.imageUrl.includes('.webm') ? (
                            <video src={opt.imageUrl} className="h-16 rounded-lg" controls />
                          ) : (
                            <img src={opt.imageUrl} alt="" className="h-16 rounded-lg object-cover" />
                          )}
                          <button
                            onClick={() => updateOption(activeQ, oIdx, { imageUrl: null })}
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black/80 flex items-center justify-center hover:bg-black transition-colors"
                          >
                            <span className="text-white text-xs">×</span>
                          </button>
                        </div>
                      ) : (
                        <details className="group">
                          <summary className="text-xs text-white/30 hover:text-white/50 cursor-pointer list-none flex items-center gap-1.5 transition-colors">
                            <ImageIcon className="w-3.5 h-3.5" />
                            Add image (optional)
                          </summary>
                          <div className="mt-2">
                            <MediaUploader
                              value={opt.imageUrl}
                              onChange={(url) => updateOption(activeQ, oIdx, { imageUrl: url })}
                              accept="image"
                              label="Upload image"
                              className="!h-10 !text-xs"
                            />
                          </div>
                        </details>
                      )}
                    </div>
                    <button
                      onClick={() => updateOption(activeQ, oIdx, { isCorrect: !opt.isCorrect })}
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all',
                        opt.isCorrect
                          ? 'bg-green-500 text-white'
                          : 'bg-white/[0.04] text-white/20 hover:bg-white/[0.08] border border-white/[0.08]'
                      )}
                      title={opt.isCorrect ? 'Marked correct' : 'Mark as correct'}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    {q.options.length > 2 && (
                      <button
                        onClick={() => removeOption(activeQ, oIdx)}
                        className="text-white/15 hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {q.options.length < 8 && (
                <button
                  onClick={() => addOption(activeQ)}
                  className="mt-2 text-white/30 hover:text-white/50 text-sm font-body
                            flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Option
                </button>
              )}
            </div>

            {/* Nav */}
            <div className="flex justify-between pt-4 border-t border-white/[0.06]">
              <button onClick={() => setStep(1)} className="btn-ghost">
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={() => { if (validateStep2()) setStep(3) }}
                className="btn-primary"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="card-base p-6 space-y-6 animate-fade-in">
          <div className="space-y-2">
            <h3 className="font-display font-semibold text-white text-lg">{title}</h3>
            {description && <p className="text-white/40 text-sm font-body">{description}</p>}
            <div className="flex gap-3 flex-wrap">
              <span className="badge badge-default">
                {accessMode === 'ANYONE' ? 'Open to all' : 'Login required'}
              </span>
              <span className="badge badge-default">
                Max {maxParticipants} participants
              </span>
              <span className="badge badge-info">
                {questions.length} question{questions.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Summary table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-white/40 font-body font-medium py-2 pr-4">#</th>
                  <th className="text-left text-white/40 font-body font-medium py-2 pr-4">Question</th>
                  <th className="text-left text-white/40 font-body font-medium py-2 pr-4">Type</th>
                  <th className="text-left text-white/40 font-body font-medium py-2 pr-4">Time</th>
                  <th className="text-left text-white/40 font-body font-medium py-2 pr-4">Points</th>
                  <th className="text-left text-white/40 font-body font-medium py-2">Options</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q, i) => (
                  <tr
                    key={i}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-colors"
                    onClick={() => { setActiveQ(i); setStep(2) }}
                  >
                    <td className="py-3 pr-4 text-white/50">{i + 1}</td>
                    <td className="py-3 pr-4 text-white/80 max-w-[200px] truncate">{q.text || 'Untitled'}</td>
                    <td className="py-3 pr-4">
                      <span className={cn('badge', q.type === 'SINGLE' ? 'badge-default' : 'badge-info')}>
                        {q.type === 'SINGLE' ? 'Single' : 'Multi'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-white/50">{q.timeLimit}s</td>
                    <td className="py-3 pr-4 text-white/50">{q.points}</td>
                    <td className="py-3 text-white/50">{q.options.filter((o) => o.text.trim()).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t border-white/[0.06]">
            <button onClick={() => setStep(2)} className="btn-ghost">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trophy className="w-4 h-4" />
              )}
              Create Quiz
            </button>
          </div>
        </div>
      )}

      {/* AI Generate Modal */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111113] border border-white/[0.08] rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
              <h2 className="font-display font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                Auto-Generate with AI
              </h2>
              <button 
                onClick={() => setShowAIModal(false)}
                className="p-2 rounded-lg hover:bg-white/[0.06] text-white/50 transition-colors"
                disabled={isGenerating}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-white/60 text-sm font-body mb-2">Topic or Description</label>
                <textarea
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g. History of Rome for 8th graders..."
                  className="input-base min-h-[80px] resize-none"
                  maxLength={300}
                  disabled={isGenerating}
                />
              </div>
              <div>
                <label className="flex items-center justify-between text-white/60 text-sm font-body mb-2">
                  <span>Number of Questions</span>
                  <span className="text-white">{aiAmount}</span>
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="20" 
                  value={aiAmount}
                  onChange={(e) => setAiAmount(parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                  disabled={isGenerating}
                />
                <p className="text-white/30 text-xs mt-2">Maximum of 20 questions per generation. Rate limit: 5 generations per day.</p>
              </div>
              <button
                onClick={generateWithAI}
                disabled={isGenerating || !aiTopic.trim()}
                className="w-full btn-primary bg-blue-500 hover:bg-blue-600 border-blue-500"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Questions
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
