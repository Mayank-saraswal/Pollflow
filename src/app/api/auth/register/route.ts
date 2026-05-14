import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { registerSchema } from '@/lib/validations/auth'
import {
  apiSuccess, apiError, handleZodError, handleServerError,
} from '@/lib/api-response'
import { ZodError } from 'zod'

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = registerSchema.parse(body)

    const existing = await prisma.user.findUnique({
      where: { email: parsed.email },
    })
    if (existing) return apiError('Email already registered', 409)

    const hashed = await bcrypt.hash(parsed.password, 12)

    const user = await prisma.user.create({
      data: {
        name:     parsed.name,
        email:    parsed.email,
        password: hashed,
      },
      select: { id: true, name: true, email: true, createdAt: true },
    })

    return apiSuccess(user, 'Account created successfully', 201)
  } catch (err) {
    if (err instanceof ZodError) return handleZodError(err)
    return handleServerError(err)
  }
}
