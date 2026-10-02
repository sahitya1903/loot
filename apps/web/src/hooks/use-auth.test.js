import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/lib/firebase/auth', () => ({
  onAuthStateChange: vi.fn(),
}))

vi.mock('@/lib/firebase/firestore', () => ({
  createUserIfNotExists: vi.fn(),
  fetchUserProfile: vi.fn(),
}))

import { onAuthStateChange } from '@/lib/firebase/auth'
import { createUserIfNotExists, fetchUserProfile } from '@/lib/firebase/firestore'
import { useAuth } from './use-auth'

const mockOnAuthStateChange = vi.mocked(onAuthStateChange)
const mockCreateUserIfNotExists = vi.mocked(createUserIfNotExists)
const mockFetchUserProfile = vi.mocked(fetchUserProfile)

const mockUser = { uid: 'user-1', displayName: 'Test User' }

describe('useAuth', () => {
  let authCallback = null
  const unsubscribe = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      user: null,
      profile: null,
      isLoading: true,
      isInitialized: false,
      isNewUser: false,
    })
    sessionStorage.clear()

    mockOnAuthStateChange.mockImplementation((cb) => {
      authCallback = cb
      return unsubscribe
    })
  })

  it('returns unauthenticated state before auth resolves', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('returns isLoading true before auth resolves', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.isLoading).toBe(true)
  })

  it('sets authenticated state when user signs in', async () => {
    mockCreateUserIfNotExists.mockResolvedValue({
      profile: { userId: 'user-1', name: 'Test User' },
      isNewUser: false,
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await authCallback(mockUser)
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toBe(mockUser)
  })

  it('sets profile from createUserIfNotExists', async () => {
    const profile = { userId: 'user-1', name: 'Test User' }
    mockCreateUserIfNotExists.mockResolvedValue({ profile, isNewUser: false })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await authCallback(mockUser)
    })

    expect(result.current.profile).toEqual(profile)
  })

  it('sets isInitialized after auth state resolves', async () => {
    mockCreateUserIfNotExists.mockResolvedValue({
      profile: { userId: 'user-1' },
      isNewUser: false,
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await authCallback(mockUser)
    })

    expect(result.current.isInitialized).toBe(true)
  })

  it('sets isNewUser and stores sessionStorage flag for new users', async () => {
    mockCreateUserIfNotExists.mockResolvedValue({
      profile: { userId: 'new-user' },
      isNewUser: true,
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await authCallback({ uid: 'new-user', displayName: 'New' })
    })

    expect(result.current.isNewUser).toBe(true)
    expect(result.current.needsOnboarding).toBe(true)
    expect(sessionStorage.getItem('loot_is_new_user')).toBe('true')
  })

  it('reads isNewUser from sessionStorage for mid-onboarding navigations', async () => {
    sessionStorage.setItem('loot_is_new_user', 'true')
    mockCreateUserIfNotExists.mockResolvedValue({
      profile: { userId: 'user-1' },
      isNewUser: false, // already in DB but session flag is set
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await authCallback(mockUser)
    })

    expect(result.current.isNewUser).toBe(true)
  })

  it('clears auth on sign out', async () => {
    mockCreateUserIfNotExists.mockResolvedValue({
      profile: { userId: 'user-1' },
      isNewUser: false,
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await authCallback(mockUser)
    })

    await act(async () => {
      await authCallback(null)
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.profile).toBeNull()
  })

  it('clears sessionStorage new user flag on sign out', async () => {
    sessionStorage.setItem('loot_is_new_user', 'true')
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await authCallback(null)
    })

    expect(sessionStorage.getItem('loot_is_new_user')).toBeNull()
    expect(result.current.isNewUser).toBe(false)
  })

  it('unsubscribes from auth state on unmount', () => {
    const { unmount } = renderHook(() => useAuth())
    unmount()
    expect(unsubscribe).toHaveBeenCalledOnce()
  })

  it('refreshProfile fetches and updates the profile', async () => {
    const updatedProfile = { userId: 'user-1', name: 'Updated Name' }
    useAuthStore.setState({ user: mockUser })
    mockFetchUserProfile.mockResolvedValue(updatedProfile)

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.refreshProfile()
    })

    expect(mockFetchUserProfile).toHaveBeenCalledWith('user-1')
    expect(result.current.profile).toEqual(updatedProfile)
  })

  it('refreshProfile does nothing when user is null', async () => {
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.refreshProfile()
    })

    expect(mockFetchUserProfile).not.toHaveBeenCalled()
  })

  it('clearNewUserFlag removes session flag and resets isNewUser', () => {
    sessionStorage.setItem('loot_is_new_user', 'true')
    useAuthStore.setState({ isNewUser: true })

    const { result } = renderHook(() => useAuth())

    act(() => {
      result.current.clearNewUserFlag()
    })

    expect(sessionStorage.getItem('loot_is_new_user')).toBeNull()
    expect(result.current.isNewUser).toBe(false)
  })
})
