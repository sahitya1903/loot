// Auth store — Firebase user + Loot AppUser profile + (when pro) Business.

import { create } from 'zustand'

export const useAuthStore = create((set) => ({
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
