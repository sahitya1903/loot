// Loot — CRUD (professional accounts) and reads.

import { apiRequest, pathParam } from '../client.js'

/** @returns {Promise<{ loot: import('../models.js').Loot }>} */
export function createLoot(req) {
  return apiRequest('POST', '/v1/loot', { body: req })
}

export function updateLoot({ lootId, ...changes }) {
  return apiRequest('PATCH', `/v1/loot/${pathParam(lootId)}`, { body: changes })
}

/** Publishes a draft: it goes live in feeds until its expiryAt. */
export function publishLoot({ lootId }) {
  return apiRequest('POST', `/v1/loot/${pathParam(lootId)}/publish`)
}

export function archiveLoot({ lootId }) {
  return apiRequest('POST', `/v1/loot/${pathParam(lootId)}/archive`)
}

export function attachLootMedia({ lootId, media }) {
  return apiRequest('POST', `/v1/loot/${pathParam(lootId)}/media`, { body: { media } })
}

/** @returns {Promise<{ loot: import('../models.js').Loot }>} */
export function getLoot({ lootId }) {
  return apiRequest('GET', `/v1/loot/${pathParam(lootId)}`)
}

/** @returns {Promise<{ urls: Array<{ url: string, thumbnailUrl?: string, mimeType: string }> }>} */
export function getLootMediaUrls({ lootId }) {
  return apiRequest('GET', `/v1/loot/${pathParam(lootId)}/media`)
}

/** @param {{ lootId: string, source: string, watchTimeMs?: number }} req source is one of FEED_SOURCES */
export function trackLootView({ lootId, source, watchTimeMs }) {
  return apiRequest('POST', `/v1/loot/${pathParam(lootId)}/views`, { body: { source, watchTimeMs } })
}

/**
 * Live counters without the full loot: the REST fallback when the socket is down.
 * @returns {Promise<{ counters: import('../models.js').LootCounters }>}
 */
export function getLootCounters({ lootId }) {
  return apiRequest('GET', `/v1/loot/${pathParam(lootId)}/counters`)
}
