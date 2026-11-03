import { PageQuery, PushTokenBody, RemovePushTokenBody } from '@loot/shared'
import { Router } from 'express'
import { decodeCursor, paginate } from '../../lib/cursor.js'
import { badRequest, notFound } from '../../lib/errors.js'
import { parseObjectId } from '../../lib/ids.js'
import { getAuth } from '../../middleware/auth.js'
import { validateBody, validateQuery } from '../../middleware/validate.js'
import { LootAlert, toLootAlert } from './alert.model.js'
import { PushToken } from './pushToken.model.js'

const alertNotFound = () => notFound('alert_not_found', 'Alert not found')

/** @param {{ auth: Function[] }} guards */
export function createAlertsRouter(guards) {
  const router = Router()

  // ---------------------------------------------------------------- push devices

  router.post('/me/push-tokens', guards.auth, validateBody(PushTokenBody), async (req, res) => {
    const { token, platform } = req.body
    await PushToken.updateOne({ token }, { userId: getAuth(req).userId, platform }, { upsert: true })
    res.status(204).end()
  })

  // Only the owner can remove a token, so knowing someone's token can't silence their pushes.
  router.delete('/me/push-tokens', guards.auth, validateBody(RemovePushTokenBody), async (req, res) => {
    await PushToken.deleteOne({ token: req.body.token, userId: getAuth(req).userId })
    res.status(204).end()
  })

  // ---------------------------------------------------------------- inbox

  router.get('/me/alerts', guards.auth, validateQuery(PageQuery), async (req, res) => {
    const { userId } = getAuth(req)
    const { cursor, limit } = req.parsedQuery
    const after = decodeCursor(cursor)
    const query = { userId }
    if (after) {
      query._id = { $lt: parseObjectId(after.id, () => badRequest('invalid_cursor', 'Pagination cursor is invalid')) }
    }
    const [rows, unreadCount] = await Promise.all([
      LootAlert.find(query)
        .sort({ _id: -1 })
        .limit(limit + 1)
        .lean(),
      LootAlert.countDocuments({ userId, readAt: null }),
    ])
    const { page, cursor: next } = paginate(rows, limit, (last) => ({ id: last._id.toString() }))
    res.json({ items: page.map(toLootAlert), cursor: next, unreadCount })
  })

  router.post('/me/alerts/read-all', guards.auth, async (req, res) => {
    const result = await LootAlert.updateMany({ userId: getAuth(req).userId, readAt: null }, { readAt: new Date() })
    res.json({ updated: result.modifiedCount })
  })

  router.post('/me/alerts/:alertId/read', guards.auth, async (req, res) => {
    const _id = parseObjectId(req.params.alertId, alertNotFound)
    const userId = getAuth(req).userId
    // Keep the first read time when it is marked read twice.
    const alert =
      (await LootAlert.findOneAndUpdate(
        { _id, userId, readAt: null },
        { readAt: new Date() },
        { returnDocument: 'after' },
      )) ?? (await LootAlert.findOne({ _id, userId }))
    if (!alert) throw alertNotFound()
    res.json({ alert: toLootAlert(alert) })
  })

  return router
}
