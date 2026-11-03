// Feed surfaces — Nearby, Following, Trending, Fresh. All cursor-paginated:
// each returns { items: LootFeedItem[], cursor } where cursor is null at the end.

import { apiRequest } from '../client.js'

/** @param {{ latitude: number, longitude: number, radiusKm?: number, category?: string, cursor?: string, limit?: number }} req */
export function getNearbyFeed(req) {
  return apiRequest('GET', '/v1/feed/nearby', { query: req })
}

/**
 * Live loot from businesses the signed-in user follows, newest first. Pass both coordinates to get distanceKm.
 * @param {{ latitude?: number, longitude?: number, category?: string, cursor?: string, limit?: number }} [req]
 */
export function getFollowingFeed(req = {}) {
  return apiRequest('GET', '/v1/feed/following', { query: req })
}

/**
 * Live loot in the area with a trending score, highest first. Empty when nothing nearby is trending.
 * @param {{ latitude: number, longitude: number, radiusKm?: number, category?: string, cursor?: string, limit?: number }} req
 */
export function getTrendingFeed(req) {
  return apiRequest('GET', '/v1/feed/trending', { query: req })
}

/** @param {{ latitude: number, longitude: number, radiusKm?: number, category?: string, cursor?: string, limit?: number }} req */
export function getFreshFeed(req) {
  return apiRequest('GET', '/v1/feed/fresh', { query: req })
}
