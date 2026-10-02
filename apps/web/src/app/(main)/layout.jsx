'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useAuth, useScrollReveal } from '@/hooks'
import { Sidebar, SidebarProvider, MobileHeader } from '@/components/layout/sidebar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Toaster } from '@/components/ui/toaster'

function LoadingScreen() {
  return (
    <div className="app-page flex min-h-screen items-center justify-center bg-[var(--bg,_#0c0c0e)]">
      <div className="flex flex-col items-center">
        <div className="relative flex h-[80px] w-[80px] animate-pulse items-center justify-center">
          <span className="bg-gradient-to-br from-[var(--accent,_#ff4d6d)] to-[var(--accent-2,_#c4ff3b)] bg-clip-text text-3xl font-black tracking-tight text-transparent">
            Loot
          </span>
        </div>
        <p className="mt-4 text-sm text-white/55">Loading…</p>
      </div>
    </div>
  )
}

function AuthGuard({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isAuthenticated, isInitialized, needsOnboarding } = useAuth()

  // Activate scroll-reveal for all .sr elements in child pages.
  // MutationObserver inside the hook re-scans on navigation.
  useScrollReveal()

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      const redirectUrl = encodeURIComponent(
        `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      )
      router.push(`/login?redirect=${redirectUrl}`)
    }
    if (isInitialized && isAuthenticated && needsOnboarding) {
      const redirectUrl = encodeURIComponent(
        `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      )
      router.push(`/onboarding?redirect=${redirectUrl}`)
    }
  }, [isInitialized, isAuthenticated, needsOnboarding, router, pathname, searchParams])

  if (!isInitialized || !isAuthenticated) {
    return <LoadingScreen />
  }

  return (
    <SidebarProvider>
      <div className="app-page flex min-h-[100dvh] items-start">
        {/* Desktop Sidebar — sticky, scrolls with page */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile Header */}
          <MobileHeader />

          {/* Page Content — scrolls with the document */}
          <main id="main-content" className="flex-1" role="main">
            <div className="mx-auto w-full max-w-7xl p-4 pb-28 lg:p-6 lg:pb-10">{children}</div>
          </main>
        </div>

        {/* Bottom Navigation (mobile/tablet only) */}
        <BottomNav />
      </div>
      <Toaster />
    </SidebarProvider>
  )
}

export default function MainLayout({ children }) {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AuthGuard>{children}</AuthGuard>
    </Suspense>
  )
}
