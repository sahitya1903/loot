import { AccountTypeBody, UpdateProfileBody } from '@loot/shared'
import { Router } from 'express'
import { conflict, unauthorized } from '../../lib/errors.js'
import { getAuth } from '../../middleware/auth.js'
import { validateBody } from '../../middleware/validate.js'
import { User, toPublicUser } from './user.model.js'

async function updateMe(req, changes) {
  try {
    const user = await User.findByIdAndUpdate(getAuth(req).userId, changes, {
      returnDocument: 'after',
      runValidators: true,
    })
    if (!user) throw unauthorized('user_not_found', 'Account no longer exists')
    return user
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.username) throw conflict('username_taken', 'That username is taken')
    throw err
  }
}

export function createUsersRouter(requireAuth) {
  const router = Router()

  router.get('/me', requireAuth, async (req, res) => {
    const user = await User.findById(getAuth(req).userId)
    if (!user) throw unauthorized('user_not_found', 'Account no longer exists')
    res.json({ user: toPublicUser(user) })
  })

  router.patch('/me', requireAuth, validateBody(UpdateProfileBody), async (req, res) => {
    res.json({ user: toPublicUser(await updateMe(req, req.body)) })
  })

  // First onboarding step. Choosing `professional` here only records intent: creating loot
  // still needs a business profile (POST /v1/businesses), which also sets this.
  router.put('/me/account-type', requireAuth, validateBody(AccountTypeBody), async (req, res) => {
    res.json({ user: toPublicUser(await updateMe(req, { accountType: req.body.accountType })) })
  })

  return router
}
