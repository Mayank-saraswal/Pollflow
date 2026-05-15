import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Initialize Upstash Redis for Rate Limiting
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Create a rate limiter: 5 requests per 24 hours per user
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(5, '24 h'),
})

const generateSchema = z.object({
  topic: z.string().min(3).max(200),
  amount: z.number().min(1).max(20),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Enforce Rate Limit
    const { success } = await ratelimit.limit(`ratelimit_quiz_gen_${session.user.id}`)
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. You can only generate 5 quizzes per day.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const parsed = generateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    const { topic, amount } = parsed.data

    // Generate Structured Object using gpt-4o-mini
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: z.object({
        questions: z.array(
          z.object({
            text: z.string().describe('The question text'),
            type: z.enum(['SINGLE', 'MULTIPLE']).describe('Whether this question has a SINGLE correct answer or MULTIPLE correct answers'),
            options: z.array(
              z.object({
                text: z.string().describe('The answer option text'),
                isCorrect: z.boolean().describe('True if this option is a correct answer'),
              })
            ).min(2).max(4).describe('Array of 2 to 4 options for the question'),
          })
        ),
      }),
      prompt: `Generate ${amount} multiple-choice questions about the following topic: "${topic}". 
      Ensure the options are plausible but only the correct one(s) have isCorrect set to true. 
      If type is SINGLE, exactly one option must be true. If type is MULTIPLE, more than one option can be true.`,
    })

    return NextResponse.json({ data: object.questions })

  } catch (err: any) {
    console.error('Quiz Generation Error:', err)
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 })
  }
}
