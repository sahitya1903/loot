import { NearbyFeedQuery } from '@loot/shared'
import { Router } from 'express'
import { decodeCursor, paginate } from '../../lib/cursor.js'
import { badRequest } from '../../lib/errors.js'
import { parseObjectId } from '../../lib/ids.js'
import { validateQuery } from '../../middleware/validate.js'
import { toFeedItems } from '../loot/loot.hydrate.js'
import { Loot, liveLootFilter } from '../loot/loot.model.js'
import { scoreExpression } from './score.js'

const invalidCursor = () => badRequest('invalid_cursor', 'Pagination cursor is invalid')

/**
 * $geoNear stage: live, unexpired loot within the radius (and within each loot's own
 * visibility radius), using the { location: 2dsphere, status, expiryAt } index.
 */
function nearStages({ latitude, longitude, radiusKm, category }, now) {
  return [
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [longitude, latitude] },
        key: 'location',
        distanceField: 'distanceMeters',
        maxDistance: radiusKm * 1000,
        spherical: true,
        query: { ...liveLootFilter(now), ...(category ? { category } : {}) },
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
      ...(after
        ? [
            {
              $match: {
                $or: [
                  { score: { $lt: after.score } },
                  { score: after.score, _id: { $lt: parseObjectId(after.id, invalidCursor) } },
                ],
              },
            },
          ]
        : []),
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
      ...(after
        ? [
            {
              $match: {
                $or: [
                  { publishedAt: { $lt: publishedBefore } },
                  { publishedAt: publishedBefore, _id: { $lt: parseObjectId(after.id, invalidCursor) } },
                ],
              },
            },
          ]
        : []),
      { $sort: { publishedAt: -1, _id: -1 } },
      { $limit: query.limit + 1 },
    ])

    await respond(req, res, rows, query.limit, (last) => ({
      publishedAt: last.publishedAt.toISOString(),
      id: last._id.toString(),
    }))
  })

  return router
}
