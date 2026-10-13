import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { Loot } from '../src/modules/loot/loot.model.js'
import { ORIGIN, createLoot, lootBody, signIn, signInBusiness, startTestServer } from './helpers.js'

let server

beforeAll(async () => {
  server = await startTestServer()
})
beforeEach(() => server.reset())
afterAll(() => server.stop())

const hoursFromNow = (h) => new Date(Date.now() + h * 3600_000).toISOString()

describe('POST /v1/loot', () => {
  it('creates live loot at the branch, schedules expiry and announces it', async () => {
    const biz = await signInBusiness(server)
    const res = await request(server.app)
      .post('/v1/loot')
      .set(...biz.auth)
      .send(lootBody(biz.branchId))
      .expect(201)
    const { loot } = res.body

    expect(loot).toMatchObject({
      title: 'Two-for-one cold brew',
      status: 'active',
      businessId: biz.business.businessId,
      branchId: biz.branchId,
      offerText: 'Buy 1 Get 1',
      originalPrice: 240,
      offerPrice: 120,
      currency: 'INR',
      totalQuantity: null,
      remainingQuantity: null,
      claimCount: 0,
      location: { name: 'Indiranagar', address: '100ft Road' },
      ...ORIGIN,
      business: { username: biz.business.username },
    })
    expect(loot.publishedAt).not.toBeNull()
    expect(server.scheduled).toEqual([loot.id])
    expect(server.realtime.events).toContainEqual({
      type: 'published',
      lootId: loot.id,
      businessId: biz.business.businessId,
    })
  })

  it('starts as `expiring` when it ends within two hours', async () => {
    const biz = await signInBusiness(server)
    const loot = await createLoot(server, biz, { expiryAt: hoursFromNow(1) })
    expect(loot.status).toBe('expiring')
  })

  it('saves drafts without publishing them', async () => {
    const biz = await signInBusiness(server)
    const loot = await createLoot(server, biz, { status: 'draft' })
    expect(loot).toMatchObject({ status: 'draft', publishedAt: null })
    expect(server.scheduled).toEqual([])
  })

  it('ignores client-supplied ownership and counters', async () => {
    const biz = await signInBusiness(server)
    const other = await signInBusiness(server)
    const loot = await createLoot(server, biz, {
      businessId: other.business.businessId,
      claimCount: 99,
      saveCount: 50,
      trendingScore: 1000,
    })
    expect(loot).toMatchObject({ businessId: biz.business.businessId, claimCount: 0, saveCount: 0, trendingScore: 0 })
  })

  it.each([
    ['offer price above original', { offerPrice: 300 }, 'offerPrice'],
    ['no offer described', { offerText: undefined, offerPrice: undefined }, 'offerText'],
    ['expiry in the past', { expiryAt: hoursFromNow(-1) }, 'expiryAt'],
    ['expiry beyond 30 days', { expiryAt: hoursFromNow(31 * 24) }, 'expiryAt'],
    ['non-https media', { media: [{ url: 'ftp://x/y.jpg', mediaType: 'image' }] }, 'media.0.url'],
    ['unknown category', { category: 'spaceships' }, 'category'],
    ['client-chosen lifecycle status', { status: 'trending' }, 'status'],
  ])('rejects %s', async (_name, overrides, path) => {
    const biz = await signInBusiness(server)
    const res = await request(server.app)
      .post('/v1/loot')
      .set(...biz.auth)
      .send(lootBody(biz.branchId, overrides))
      .expect(400)
    expect(res.body.error.code).toBe('validation_failed')
    expect(res.body.error.details.map((d) => d.path)).toContain(path)
  })

  it('rejects another business’s branch', async () => {
    const biz = await signInBusiness(server)
    const other = await signInBusiness(server)
    const res = await request(server.app)
      .post('/v1/loot')
      .set(...biz.auth)
      .send(lootBody(other.branchId))
      .expect(400)
    expect(res.body.error.code).toBe('branch_not_found')
  })
})

