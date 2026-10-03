// Auth — phone OTP sign-in against apps/api. Tokens go to the app's token store.

import { apiRequest, getLootClient, publicRequest, toAuthTokens } from '../client.js'

/**
 * Sends a 6-digit code to the phone number over WhatsApp.
 * @param {{ phoneNumber: string }} req E.164, e.g. +919876543210
 * @returns {Promise<{ expiresInSeconds: number }>}
 */
export function sendOtp({ phoneNumber }) {
  return publicRequest('POST', '/v1/auth/otp/send', { body: { phoneNumber } })
}

/**
 * Verifies the code and starts a session. Creates the account on first sign-in.
 * @param {{ phoneNumber: string, code: string }} req
 * @returns {Promise<{ user: import('../models.js').AppUser, isNewUser: boolean }>}
 */
export async function verifyOtp({ phoneNumber, code }) {
  const { user, isNewUser, ...tokens } = await publicRequest('POST', '/v1/auth/otp/verify', {
    body: { phoneNumber, code },
  })
  await getLootClient().tokenStore.set(toAuthTokens(tokens))
  return { user, isNewUser }
}

/** Ends the session on the server (best effort) and clears local tokens. */
export async function logout() {
  const { tokenStore } = getLootClient()
  const tokens = await tokenStore.get()
  await tokenStore.set(null)
  if (tokens) {
    await publicRequest('POST', '/v1/auth/logout', { body: { refreshToken: tokens.refreshToken } }).catch(() => {})
  }
}

/** True when a session exists locally (the API may still reject it). */
export async function hasSession() {
  return !!(await getLootClient().tokenStore.get())
}

/** @returns {Promise<{ user: import('../models.js').AppUser }>} */
export function getMe() {
  return apiRequest('GET', '/v1/me')
}
