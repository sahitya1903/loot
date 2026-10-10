import { Business } from '../businesses/business.model.js'
import { Claim } from '../engagement/claim.model.js'
import { Save } from '../engagement/save.model.js'
import { toFeedItem } from './loot.serialize.js'

/** @returns {Promise<Map<string, object>>} businessId → business document */
export async function loadBusinesses(loots) {
  const ids = [...new Set(loots.map((loot) => loot.businessId.toString()))]
  if (ids.length === 0) return new Map()
  const businesses = await Business.find({ _id: { $in: ids } }).lean()
  return new Map(businesses.map((b) => [b._id.toString(), b]))
}

/**
 * The signed-in user's saved/claimed state for each loot.
 * @returns {Promise<Map<string, { saved: boolean, claimed: boolean }> | null>} null when anonymous
 */
export async function loadViewerStates(userId, loots) {
  if (!userId) return null
  const lootIds = loots.map((loot) => loot._id)
  const [saves, claims] = await Promise.all([
    Save.find({ userId, lootId: { $in: lootIds } })
      .select('lootId')
      .lean(),
    Claim.find({ userId, lootId: { $in: lootIds } })
      .select('lootId')
      .lean(),
  ])
  const saved = new Set(saves.map((s) => s.lootId.toString()))
  const claimed = new Set(claims.map((c) => c.lootId.toString()))
  return new Map(
    lootIds.map((id) => [id.toString(), { saved: saved.has(id.toString()), claimed: claimed.has(id.toString()) }]),
  )
}

/**
 * Loot documents → LootFeedItems with business info and viewer state.
 * @param {object[]} loots
 * @param {{ userId?: string, distanceKm?: (loot: object) => number | null }} [options]
 */
export async function toFeedItems(loots, { userId, distanceKm } = {}) {
  const [businesses, viewers] = await Promise.all([loadBusinesses(loots), loadViewerStates(userId, loots)])
  return loots.map((loot) =>
    toFeedItem(loot, businesses.get(loot.businessId.toString()), {
      distanceKm: distanceKm ? distanceKm(loot) : null,
      viewer: viewers?.get(loot._id.toString()),
    }),
  )
}
