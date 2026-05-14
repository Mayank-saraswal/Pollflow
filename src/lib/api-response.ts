import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export type ApiSuccess<T> = {
  success: true
  data:    T
  message?: string
}

export type ApiError = {
  success: false
  error:   string
  details?: unknown
}

export function apiSuccess<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data, message }, { status })
}

export function apiError(
  error: string,
  status: number = 400,
  details?: unknown
): NextResponse<ApiError> {
  return NextResponse.json({ success: false, error, details }, { status })
}

export function handleZodError(err: ZodError): NextResponse<ApiError> {
  const details = err.issues.map((e) => ({
    field:   e.path.join('.'),
    message: e.message,
  }))
  return apiError('Validation failed', 400, details)
}

export function handleServerError(err: unknown): NextResponse<ApiError> {
  console.error('[API Error]', err)
  const message = err instanceof Error ? err.message : 'Internal server error'
  return apiError(message, 500)
}

// Helper to get user IP from request headers
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}

// Hash IP for anonymous dedup (non-reversible)
export async function hashIdentifier(ip: string, pollId: string): Promise<string> {
  const data = new TextEncoder().encode(`${ip}:${pollId}:${process.env.NEXTAUTH_SECRET ?? ''}`)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
