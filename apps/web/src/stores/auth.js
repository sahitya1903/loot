// Auth store — the signed-in user's profile (from the API) + (when pro) Business.

import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  /** @type {import('@loot/shared/models').AppUser | null} */
  profile: null,
  /** @type {import('@loot/shared/models').Business | null} */
  business: null,
  isLoading: true,
  isInitialized: false,
  isNewUser: false,

  setProfile: (profile) => set({ profile }),
  setBusiness: (business) => set({ business }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsInitialized: (isInitialized) => set({ isInitialized, isLoading: false }),
  setIsNewUser: (isNewUser) => set({ isNewUser }),
  reset: () =>
    set({
      profile: null,
      business: null,
      isLoading: false,
      isNewUser: false,
    }),
}))
