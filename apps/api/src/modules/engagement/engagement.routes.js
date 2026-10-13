import { PageQuery, RedeemBody } from '@loot/shared'
import { Router } from 'express'
import { decodeCursor, paginate } from '../../lib/cursor.js'
import { badRequest, conflict, gone, notFound } from '../../lib/errors.js'
import { parseObjectId } from '../../lib/ids.js'
import { getAuth } from '../../middleware/auth.js'
import { rateLimit } from '../../middleware/rateLimit.js'
import { validateBody, validateQuery } from '../../middleware/validate.js'
import { Business } from '../businesses/business.model.js'
import { toFeedItems } from '../loot/loot.hydrate.js'
import { Loot, liveLootFilter } from '../loot/loot.model.js'
import { lootNotFound, visibleLoot } from '../loot/loot.routes.js'
import { effectiveStatus, toFeedItem } from '../loot/loot.serialize.js'
import { User } from '../users/user.model.js'
import { Claim, generateRedemptionCode, toRedemption } from './claim.model.js'
import { Save } from './save.model.js'

/** A redemption stays usable until the loot expires, but never less than this after claiming. */
export const MIN_REDEMPTION_WINDOW_MS = 60 * 60_000

const CODE_ATTEMPTS = 5

/** Explains why a loot can't be claimed or saved right now. */
function unavailable(loot) {
  if (!loot || loot.status === 'draft') return lootNotFound()
  if (loot.status === 'archived') return conflict('loot_not_claimable', 'This loot is no longer available')
  if (effectiveStatus(loot) === 'expired') return gone('loot_expired', 'This loot has expired')
  return conflict('loot_sold_out', 'This loot is sold out')
}

async function pageOf(Model, userId, { cursor, limit }) {
  const after = decodeCursor(cursor)
  const query = { userId }
  if (after)
    query._id = { $lt: parseObjectId(after.id, () => badRequest('invalid_cursor', 'Pagination cursor is invalid')) }
  const rows = await Model.find(query)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean()
  return paginate(rows, limit, (last) => ({ id: last._id.toString() }))
}

/** Loot for a list of saves/claims, in the same order. */
async function lootFor(rows) {
  const loots = await Loot.find({ _id: { $in: rows.map((r) => r.lootId) } })
  const byId = new Map(loots.map((l) => [l.id, l]))
  return rows.map((r) => byId.get(r.lootId.toString())).filter(Boolean)
}

/**
 * @param {object} deps
 * @param {{ personal: Function[], business: Function[], auth: Function[] }} deps.guards
 * @param {import('ioredis').Redis} deps.redis
 * @param {{ lootCounters: Function, redemptionUpdated: Function }} deps.realtime
 */
