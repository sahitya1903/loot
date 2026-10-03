import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './auth'

const mockProfile = { userId: 'user-1', name: 'Test User', username: 'testuser' }
const mockBusiness = { businessId: 'biz-1', businessName: 'Test Cafe' }

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      profile: null,
      business: null,
      isLoading: true,
      isInitialized: false,
      isNewUser: false,
    })
  })

  it('has correct initial state', () => {
    const state = useAuthStore.getState()
    expect(state.profile).toBeNull()
    expect(state.business).toBeNull()
    expect(state.isLoading).toBe(true)
    expect(state.isInitialized).toBe(false)
    expect(state.isNewUser).toBe(false)
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

  it('setBusiness stores the business', () => {
    useAuthStore.getState().setBusiness(mockBusiness)
    expect(useAuthStore.getState().business).toBe(mockBusiness)
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

  it('reset clears profile and business', () => {
    useAuthStore.getState().setProfile(mockProfile)
    useAuthStore.getState().setBusiness(mockBusiness)
    useAuthStore.getState().reset()
    const state = useAuthStore.getState()
    expect(state.profile).toBeNull()
    expect(state.business).toBeNull()
  })

  it('reset clears isNewUser', () => {
    useAuthStore.getState().setIsNewUser(true)
    useAuthStore.getState().reset()
    expect(useAuthStore.getState().isNewUser).toBe(false)
  })

  it('reset keeps the store initialized and not loading', () => {
    useAuthStore.getState().setIsInitialized(true)
    useAuthStore.getState().reset()
    const state = useAuthStore.getState()
    expect(state.isLoading).toBe(false)
    expect(state.isInitialized).toBe(true)
  })

  it('multiple setters compose independently', () => {
    useAuthStore.getState().setProfile(mockProfile)
    useAuthStore.getState().setIsNewUser(true)
    useAuthStore.getState().setIsInitialized(true)
    const state = useAuthStore.getState()
    expect(state.profile).toBe(mockProfile)
    expect(state.isNewUser).toBe(true)
    expect(state.isInitialized).toBe(true)
    expect(state.isLoading).toBe(false)
  })
})
