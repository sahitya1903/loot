// Who gets which alert. Each function writes inbox rows, then pushes to the devices of users
// whose row is new. Rows are upserted on (userId, type, lootId), so running a job twice
// neither duplicates the inbox nor pushes twice.
//
//   followed_business_drop  followers, when a loot goes live
//   loot_ending_soon        savers who haven't claimed, when a loot enters `expiring`
//   redemption_reminder     holders of an unused code, at the same moment

import { LIVE_LOOT_STATUSES } from '@loot/shared'
import { Business } from '../businesses/business.model.js'
import { Follow } from '../businesses/follow.model.js'
import { Claim } from '../engagement/claim.model.js'
import { Save } from '../engagement/save.model.js'
import { Loot } from '../loot/loot.model.js'
import { LootAlert } from './alert.model.js'
import { PushToken } from './pushToken.model.js'

/** At most one follow-drop push per user per business in this window; the inbox still gets every drop. */
export const DROP_PUSH_COOLDOWN_SECONDS = 3600
const BATCH_SIZE = 1000

/** "45 minutes", "about 2 hours". */
export function timeLeft(until, now = Date.now()) {
  const minutes = Math.max(1, Math.round((until.getTime() - now) / 60_000))
  if (minutes < 60) return minutes === 1 ? '1 minute' : `${minutes} minutes`
  const hours = Math.round(minutes / 60)
  return hours === 1 ? 'about an hour' : `about ${hours} hours`
}

function lootImage(loot) {
  const first = loot.media?.[0]
  if (!first) return undefined
  return first.thumbnailUrl ?? (first.mediaType === 'image' ? first.url : undefined)
}

/**
 * Upserts one alert per row and returns the ones that didn't exist yet.
 * @param {object[]} rows { userId, type, title, body, lootId, businessId, imageUrl }
 */
async function insertNewAlerts(rows) {
  if (rows.length === 0) return []
  const result = await LootAlert.bulkWrite(
    rows.map((row) => ({
      updateOne: {
        filter: { userId: row.userId, type: row.type, lootId: row.lootId },
        update: { $setOnInsert: row },
        upsert: true,
      },
    })),
    { ordered: false },
  )
  return Object.entries(result.upsertedIds ?? {}).map(([index, _id]) => ({ ...rows[Number(index)], _id }))
}

/**
 * Pushes each alert to its user's devices and deletes tokens Expo reports as dead.
 * @param {object[]} alerts inserted alerts
 * @param {{ push: object, redis?: import('ioredis').Redis, cooldownKey?: (alert: object) => string }} deps
 * @returns {Promise<{ pushed: number, tickets: { id: string, token: string }[] }>}
 */
async function pushAlerts(alerts, { push, redis, cooldownKey }) {
  let due = alerts
  if (cooldownKey && redis && alerts.length > 0) {
    const pipeline = redis.pipeline()
    for (const alert of alerts) pipeline.set(cooldownKey(alert), '1', 'EX', DROP_PUSH_COOLDOWN_SECONDS, 'NX')
    const replies = await pipeline.exec()
    due = alerts.filter((_, i) => replies[i]?.[1] === 'OK')
  }
  if (due.length === 0) return { pushed: 0, tickets: [] }

  const tokens = await PushToken.find({ userId: { $in: due.map((a) => a.userId) } }).lean()
  const byUser = new Map(due.map((a) => [a.userId.toString(), a]))
  const messages = tokens.map((t) => {
    const alert = byUser.get(t.userId.toString())
    return {
      to: t.token,
      title: alert.title,
      body: alert.body,
      data: { alertId: alert._id.toString(), type: alert.type, lootId: alert.lootId?.toString() },
    }
  })
  if (messages.length === 0) return { pushed: 0, tickets: [] }

  const { deadTokens, tickets } = await push.send(messages)
  if (deadTokens.length > 0) await PushToken.deleteMany({ token: { $in: deadTokens } })
  return { pushed: tickets.length, tickets }
}

