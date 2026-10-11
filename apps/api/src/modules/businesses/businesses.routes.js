import { BranchBody, OnboardBusinessBody, UpdateBusinessBody } from '@loot/shared'
import { Router } from 'express'
import { conflict, notFound } from '../../lib/errors.js'
import { parseObjectId } from '../../lib/ids.js'
import { getAuth } from '../../middleware/auth.js'
import { validateBody } from '../../middleware/validate.js'
import { Loot, liveLootFilter } from '../loot/loot.model.js'
import { User } from '../users/user.model.js'
import { Business, MAX_BRANCHES, toBranchFields, toPublicBranch, toPublicBusiness } from './business.model.js'
import { Follow } from './follow.model.js'

const businessNotFound = () => notFound('business_not_found', 'Business not found')

function liveLootCount(businessId) {
  return Loot.countDocuments({ businessId, ...liveLootFilter() })
}

/** @param {{ auth: Function[], optionalAuth: Function, business: Function[], personal: Function[] }} guards */
export function createBusinessesRouter(guards) {
  const router = Router()

  // Onboarding: creates the caller's business and makes the account professional.
  router.post('/', guards.auth, validateBody(OnboardBusinessBody), async (req, res) => {
    const { userId } = getAuth(req)
    const { branch, ...fields } = req.body
    if (await Business.exists({ ownerUserId: userId })) {
      throw conflict('business_exists', 'This account already has a business')
    }

    let business
    try {
      business = await Business.create({ ...fields, ownerUserId: userId, branches: [toBranchFields(branch)] })
    } catch (err) {
      if (err.code === 11000 && err.keyPattern?.username) throw conflict('username_taken', 'That username is taken')
      if (err.code === 11000) throw conflict('business_exists', 'This account already has a business')
      throw err
    }
    await User.updateOne({ _id: userId }, { accountType: 'professional', businessId: business._id })
    res.status(201).json({ business: toPublicBusiness(business, 0) })
  })

  router.get('/me', guards.business, async (req, res) => {
    res.json({ business: toPublicBusiness(req.business, await liveLootCount(req.business._id)) })
  })

  router.patch('/me', guards.business, validateBody(UpdateBusinessBody), async (req, res) => {
    req.business.set(req.body)
    await req.business.save()
    res.json({ business: toPublicBusiness(req.business, await liveLootCount(req.business._id)) })
  })

  router.post('/me/branches', guards.business, validateBody(BranchBody), async (req, res) => {
    const branch = toBranchFields(req.body)
    // Conditional push so concurrent adds can't exceed the cap.
    const updated = await Business.findOneAndUpdate(
      { _id: req.business._id, [`branches.${MAX_BRANCHES - 1}`]: { $exists: false } },
      { $push: { branches: branch } },
      { returnDocument: 'after' },
    )
    if (!updated) throw conflict('branch_limit_reached', `A business can have at most ${MAX_BRANCHES} branches`)
    res.status(201).json({ branch: toPublicBranch(updated.branches[updated.branches.length - 1]) })
  })

  router.delete('/me/branches/:branchId', guards.business, async (req, res) => {
    const branchNotFound = () => notFound('branch_not_found', 'Branch not found')
    const branchId = parseObjectId(req.params.branchId, branchNotFound)
    if (!req.business.branches.id(branchId)) throw branchNotFound()
    if (req.business.branches.length === 1) throw conflict('last_branch', 'A business needs at least one branch')
    if (await Loot.exists({ branchId, ...liveLootFilter() })) {
      throw conflict('branch_in_use', 'Archive or wait out the live loot at this branch first')
    }
    await Business.updateOne({ _id: req.business._id }, { $pull: { branches: { _id: branchId } } })
    res.status(204).end()
  })

  router.get('/:businessId', guards.optionalAuth, async (req, res) => {
    const businessId = parseObjectId(req.params.businessId, businessNotFound)
    const business = await Business.findById(businessId)
    if (!business) throw businessNotFound()
    const userId = req.auth?.userId
    const [lootCount, isFollowing] = await Promise.all([
      liveLootCount(businessId),
      userId ? Follow.exists({ userId, businessId }).then(Boolean) : false,
    ])
    res.json({ business: toPublicBusiness(business, lootCount), isFollowing })
  })

  router.put('/:businessId/follow', guards.personal, async (req, res) => {
    const { userId } = getAuth(req)
    const businessId = parseObjectId(req.params.businessId, businessNotFound)
    if (!(await Business.exists({ _id: businessId }))) throw businessNotFound()
    try {
      const result = await Follow.updateOne(
        { userId, businessId },
        { $setOnInsert: { userId, businessId } },
        { upsert: true },
      )
      if (result.upsertedCount) {
        await Promise.all([
          Business.updateOne({ _id: businessId }, { $inc: { followersCount: 1 } }),
          User.updateOne({ _id: userId }, { $inc: { followingCount: 1 } }),
        ])
      }
    } catch (err) {
      if (err.code !== 11000) throw err // a concurrent follow won the upsert race
    }
    res.json({ isFollowing: true })
  })

  router.delete('/:businessId/follow', guards.personal, async (req, res) => {
    const { userId } = getAuth(req)
    const businessId = parseObjectId(req.params.businessId, businessNotFound)
    const { deletedCount } = await Follow.deleteOne({ userId, businessId })
    if (deletedCount) {
      await Promise.all([
        Business.updateOne({ _id: businessId }, { $inc: { followersCount: -1 } }),
        User.updateOne({ _id: userId }, { $inc: { followingCount: -1 } }),
      ])
    }
    res.json({ isFollowing: false })
  })

  return router
}
