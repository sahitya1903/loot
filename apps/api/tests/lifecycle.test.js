import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { expireLoot, markLootExpiring, sweepLootLifecycle } from '../src/modules/loot/lifecycle.js'
import { Loot } from '../src/modules/loot/loot.model.js'
import { createLoot, signIn, signInBusiness, startTestServer } from './helpers.js'

let server

beforeAll(async () => {
  server = await startTestServer()
})
beforeEach(() => server.reset())
afterAll(() => server.stop())

const HOUR = 3600_000

describe('loot lifecycle', () => {
  it('sweeps due loot to expiring and expired, once', async () => {
    const biz = await signInBusiness(server)
    const calm = await createLoot(server, biz, { expiryAt: new Date(Date.now() + 10 * HOUR).toISOString() })
    const soon = await createLoot(server, biz, { expiryAt: new Date(Date.now() + 10 * HOUR).toISOString() })
    const over = await createLoot(server, biz, { expiryAt: new Date(Date.now() + 10 * HOUR).toISOString() })
    const draft = await createLoot(server, biz, { status: 'draft' })
    await Loot.updateOne({ _id: soon.id }, { expiryAt: new Date(Date.now() + HOUR) })
    await Loot.updateOne({ _id: over.id }, { expiryAt: new Date(Date.now() - 1000) })
    await Loot.updateOne({ _id: draft.id }, { expiryAt: new Date(Date.now() - 1000) })

    const result = await sweepLootLifecycle()
    expect(result.expired.map((l) => l.id)).toEqual([over.id])
    expect(result.expiring.map((l) => l.id)).toEqual([soon.id])

    const status = async (id) => (await Loot.findById(id).lean()).status
    expect(await status(calm.id)).toBe('active')
    expect(await status(soon.id)).toBe('expiring')
    expect(await status(over.id)).toBe('expired')
    expect(await status(draft.id)).toBe('draft') // drafts never go live by expiring
    expect((await Loot.findById(over.id).lean()).expiredAt).toBeInstanceOf(Date)

    expect(await sweepLootLifecycle()).toEqual({ expired: [], expiring: [] })
  })

  it('job handlers are no-ops when they run early or twice', async () => {
    const biz = await signInBusiness(server)
    const loot = await createLoot(server, biz)
    expect(await expireLoot(loot.id)).toBeNull()
    expect(await markLootExpiring(loot.id)).toBeNull()

    await Loot.updateOne({ _id: loot.id }, { expiryAt: new Date(Date.now() - 1000) })
    expect((await expireLoot(loot.id)).status).toBe('expired')
    expect(await expireLoot(loot.id)).toBeNull()
  })

  it('keeps expired loot (no TTL) and its claims for history', async () => {
    const biz = await signInBusiness(server)
    const loot = await createLoot(server, biz)
    const user = await signIn(server)
    await request(server.app)
      .post(`/v1/loot/${loot.id}/claim`)
      .set(...user.auth)
      .expect(201)
    await Loot.updateOne({ _id: loot.id }, { expiryAt: new Date(Date.now() - 1000) })
    await sweepLootLifecycle()

    const indexes = await Loot.collection.indexes()
    expect(indexes.some((index) => index.expireAfterSeconds !== undefined)).toBe(false)
    const claims = await request(server.app)
      .get('/v1/me/claims')
      .set(...user.auth)
      .expect(200)
    expect(claims.body.items[0]).toMatchObject({ id: loot.id, status: 'expired' })
  })
})

describe('profile', () => {
  it('updates the profile and keeps usernames unique', async () => {
    const a = await signIn(server)
    const b = await signIn(server)
    const res = await request(server.app)
      .patch('/v1/me')
      .set(...a.auth)
      .send({ name: 'Asha', username: 'Asha_K', interests: ['food_drink'] })
      .expect(200)
    expect(res.body.user).toMatchObject({ name: 'Asha', username: 'asha_k', interests: ['food_drink'] })

    const taken = await request(server.app)
      .patch('/v1/me')
      .set(...b.auth)
      .send({ username: 'asha_k' })
      .expect(409)
    expect(taken.body.error.code).toBe('username_taken')
  })

  it('rejects fields the user may not set', async () => {
    const a = await signIn(server)
    await request(server.app)
      .patch('/v1/me')
      .set(...a.auth)
      .send({ accountType: 'professional' })
      .expect(400)
    await request(server.app)
      .patch('/v1/me')
      .set(...a.auth)
      .send({ claimsCount: 100 })
      .expect(400)
  })

  it('echoes a request id on every response', async () => {
    const res = await request(server.app).get('/health').set('X-Request-Id', 'trace-123').expect(200)
    expect(res.headers['x-request-id']).toBe('trace-123')
    const minted = await request(server.app).get('/health').expect(200)
    expect(minted.headers['x-request-id']).toMatch(/^[\w-]{36}$/)
  })
})
