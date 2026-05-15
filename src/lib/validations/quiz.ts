import { z } from 'zod'

export const quizOptionSchema = z.object({
  id:        z.string().optional(),
  text:      z.string().min(1).max(200),
  imageUrl:  z.string().url().optional().nullable(),
  isCorrect: z.boolean().default(false),
  order:     z.number().int().min(0),
})

export const quizQuestionSchema = z.object({
  id:        z.string().optional(),
  text:      z.string().min(1).max(500),
  imageUrl:  z.string().url().optional().nullable(),
  type:      z.enum(['SINGLE', 'MULTIPLE']).default('SINGLE'),
  timeLimit: z.number().int().min(5).max(120).default(30),
  points:    z.number().int().min(100).max(2000).default(1000),
  order:     z.number().int().min(0),
  options:   z
    .array(quizOptionSchema)
    .min(2, 'At least 2 options required')
    .max(8)
    .refine(
      (opts) => opts.some((o) => o.isCorrect),
      'At least one option must be marked correct'
    ),
}).refine(
  (q) => {
    if (q.type === 'SINGLE') {
      return q.options.filter((o) => o.isCorrect).length === 1
    }
    return true
  },
  { message: 'Single-select questions must have exactly 1 correct answer' }
)

export const createQuizSchema = z.object({
  title:           z.string().min(3).max(100),
  description:     z.string().max(500).optional().nullable(),
  accessMode:      z.enum(['AUTHENTICATED_ONLY', 'ANYONE']).default('AUTHENTICATED_ONLY'),
  maxParticipants: z.number().int().min(1).max(1000).default(1000),
  questions:       z
    .array(quizQuestionSchema)
    .min(1, 'At least 1 question required')
    .max(50),
})

export const submitAnswerSchema = z.object({
  sessionId:        z.string(),
  questionId:       z.string(),
  selectedOptionIds: z.array(z.string()).min(1, 'Select at least one option'),
})

export type CreateQuizInput  = z.infer<typeof createQuizSchema>
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>