describe('reading loot', () => {
  it('shows live loot to anyone, with viewer state when signed in', async () => {
    const biz = await signInBusiness(server)
    const loot = await createLoot(server, biz)

    const anon = await request(server.app).get(`/v1/loot/${loot.id}`).expect(200)
    expect(anon.body.loot.id).toBe(loot.id)
    expect(anon.body.loot.viewer).toBeUndefined()

    const user = await signIn(server)
    const signedIn = await request(server.app)
      .get(`/v1/loot/${loot.id}`)
      .set(...user.auth)
      .expect(200)
    expect(signedIn.body.loot.viewer).toEqual({ saved: false, claimed: false })

    const media = await request(server.app).get(`/v1/loot/${loot.id}/media`).expect(200)
    expect(media.body.urls).toEqual([
      { url: 'https://images.example.com/brew.jpg', thumbnailUrl: null, mediaType: 'image' },
    ])
  })

  it('hides drafts from everyone but their business', async () => {
    const biz = await signInBusiness(server)
    const draft = await createLoot(server, biz, { status: 'draft' })
    const user = await signIn(server)

    await request(server.app).get(`/v1/loot/${draft.id}`).expect(404)
    await request(server.app)
      .get(`/v1/loot/${draft.id}`)
      .set(...user.auth)
      .expect(404)
    await request(server.app)
      .get(`/v1/loot/${draft.id}`)
      .set(...biz.auth)
      .expect(200)
  })

  it('shows loot past its expiry as expired even before the sweeper runs', async () => {
    const biz = await signInBusiness(server)
    const loot = await createLoot(server, biz)
    await Loot.updateOne({ _id: loot.id }, { expiryAt: new Date(Date.now() - 1000) })
    const res = await request(server.app).get(`/v1/loot/${loot.id}`).expect(200)
    expect(res.body.loot.status).toBe('expired')
  })

  it('404s malformed and unknown ids', async () => {
    await request(server.app).get('/v1/loot/nope').expect(404)
    const res = await request(server.app)
      .get(`/v1/loot/${'a'.repeat(24)}`)
      .expect(404)
    expect(res.body.error.code).toBe('loot_not_found')
  })

  it('counts views and shares', async () => {
    const biz = await signInBusiness(server)
    const loot = await createLoot(server, biz)
    const user = await signIn(server)

    await request(server.app).post(`/v1/loot/${loot.id}/views`).send({ source: 'nearby' }).expect(204)
    await request(server.app)
      .post(`/v1/loot/${loot.id}/shares`)
      .set(...user.auth)
      .send({ channel: 'whatsapp' })
      .expect(204)
    const stored = await Loot.findById(loot.id).lean()
    expect(stored).toMatchObject({ viewCount: 1, shareCount: 1 })
  })
})

