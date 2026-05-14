'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { POLL_LIMITS } from '@/lib/constants'
import type { CreateOptionInput } from '@/lib/validations/poll'

interface OptionBuilderProps {
  option: CreateOptionInput
  index: number
  canRemove: boolean
  onChange: (o: CreateOptionInput) => void
  onRemove: () => void
}

export function OptionBuilder({ option, index, canRemove, onChange, onRemove }: OptionBuilderProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="size-6 rounded-full border border-white/[0.08] bg-white/[0.06] flex items-center justify-center shrink-0">
        <span className="text-xs text-white/50">{index + 1}</span>
      </div>
      <Input
        value={option.text}
        onChange={(e) => onChange({ ...option, text: e.target.value })}
        placeholder={`Option ${index + 1}`}
        maxLength={POLL_LIMITS.MAX_OPTION_LENGTH}
        className="flex-1"
      />
      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-white/50 hover:text-red-500 shrink-0"
          onClick={onRemove}
        >
          <Trash2 className="size-3" />
        </Button>
      )}
    </div>
  )
}
