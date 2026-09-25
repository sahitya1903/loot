import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './auth'
import type { User } from 'firebase/auth'
import type { User as AppUser } from '@loot/shared/types'

const mockUser = { uid: 'user-1', displayName: 'Test User', email: 'test@example.com' } as User
const mockProfile = { userId: 'user-1', name: 'Test User', username: 'testuser' } as AppUser

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      profile: null,
      isLoading: true,
      isInitialized: false,
      isNewUser: false,
    })
  })

  it('has correct initial state', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.profile).toBeNull()
    expect(state.isLoading).toBe(true)
    expect(state.isInitialized).toBe(false)
    expect(state.isNewUser).toBe(false)
  })

  it('setUser stores the user', () => {
    useAuthStore.getState().setUser(mockUser)
    expect(useAuthStore.getState().user).toBe(mockUser)
  })

  it('setUser accepts null to clear user', () => {
    useAuthStore.getState().setUser(mockUser)
    useAuthStore.getState().setUser(null)
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('setProfile stores the profile', () => {
    useAuthStore.getState().setProfile(mockProfile)
    expect(useAuthStore.getState().profile).toBe(mockProfile)
  })

  it('setProfile accepts null to clear profile', () => {
    useAuthStore.getState().setProfile(mockProfile)
    useAuthStore.getState().setProfile(null)
    expect(useAuthStore.getState().profile).toBeNull()
  })

  it('setIsLoading updates loading state', () => {
    useAuthStore.getState().setIsLoading(false)
    expect(useAuthStore.getState().isLoading).toBe(false)
  })

  it('setIsInitialized marks as initialized and clears loading', () => {
    useAuthStore.getState().setIsInitialized(true)
    const state = useAuthStore.getState()
    expect(state.isInitialized).toBe(true)
    expect(state.isLoading).toBe(false)
  })

  it('setIsInitialized(false) still clears loading', () => {
    useAuthStore.getState().setIsInitialized(false)
    expect(useAuthStore.getState().isLoading).toBe(false)
  })

  it('setIsNewUser updates new user flag', () => {
    useAuthStore.getState().setIsNewUser(true)
    expect(useAuthStore.getState().isNewUser).toBe(true)
  })

  it('reset clears user and profile', () => {
    useAuthStore.getState().setUser(mockUser)
    useAuthStore.getState().setProfile(mockProfile)
    useAuthStore.getState().reset()
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.profile).toBeNull()
  })

  it('reset clears isNewUser', () => {
    useAuthStore.getState().setIsNewUser(true)
    useAuthStore.getState().reset()
    expect(useAuthStore.getState().isNewUser).toBe(false)
  })

  it('reset sets isLoading to false', () => {
    useAuthStore.getState().reset()
    expect(useAuthStore.getState().isLoading).toBe(false)
  })

  it('multiple setters compose independently', () => {
    useAuthStore.getState().setUser(mockUser)
    useAuthStore.getState().setIsNewUser(true)
    useAuthStore.getState().setIsInitialized(true)
    const state = useAuthStore.getState()
    expect(state.user).toBe(mockUser)
    expect(state.isNewUser).toBe(true)
    expect(state.isInitialized).toBe(true)
    expect(state.isLoading).toBe(false)
  })
})
