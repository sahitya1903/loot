// Contract test: the @loot/shared client (used by web and mobile) against the real API.

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ApiError, configureLootClient, getMe, logout, sendOtp, verifyOtp } from '@loot/shared'
import { startTestServer } from './helpers.js'

const PHONE = '+919876543210'

let server
let httpServer
let tokens = null
const tokenStore = {
  get: () => tokens,
  set: (next) => {
    tokens = next
  },
}

beforeAll(async () => {
  server = await startTestServer()
  httpServer = server.app.listen(0)
  await new Promise((resolve) => httpServer.once('listening', resolve))
  configureLootClient({ baseUrl: `http://127.0.0.1:${httpServer.address().port}`, tokenStore })
})
beforeEach(async () => {
  tokens = null
  await server.reset()
})
afterAll(async () => {
  await new Promise((resolve) => httpServer.close(resolve))
  await server.stop()
})

async function signIn() {
  await sendOtp({ phoneNumber: PHONE })
  return verifyOtp({ phoneNumber: PHONE, code: server.otpSender.codes.get(PHONE) })
}

describe('@loot/shared client against the API', () => {
  it('signs in with OTP and stores the session', async () => {
    const { user, isNewUser } = await signIn()

    expect(isNewUser).toBe(true)
    expect(user.phoneNumber).toBe(PHONE)
    expect(tokens.accessToken).toEqual(expect.any(String))
    expect(tokens.accessTokenExpiresAt).toBeGreaterThan(Date.now())

    const me = await getMe()
    expect(me.user.userId).toBe(user.userId)
  })

  it('surfaces validation errors as ApiError with details', async () => {
    const err = await sendOtp({ phoneNumber: '12345' }).catch((e) => e)

    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(400)
    expect(err.code).toBe('validation_failed')
    expect(err.details[0].message).toMatch(/international number/)
  })

  it('refreshes an expired access token transparently', async () => {
    await signIn()
    const before = tokens
    tokens = { ...tokens, accessTokenExpiresAt: Date.now() - 1 }

    await expect(getMe()).resolves.toHaveProperty('user')
    expect(tokens.refreshToken).not.toBe(before.refreshToken)
  })

  it('logout revokes the session on the server', async () => {
    await signIn()
    const stale = tokens
    await logout()
    expect(tokens).toBeNull()

    // The old refresh token no longer works.
    tokens = { ...stale, accessTokenExpiresAt: Date.now() - 1 }
    await expect(getMe()).rejects.toMatchObject({ status: 401 })
    expect(tokens).toBeNull()
  })
})
