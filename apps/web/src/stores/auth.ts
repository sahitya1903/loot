// Auth store — Firebase user + Loot AppUser profile + (when pro) Business.

import { create } from 'zustand'
import type { User as FirebaseUser } from 'firebase/auth'
import type { AppUser, Business } from '@/types'

interface AuthState {
  user: FirebaseUser | null
  profile: AppUser | null
  business: Business | null
  isLoading: boolean
  isInitialized: boolean
  isNewUser: boolean

  setUser: (user: FirebaseUser | null) => void
  setProfile: (profile: AppUser | null) => void
  setBusiness: (business: Business | null) => void
  setIsLoading: (isLoading: boolean) => void
  setIsInitialized: (isInitialized: boolean) => void
  setIsNewUser: (isNewUser: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  business: null,
  isLoading: true,
  isInitialized: false,
  isNewUser: false,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setBusiness: (business) => set({ business }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsInitialized: (isInitialized) => set({ isInitialized, isLoading: false }),
  setIsNewUser: (isNewUser) => set({ isNewUser }),
  reset: () =>
    set({
      user: null,
      profile: null,
      business: null,
      isLoading: false,
      isNewUser: false,
    }),
}))
