// Session lifecycle for the web app: phone OTP sign-in, restoring the session
// on load, and sign-out. The auth store is the single source of truth for UI.

import { ApiError, getMe, hasSession, logout, sendOtp, verifyOtp } from '@loot/shared'
import { useAuthStore } from '@/stores/auth'

// Survives reloads during onboarding so a new user isn't dropped into the app
// half-way through choosing an account type.
const NEW_USER_SESSION_KEY = 'loot_is_new_user'

function readNewUserFlag() {
  try {
    return window.sessionStorage.getItem(NEW_USER_SESSION_KEY) === 'true'
  } catch {
    return false
  }
}

function writeNewUserFlag(isNew) {
  try {
    if (isNew) window.sessionStorage.setItem(NEW_USER_SESSION_KEY, 'true')
    else window.sessionStorage.removeItem(NEW_USER_SESSION_KEY)
  } catch {
    // ignore
  }
}

/** Sends a WhatsApp OTP. Throws ApiError (e.g. `rate_limited`) on failure. */
export function sendPhoneOtp(phoneNumber) {
  return sendOtp({ phoneNumber })
}

/** Verifies the OTP, stores the session and signs the user in. */
export async function verifyPhoneOtp(phoneNumber, code) {
  const { user, isNewUser } = await verifyOtp({ phoneNumber, code })
  const store = useAuthStore.getState()
  writeNewUserFlag(isNewUser)
  store.setIsNewUser(isNewUser)
  store.setProfile(user)
  return { user, isNewUser }
}

/** Restores the signed-in user from a stored session. Runs once on app start. */
export async function restoreSession() {
  const store = useAuthStore.getState()
  try {
    if (await hasSession()) {
      const { user } = await getMe()
      store.setProfile(user)
      store.setIsNewUser(readNewUserFlag())
    }
  } catch (err) {
    // A rejected session is already cleared by the client; anything else
    // (API down, offline) leaves the tokens for the next attempt.
    if (!(err instanceof ApiError)) console.error('Could not restore session', err)
  } finally {
    store.setIsInitialized(true)
  }
}

/** Reloads the signed-in user's profile from the API. */
export async function refreshProfile() {
  const { user } = await getMe()
  useAuthStore.getState().setProfile(user)
  return user
}

export function clearNewUserFlag() {
  writeNewUserFlag(false)
  useAuthStore.getState().setIsNewUser(false)
}

export async function signOut() {
  writeNewUserFlag(false)
  await logout()
  useAuthStore.getState().reset()
}
