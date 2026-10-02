'use client'

// Auth state management hook

import { useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { onAuthStateChange } from '@/lib/firebase/auth'
import { createUserIfNotExists, fetchUserProfile } from '@/lib/firebase/firestore'

const NEW_USER_SESSION_KEY = 'loot_is_new_user'

export function useAuth() {
  const {
    user,
    profile,
    isLoading,
    isInitialized,
    isNewUser,
    setUser,
    setProfile,
    setIsInitialized,
    setIsNewUser,
  } = useAuthStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser)

      if (firebaseUser) {
        // Create user document if it doesn't exist (matches Flutter onLoginSuccess behavior)
        // This also returns whether the user is newly created
        const { profile: userProfile, isNewUser: newUser } = await createUserIfNotExists(
          firebaseUser.uid,
          firebaseUser.displayName
        )
        setProfile(userProfile)

        // If this is a new user, store the flag in sessionStorage
        // so it persists during onboarding navigation
        if (newUser) {
          sessionStorage.setItem(NEW_USER_SESSION_KEY, 'true')
          setIsNewUser(true)
        } else {
          // Check if we have a stored flag (mid-onboarding navigation)
          const storedNewUser = sessionStorage.getItem(NEW_USER_SESSION_KEY) === 'true'
          setIsNewUser(storedNewUser)
        }
      } else {
        setProfile(null)
        setIsNewUser(false)
        sessionStorage.removeItem(NEW_USER_SESSION_KEY)
      }

      setIsInitialized(true)
    })

    return () => unsubscribe()
  }, [setUser, setProfile, setIsInitialized, setIsNewUser])

  // Refresh profile data from Firestore
  const refreshProfile = useCallback(async () => {
    if (!user?.uid) return
    const updatedProfile = await fetchUserProfile(user.uid)
    if (updatedProfile) {
      setProfile(updatedProfile)
    }
  }, [user, setProfile])

  // Clear the new user flag after onboarding is complete
  const clearNewUserFlag = useCallback(() => {
    sessionStorage.removeItem(NEW_USER_SESSION_KEY)
    setIsNewUser(false)
  }, [setIsNewUser])

  return {
    user,
    profile,
    isLoading,
    isInitialized,
    isAuthenticated: !!user,
    isNewUser,
    needsOnboarding: !!user && isNewUser,
    refreshProfile,
    clearNewUserFlag,
  }
}
