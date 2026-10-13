import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { Claim } from '../src/modules/engagement/claim.model.js'
import { MIN_REDEMPTION_WINDOW_MS } from '../src/modules/engagement/engagement.routes.js'
import { Loot } from '../src/modules/loot/loot.model.js'
import { User } from '../src/modules/users/user.model.js'
import { createLoot, signIn, signInBusiness, startTestServer } from './helpers.js'

let server

beforeAll(async () => {
  server = await startTestServer()
})
beforeEach(() => server.reset())
afterAll(() => server.stop())

const claim = (user, lootId) =>
  request(server.app)
    .post(`/v1/loot/${lootId}/claim`)
    .set(...user.auth)
const redeem = (biz, code) =>
  request(server.app)
    .post('/v1/businesses/me/redemptions')
    .set(...biz.auth)
    .send({ code })

describe('saves', () => {
  it('saves and unsaves idempotently, counting once', async () => {
    const biz = await signInBusiness(server)
    const loot = await createLoot(server, biz)
    const user = await signIn(server)
    const path = `/v1/loot/${loot.id}/save`

    expect(
      (
        await request(server.app)
          .put(path)
          .set(...user.auth)
          .expect(200)
      ).body,
    ).toEqual({ saved: true, saveCount: 1 })
    expect(
      (
        await request(server.app)
          .put(path)
          .set(...user.auth)
          .expect(200)
      ).body,
    ).toEqual({ saved: true, saveCount: 1 })

    const saved = await request(server.app)
      .get('/v1/me/saved')
      .set(...user.auth)
      .expect(200)
    expect(saved.body.items.map((i) => i.id)).toEqual([loot.id])
    expect(saved.body.items[0].viewer).toEqual({ saved: true, claimed: false })

    expect(
      (
        await request(server.app)
          .delete(path)
          .set(...user.auth)
          .expect(200)
      ).body,
    ).toEqual({ saved: false, saveCount: 0 })
    expect(
      (
        await request(server.app)
          .delete(path)
          .set(...user.auth)
          .expect(200)
      ).body,
    ).toEqual({ saved: false, saveCount: 0 })
    expect((await User.findById(user.user.userId).lean()).savesCount).toBe(0)
  })

  it('survives concurrent saves from one user', async () => {
    const biz = await signInBusiness(server)
    const loot = await createLoot(server, biz)
    const user = await signIn(server)
    await Promise.all(
      Array.from({ length: 5 }, () =>
        request(server.app)
          .put(`/v1/loot/${loot.id}/save`)
          .set(...user.auth)
          .expect(200),
      ),
    )
    expect((await Loot.findById(loot.id).lean()).saveCount).toBe(1)
  })

  it('is for personal accounts, on live loot only', async () => {
    const biz = await signInBusiness(server)
    const loot = await createLoot(server, biz)
    await request(server.app).put(`/v1/loot/${loot.id}/save`).expect(401)
    await request(server.app)
      .put(`/v1/loot/${loot.id}/save`)
      .set(...biz.auth)
      .expect(403)

    const user = await signIn(server)
    await Loot.updateOne({ _id: loot.id }, { expiryAt: new Date(Date.now() - 1000) })
    const res = await request(server.app)
      .put(`/v1/loot/${loot.id}/save`)
      .set(...user.auth)
      .expect(410)
    expect(res.body.error.code).toBe('loot_expired')
  })
})

