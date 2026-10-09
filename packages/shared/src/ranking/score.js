// Feed ranking score. Each signal is normalized to 0..1 and weighted, so no single
// signal dominates; a paid boost multiplies the total by at most MAX_BOOST_MULTIPLIER.
//
// apps/api evaluates the same formula inside MongoDB (src/modules/feed/score.js);
// a test there asserts both agree. Change the two together.

import { MAX_BOOST_MULTIPLIER } from '../models.js'

const HOUR_MS = 3600_000

export const RANKING_WEIGHTS = Object.freeze({
  distance: 0.35,
  freshness: 0.2,
  urgency: 0.15,
  engagement: 0.2,
  trending: 0.1,
})

export const RANKING_PARAMS = Object.freeze({
  /** Freshness is 0.5 at this age. */
  freshnessHalfLifeHours: 12,
  /** Urgency rises linearly over the last this-many hours. */
  urgencyWindowHours: 24,
  /** Engagement velocity (weighted actions per hour) that scores 0.5. */
  engagementHalfSaturation: 5,
  /** trendingScore that scores 0.5. */
  trendingHalfSaturation: 10,
})

/**
 * @param {object} loot
 * @param {number} loot.distanceKm
 * @param {number} loot.radiusKm the radius the viewer searched
 * @param {string | number | Date} loot.createdAt
 * @param {string | number | Date} loot.expiryAt
 * @param {number} [loot.saveCount]
 * @param {number} [loot.claimCount]
 * @param {number} [loot.shareCount]
 * @param {number} [loot.trendingScore]
 * @param {{ active?: boolean, multiplier?: number, endsAt?: string | number | Date }} [loot.boost]
 * @param {number} [now] epoch ms
 * @returns {number}
 */
export function scoreLoot(loot, now = Date.now()) {
  const p = RANKING_PARAMS
  const w = RANKING_WEIGHTS

  const distance = 1 - Math.min(loot.distanceKm / loot.radiusKm, 1)

  const ageHours = Math.max(0, (now - new Date(loot.createdAt).getTime()) / HOUR_MS)
  const freshness = p.freshnessHalfLifeHours / (p.freshnessHalfLifeHours + ageHours)

  const hoursLeft = Math.max(0, (new Date(loot.expiryAt).getTime() - now) / HOUR_MS)
  const urgency = Math.max(0, 1 - hoursLeft / p.urgencyWindowHours)

  const actions = (loot.saveCount ?? 0) + 2 * (loot.claimCount ?? 0) + (loot.shareCount ?? 0)
  const velocity = actions / (ageHours + 2)
  const engagement = velocity / (velocity + p.engagementHalfSaturation)

  const trendingScore = Math.max(0, loot.trendingScore ?? 0)
  const trending = trendingScore / (trendingScore + p.trendingHalfSaturation)

  const base =
    w.distance * distance +
    w.freshness * freshness +
    w.urgency * urgency +
    w.engagement * engagement +
    w.trending * trending

  const boost = loot.boost
  const boosted = boost?.active && boost.endsAt && new Date(boost.endsAt).getTime() > now
  const multiplier = boosted ? Math.min(Math.max(boost.multiplier ?? 1, 1), MAX_BOOST_MULTIPLIER) : 1

  return base * multiplier
}
