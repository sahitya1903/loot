// Push delivery through Expo's push service. Expo relays to FCM (Android) and APNs (iOS), so the
// API needs no per-platform credentials; those live in the EAS project (see DEPLOY.md).
// https://docs.expo.dev/push-notifications/sending-notifications/

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push'
/** Expo accepts at most this many messages (or receipt ids) per request. */
export const EXPO_BATCH_SIZE = 100
/** The Android notification channel the app creates (src/lib/push.jsx). */
export const ANDROID_CHANNEL_ID = 'loot'

function chunks(items, size) {
  const out = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

/**
 * @typedef {object} PushMessage
 * @property {string} to Expo push token
 * @property {string} title
 * @property {string} body
 * @property {Record<string, unknown>} [data] delivered to the app (e.g. { lootId })
 */

/**
 * @typedef {object} PushResult
 * @property {string[]} deadTokens tokens Expo says are no longer registered; delete them
 * @property {{ id: string, token: string }[]} tickets accepted messages, to check receipts later
 */

/**
 * @param {object} deps
 * @param {string} [deps.accessToken] EXPO_ACCESS_TOKEN, required only if push security is enabled
 * @param {import('pino').Logger} deps.logger
 * @param {typeof fetch} [deps.fetch]
 */
export function createExpoPushSender({ accessToken, logger, fetch: fetchImpl = fetch }) {
  async function post(path, body) {
    const headers = { Accept: 'application/json', 'Content-Type': 'application/json' }
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`
    const res = await fetchImpl(`${EXPO_PUSH_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || json.errors) {
      throw new Error(`Expo push ${path} failed (${res.status}): ${JSON.stringify(json.errors ?? json)}`)
    }
    return json.data
  }

  return {
    /**
     * @param {PushMessage[]} messages
     * @returns {Promise<PushResult>}
     */
    async send(messages) {
      const result = { deadTokens: [], tickets: [] }
      for (const batch of chunks(messages, EXPO_BATCH_SIZE)) {
        const tickets = await post(
          '/send',
          batch.map((m) => ({ ...m, sound: 'default', priority: 'high', channelId: ANDROID_CHANNEL_ID })),
        )
        tickets.forEach((ticket, i) => {
          const token = batch[i].to
          if (ticket.status === 'ok') result.tickets.push({ id: ticket.id, token })
          else if (ticket.details?.error === 'DeviceNotRegistered') result.deadTokens.push(token)
          else logger.warn({ token, ticket }, 'Expo rejected a push')
        })
      }
      return result
    },

    /**
     * Expo reports most delivery failures only in receipts, some minutes after sending.
     * @param {{ id: string, token: string }[]} tickets
     * @returns {Promise<{ deadTokens: string[] }>}
     */
    async checkReceipts(tickets) {
      const tokenById = new Map(tickets.map((t) => [t.id, t.token]))
      const deadTokens = []
      for (const ids of chunks([...tokenById.keys()], EXPO_BATCH_SIZE * 10)) {
        const receipts = await post('/getReceipts', { ids })
        for (const [id, receipt] of Object.entries(receipts ?? {})) {
          if (receipt.status === 'ok') continue
          if (receipt.details?.error === 'DeviceNotRegistered') deadTokens.push(tokenById.get(id))
          else logger.warn({ token: tokenById.get(id), receipt }, 'Expo push was not delivered')
        }
      }
      return { deadTokens }
    },
  }
}
