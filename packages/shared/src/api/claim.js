// Claim / save / share / review / redemption — personal accounts.

import { apiRequest, pathParam } from '../client.js'

/** @returns {Promise<{ redemption: import('../models.js').Redemption }>} */
export function claimLoot({ lootId }) {
  return apiRequest('POST', `/v1/loot/${pathParam(lootId)}/claim`)
}

export function saveLoot({ lootId }) {
  return apiRequest('PUT', `/v1/loot/${pathParam(lootId)}/save`)
}

export function unsaveLoot({ lootId }) {
  return apiRequest('DELETE', `/v1/loot/${pathParam(lootId)}/save`)
}

/** @param {{ lootId: string, channel: string }} req channel is one of SHARE_CHANNELS */
export function shareLoot({ lootId, channel }) {
  return apiRequest('POST', `/v1/loot/${pathParam(lootId)}/shares`, { body: { channel } })
}

/** @param {{ lootId: string, rating: number, text?: string }} req rating is 1-5 */
export function reviewLoot({ lootId, rating, text }) {
  return apiRequest('POST', `/v1/loot/${pathParam(lootId)}/reviews`, { body: { rating, text } })
}

/** @returns {Promise<{ redemption: import('../models.js').Redemption | null }>} */
export function getRedemptionByLoot(lootId) {
  return apiRequest('GET', `/v1/loot/${pathParam(lootId)}/redemption`)
}

/** @returns {Promise<import('../models.js').Page<import('../models.js').LootFeedItem>>} */
export function getMySavedLoot({ cursor, limit } = {}) {
  return apiRequest('GET', '/v1/me/saved', { query: { cursor, limit } })
}

/** Each item also carries its `redemption`. */
export function getMyClaimedLoot({ cursor, limit } = {}) {
  return apiRequest('GET', '/v1/me/claims', { query: { cursor, limit } })
}
