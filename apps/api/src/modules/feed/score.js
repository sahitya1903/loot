// The shared ranking formula (@loot/shared scoreLoot) as a MongoDB aggregation expression,
// so the feed can score, sort and page inside the database. tests/feed.test.js asserts the
// two give the same numbers; change them together.

import { MAX_BOOST_MULTIPLIER, RANKING_PARAMS, RANKING_WEIGHTS } from '@loot/shared'

const HOUR_MS = 3600_000

const ratio = (value, halfSaturation) => ({ $divide: [value, { $add: [value, halfSaturation] }] })

/**
 * @param {object} options
 * @param {number} options.radiusKm the viewer's search radius
 * @param {number} options.now epoch ms — fixed per feed session so scores are stable across pages
 * @param {string} [options.distanceField] meters, from $geoNear
 */
export function scoreExpression({ radiusKm, now, distanceField = '$distanceMeters' }) {
  const p = RANKING_PARAMS
  const w = RANKING_WEIGHTS
  const nowDate = new Date(now)

  const ageHours = {
    $max: [0, { $divide: [{ $subtract: [nowDate, { $ifNull: ['$publishedAt', '$createdAt'] }] }, HOUR_MS] }],
  }
  const hoursLeft = { $max: [0, { $divide: [{ $subtract: ['$expiryAt', nowDate] }, HOUR_MS] }] }
  const actions = {
    $add: [
      { $ifNull: ['$saveCount', 0] },
      { $multiply: [2, { $ifNull: ['$claimCount', 0] }] },
      { $ifNull: ['$shareCount', 0] },
    ],
  }
  const velocity = { $divide: [actions, { $add: [ageHours, 2] }] }
  const trendingScore = { $max: [0, { $ifNull: ['$trendingScore', 0] }] }

  const distance = { $subtract: [1, { $min: [{ $divide: [{ $divide: [distanceField, 1000] }, radiusKm] }, 1] }] }
  const freshness = { $divide: [p.freshnessHalfLifeHours, { $add: [p.freshnessHalfLifeHours, ageHours] }] }
  const urgency = { $max: [0, { $subtract: [1, { $divide: [hoursLeft, p.urgencyWindowHours] }] }] }
  const engagement = ratio(velocity, p.engagementHalfSaturation)
  const trending = ratio(trendingScore, p.trendingHalfSaturation)

  const base = {
    $add: [
      { $multiply: [w.distance, distance] },
      { $multiply: [w.freshness, freshness] },
      { $multiply: [w.urgency, urgency] },
      { $multiply: [w.engagement, engagement] },
      { $multiply: [w.trending, trending] },
    ],
  }
  const multiplier = {
    $cond: [
      { $and: [{ $eq: ['$boost.active', true] }, { $gt: ['$boost.endsAt', nowDate] }] },
      { $min: [{ $max: [{ $ifNull: ['$boost.multiplier', 1] }, 1] }, MAX_BOOST_MULTIPLIER] },
      1,
    ],
  }
  return { $multiply: [base, multiplier] }
}
