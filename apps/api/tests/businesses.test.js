import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { Loot } from '../src/modules/loot/loot.model.js'
import { User } from '../src/modules/users/user.model.js'
import { ORIGIN, createLoot, lootBody, north, signIn, signInBusiness, startTestServer } from './helpers.js'

let server

beforeAll(async () => {
  server = await startTestServer()
})
beforeEach(() => server.reset())
afterAll(() => server.stop())

const onboardBody = (overrides = {}) => ({
  businessName: 'Third Wave Cafe',
  username: 'thirdwave',
  category: 'cafe',
  branch: { name: 'Indiranagar', address: '100ft Road', ...ORIGIN },
  ...overrides,
})

describe('business onboarding', () => {
  it('creates the business with its first branch and makes the account professional', async () => {
    const session = await signIn(server)
    const res = await request(server.app)
      .post('/v1/businesses')
      .set(...session.auth)
      .send(onboardBody())
      .expect(201)

    expect(res.body.business).toMatchObject({
      businessName: 'Third Wave Cafe',
      username: 'thirdwave',
      ownerUserId: session.user.userId,
      lootCount: 0,
    })
    expect(res.body.business.branchLocations).toHaveLength(1)
    expect(res.body.business.branchLocations[0]).toMatchObject({ name: 'Indiranagar', ...ORIGIN })

    const user = await User.findById(session.user.userId).lean()
    expect(user.accountType).toBe('professional')
    expect(user.businessId.toString()).toBe(res.body.business.businessId)
  })

  it('allows one business per account and unique usernames', async () => {
    const first = await signIn(server)
    await request(server.app)
      .post('/v1/businesses')
      .set(...first.auth)
      .send(onboardBody())
      .expect(201)

    const again = await request(server.app)
      .post('/v1/businesses')
      .set(...first.auth)
      .send(onboardBody({ username: 'other' }))
    expect(again.status).toBe(409)
    expect(again.body.error.code).toBe('business_exists')

    const second = await signIn(server)
    const taken = await request(server.app)
      .post('/v1/businesses')
      .set(...second.auth)
      .send(onboardBody())
    expect(taken.status).toBe(409)
    expect(taken.body.error.code).toBe('username_taken')
  })

  it('validates the body', async () => {
    const session = await signIn(server)
    const res = await request(server.app)
      .post('/v1/businesses')
      .set(...session.auth)
      .send(onboardBody({ category: 'spaceship', branch: { name: 'X', address: 'Y', latitude: 200, longitude: 0 } }))
      .expect(400)
    expect(res.body.error.code).toBe('validation_failed')
    expect(res.body.error.details.map((d) => d.path)).toEqual(expect.arrayContaining(['category', 'branch.latitude']))
  })

  it('requires sign-in', async () => {
    const res = await request(server.app).post('/v1/businesses').send(onboardBody()).expect(401)
    expect(res.body.error.code).toBe('unauthorized')
  })
})

describe('loot write access', () => {
  it('rejects anonymous, personal, and professional-without-business callers', async () => {
    await request(server.app)
      .post('/v1/loot')
      .send(lootBody('a'.repeat(24)))
      .expect(401)

    const personal = await signIn(server)
    const asPersonal = await request(server.app)
      .post('/v1/loot')
      .set(...personal.auth)
      .send(lootBody('a'.repeat(24)))
    expect(asPersonal.status).toBe(403)
    expect(asPersonal.body.error.code).toBe('account_type_required')

    const pro = await signIn(server)
    await request(server.app)
      .put('/v1/me/account-type')
      .set(...pro.auth)
      .send({ accountType: 'professional' })
      .expect(200)
    const noBusiness = await request(server.app)
      .post('/v1/loot')
      .set(...pro.auth)
      .send(lootBody('a'.repeat(24)))
    expect(noBusiness.status).toBe(409)
    expect(noBusiness.body.error.code).toBe('business_profile_required')
  })
})

describe('my business and branches', () => {
  it('reads and updates the caller’s own business', async () => {
    const biz = await signInBusiness(server)
    await createLoot(server, biz)

    const mine = await request(server.app)
      .get('/v1/businesses/me')
      .set(...biz.auth)
      .expect(200)
    expect(mine.body.business.lootCount).toBe(1)

    const updated = await request(server.app)
      .patch('/v1/businesses/me')
      .set(...biz.auth)
      .send({ about: 'Specialty coffee' })
      .expect(200)
    expect(updated.body.business.about).toBe('Specialty coffee')

    // Ownership can't be reassigned through the body.
    await request(server.app)
      .patch('/v1/businesses/me')
      .set(...biz.auth)
      .send({ ownerUserId: 'a'.repeat(24) })
      .expect(400)
  })

  it('adds and removes branches, keeping at least one and protecting live loot', async () => {
    const biz = await signInBusiness(server)
    const added = await request(server.app)
      .post('/v1/businesses/me/branches')
      .set(...biz.auth)
      .send({ name: 'Koramangala', address: '80ft Road', ...north(5) })
      .expect(201)
    const secondId = added.body.branch.branchId

    await createLoot(server, { ...biz, branchId: secondId })
    const inUse = await request(server.app)
      .delete(`/v1/businesses/me/branches/${secondId}`)
      .set(...biz.auth)
    expect(inUse.status).toBe(409)
    expect(inUse.body.error.code).toBe('branch_in_use')

    await Loot.updateMany({}, { status: 'archived' })
    await request(server.app)
      .delete(`/v1/businesses/me/branches/${secondId}`)
      .set(...biz.auth)
      .expect(204)

    const last = await request(server.app)
      .delete(`/v1/businesses/me/branches/${biz.branchId}`)
      .set(...biz.auth)
    expect(last.status).toBe(409)
    expect(last.body.error.code).toBe('last_branch')
  })
})

describe('public business profile and follows', () => {
  it('shows the profile and follows idempotently', async () => {
    const biz = await signInBusiness(server)
    const fan = await signIn(server)
    const path = `/v1/businesses/${biz.business.businessId}`

    const anon = await request(server.app).get(path).expect(200)
    expect(anon.body).toMatchObject({ isFollowing: false, business: { username: biz.business.username } })

    await request(server.app)
      .put(`${path}/follow`)
      .set(...fan.auth)
      .expect(200)
    await request(server.app)
      .put(`${path}/follow`)
      .set(...fan.auth)
      .expect(200)
    const followed = await request(server.app)
      .get(path)
      .set(...fan.auth)
      .expect(200)
    expect(followed.body.isFollowing).toBe(true)
    expect(followed.body.business.followersCount).toBe(1)

    await request(server.app)
      .delete(`${path}/follow`)
      .set(...fan.auth)
      .expect(200)
    await request(server.app)
      .delete(`${path}/follow`)
      .set(...fan.auth)
      .expect(200)
    const unfollowed = await request(server.app)
      .get(path)
      .set(...fan.auth)
      .expect(200)
    expect(unfollowed.body.business.followersCount).toBe(0)
  })

  it('only lets personal accounts follow, and 404s unknown businesses', async () => {
    const biz = await signInBusiness(server)
    const other = await signInBusiness(server)
    const res = await request(server.app)
      .put(`/v1/businesses/${other.business.businessId}/follow`)
      .set(...biz.auth)
    expect(res.status).toBe(403)

    await request(server.app).get('/v1/businesses/not-an-id').expect(404)
    await request(server.app)
      .get(`/v1/businesses/${'a'.repeat(24)}`)
      .expect(404)
  })
})