function mergeResults(a, b) {
  return { alerts: a.alerts + b.alerts, pushed: a.pushed + b.pushed, tickets: [...a.tickets, ...b.tickets] }
}

const EMPTY = { alerts: 0, pushed: 0, tickets: [] }

/**
 * A loot just went live: tell the business's followers.
 * @param {string} lootId
 * @param {{ push: object, redis?: import('ioredis').Redis }} deps
 */
export async function fanOutLootDrop(lootId, deps, { batchSize = BATCH_SIZE } = {}) {
  const loot = await Loot.findOne({ _id: lootId, status: { $in: LIVE_LOOT_STATUSES }, expiryAt: { $gt: new Date() } })
  if (!loot) return EMPTY
  const business = await Business.findById(loot.businessId).select('businessName ownerUserId').lean()
  if (!business) return EMPTY

  const template = {
    type: 'followed_business_drop',
    title: `${business.businessName} just dropped loot`,
    body: loot.offerText ? `${loot.title} · ${loot.offerText}` : loot.title,
    lootId: loot._id,
    businessId: loot.businessId,
    imageUrl: lootImage(loot),
  }
  const cooldownKey = (alert) => `alerts:drop-cooldown:${alert.userId}:${alert.businessId}`

  let total = EMPTY
  let after
  // Page through followers by _id so a big following never loads at once.
  for (;;) {
    const follows = await Follow.find({ businessId: loot.businessId, ...(after ? { _id: { $gt: after } } : {}) })
      .sort({ _id: 1 })
      .limit(batchSize)
      .select('userId')
      .lean()
    if (follows.length === 0) break
    after = follows[follows.length - 1]._id

    const rows = follows
      .filter((f) => !f.userId.equals(business.ownerUserId))
      .map((f) => ({ ...template, userId: f.userId }))
    const inserted = await insertNewAlerts(rows)
    const sent = await pushAlerts(inserted, { ...deps, cooldownKey })
    total = mergeResults(total, { alerts: inserted.length, ...sent })
    if (follows.length < batchSize) break
  }
  return total
}

/**
 * A loot just entered its ending-soon window: nudge savers who haven't claimed, and remind
 * holders of an unused code to redeem it.
 * @param {string} lootId
 * @param {{ push: object }} deps
 */
export async function fanOutEndingSoon(lootId, deps, now = new Date()) {
  const loot = await Loot.findOne({ _id: lootId, status: 'expiring', expiryAt: { $gt: now } })
  if (!loot) return EMPTY

  const [saves, claims] = await Promise.all([
    Save.find({ lootId: loot._id }).select('userId').lean(),
    Claim.find({ lootId: loot._id }).select('userId status expiresAt').lean(),
  ])
  const claimed = new Set(claims.map((c) => c.userId.toString()))
  const base = { lootId: loot._id, businessId: loot.businessId, imageUrl: lootImage(loot) }

  const endingSoon = saves
    .filter((s) => !claimed.has(s.userId.toString()))
    .map((s) => ({
      ...base,
      userId: s.userId,
      type: 'loot_ending_soon',
      title: `Ending soon: ${loot.title}`,
      body: `You saved this. It ends in ${timeLeft(loot.expiryAt, now.getTime())}, claim it before it's gone.`,
    }))
  const reminders = claims
    .filter((c) => c.status === 'issued' && c.expiresAt > now)
    .map((c) => ({
      ...base,
      userId: c.userId,
      type: 'redemption_reminder',
      title: `Use your code: ${loot.title}`,
      body: `Your code expires in ${timeLeft(c.expiresAt, now.getTime())}. Show it at ${loot.locationName}.`,
    }))

  const inserted = await insertNewAlerts([...endingSoon, ...reminders])
  const sent = await pushAlerts(inserted, deps)
  return { alerts: inserted.length, ...sent }
}
