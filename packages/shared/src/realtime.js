// Socket.io contract between apps/api and the apps. Event names and area cells live here
// so the server and every client agree. Real-time is an enhancement: every value it
// pushes can also be fetched over REST (GET /v1/loot/:id/counters, the feeds).

import { geoHash, geoHashNeighborhood } from './geo/geohash.js'

export const REALTIME_EVENTS = Object.freeze({
  /** client → server `{ lootIds: string[] }`, ack `{ ok: true } | { ok: false, error }`. Adds to the watched set. */
  watchLoot: 'loot:watch',
  /** client → server `{ lootIds: string[] }`, ack as above. */
  unwatchLoot: 'loot:unwatch',
  /** client → server `{ latitude, longitude }`, ack as above. Replaces the previously watched area. */
  watchArea: 'area:watch',
  /** server → client {@link import('./models.js').LootCounters} for a watched loot. */
  lootCounters: 'loot:counters',
  /** server → client `LootFeedItem` (no `viewer`, `distanceKm` null): new live loot in the watched area. */
  lootPublished: 'loot:published',
  /** server → the claiming user `{ redemption }` when a business redeems their code. */
  redemptionUpdated: 'redemption:updated',
})

/** Most loot rooms one connection may watch (a feed screen's worth, with headroom). */
export const MAX_WATCHED_LOOT = 100

/** geoHash precision of area rooms: ~20 km × ~37 km cells near the equator. */
export const AREA_CELL_PRECISION = 4

/** The area cell a loot at this point is announced in. */
export function areaCell(lat, lng) {
  return geoHash(lat, lng, AREA_CELL_PRECISION)
}

/**
 * Cells a viewer at this point should watch: their own and its neighbours, which covers
 * at least one full cell (~20 km) in every direction. Clients still filter by distance.
 */
export function areaCellsAround(lat, lng) {
  return geoHashNeighborhood(lat, lng, AREA_CELL_PRECISION)
}
