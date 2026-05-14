import type { Metadata } from 'next'
import '@fontsource/plus-jakarta-sans/400.css'
import '@fontsource/plus-jakarta-sans/500.css'
import '@fontsource/plus-jakarta-sans/600.css'
import '@fontsource/plus-jakarta-sans/700.css'
import '@fontsource/plus-jakarta-sans/800.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import './globals.css'
import { Toaster } from 'sonner'
import { QueryProvider } from '@/components/shared/query-provider'
import { AuthProvider } from '@/components/shared/auth-provider'
import { TooltipProvider } from '@/components/ui/tooltip'

export const metadata: Metadata = {
  title: {
    default: 'PollFlow — Create & Share Polls Instantly',
    template: '%s | PollFlow',
  },
  description:
    'Create polls, share links, collect real-time feedback from your audience. Beautiful analytics, live updates, and zero friction.',
  keywords: ['polls', 'survey', 'feedback', 'real-time', 'analytics'],
  openGraph: {
    title: 'PollFlow',
    description: 'Create & Share Polls Instantly',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased font-sans">
        <AuthProvider>
          <QueryProvider>
            <TooltipProvider>
              {children}
              <Toaster
                position="top-right"
                theme="dark"
                toastOptions={{
                  style: {
                    background: 'oklch(0.12 0.01 265)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'oklch(0.95 0 0)',
                  },
                }}
              />
            </TooltipProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
