// Loot alerts — the signed-in user's notification inbox and push devices.

import { apiRequest, pathParam } from '../client.js'

/** @returns {Promise<import('../models.js').LootAlertPage>} */
export function listLootAlerts({ cursor, limit } = {}) {
  return apiRequest('GET', '/v1/me/alerts', { query: { cursor, limit } })
}

/** @returns {Promise<{ alert: import('../models.js').LootAlert }>} */
export function markAlertRead(alertId) {
  return apiRequest('POST', `/v1/me/alerts/${pathParam(alertId)}/read`)
}

/** @returns {Promise<{ updated: number }>} */
export function markAllAlertsRead() {
  return apiRequest('POST', '/v1/me/alerts/read-all')
}

/**
 * Sends this device's Expo push token. Call after every sign-in; registering again is harmless,
 * and a token that belonged to another account moves to this one.
 * @param {{ token: string, platform: 'android' | 'ios' }} req
 */
export function registerPushToken({ token, platform }) {
  return apiRequest('POST', '/v1/me/push-tokens', { body: { token, platform } })
}

/** Stops pushes to this device. Call before signing out. */
export function unregisterPushToken({ token }) {
  return apiRequest('DELETE', '/v1/me/push-tokens', { body: { token } })
}
