// Loot alerts — the signed-in user's notification inbox.

import { apiRequest, pathParam } from '../client.js'

/** @returns {Promise<import('../models.js').Page<import('../models.js').LootAlert>>} */
export function listLootAlerts({ cursor, limit } = {}) {
  return apiRequest('GET', '/v1/me/alerts', { query: { cursor, limit } })
}

export function markAlertRead(alertId) {
  return apiRequest('POST', `/v1/me/alerts/${pathParam(alertId)}/read`)
}