describe('claims', () => {
  it('issues one redemption code per user and returns it again on retry', async () => {
    const biz = await signInBusiness(server)
    const loot = await createLoot(server, biz, { totalQuantity: 5 })
    const user = await signIn(server)

    const first = await claim(user, loot.id).expect(201)
    const { redemption } = first.body
    expect(redemption).toMatchObject({
      lootId: loot.id,
      userId: user.user.userId,
      businessId: biz.business.businessId,
      branchId: biz.branchId,
      status: 'issued',
      usedAt: null,
    })
    expect(redemption.code).toMatch(/^LOOT-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/)
    expect(redemption.qrPayload).toBe(`loot:redeem:${redemption.code}`)
    expect(new Date(redemption.expiresAt).getTime()).toBe(new Date(loot.expiryAt).getTime())

    const retry = await claim(user, loot.id).expect(200)
    expect(retry.body.redemption.code).toBe(redemption.code)

    const stored = await Loot.findById(loot.id).lean()
    expect(stored.claimCount).toBe(1)
    expect(server.realtime.events).toContainEqual({
      type: 'counters',
      lootId: loot.id,
      claimCount: 1,
      status: 'active',
    })

    const detail = await request(server.app)
      .get(`/v1/loot/${loot.id}`)
      .set(...user.auth)
      .expect(200)
    expect(detail.body.loot).toMatchObject({ remainingQuantity: 4, viewer: { saved: false, claimed: true } })
    const mine = await request(server.app)
      .get(`/v1/loot/${loot.id}/redemption`)
      .set(...user.auth)
      .expect(200)
    expect(mine.body.redemption.code).toBe(redemption.code)
    const claims = await request(server.app)
      .get('/v1/me/claims')
      .set(...user.auth)
      .expect(200)
    expect(claims.body.items).toHaveLength(1)
    expect(claims.body.items[0]).toMatchObject({ id: loot.id, redemption: { code: redemption.code } })
  })

  it('gives at least an hour to redeem loot that is about to expire', async () => {
    const biz = await signInBusiness(server)
    const loot = await createLoot(server, biz, { expiryAt: new Date(Date.now() + 10 * 60_000).toISOString() })
    const user = await signIn(server)
    const before = Date.now()
    const { redemption } = (await claim(user, loot.id).expect(201)).body
    expect(new Date(redemption.expiresAt).getTime()).toBeGreaterThanOrEqual(before + MIN_REDEMPTION_WINDOW_MS)
  })

  it('stops at the stock limit', async () => {
    const biz = await signInBusiness(server)
    const loot = await createLoot(server, biz, { totalQuantity: 2 })
    const [a, b, c] = [await signIn(server), await signIn(server), await signIn(server)]

    await claim(a, loot.id).expect(201)
    await claim(b, loot.id).expect(201)
    const soldOut = await claim(c, loot.id).expect(409)
    expect(soldOut.body.error.code).toBe('loot_sold_out')
    expect((await Loot.findById(loot.id).lean()).claimCount).toBe(2)
  })

  it('never oversells under concurrent claims', async () => {
    const biz = await signInBusiness(server)
    const loot = await createLoot(server, biz, { totalQuantity: 3 })
    const users = []
    for (let i = 0; i < 12; i++) users.push(await signIn(server))

    const results = await Promise.all(users.map((u) => claim(u, loot.id)))
    const statuses = results.map((r) => r.status)
    expect(statuses.filter((s) => s === 201)).toHaveLength(3)
    expect(statuses.filter((s) => s === 409)).toHaveLength(9)
    expect((await Loot.findById(loot.id).lean()).claimCount).toBe(3)
    expect(await Claim.countDocuments({ lootId: loot.id })).toBe(3)
  })

  it('creates one claim when the same user double-taps', async () => {
    const biz = await signInBusiness(server)
    const loot = await createLoot(server, biz, { totalQuantity: 10 })
    const user = await signIn(server)

    const results = await Promise.all(Array.from({ length: 6 }, () => claim(user, loot.id)))
    expect(results.every((r) => r.status === 200 || r.status === 201)).toBe(true)
    expect(new Set(results.map((r) => r.body.redemption.code)).size).toBe(1)
    expect((await Loot.findById(loot.id).lean()).claimCount).toBe(1)
    expect(await Claim.countDocuments({ lootId: loot.id })).toBe(1)
  })

  it('refuses expired, archived and draft loot', async () => {
    const biz = await signInBusiness(server)
    const user = await signIn(server)

    const expired = await createLoot(server, biz)
    await Loot.updateOne({ _id: expired.id }, { expiryAt: new Date(Date.now() - 1000) })
    expect((await claim(user, expired.id).expect(410)).body.error.code).toBe('loot_expired')

    const archived = await createLoot(server, biz)
    await request(server.app)
      .post(`/v1/loot/${archived.id}/archive`)
      .set(...biz.auth)
      .expect(200)
    expect((await claim(user, archived.id).expect(409)).body.error.code).toBe('loot_not_claimable')

    const draft = await createLoot(server, biz, { status: 'draft' })
    expect((await claim(user, draft.id).expect(404)).body.error.code).toBe('loot_not_found')

    expect(await Claim.countDocuments()).toBe(0)
  })

  it('is for personal accounts only', async () => {
    const biz = await signInBusiness(server)
    const loot = await createLoot(server, biz)
    await request(server.app).post(`/v1/loot/${loot.id}/claim`).expect(401)
    await claim(biz, loot.id).expect(403)
  })
})

describe('redemption', () => {
  async function claimedCode() {
    const biz = await signInBusiness(server)
    const loot = await createLoot(server, biz)
    const user = await signIn(server)
    const { redemption } = (await claim(user, loot.id).expect(201)).body
    return { biz, loot, user, code: redemption.code }
  }

  it('redeems a code once', async () => {
    const { biz, loot, code } = await claimedCode()

    const res = await redeem(biz, code).expect(200)
    expect(res.body.redemption).toMatchObject({ code, status: 'used' })
    expect(res.body.redemption.usedAt).not.toBeNull()
    expect(res.body.loot.id).toBe(loot.id)
    expect((await Loot.findById(loot.id).lean()).redeemedCount).toBe(1)

    const twice = await redeem(biz, code).expect(409)
    expect(twice.body.error.code).toBe('redemption_already_used')
  })

  it('accepts codes typed loosely', async () => {
    const { biz, code } = await claimedCode()
    const typed = code.replace('LOOT-', '').toLowerCase()
    await redeem(biz, typed).expect(200)
  })

  it('redeems exactly once under concurrent scans', async () => {
    const { biz, code } = await claimedCode()
    const results = await Promise.all(Array.from({ length: 5 }, () => redeem(biz, code)))
    expect(results.map((r) => r.status).sort()).toEqual([200, 409, 409, 409, 409])
  })

  it('hides other businesses’ codes and blocks personal accounts', async () => {
    const { user, code } = await claimedCode()
    const other = await signInBusiness(server)

    const res = await redeem(other, code).expect(404)
    expect(res.body.error.code).toBe('redemption_not_found')
    await redeem(user, code).expect(403)
    expect((await Claim.findOne({ code }).lean()).status).toBe('issued')
  })

  it('refuses expired codes and malformed input', async () => {
    const { biz, code } = await claimedCode()
    await Claim.updateOne({ code }, { expiresAt: new Date(Date.now() - 1000) })
    expect((await redeem(biz, code).expect(410)).body.error.code).toBe('redemption_expired')

    expect((await redeem(biz, 'nope').expect(400)).body.error.code).toBe('validation_failed')
  })
})
