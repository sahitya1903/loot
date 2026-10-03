'use client'

// Auth state for components. The session itself is restored once by
// <Providers> (see lib/auth.restoreSession); this hook only reads the store.

import { useAuthStore } from '@/stores/auth'
import { clearNewUserFlag, refreshProfile } from '@/lib/auth'

export function useAuth() {
  const profile = useAuthStore((s) => s.profile)
  const isLoading = useAuthStore((s) => s.isLoading)
  const isInitialized = useAuthStore((s) => s.isInitialized)
  const isNewUser = useAuthStore((s) => s.isNewUser)

  return {
    profile,
    isLoading,
    isInitialized,
    isAuthenticated: !!profile,
    isNewUser,
    needsOnboarding: !!profile && isNewUser,
    refreshProfile,
    clearNewUserFlag,
  }
}
