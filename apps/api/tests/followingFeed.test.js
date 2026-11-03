import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { Loot } from '../src/modules/loot/loot.model.js'
import { ORIGIN, createLoot, north, signIn, signInBusiness, startTestServer } from './helpers.js'

let server

beforeAll(async () => {
  server = await startTestServer()
})
beforeEach(() => server.reset())
afterAll(() => server.stop())

const follow = (who, biz) =>
  request(server.app)
    .put(`/v1/businesses/${biz.business.businessId}/follow`)
    .set(...who.auth)
    .expect(200)
const followingFeed = (who, query = {}) =>
  request(server.app)
    .get('/v1/feed/following')
    .set(...who.auth)
    .query(query)
const ids = (res) => res.body.items.map((item) => item.id)

describe('GET /v1/feed/following', () => {
  it('needs a signed-in user', async () => {
    await request(server.app).get('/v1/feed/following').expect(401)
  })

  it('is empty until the user follows someone', async () => {
    const biz = await signInBusiness(server)
    await createLoot(server, biz)
    const hunter = await signIn(server)
    const res = await followingFeed(hunter).expect(200)
    expect(res.body).toEqual({ items: [], cursor: null })
  })

  it('lists live loot from followed businesses only, newest first, at any distance', async () => {
    const followed = await signInBusiness(server)
    const faraway = await signInBusiness(server, { at: north(300) })
    const other = await signInBusiness(server)
    const hunter = await signIn(server)
    await follow(hunter, followed)
    await follow(hunter, faraway)

    const older = await createLoot(server, followed)
    await Loot.updateOne({ _id: older.id }, { publishedAt: new Date(Date.now() - 3600_000) })
    const newer = await createLoot(server, followed)
    const far = await createLoot(server, faraway)
    await Loot.updateOne({ _id: far.id }, { publishedAt: new Date(Date.now() - 1800_000) })
    await createLoot(server, followed, { status: 'draft' })
    const lapsed = await createLoot(server, followed)
    await Loot.updateOne({ _id: lapsed.id }, { expiryAt: new Date(Date.now() - 1000) })
    await createLoot(server, other)

    const res = await followingFeed(hunter).expect(200)
    expect(ids(res)).toEqual([newer.id, far.id, older.id])
    expect(res.body.items[0].distanceKm).toBeNull()

    // With a location, items carry their distance.
    const located = await followingFeed(hunter, ORIGIN).expect(200)
    expect(located.body.items.find((i) => i.id === far.id).distanceKm).toBeCloseTo(300, 0)
  })

  it('filters by category, pages through everything once, and rejects half a location', async () => {
    const biz = await signInBusiness(server)
    const hunter = await signIn(server)
    await follow(hunter, biz)
    const created = []
    for (let i = 0; i < 5; i++) created.push((await createLoot(server, biz)).id)
    const nightlife = await createLoot(server, biz, { category: 'nightlife' })

    expect(ids(await followingFeed(hunter, { category: 'nightlife' }).expect(200))).toEqual([nightlife.id])

    const seen = []
    let cursor
    do {
      const res = await followingFeed(hunter, { limit: 2, ...(cursor ? { cursor } : {}) }).expect(200)
      seen.push(...ids(res))
      cursor = res.body.cursor
    } while (cursor)
    expect(seen.sort()).toEqual([...created, nightlife.id].sort())

    await followingFeed(hunter, { latitude: ORIGIN.latitude }).expect(400)
  })

  it('gives business accounts an empty list rather than an error', async () => {
    const biz = await signInBusiness(server)
    await createLoot(server, biz)
    expect((await followingFeed(biz).expect(200)).body.items).toEqual([])
  })
})
