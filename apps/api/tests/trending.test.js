import { TRENDING_HALF_LIFE_HOURS, TRENDING_POINTS, TRENDING_THRESHOLD } from '@loot/shared'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { decayTrendingScores, refreshTrending } from '../src/modules/loot/lifecycle.js'
import { runLifecycleJob } from '../src/modules/loot/lifecycle.jobs.js'
import { Loot } from '../src/modules/loot/loot.model.js'
import {
  ORIGIN,
  createCapturingRealtime,
  createLoot,
  north,
  signIn,
  signInBusiness,
  startTestServer,
} from './helpers.js'

let server

beforeAll(async () => {
  server = await startTestServer()
})
beforeEach(() => server.reset())
afterAll(() => server.stop())

const HOUR = 3600_000
const HALF_LIFE = TRENDING_HALF_LIFE_HOURS * HOUR
const scoreOf = async (id) => (await Loot.findById(id).lean()).trendingScore
const setLoot = (id, fields) => Loot.updateOne({ _id: id }, fields)

describe('trending points from engagement', () => {
  it('adds points for saves and claims, and takes them back on unsave', async () => {
    const biz = await signInBusiness(server)
    const loot = await createLoot(server, biz)
    const hunter = await signIn(server)
    const app = () => request(server.app)

    await app()
      .put(`/v1/loot/${loot.id}/save`)
      .set(...hunter.auth)
      .expect(200)
    // Saving again is a no-op: no extra points.
    await app()
      .put(`/v1/loot/${loot.id}/save`)
      .set(...hunter.auth)
      .expect(200)
    expect(await scoreOf(loot.id)).toBe(TRENDING_POINTS.save)

    await app()
      .delete(`/v1/loot/${loot.id}/save`)
      .set(...hunter.auth)
      .expect(200)
    expect(await scoreOf(loot.id)).toBe(0)

    await app()
      .post(`/v1/loot/${loot.id}/claim`)
      .set(...hunter.auth)
      .expect(201)
    // A retried claim returns the same code and adds nothing.
    await app()
      .post(`/v1/loot/${loot.id}/claim`)
      .set(...hunter.auth)
      .expect(200)
    expect(await scoreOf(loot.id)).toBe(TRENDING_POINTS.claim)
  })

  it('counts every share but gives points once per user per loot', async () => {
    const biz = await signInBusiness(server)
    const loot = await createLoot(server, biz)
    const [a, b] = [await signIn(server), await signIn(server)]
    const share = (who) =>
      request(server.app)
        .post(`/v1/loot/${loot.id}/shares`)
        .set(...who.auth)
        .send({ channel: 'whatsapp' })
        .expect(204)

    await share(a)
    await share(a)
    await share(a)
    await share(b)
    const doc = await Loot.findById(loot.id).lean()
    expect(doc.shareCount).toBe(4)
    expect(doc.trendingScore).toBe(2 * TRENDING_POINTS.share)
  })

  it('rate-limits shares per user', async () => {
    const biz = await signInBusiness(server)
    const loot = await createLoot(server, biz)
    const hunter = await signIn(server)
    const share = () =>
      request(server.app)
        .post(`/v1/loot/${loot.id}/shares`)
        .set(...hunter.auth)
        .send({ channel: 'native' })
    for (let i = 0; i < 20; i++) await share().expect(204)
    await share().expect(429)
  })
})

