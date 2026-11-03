// Loot lifecycle transitions driven by time: live → expiring (ENDING_SOON_MS before expiryAt)
// → expired (at expiryAt). BullMQ runs these at the exact moment (delayed jobs) and a
// sweeper catches anything missed. Reads never depend on them: every feed and claim also
// filters on expiryAt, so a late job can't make expired loot claimable.
// Trending is driven by engagement: refreshTrending decays scores and moves active ⇄ trending.

import {
  ENDING_SOON_MS,
  LIVE_LOOT_STATUSES,
  TRENDING_HALF_LIFE_HOURS,
  TRENDING_MIN_SCORE,
  TRENDING_THRESHOLD,
} from '@loot/shared'
import { Loot } from './loot.model.js'

/** Status for live loot with this expiry: `expiring` inside the ending-soon window. */
export function liveStatusFor(expiryAt, now = Date.now(), current = 'active') {
  if (expiryAt.getTime() - now <= ENDING_SOON_MS) return 'expiring'
  return current === 'expiring' ? 'active' : current
}

/**
 * Expires one loot if it is due. Idempotent.
 * @returns {Promise<object | null>} the updated loot, or null if nothing changed
 */
export function expireLoot(lootId, now = new Date()) {
  return Loot.findOneAndUpdate(
    { _id: lootId, status: { $in: LIVE_LOOT_STATUSES }, expiryAt: { $lte: now } },
    { status: 'expired', expiredAt: now },
    { returnDocument: 'after' },
  )
}

/** Marks one loot as ending soon if it is inside the window. Idempotent. */
export function markLootExpiring(lootId, now = new Date()) {
  return Loot.findOneAndUpdate(
    {
      _id: lootId,
      status: { $in: ['active', 'trending'] },
      expiryAt: { $gt: now, $lte: new Date(now.getTime() + ENDING_SOON_MS) },
    },
    { status: 'expiring' },
    { returnDocument: 'after' },
  )
}

/**
 * Reconciles every loot whose lifecycle job was missed (server down, Redis flushed, ...).
 * @returns {Promise<{ expired: object[], expiring: object[] }>} loot that changed
 */
export async function sweepLootLifecycle(now = new Date(), batchSize = 500) {
  const dueToExpire = await Loot.find({ status: { $in: LIVE_LOOT_STATUSES }, expiryAt: { $lte: now } })
    .select('_id')
    .limit(batchSize)
    .lean()
  const dueToWarn = await Loot.find({
    status: { $in: ['active', 'trending'] },
    expiryAt: { $gt: now, $lte: new Date(now.getTime() + ENDING_SOON_MS) },
  })
    .select('_id')
    .limit(batchSize)
    .lean()

  const expired = (await Promise.all(dueToExpire.map((l) => expireLoot(l._id, now)))).filter(Boolean)
  const expiring = (await Promise.all(dueToWarn.map((l) => markLootExpiring(l._id, now)))).filter(Boolean)
  return { expired, expiring }
}

/** No-op scheduler for tests and for running without Redis; the sweeper still reconciles. */
export const noopLifecycleScheduler = {
  scheduleLoot() {},
}

/**
 * Decays every live loot's trendingScore by the time since its own last decay (the same
 * curve as @loot/shared decayTrendingScore), so a late or missed run still decays correctly.
 * Negative scores (an unsave after decay) clamp to 0. A score that reaches 0 forgets its
 * decay time, so points earned later start fresh instead of decaying from long ago.
 */
export function decayTrendingScores(now = new Date()) {
  const halfLifeMs = TRENDING_HALF_LIFE_HOURS * 3600_000
  const elapsedMs = { $max: [0, { $subtract: [now, { $ifNull: ['$trendingDecayedAt', now] }] }] }
  const decayed = {
    $multiply: [{ $max: [0, '$trendingScore'] }, { $pow: [0.5, { $divide: [elapsedMs, halfLifeMs] }] }],
  }
  return Loot.updateMany(
    { status: { $in: LIVE_LOOT_STATUSES }, trendingScore: { $ne: 0 } },
    [
      {
        $set: {
          trendingScore: {
            $let: { vars: { d: decayed }, in: { $cond: [{ $lt: ['$$d', TRENDING_MIN_SCORE] }, 0, '$$d'] } },
          },
        },
      },
      { $set: { trendingDecayedAt: { $cond: [{ $eq: ['$trendingScore', 0] }, '$$REMOVE', now] } } },
    ],
    { updatePipeline: true },
  )
}

/**
 * Decays scores, then moves `active` loot at TRENDING_THRESHOLD to `trending` and `trending`
 * loot below half of it back to `active` (the gap stops it flapping). `expiring` is left alone:
 * ending soon matters more than trending.
 * @returns {Promise<{ trending: object[], active: object[] }>} loot whose status changed
 */
export async function refreshTrending(now = new Date(), batchSize = 500) {
  await decayTrendingScores(now)

  const rising = { status: 'active', expiryAt: { $gt: now }, trendingScore: { $gte: TRENDING_THRESHOLD } }
  const cooling = { status: 'trending', trendingScore: { $lt: TRENDING_THRESHOLD / 2 } }
  const move = async (filter, status) => {
    const due = await Loot.find(filter).select('_id').limit(batchSize).lean()
    const changed = await Promise.all(
      due.map((l) => Loot.findOneAndUpdate({ _id: l._id, ...filter }, { status }, { returnDocument: 'after' })),
    )
    return changed.filter(Boolean)
  }
  const [trending, active] = await Promise.all([move(rising, 'trending'), move(cooling, 'active')])
  return { trending, active }
}
