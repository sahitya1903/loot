import {
  BusinessLootQuery,
  CreateLootBody,
  LIVE_LOOT_STATUSES,
  MIN_LOOT_LIFETIME_MS,
  ShareBody,
  UpdateLootBody,
  ViewBody,
  checkLootRules,
} from '@loot/shared'
import { Router } from 'express'
import { decodeCursor, paginate } from '../../lib/cursor.js'
import { badRequest, conflict, forbidden, notFound } from '../../lib/errors.js'
import { parseObjectId } from '../../lib/ids.js'
import { validateBody, validateQuery } from '../../middleware/validate.js'
import { Business } from '../businesses/business.model.js'
import { liveStatusFor } from './lifecycle.js'
import { loadViewerStates, toFeedItems } from './loot.hydrate.js'
import { Loot, liveLootFilter } from './loot.model.js'
import { effectiveStatus, toLoot } from './loot.serialize.js'

export const lootNotFound = () => notFound('loot_not_found', 'Loot not found')

/** Location fields a loot copies from its branch. */
function branchFields(branch) {
  return {
    branchId: branch._id,
    location: { type: 'Point', coordinates: [...branch.location.coordinates] },
    geoHash: branch.geoHash,
    locationName: branch.name,
    address: branch.address,
    outletInfo: { hours: branch.hours, phone: branch.phone },
  }
}

function findBranch(business, branchId) {
  const branch = business.branches.id(branchId)
  if (!branch) {
    throw badRequest('branch_not_found', 'That branch is not one of your locations', [
      { path: 'branchId', message: 'Unknown branch' },
    ])
  }
  return branch
}

/** The caller's own loot. Other businesses' loot is indistinguishable from missing. */
async function ownLoot(req) {
  const lootId = parseObjectId(req.params.lootId, lootNotFound)
  const loot = await Loot.findOne({ _id: lootId, businessId: req.business._id })
  if (!loot) throw lootNotFound()
  return loot
}

async function isOwner(req, businessId) {
  if (!req.auth) return false
  return Boolean(await Business.exists({ _id: businessId, ownerUserId: req.auth.userId }))
}

/** Loot anyone may read: everything except other businesses' drafts. */
export async function visibleLoot(req) {
  const lootId = parseObjectId(req.params.lootId, lootNotFound)
  const loot = await Loot.findById(lootId)
  if (!loot) throw lootNotFound()
  if (loot.status === 'draft' && !(await isOwner(req, loot.businessId))) throw lootNotFound()
  return loot
}

/**
 * @param {object} deps
 * @param {{ auth: Function[], optionalAuth: Function, business: Function[] }} deps.guards
 * @param {{ scheduleLoot: (loot: object) => unknown }} deps.lifecycle
 * @param {{ lootCounters: Function, lootPublished: Function }} deps.realtime
 * @param {import('pino').Logger} deps.logger
 */
