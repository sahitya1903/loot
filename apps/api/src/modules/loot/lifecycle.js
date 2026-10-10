// Loot lifecycle transitions driven by time: live → expiring (ENDING_SOON_MS before expiryAt)
// → expired (at expiryAt). BullMQ runs these at the exact moment (delayed jobs) and a
// sweeper catches anything missed. Reads never depend on them: every feed and claim also
// filters on expiryAt, so a late job can't make expired loot claimable.

import { ENDING_SOON_MS, LIVE_LOOT_STATUSES } from '@loot/shared'
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
