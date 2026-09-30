import { Router, type RequestHandler } from 'express'
import { unauthorized } from '../../lib/errors.js'
import { getAuth } from '../../middleware/auth.js'
import { User, toPublicUser } from './user.model.js'

export function createUsersRouter(requireAuth: RequestHandler): Router {
  const router = Router()

  router.get('/me', requireAuth, async (req, res) => {
    const user = await User.findById(getAuth(req).userId)
    if (!user) throw unauthorized('user_not_found', 'Account no longer exists')
    res.json({ user: toPublicUser(user) })
  })

  return router
}