export function createLootRouter({ guards, lifecycle, realtime, logger }) {
  const router = Router()

  function schedule(loot) {
    Promise.resolve()
      .then(() => lifecycle.scheduleLoot(loot))
      .catch((err) =>
        logger.warn({ err, lootId: loot.id }, 'Could not schedule lifecycle jobs; the sweeper will catch up'),
      )
  }

  function published(loot) {
    schedule(loot)
    realtime.lootPublished(loot)
  }

  router.post('/', guards.business, validateBody(CreateLootBody), async (req, res) => {
    const { branchId, status, ...fields } = req.body
    const branch = findBranch(req.business, branchId)
    const now = Date.now()
    const live = status === 'active'

    const loot = await Loot.create({
      ...fields,
      ...branchFields(branch),
      businessId: req.business._id,
      status: live ? liveStatusFor(fields.expiryAt, now) : 'draft',
      publishedAt: live ? new Date(now) : undefined,
    })
    if (live) published(loot)
    res.status(201).json({ loot: toLoot(loot, req.business) })
  })

  router.patch('/:lootId', guards.business, validateBody(UpdateLootBody), async (req, res) => {
    const loot = await ownLoot(req)
    const editable = loot.status === 'draft' || effectiveStatus(loot) !== 'expired'
    if (!editable || loot.status === 'archived') {
      throw conflict('loot_not_editable', 'Expired or archived loot cannot be edited')
    }

    const changes = req.body
    const merged = (key) => (key in changes ? (changes[key] ?? undefined) : (loot[key] ?? undefined))
    const issues = []
    checkLootRules(
      {
        offerText: merged('offerText'),
        originalPrice: merged('originalPrice'),
        offerPrice: merged('offerPrice'),
        expiryAt: changes.expiryAt,
      },
      { addIssue: (issue) => issues.push({ path: issue.path.join('.'), message: issue.message }) },
    )
    if (issues.length) throw badRequest('validation_failed', 'Request is invalid', issues)

    const $set = {}
    const $unset = {}
    for (const [key, value] of Object.entries(changes)) {
      if (key === 'branchId') continue
      if (value === null && key !== 'totalQuantity') $unset[key] = ''
      else $set[key] = value
    }
    if (changes.branchId) Object.assign($set, branchFields(findBranch(req.business, changes.branchId)))
    const isLive = LIVE_LOOT_STATUSES.includes(loot.status)
    if (changes.expiryAt && isLive) $set.status = liveStatusFor(changes.expiryAt, Date.now(), loot.status)

    // Optimistic: the status must not have moved since we read it, and a new quantity can
    // never drop below what has already been claimed (checked atomically against claims).
    const filter = { _id: loot._id, status: loot.status }
    if (changes.totalQuantity != null) filter.claimCount = { $lte: changes.totalQuantity }
    const update = Object.keys($unset).length ? { $set, $unset } : { $set }
    const updated = await Loot.findOneAndUpdate(filter, update, { returnDocument: 'after', runValidators: true })

    if (!updated) {
      const fresh = await Loot.findById(loot._id).select('claimCount').lean()
      if (changes.totalQuantity != null && fresh && fresh.claimCount > changes.totalQuantity) {
        throw conflict('quantity_below_claims', `Already claimed ${fresh.claimCount} times`, {
          claimCount: fresh.claimCount,
        })
      }
      throw conflict('loot_changed', 'This loot changed while you were editing it, try again')
    }

    if (changes.expiryAt && isLive) schedule(updated)
    realtime.lootCounters(updated)
    res.json({ loot: toLoot(updated, req.business) })
  })

  router.post('/:lootId/publish', guards.business, async (req, res) => {
    const loot = await ownLoot(req)
    if (loot.status !== 'draft') throw conflict('loot_not_draft', 'Only drafts can be published')
    const now = Date.now()
    if (loot.expiryAt.getTime() < now + MIN_LOOT_LIFETIME_MS) {
      throw conflict('loot_expiry_too_soon', 'Set a later expiry before publishing')
    }
    const updated = await Loot.findOneAndUpdate(
      { _id: loot._id, status: 'draft' },
      { status: liveStatusFor(loot.expiryAt, now), publishedAt: new Date(now) },
      { returnDocument: 'after' },
    )
    if (!updated) throw conflict('loot_not_draft', 'Only drafts can be published')
    published(updated)
    res.json({ loot: toLoot(updated, req.business) })
  })

  router.post('/:lootId/archive', guards.business, async (req, res) => {
    const loot = await ownLoot(req)
    const updated = await Loot.findOneAndUpdate(
      { _id: loot._id, status: { $ne: 'archived' } },
      { status: 'archived', archivedAt: new Date() },
      { returnDocument: 'after' },
    )
    if (!updated) throw conflict('loot_already_archived', 'This loot is already archived')
    realtime.lootCounters(updated)
    res.json({ loot: toLoot(updated, req.business) })
  })

  router.get('/:lootId', guards.optionalAuth, async (req, res) => {
    const loot = await visibleLoot(req)
    const [business, viewers] = await Promise.all([
      Business.findById(loot.businessId).lean(),
      loadViewerStates(req.auth?.userId, [loot]),
    ])
    res.json({ loot: toLoot(loot, business, viewers?.get(loot.id)) })
  })

  router.get('/:lootId/media', guards.optionalAuth, async (req, res) => {
    const loot = await visibleLoot(req)
    res.json({
      urls: loot.media.map((m) => ({ url: m.url, thumbnailUrl: m.thumbnailUrl ?? null, mediaType: m.mediaType })),
    })
  })

  // Engagement counters. Fire-and-forget from the client; never fail the UI.
  router.post('/:lootId/views', guards.optionalAuth, validateBody(ViewBody), async (req, res) => {
    const lootId = parseObjectId(req.params.lootId, lootNotFound)
    await Loot.updateOne({ _id: lootId, ...liveLootFilter() }, { $inc: { viewCount: 1 } })
    res.status(204).end()
  })

  router.post('/:lootId/shares', guards.auth, validateBody(ShareBody), async (req, res) => {
    const lootId = parseObjectId(req.params.lootId, lootNotFound)
    const { matchedCount } = await Loot.updateOne(
      { _id: lootId, status: { $ne: 'draft' } },
      { $inc: { shareCount: 1 } },
    )
    if (!matchedCount) throw lootNotFound()
    res.status(204).end()
  })

  return router
}

/** GET /v1/businesses/:businessId/loot — public live loot, or any status for the owner. */
export function createBusinessLootRouter({ guards }) {
  const router = Router()

  router.get('/:businessId/loot', guards.optionalAuth, validateQuery(BusinessLootQuery), async (req, res) => {
    const businessId = parseObjectId(req.params.businessId, () => notFound('business_not_found', 'Business not found'))
    const { status, cursor, limit } = req.parsedQuery
    if (status !== 'all_active' && !(await isOwner(req, businessId))) {
      throw forbidden('not_owner', 'Only the business can list these loot')
    }

    const now = new Date()
    const statusFilter = {
      all_active: liveLootFilter(now),
      draft: { status: 'draft' },
      expired: { $or: [{ status: 'expired' }, { status: { $in: LIVE_LOOT_STATUSES }, expiryAt: { $lte: now } }] },
      archived: { status: 'archived' },
      all: {},
    }[status]

    const after = decodeCursor(cursor)
    const query = { businessId, ...statusFilter }
    if (after)
      query._id = { $lt: parseObjectId(after.id, () => badRequest('invalid_cursor', 'Pagination cursor is invalid')) }

    const rows = await Loot.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
    const { page, cursor: next } = paginate(rows, limit, (last) => ({ id: last.id }))
    res.json({ items: await toFeedItems(page, { userId: req.auth?.userId }), cursor: next })
  })

  return router
}