describe('managing loot', () => {
  it('edits own loot and re-schedules when the expiry moves', async () => {
    const biz = await signInBusiness(server)
    const loot = await createLoot(server, biz)
    server.scheduled.length = 0

    const res = await request(server.app)
      .patch(`/v1/loot/${loot.id}`)
      .set(...biz.auth)
      .send({ title: 'Three-for-one cold brew', expiryAt: hoursFromNow(1), terms: null })
      .expect(200)
    expect(res.body.loot).toMatchObject({ title: 'Three-for-one cold brew', status: 'expiring', terms: null })
    // Defaults are not re-applied on a partial update.
    expect(res.body.loot.lootType).toBe('deal')
    expect(server.scheduled).toEqual([loot.id])
  })

  it('checks offer rules against the merged loot', async () => {
    const biz = await signInBusiness(server)
    const loot = await createLoot(server, biz)
    const res = await request(server.app)
      .patch(`/v1/loot/${loot.id}`)
      .set(...biz.auth)
      .send({ offerPrice: 500 })
      .expect(400)
    expect(res.body.error.details[0].path).toBe('offerPrice')

    await request(server.app)
      .patch(`/v1/loot/${loot.id}`)
      .set(...biz.auth)
      .send({ status: 'archived' })
      .expect(400)
  })

  it('treats another business’s loot as missing', async () => {
    const biz = await signInBusiness(server)
    const other = await signInBusiness(server)
    const loot = await createLoot(server, biz)

    for (const [method, path, body] of [
      ['patch', `/v1/loot/${loot.id}`, { title: 'Hijacked' }],
      ['post', `/v1/loot/${loot.id}/archive`, {}],
      ['post', `/v1/loot/${loot.id}/publish`, {}],
    ]) {
      const agent = request(server.app)
      const res = await agent[method](path)
        .set(...other.auth)
        .send(body)
      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('loot_not_found')
    }
    expect((await Loot.findById(loot.id).lean()).title).toBe('Two-for-one cold brew')
  })

  it('never lowers quantity below what has been claimed', async () => {
    const biz = await signInBusiness(server)
    const loot = await createLoot(server, biz, { totalQuantity: 10 })
    await Loot.updateOne({ _id: loot.id }, { claimCount: 4 })

    const res = await request(server.app)
      .patch(`/v1/loot/${loot.id}`)
      .set(...biz.auth)
      .send({ totalQuantity: 3 })
    expect(res.status).toBe(409)
    expect(res.body.error).toMatchObject({ code: 'quantity_below_claims', details: { claimCount: 4 } })

    const ok = await request(server.app)
      .patch(`/v1/loot/${loot.id}`)
      .set(...biz.auth)
      .send({ totalQuantity: 4 })
      .expect(200)
    expect(ok.body.loot.remainingQuantity).toBe(0)
  })

  it('refuses to edit expired or archived loot', async () => {
    const biz = await signInBusiness(server)
    const expired = await createLoot(server, biz)
    await Loot.updateOne({ _id: expired.id }, { expiryAt: new Date(Date.now() - 1000) })
    const res = await request(server.app)
      .patch(`/v1/loot/${expired.id}`)
      .set(...biz.auth)
      .send({ title: 'Back again' })
    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('loot_not_editable')

    const archived = await createLoot(server, biz)
    await request(server.app)
      .post(`/v1/loot/${archived.id}/archive`)
      .set(...biz.auth)
      .expect(200)
    await request(server.app)
      .patch(`/v1/loot/${archived.id}`)
      .set(...biz.auth)
      .send({ title: 'Back again' })
      .expect(409)
    const twice = await request(server.app)
      .post(`/v1/loot/${archived.id}/archive`)
      .set(...biz.auth)
    expect(twice.body.error.code).toBe('loot_already_archived')
  })

  it('publishes a draft once', async () => {
    const biz = await signInBusiness(server)
    const draft = await createLoot(server, biz, { status: 'draft' })

    const res = await request(server.app)
      .post(`/v1/loot/${draft.id}/publish`)
      .set(...biz.auth)
      .expect(200)
    expect(res.body.loot.status).toBe('active')
    expect(res.body.loot.publishedAt).not.toBeNull()
    expect(server.scheduled).toEqual([draft.id])

    const again = await request(server.app)
      .post(`/v1/loot/${draft.id}/publish`)
      .set(...biz.auth)
      .expect(409)
    expect(again.body.error.code).toBe('loot_not_draft')
  })

  it('won’t publish a draft whose expiry has (almost) passed', async () => {
    const biz = await signInBusiness(server)
    const draft = await createLoot(server, biz, { status: 'draft' })
    await Loot.updateOne({ _id: draft.id }, { expiryAt: new Date(Date.now() + 60_000) })
    const res = await request(server.app)
      .post(`/v1/loot/${draft.id}/publish`)
      .set(...biz.auth)
      .expect(409)
    expect(res.body.error.code).toBe('loot_expiry_too_soon')
  })
})

describe('GET /v1/businesses/:businessId/loot', () => {
  it('lists live loot publicly and every status for the owner', async () => {
    const biz = await signInBusiness(server)
    const live = await createLoot(server, biz)
    const draft = await createLoot(server, biz, { status: 'draft' })
    const expired = await createLoot(server, biz)
    await Loot.updateOne({ _id: expired.id }, { expiryAt: new Date(Date.now() - 1000) })
    const path = `/v1/businesses/${biz.business.businessId}/loot`

    const ids = (res) => res.body.items.map((i) => i.id)
    expect(ids(await request(server.app).get(path).expect(200))).toEqual([live.id])
    expect(
      ids(
        await request(server.app)
          .get(`${path}?status=draft`)
          .set(...biz.auth)
          .expect(200),
      ),
    ).toEqual([draft.id])
    expect(
      ids(
        await request(server.app)
          .get(`${path}?status=expired`)
          .set(...biz.auth)
          .expect(200),
      ),
    ).toEqual([expired.id])
    expect(
      ids(
        await request(server.app)
          .get(`${path}?status=all`)
          .set(...biz.auth)
          .expect(200),
      ),
    ).toEqual([expired.id, draft.id, live.id])

    const user = await signIn(server)
    const res = await request(server.app)
      .get(`${path}?status=draft`)
      .set(...user.auth)
      .expect(403)
    expect(res.body.error.code).toBe('not_owner')
  })

  it('paginates with a cursor', async () => {
    const biz = await signInBusiness(server)
    const created = []
    for (let i = 0; i < 5; i++) created.push((await createLoot(server, biz, { title: `Loot number ${i}` })).id)

    const seen = []
    let cursor
    do {
      const res = await request(server.app)
        .get(`/v1/businesses/${biz.business.businessId}/loot`)
        .query({ limit: 2, ...(cursor ? { cursor } : {}) })
        .expect(200)
      seen.push(...res.body.items.map((i) => i.id))
      cursor = res.body.cursor
    } while (cursor)
    expect(seen).toEqual(created.reverse())
  })
})