export function createEngagementRouter({ guards, redis, realtime }) {
  const router = Router()

  // ---------------------------------------------------------------- save

  router.put('/loot/:lootId/save', guards.personal, async (req, res) => {
    const { userId } = getAuth(req)
    const lootId = parseObjectId(req.params.lootId, lootNotFound)
    const loot = await Loot.findOne({ _id: lootId, ...liveLootFilter() }).select('_id')
    if (!loot) throw unavailable(await Loot.findById(lootId))

    let inserted = false
    try {
      const result = await Save.updateOne({ userId, lootId }, { $setOnInsert: { userId, lootId } }, { upsert: true })
      inserted = result.upsertedCount === 1
    } catch (err) {
      if (err.code !== 11000) throw err // a concurrent save won the upsert race: already saved
    }

    let current = await Loot.findById(lootId)
    if (inserted) {
      ;[current] = await Promise.all([
        Loot.findByIdAndUpdate(lootId, { $inc: { saveCount: 1 } }, { returnDocument: 'after' }),
        User.updateOne({ _id: userId }, { $inc: { savesCount: 1 } }),
      ])
      realtime.lootCounters(current)
    }
    res.json({ saved: true, saveCount: current.saveCount })
  })

  router.delete('/loot/:lootId/save', guards.personal, async (req, res) => {
    const { userId } = getAuth(req)
    const lootId = parseObjectId(req.params.lootId, lootNotFound)
    const { deletedCount } = await Save.deleteOne({ userId, lootId })

    let current = await Loot.findById(lootId)
    if (!current) throw lootNotFound()
    if (deletedCount) {
      ;[current] = await Promise.all([
        Loot.findByIdAndUpdate(lootId, { $inc: { saveCount: -1 } }, { returnDocument: 'after' }),
        User.updateOne({ _id: userId }, { $inc: { savesCount: -1 } }),
      ])
      realtime.lootCounters(current)
    }
    res.json({ saved: false, saveCount: current.saveCount })
  })

  router.get('/me/saved', guards.personal, validateQuery(PageQuery), async (req, res) => {
    const { userId } = getAuth(req)
    const { page, cursor } = await pageOf(Save, userId, req.parsedQuery)
    res.json({ items: await toFeedItems(await lootFor(page), { userId }), cursor })
  })

  // ---------------------------------------------------------------- claim

  router.post(
    '/loot/:lootId/claim',
    guards.personal,
    rateLimit(redis, { name: 'claim-user', limit: 30, windowSeconds: 60, key: (req) => req.auth?.userId }),
    async (req, res) => {
      const { userId } = getAuth(req)
      const lootId = parseObjectId(req.params.lootId, lootNotFound)

      // Idempotent: a retried claim returns the code already issued.
      const existing = await Claim.findOne({ userId, lootId })
      if (existing) return res.json({ redemption: toRedemption(existing) })

      // Reserve one unit atomically. The filter is the whole rule: live, unexpired, stock left.
      const now = new Date()
      const loot = await Loot.findOneAndUpdate(
        {
          _id: lootId,
          ...liveLootFilter(now),
          $or: [{ totalQuantity: null }, { $expr: { $lt: ['$claimCount', '$totalQuantity'] } }],
        },
        { $inc: { claimCount: 1 } },
        { returnDocument: 'after' },
      )
      if (!loot) throw unavailable(await Loot.findById(lootId))

      const release = () => Loot.updateOne({ _id: lootId }, { $inc: { claimCount: -1 } })
      const expiresAt = new Date(Math.max(loot.expiryAt.getTime(), now.getTime() + MIN_REDEMPTION_WINDOW_MS))

      let claim
      for (let attempt = 0; !claim; attempt++) {
        try {
          claim = await Claim.create({
            userId,
            lootId,
            businessId: loot.businessId,
            branchId: loot.branchId,
            redemptionType: loot.redemptionType,
            code: generateRedemptionCode(),
            expiresAt,
          })
        } catch (err) {
          const codeClash = err.code === 11000 && err.keyPattern?.code
          if (codeClash && attempt < CODE_ATTEMPTS) continue
          await release()
          // A parallel request from the same user claimed first: hand back that claim.
          if (err.code === 11000 && !codeClash) {
            const winner = await Claim.findOne({ userId, lootId })
            if (winner) return res.json({ redemption: toRedemption(winner) })
          }
          throw err
        }
      }

      await Promise.all([
        User.updateOne({ _id: userId }, { $inc: { claimsCount: 1 } }),
        Business.updateOne({ _id: loot.businessId }, { $inc: { totalClaimsCount: 1 } }),
      ])
      realtime.lootCounters(loot)
      res.status(201).json({ redemption: toRedemption(claim) })
    },
  )

  router.get('/loot/:lootId/redemption', guards.auth, async (req, res) => {
    const { userId } = getAuth(req)
    const loot = await visibleLoot(req)
    const claim = await Claim.findOne({ userId, lootId: loot._id })
    res.json({ redemption: claim ? toRedemption(claim) : null })
  })

  router.get('/me/claims', guards.personal, validateQuery(PageQuery), async (req, res) => {
    const { userId } = getAuth(req)
    const { page, cursor } = await pageOf(Claim, userId, req.parsedQuery)
    const loots = await lootFor(page)
    const items = await toFeedItems(loots, { userId })
    const claimByLoot = new Map(page.map((c) => [c.lootId.toString(), c]))
    res.json({
      items: items.map((item) => ({ ...item, redemption: toRedemption(claimByLoot.get(item.id)) })),
      cursor,
    })
  })

  // ---------------------------------------------------------------- redeem (business side)

  router.post('/businesses/me/redemptions', guards.business, validateBody(RedeemBody), async (req, res) => {
    const { userId } = getAuth(req)
    const { code } = req.body
    const businessId = req.business._id
    const now = new Date()

    // Single atomic transition issued → used; a second redeem can never match.
    const claim = await Claim.findOneAndUpdate(
      { code, businessId, status: 'issued', expiresAt: { $gt: now } },
      { status: 'used', usedAt: now, redeemedByUserId: userId },
      { returnDocument: 'after' },
    )
    if (!claim) {
      // Codes from other businesses look exactly like unknown codes.
      const found = await Claim.findOne({ code, businessId })
      if (!found) throw notFound('redemption_not_found', 'No redemption with that code at your business')
      if (found.status === 'used') {
        throw conflict('redemption_already_used', 'This code has already been redeemed', {
          usedAt: found.usedAt?.toISOString(),
        })
      }
      throw gone('redemption_expired', 'This code has expired')
    }

    const loot = await Loot.findByIdAndUpdate(claim.lootId, { $inc: { redeemedCount: 1 } }, { returnDocument: 'after' })
    realtime.redemptionUpdated(claim)
    res.json({ redemption: toRedemption(claim), loot: toFeedItem(loot, req.business) })
  })

  return router
}
