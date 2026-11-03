import { FollowingFeedQuery, NearbyFeedQuery, TrendingFeedQuery, haversineKm } from '@loot/shared'
import { Router } from 'express'
import { decodeCursor, paginate } from '../../lib/cursor.js'
import { badRequest } from '../../lib/errors.js'
import { parseObjectId } from '../../lib/ids.js'
import { getAuth } from '../../middleware/auth.js'
import { validateQuery } from '../../middleware/validate.js'
import { Follow } from '../businesses/follow.model.js'
import { toFeedItems } from '../loot/loot.hydrate.js'
import { Loot, liveLootFilter } from '../loot/loot.model.js'
import { scoreExpression } from './score.js'

const invalidCursor = () => badRequest('invalid_cursor', 'Pagination cursor is invalid')

/** Keyset filter for the next page of a list sorted by { [field]: -1, _id: -1 }. */
function seekAfter(field, value, id) {
  const _id = { $lt: parseObjectId(id, invalidCursor) }
  return { $or: [{ [field]: { $lt: value } }, { [field]: value, _id }] }
}

/**
 * $geoNear stage: live, unexpired loot within the radius (and within each loot's own
 * visibility radius), using the { location: 2dsphere, status, expiryAt } index.
 */
function nearStages({ latitude, longitude, radiusKm, category }, now, extraFilter = {}) {
  return [
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [longitude, latitude] },
        key: 'location',
        distanceField: 'distanceMeters',
        maxDistance: radiusKm * 1000,
        spherical: true,
        query: { ...liveLootFilter(now), ...(category ? { category } : {}), ...extraFilter },
      },
    },
    { $match: { $expr: { $lte: ['$distanceMeters', { $multiply: ['$visibilityRadiusKm', 1000] }] } } },
  ]
}

const toKm = (loot) => Math.round(loot.distanceMeters) / 1000

async function respond(req, res, rows, limit, cursorOf) {
  const { page, cursor } = paginate(rows, limit, cursorOf)
  const items = await toFeedItems(page, { userId: req.auth?.userId, distanceKm: toKm })
  res.json({ items, cursor })
}

export function createFeedRouter({ guards }) {
  const router = Router()

  // Ranked: distance, freshness, urgency, engagement velocity, trending (see @loot/shared scoreLoot).
  // The cursor pins `asOf`, so every page is scored against the same clock and pages don't overlap.
  router.get('/nearby', guards.optionalAuth, validateQuery(NearbyFeedQuery), async (req, res) => {
    const query = req.parsedQuery
    const now = new Date()
    const after = decodeCursor(query.cursor)
    if (after && (typeof after.asOf !== 'number' || typeof after.score !== 'number')) throw invalidCursor()
    const asOf = after?.asOf ?? now.getTime()

    const rows = await Loot.aggregate([
      ...nearStages(query, now),
      { $addFields: { score: scoreExpression({ radiusKm: query.radiusKm, now: asOf }) } },
      ...(after ? [{ $match: seekAfter('score', after.score, after.id) }] : []),
      { $sort: { score: -1, _id: -1 } },
      { $limit: query.limit + 1 },
    ])

    await respond(req, res, rows, query.limit, (last) => ({ asOf, score: last.score, id: last._id.toString() }))
  })

  // Newest first within the radius.
  router.get('/fresh', guards.optionalAuth, validateQuery(NearbyFeedQuery), async (req, res) => {
    const query = req.parsedQuery
    const after = decodeCursor(query.cursor)
    const publishedBefore = after ? new Date(after.publishedAt) : null
    if (publishedBefore && Number.isNaN(publishedBefore.getTime())) throw invalidCursor()

    const rows = await Loot.aggregate([
      ...nearStages(query, new Date()),
      ...(after ? [{ $match: seekAfter('publishedAt', publishedBefore, after.id) }] : []),
      { $sort: { publishedAt: -1, _id: -1 } },
      { $limit: query.limit + 1 },
    ])

    await respond(req, res, rows, query.limit, (last) => ({
      publishedAt: last.publishedAt.toISOString(),
      id: last._id.toString(),
    }))
  })

  // Highest trending score first within the radius; only loot people are engaging with right now.
  // Scores move when the trending job runs, so a later page can occasionally repeat or skip an item.
  router.get('/trending', guards.optionalAuth, validateQuery(TrendingFeedQuery), async (req, res) => {
    const query = req.parsedQuery
    const after = decodeCursor(query.cursor)
    if (after && typeof after.score !== 'number') throw invalidCursor()

    const rows = await Loot.aggregate([
      ...nearStages(query, new Date(), { trendingScore: { $gt: 0 } }),
      ...(after ? [{ $match: seekAfter('trendingScore', after.score, after.id) }] : []),
      { $sort: { trendingScore: -1, _id: -1 } },
      { $limit: query.limit + 1 },
    ])

    await respond(req, res, rows, query.limit, (last) => ({ score: last.trendingScore, id: last._id.toString() }))
  })

  // Live loot from businesses the user follows, newest first, wherever they are.
  // Business accounts follow no one, so they get an empty list.
  router.get('/following', guards.auth, validateQuery(FollowingFeedQuery), async (req, res) => {
    const { userId } = getAuth(req)
    const query = req.parsedQuery
    const after = decodeCursor(query.cursor)
    const publishedBefore = after ? new Date(after.publishedAt) : null
    if (publishedBefore && Number.isNaN(publishedBefore.getTime())) throw invalidCursor()

    const follows = await Follow.find({ userId }).select('businessId').lean()
    if (follows.length === 0) return res.json({ items: [], cursor: null })

    const rows = await Loot.find({
      businessId: { $in: follows.map((f) => f.businessId) },
      ...liveLootFilter(),
      ...(query.category ? { category: query.category } : {}),
      ...(after ? seekAfter('publishedAt', publishedBefore, after.id) : {}),
    })
      .sort({ publishedAt: -1, _id: -1 })
      .limit(query.limit + 1)
      .lean()

    const { page, cursor } = paginate(rows, query.limit, (last) => ({
      publishedAt: last.publishedAt.toISOString(),
      id: last._id.toString(),
    }))
    const hasOrigin = query.latitude !== undefined
    const distanceKm = (loot) => {
      const [lng, lat] = loot.location.coordinates
      return Math.round(haversineKm(query.latitude, query.longitude, lat, lng) * 1000) / 1000
    }
    const items = await toFeedItems(page, { userId, distanceKm: hasOrigin ? distanceKm : undefined })
    res.json({ items, cursor })
  })

  return router
}
