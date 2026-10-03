'use client'

import '@/lib/api' // configures the @loot/shared API client before any request
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { ThemeProvider } from '@/hooks'
import { restoreSession } from '@/lib/auth'
import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider'

export function Providers({ children }) {
  // Restore the signed-in user once; the auth store persists across navigation.
  useEffect(() => {
    restoreSession()
  }, [])

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
