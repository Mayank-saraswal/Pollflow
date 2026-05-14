'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { POLL_LIMITS } from '@/lib/constants'
import type { CreatePollInput } from '@/lib/validations/poll'

interface PollBuilderProps {
  onSubmit: (data: CreatePollInput) => void
  isLoading?: boolean
}

export function PollBuilder({ onSubmit, isLoading }: PollBuilderProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      title,
      description,
      voterMode: 'ANYONE',
      isAnonymous,
      questions: [],
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
        <h2 className="font-semibold text-foreground">Poll Details</h2>

        <div className="flex flex-col gap-2">
          <Label htmlFor="poll-title">
            Title{' '}
            <span className={cn('text-xs text-white/50', title.length > POLL_LIMITS.MAX_TITLE_LENGTH && 'text-destructive')}>
              {title.length}/{POLL_LIMITS.MAX_TITLE_LENGTH}
            </span>
          </Label>
          <Input
            id="poll-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's your poll about?"
            maxLength={POLL_LIMITS.MAX_TITLE_LENGTH}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="poll-description">Description (optional)</Label>
          <Textarea
            id="poll-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add context for your respondents..."
            rows={3}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="font-medium">Anonymous responses</Label>
            <p className="text-xs text-white/50">Respondents are not identified</p>
          </div>
          <Switch
            checked={isAnonymous}
            onCheckedChange={setIsAnonymous}
            id="anonymous-switch"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          <Plus className="size-3 mr-1" />
          Questions — Step 2
        </Badge>
        <GripVertical className="size-4 text-white/50" />
        <Trash2 className="size-4 text-white/50" />
      </div>

      <Button
        type="submit"
        className="btn-gradient self-end px-8"
        disabled={isLoading || !title.trim()}
      >
        {isLoading ? 'Creating...' : 'Create Poll'}
      </Button>
    </form>
  )
}
