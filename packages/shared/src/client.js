// Loot API client wiring.
//
// @loot/shared never decides where tokens live or which API it talks to — web
// keeps tokens in localStorage, mobile in secure storage. Each app calls
// `configureLootClient` once at startup.

/**
 * @typedef {object} AuthTokens
 * @property {string} accessToken
 * @property {string} refreshToken
 * @property {number} accessTokenExpiresAt epoch ms
 */

/**
 * @typedef {object} TokenStore
 * @property {() => AuthTokens | null | Promise<AuthTokens | null>} get
 * @property {(tokens: AuthTokens | null) => void | Promise<void>} set null clears the session
 */

/**
 * @typedef {object} LootClientConfig
 * @property {string} baseUrl API origin, e.g. http://localhost:4000
 * @property {TokenStore} tokenStore
 * @property {() => void} [onSessionExpired] called when the refresh token is rejected
 */

/** Error thrown for every non-2xx response. `code` is the API's stable error code. */
export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

// Refresh this long before the access token actually expires.
const EXPIRY_SKEW_MS = 30_000

/** @type {LootClientConfig | null} */
let config = null
/** @type {Promise<AuthTokens | null> | null} */
let refreshInFlight = null

/** @param {LootClientConfig} next */
export function configureLootClient(next) {
  config = { ...next, baseUrl: next.baseUrl.replace(/\/+$/, '') }
}

export function getLootClient() {
  if (!config) {
    throw new Error('@loot/shared: call configureLootClient() before using the API')
  }
  return config
}

/** Converts the API's token response into what the token store keeps. */
export function toAuthTokens({ accessToken, refreshToken, accessTokenExpiresIn }) {
  return { accessToken, refreshToken, accessTokenExpiresAt: Date.now() + accessTokenExpiresIn * 1000 }
}

function buildUrl(path, query) {
  const params = Object.entries(query ?? {})
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
  return `${getLootClient().baseUrl}${path}${params.length ? `?${params.join('&')}` : ''}`
}

async function send(method, path, { body, query, accessToken } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  const res = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const error = data?.error ?? {}
    throw new ApiError(
      res.status,
      error.code ?? 'http_error',
      error.message ?? `Request failed (${res.status})`,
      error.details,
    )
  }
  return data
}

// One refresh at a time: the API treats a reused refresh token as theft and
// revokes the whole session, so parallel refreshes would log the user out.
function refreshTokens() {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const { tokenStore, onSessionExpired } = getLootClient()
      const current = await tokenStore.get()
      if (!current) return null
      try {
        const next = toAuthTokens(
          await send('POST', '/v1/auth/token/refresh', { body: { refreshToken: current.refreshToken } }),
        )
        await tokenStore.set(next)
        return next
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          await tokenStore.set(null)
          onSessionExpired?.()
          return null
        }
        throw err
      }
    })().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

async function validAccessToken() {
  const tokens = await getLootClient().tokenStore.get()
  if (!tokens) return null
  if (tokens.accessTokenExpiresAt - EXPIRY_SKEW_MS > Date.now()) return tokens.accessToken
  return (await refreshTokens())?.accessToken ?? null
}

/**
 * Calls the Loot API. Sends the access token when signed in, refreshes it when
 * it has expired, and retries once if the API still answers 401.
 *
 * @param {'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'} method
 * @param {string} path e.g. `/v1/me`
 * @param {{ body?: unknown, query?: Record<string, unknown> }} [options]
 */
export async function apiRequest(method, path, { body, query } = {}) {
  const accessToken = await validAccessToken()
  try {
    return await send(method, path, { body, query, accessToken })
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401 || !accessToken) throw err
    const refreshed = await refreshTokens()
    if (!refreshed) throw err
    return send(method, path, { body, query, accessToken: refreshed.accessToken })
  }
}

/** Calls the API without credentials (sign-in endpoints). */
export function publicRequest(method, path, options) {
  return send(method, path, options)
}

/** Escapes a value for use as a URL path segment: `/v1/loot/${pathParam(lootId)}`. */
export function pathParam(value) {
  return encodeURIComponent(String(value))
}
