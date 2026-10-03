import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiRequest, configureLootClient } from './client.js'
import { logout, verifyOtp } from './api/auth.js'

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

function memoryStore(initial = null) {
  let tokens = initial
  return {
    get: () => tokens,
    set: vi.fn((next) => {
      tokens = next
    }),
  }
}

const fresh = (accessToken = 'access-1', refreshToken = 'refresh-1') => ({
  accessToken,
  refreshToken,
  accessTokenExpiresAt: Date.now() + 60 * 60_000,
})

let fetchMock
let store
let onSessionExpired

function setup(tokens) {
  store = memoryStore(tokens)
  onSessionExpired = vi.fn()
  configureLootClient({ baseUrl: 'http://api.test/', tokenStore: store, onSessionExpired })
}

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('apiRequest', () => {
  it('sends the bearer token and drops empty query params', async () => {
    setup(fresh())
    fetchMock.mockResolvedValue(jsonResponse(200, { items: [], cursor: null }))

    await apiRequest('GET', '/v1/feed/fresh', { query: { latitude: 12.9, category: undefined, cursor: '' } })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://api.test/v1/feed/fresh?latitude=12.9')
    expect(init.headers.Authorization).toBe('Bearer access-1')
  })

  it('throws ApiError with the API error code', async () => {
    setup(fresh())
    fetchMock.mockResolvedValue(jsonResponse(403, { error: { code: 'account_type_required', message: 'Nope' } }))

    const err = await apiRequest('POST', '/v1/loot', { body: {} }).catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err).toMatchObject({ status: 403, code: 'account_type_required', message: 'Nope' })
  })

  it('refreshes an expired access token before the request', async () => {
    setup({ ...fresh(), accessTokenExpiresAt: Date.now() - 1 })
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(200, { accessToken: 'access-2', refreshToken: 'refresh-2', accessTokenExpiresIn: 900 }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { user: {} }))

    await apiRequest('GET', '/v1/me')

    expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/v1/auth/token/refresh')
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ refreshToken: 'refresh-1' })
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe('Bearer access-2')
    expect(store.get().refreshToken).toBe('refresh-2')
  })

  it('shares one refresh between concurrent requests', async () => {
    setup({ ...fresh(), accessTokenExpiresAt: Date.now() - 1 })
    fetchMock.mockImplementation(async (url) =>
      url.endsWith('/token/refresh')
        ? jsonResponse(200, { accessToken: 'access-2', refreshToken: 'refresh-2', accessTokenExpiresIn: 900 })
        : jsonResponse(200, {}),
    )

    await Promise.all([
      apiRequest('GET', '/v1/me'),
      apiRequest('GET', '/v1/me/saved'),
      apiRequest('GET', '/v1/me/claims'),
    ])

    const refreshes = fetchMock.mock.calls.filter(([url]) => url.endsWith('/token/refresh'))
    expect(refreshes).toHaveLength(1)
  })

  it('retries once after a 401 with a refreshed token', async () => {
    setup(fresh())
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { error: { code: 'invalid_token', message: 'expired' } }))
      .mockResolvedValueOnce(
        jsonResponse(200, { accessToken: 'access-2', refreshToken: 'refresh-2', accessTokenExpiresIn: 900 }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { user: { userId: 'u1' } }))

    await expect(apiRequest('GET', '/v1/me')).resolves.toEqual({ user: { userId: 'u1' } })
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer access-2')
  })

  it('clears the session when the refresh token is rejected', async () => {
    setup({ ...fresh(), accessTokenExpiresAt: Date.now() - 1 })
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { error: { code: 'refresh_token_reused', message: 'revoked' } }))
      .mockResolvedValueOnce(jsonResponse(401, { error: { code: 'unauthorized', message: 'Authentication required' } }))

    await expect(apiRequest('GET', '/v1/me')).rejects.toMatchObject({ status: 401 })
    expect(store.get()).toBeNull()
    expect(onSessionExpired).toHaveBeenCalledOnce()
  })
})

describe('auth', () => {
  it('verifyOtp stores the tokens and returns the user', async () => {
    setup(null)
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        user: { userId: 'u1' },
        isNewUser: true,
        accessToken: 'a',
        refreshToken: 'r',
        accessTokenExpiresIn: 900,
      }),
    )

    await expect(verifyOtp({ phoneNumber: '+919876543210', code: '123456' })).resolves.toEqual({
      user: { userId: 'u1' },
      isNewUser: true,
    })
    expect(store.get()).toMatchObject({ accessToken: 'a', refreshToken: 'r' })
  })

  it('logout clears local tokens even if the API call fails', async () => {
    setup(fresh())
    fetchMock.mockRejectedValue(new Error('offline'))

    await logout()
    expect(store.get()).toBeNull()
  })
})
