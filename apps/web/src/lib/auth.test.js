import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from '@/stores/auth'

vi.mock('@loot/shared', () => {
  class ApiError extends Error {
    constructor(status, code, message) {
      super(message)
      this.status = status
      this.code = code
    }
  }
  return {
    ApiError,
    getMe: vi.fn(),
    hasSession: vi.fn(),
    logout: vi.fn(),
    sendOtp: vi.fn(),
    verifyOtp: vi.fn(),
  }
})

import { ApiError, getMe, hasSession, logout, verifyOtp } from '@loot/shared'
import { clearNewUserFlag, restoreSession, signOut, verifyPhoneOtp } from './auth'
import { useAuth } from '@/hooks/use-auth'

const profile = { userId: 'user-1', name: 'Test User', accountType: 'personal' }

// vitest.setup mocks localStorage; give sessionStorage a working in-memory store.
const session = new Map()
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: (k) => (session.has(k) ? session.get(k) : null),
    setItem: (k, v) => session.set(k, String(v)),
    removeItem: (k) => session.delete(k),
  },
})

beforeEach(() => {
  vi.clearAllMocks()
  session.clear()
  useAuthStore.setState({
    profile: null,
    business: null,
    isLoading: true,
    isInitialized: false,
    isNewUser: false,
  })
})

describe('restoreSession', () => {
  it('marks auth initialized and signed out when there is no session', async () => {
    hasSession.mockResolvedValue(false)
    await restoreSession()

    const state = useAuthStore.getState()
    expect(getMe).not.toHaveBeenCalled()
    expect(state.profile).toBeNull()
    expect(state.isInitialized).toBe(true)
    expect(state.isLoading).toBe(false)
  })

  it('loads the profile for a stored session', async () => {
    hasSession.mockResolvedValue(true)
    getMe.mockResolvedValue({ user: profile })
    await restoreSession()

    expect(useAuthStore.getState().profile).toEqual(profile)
    expect(useAuthStore.getState().isInitialized).toBe(true)
  })

  it('stays signed out when the API rejects the session', async () => {
    hasSession.mockResolvedValue(true)
    getMe.mockRejectedValue(new ApiError(401, 'invalid_refresh_token', 'expired'))
    await restoreSession()

    expect(useAuthStore.getState().profile).toBeNull()
    expect(useAuthStore.getState().isInitialized).toBe(true)
  })

  it('keeps a new user in onboarding across reloads', async () => {
    session.set('loot_is_new_user', 'true')
    hasSession.mockResolvedValue(true)
    getMe.mockResolvedValue({ user: profile })
    await restoreSession()

    expect(useAuthStore.getState().isNewUser).toBe(true)
  })
})

describe('verifyPhoneOtp', () => {
  it('signs the user in', async () => {
    verifyOtp.mockResolvedValue({ user: profile, isNewUser: false })
    await verifyPhoneOtp('+919876543210', '123456')

    expect(verifyOtp).toHaveBeenCalledWith({ phoneNumber: '+919876543210', code: '123456' })
    expect(useAuthStore.getState().profile).toEqual(profile)
    expect(useAuthStore.getState().isNewUser).toBe(false)
  })

  it('flags new users for onboarding', async () => {
    verifyOtp.mockResolvedValue({ user: profile, isNewUser: true })
    await verifyPhoneOtp('+919876543210', '123456')

    expect(useAuthStore.getState().isNewUser).toBe(true)
    expect(session.get('loot_is_new_user')).toBe('true')
  })

  it('leaves the user signed out when the code is wrong', async () => {
    verifyOtp.mockRejectedValue(
      new ApiError(400, 'otp_invalid', 'The code is incorrect or has expired')
    )

    await expect(verifyPhoneOtp('+919876543210', '000000')).rejects.toThrow('incorrect')
    expect(useAuthStore.getState().profile).toBeNull()
  })
})

describe('clearNewUserFlag / signOut', () => {
  it('clearNewUserFlag ends onboarding', async () => {
    verifyOtp.mockResolvedValue({ user: profile, isNewUser: true })
    await verifyPhoneOtp('+919876543210', '123456')
    clearNewUserFlag()

    expect(useAuthStore.getState().isNewUser).toBe(false)
    expect(session.has('loot_is_new_user')).toBe(false)
  })

  it('signOut ends the session and clears the store', async () => {
    useAuthStore.setState({ profile, isInitialized: true })
    await signOut()

    expect(logout).toHaveBeenCalledOnce()
    expect(useAuthStore.getState().profile).toBeNull()
  })
})

describe('useAuth', () => {
  it('is unauthenticated with no profile', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.needsOnboarding).toBe(false)
  })

  it('derives isAuthenticated and needsOnboarding from the store', () => {
    useAuthStore.setState({ profile, isNewUser: true, isInitialized: true, isLoading: false })
    const { result } = renderHook(() => useAuth())

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.needsOnboarding).toBe(true)
    expect(result.current.profile).toEqual(profile)
  })
})