describe('trending job', () => {
  it('halves the score every half-life, measured from each loot’s own last decay', async () => {
    const biz = await signInBusiness(server)
    const loot = await createLoot(server, biz)
    const now = new Date()
    await setLoot(loot.id, { trendingScore: 8, trendingDecayedAt: new Date(now.getTime() - HALF_LIFE) })

    await decayTrendingScores(now)
    const doc = await Loot.findById(loot.id).lean()
    expect(doc.trendingScore).toBeCloseTo(4)
    expect(doc.trendingDecayedAt.getTime()).toBe(now.getTime())

    // Points that arrive on a loot with no decay time yet aren't decayed on the first run.
    const fresh = await createLoot(server, biz)
    await setLoot(fresh.id, { trendingScore: 3 })
    await decayTrendingScores(now)
    expect(await scoreOf(fresh.id)).toBe(3)
  })

  it('drops dust and negatives to 0 and forgets the decay time', async () => {
    const biz = await signInBusiness(server)
    const dusty = await createLoot(server, biz)
    const negative = await createLoot(server, biz)
    const now = new Date()
    await setLoot(dusty.id, { trendingScore: 0.015, trendingDecayedAt: new Date(now.getTime() - HALF_LIFE) })
    await setLoot(negative.id, { trendingScore: -0.7 })

    await decayTrendingScores(now)
    for (const id of [dusty.id, negative.id]) {
      const doc = await Loot.findById(id).lean()
      expect(doc.trendingScore).toBe(0)
      expect(doc.trendingDecayedAt).toBeUndefined()
    }
  })

  it('moves active ⇄ trending with a gap, and leaves expiring loot alone', async () => {
    const biz = await signInBusiness(server)
    const hot = await createLoot(server, biz)
    const warm = await createLoot(server, biz)
    const cooled = await createLoot(server, biz)
    const ending = await createLoot(server, biz, { expiryAt: new Date(Date.now() + HOUR).toISOString() })
    await setLoot(hot.id, { trendingScore: TRENDING_THRESHOLD })
    await setLoot(warm.id, { status: 'trending', trendingScore: TRENDING_THRESHOLD * 0.6 })
    await setLoot(cooled.id, { status: 'trending', trendingScore: TRENDING_THRESHOLD * 0.4 })
    await setLoot(ending.id, { trendingScore: TRENDING_THRESHOLD * 3 })

    const { trending, active } = await refreshTrending()
    expect(trending.map((l) => l.id)).toEqual([hot.id])
    expect(active.map((l) => l.id)).toEqual([cooled.id])

    const status = async (id) => (await Loot.findById(id).lean()).status
    expect(await status(hot.id)).toBe('trending')
    expect(await status(warm.id)).toBe('trending') // above half the threshold: stays
    expect(await status(cooled.id)).toBe('active')
    expect(await status(ending.id)).toBe('expiring')
  })

  it('runs as a lifecycle job and pushes status changes live', async () => {
    const biz = await signInBusiness(server)
    const hot = await createLoot(server, biz)
    await setLoot(hot.id, { trendingScore: TRENDING_THRESHOLD * 2 })

    const realtime = createCapturingRealtime()
    expect(await runLifecycleJob({ name: 'trending', data: {} }, { realtime })).toEqual({ trending: 1, active: 0 })
    expect(realtime.events).toEqual([expect.objectContaining({ lootId: hot.id, status: 'trending' })])
  })
})

describe('GET /v1/feed/trending', () => {
  const trendingFeed = (query = {}) =>
    request(server.app)
      .get('/v1/feed/trending')
      .query({ ...ORIGIN, ...query })
  const ids = (res) => res.body.items.map((item) => item.id)

  it('lists nearby loot with a trending score, highest first', async () => {
    const near = await signInBusiness(server, { at: north(1) })
    const far = await signInBusiness(server, { at: north(30) })
    const low = await createLoot(server, near)
    const high = await createLoot(server, near)
    await createLoot(server, near) // no score: not trending
    const away = await createLoot(server, far, { visibilityRadiusKm: 50 })
    const expired = await createLoot(server, near)
    await setLoot(low.id, { trendingScore: 2 })
    await setLoot(high.id, { trendingScore: 12, status: 'trending' })
    await setLoot(away.id, { trendingScore: 50 })
    await setLoot(expired.id, { trendingScore: 99, expiryAt: new Date(Date.now() - 1000) })

    const res = await trendingFeed({ radiusKm: 10 }).expect(200)
    expect(ids(res)).toEqual([high.id, low.id])
    expect(res.body.items[0]).toMatchObject({ status: 'trending', trendingScore: 12 })
    expect(res.body.items[0].distanceKm).toBeCloseTo(1, 1)
    expect(res.body.cursor).toBeNull()
  })

  it('filters by category and pages through every item once', async () => {
    const biz = await signInBusiness(server)
    const created = []
    for (let i = 0; i < 5; i++) {
      const loot = await createLoot(server, biz)
      await setLoot(loot.id, { trendingScore: 1 + (i % 2) }) // ties are broken by id
      created.push(loot.id)
    }
    const nightlife = await createLoot(server, biz, { category: 'nightlife' })
    await setLoot(nightlife.id, { trendingScore: 1 })
    expect(ids(await trendingFeed({ category: 'nightlife' }).expect(200))).toEqual([nightlife.id])

    const seen = []
    let cursor
    do {
      const res = await trendingFeed({ limit: 2, ...(cursor ? { cursor } : {}) }).expect(200)
      seen.push(...ids(res))
      cursor = res.body.cursor
    } while (cursor)
    expect(seen.sort()).toEqual([...created, nightlife.id].sort())
  })

  it('needs a location', async () => {
    await request(server.app).get('/v1/feed/trending').expect(400)
  })
})
