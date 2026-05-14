import { z } from 'zod'

export const answerSchema = z.object({
  questionId: z.string().cuid('Invalid question ID'),
  optionId:   z.string().cuid('Invalid option ID'),
})

export const submitResponseSchema = z.object({
  answers: z
    .array(answerSchema)
    .min(1, 'At least one answer is required'),
})

// Backward compat aliases
export const SubmitAnswerSchema   = answerSchema
export const SubmitResponseSchema = submitResponseSchema

export type SubmitResponseInput = z.infer<typeof submitResponseSchema>
export type SubmitAnswerInput   = z.infer<typeof answerSchema>
