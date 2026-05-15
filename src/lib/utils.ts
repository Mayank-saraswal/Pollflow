import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format, isAfter } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return format(new Date(date), 'MMM d, yyyy')
}

export function formatRelative(date: string | Date | null | undefined) {
  if (!date) return ''
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function isPollExpired(expiresAt?: string | Date | null): boolean {
  if (!expiresAt) return false
  return !isAfter(new Date(expiresAt), new Date())
}

export function formatPercent(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

export function generateShareUrl(shareToken: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return `${base}/p/${shareToken}`
}

export function hashIp(ip: string, pollId: string): string {
  return Buffer.from(`${ip}:${pollId}`).toString('base64')
}
