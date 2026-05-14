import { z } from 'zod'

export const optionSchema = z.object({
  id:       z.string().optional(),
  text:     z.string().min(1, 'Option text required').max(200),
  imageUrl: z.string().url().optional().nullable(),
})

export const questionSchema = z.object({
  id:          z.string().optional(),
  text:        z.string().min(1, 'Question text required').max(500),
  imageUrl:    z.string().url().optional().nullable(),
  isMandatory: z.boolean(),
  order:       z.number().int().min(0),
  options:     z
    .array(optionSchema)
    .min(2, 'Each question needs at least 2 options')
    .max(10, 'Maximum 10 options per question'),
})

export const createPollSchema = z.object({
  title:       z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().max(500).optional().nullable(),
  voterMode:   z.enum(['ANYONE', 'AUTHENTICATED_ONLY']),
  isAnonymous: z.boolean(),
  expiresAt:   z.string().optional().nullable(),
  questions:   z
    .array(questionSchema)
    .min(1, 'Poll needs at least 1 question')
    .max(20, 'Maximum 20 questions per poll'),
})

export const updatePollSchema = createPollSchema.partial().extend({
  status: z.enum(['ACTIVE', 'EXPIRED', 'PUBLISHED']).optional(),
})

// Keep old capitalized names as aliases for backward compat with existing files
export const CreatePollSchema    = createPollSchema
export const UpdatePollSchema    = updatePollSchema
export const CreateOptionSchema  = optionSchema
export const CreateQuestionSchema = questionSchema

export type CreatePollInput    = z.infer<typeof createPollSchema>
export type UpdatePollInput    = z.infer<typeof updatePollSchema>
export type CreateOptionInput  = z.infer<typeof optionSchema>
export type CreateQuestionInput = z.infer<typeof questionSchema>
