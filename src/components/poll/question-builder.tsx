'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { POLL_LIMITS } from '@/lib/constants'
import type { CreateQuestionInput } from '@/lib/validations/poll'

interface QuestionBuilderProps {
  question: CreateQuestionInput
  index: number
  onChange: (q: CreateQuestionInput) => void
  onRemove: () => void
}

export function QuestionBuilder({ question, index, onChange, onRemove }: QuestionBuilderProps) {
  const updateText = (text: string) => onChange({ ...question, text })
  const toggleMandatory = (isMandatory: boolean) => onChange({ ...question, isMandatory })

  const addOption = () => {
    if (question.options.length >= POLL_LIMITS.MAX_OPTIONS_PER_QUESTION) return
    onChange({
      ...question,
      options: [...question.options, { text: '' }],
    })
  }

  const updateOption = (idx: number, text: string) => {
    const options = question.options.map((o, i) => (i === idx ? { ...o, text } : o))
    onChange({ ...question, options })
  }

  const removeOption = (idx: number) => {
    onChange({ ...question, options: question.options.filter((_, i) => i !== idx) })
  }

  return (
    <div className="glass-card rounded-2xl gradient-border p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-brand-400">Question {index + 1}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-white/50 hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`question-${index}`}>Question text</Label>
        <Input
          id={`question-${index}`}
          value={question.text}
          onChange={(e) => updateText(e.target.value)}
          placeholder="Ask your question..."
          maxLength={POLL_LIMITS.MAX_QUESTION_LENGTH}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Options</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addOption}
            className="text-xs text-brand-400 h-7 gap-1"
            disabled={question.options.length >= POLL_LIMITS.MAX_OPTIONS_PER_QUESTION}
          >
            <Plus className="size-3" />
            Add option
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          {question.options.map((option, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                value={option.text}
                onChange={(e) => updateOption(idx, e.target.value)}
                placeholder={`Option ${idx + 1}`}
                maxLength={POLL_LIMITS.MAX_OPTION_LENGTH}
                className="flex-1"
              />
              {question.options.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 text-white/50 hover:text-destructive shrink-0"
                  onClick={() => removeOption(idx)}
                >
                  <Trash2 className="size-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id={`mandatory-${index}`}
          checked={question.isMandatory}
          onCheckedChange={toggleMandatory}
        />
        <Label htmlFor={`mandatory-${index}`} className="text-sm cursor-pointer">
          Required question
        </Label>
      </div>
    </div>
  )
}
