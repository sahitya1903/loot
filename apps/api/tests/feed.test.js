import { scoreLoot } from '@loot/shared'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { scoreExpression } from '../src/modules/feed/score.js'
import { Loot } from '../src/modules/loot/loot.model.js'
import { ORIGIN, createLoot, north, signIn, signInBusiness, startTestServer } from './helpers.js'

let server

beforeAll(async () => {
  server = await startTestServer()
})
beforeEach(() => server.reset())
afterAll(() => server.stop())

const nearby = (query = {}) =>
  request(server.app)
    .get('/v1/feed/nearby')
    .query({ ...ORIGIN, ...query })
const ids = (res) => res.body.items.map((item) => item.id)

describe('GET /v1/feed/nearby', () => {
  it('returns live loot within the radius, nearest first when otherwise equal', async () => {
    const near = await signInBusiness(server, { at: north(1) })
    const mid = await signInBusiness(server, { at: north(4) })
    const far = await signInBusiness(server, { at: north(20) })
    const a = await createLoot(server, near)
    const b = await createLoot(server, mid)
    await createLoot(server, far, { visibilityRadiusKm: 25 })

    const res = await nearby({ radiusKm: 10 }).expect(200)
    expect(ids(res)).toEqual([a.id, b.id])
    expect(res.body.items[0].distanceKm).toBeCloseTo(1, 1)
    expect(res.body.items[1].distanceKm).toBeCloseTo(4, 1)
    expect(res.body.items[0]).toMatchObject({
      businessName: 'Third Wave Cafe',
      branchName: 'Indiranagar',
      status: 'active',
    })
    expect(res.body.cursor).toBeNull()

    // A wider radius picks up the far loot too.
    expect(ids(await nearby({ radiusKm: 25 }).expect(200))).toHaveLength(3)
  })

  it('excludes drafts, archived and expired loot, and filters by category', async () => {
    const biz = await signInBusiness(server)
    const live = await createLoot(server, biz)
    await createLoot(server, biz, { status: 'draft' })
    const archived = await createLoot(server, biz)
    await request(server.app)
      .post(`/v1/loot/${archived.id}/archive`)
      .set(...biz.auth)
      .expect(200)
    // Past expiry but not yet swept: still must not show.
    const lapsed = await createLoot(server, biz)
    await Loot.updateOne({ _id: lapsed.id }, { expiryAt: new Date(Date.now() - 1000) })
    const swept = await createLoot(server, biz)
    await Loot.updateOne({ _id: swept.id }, { status: 'expired' })
    const nightlife = await createLoot(server, biz, { category: 'nightlife' })

    expect(ids(await nearby().expect(200)).sort()).toEqual([live.id, nightlife.id].sort())
    expect(ids(await nearby({ category: 'nightlife' }).expect(200))).toEqual([nightlife.id])
  })

  it('respects each loot’s own visibility radius', async () => {
    const biz = await signInBusiness(server, { at: north(5) })
    await createLoot(server, biz, { visibilityRadiusKm: 2 })
    const wide = await createLoot(server, biz, { visibilityRadiusKm: 10 })
    expect(ids(await nearby({ radiusKm: 10 }).expect(200))).toEqual([wide.id])
  })

  it('pages through every item exactly once', async () => {
    const created = []
    for (let i = 0; i < 7; i++) {
      const biz = await signInBusiness(server, { at: north(i * 0.7) })
      created.push((await createLoot(server, biz)).id)
    }

    const seen = []
    let cursor
    let pages = 0
    do {
      const res = await nearby({ limit: 3, ...(cursor ? { cursor } : {}) }).expect(200)
      seen.push(...ids(res))
      cursor = res.body.cursor
      pages++
    } while (cursor)
    expect(pages).toBe(3)
    expect(seen).toHaveLength(7)
    expect(new Set(seen)).toEqual(new Set(created))
  })

  it('personalizes for signed-in users and stays public for anonymous ones', async () => {
    const biz = await signInBusiness(server)
    const loot = await createLoot(server, biz)
    const user = await signIn(server)
    await request(server.app)
      .put(`/v1/loot/${loot.id}/save`)
      .set(...user.auth)
      .expect(200)

    expect((await nearby().expect(200)).body.items[0].viewer).toBeUndefined()
    const mine = await nearby()
      .set(...user.auth)
      .expect(200)
    expect(mine.body.items[0].viewer).toEqual({ saved: true, claimed: false })
  })

  it('validates coordinates and cursors', async () => {
    const missing = await request(server.app).get('/v1/feed/nearby').expect(400)
    expect(missing.body.error.code).toBe('validation_failed')
    await nearby({ latitude: 91 }).expect(400)
    await nearby({ radiusKm: 500 }).expect(400)
    const bad = await nearby({ cursor: 'not-a-cursor' }).expect(400)
    expect(bad.body.error.code).toBe('invalid_cursor')
    const wrongShape = await nearby({ cursor: Buffer.from('{"id":"x"}').toString('base64url') }).expect(400)
    expect(wrongShape.body.error.code).toBe('invalid_cursor')
  })

  it('returns an empty page when nothing is nearby', async () => {
    const res = await nearby().expect(200)
    expect(res.body).toEqual({ items: [], cursor: null })
  })
})

describe('ranking', () => {
  it('scores in MongoDB exactly like the shared scoreLoot', async () => {
    const now = Date.now()
    const radiusKm = 10
    for (const [i, km] of [0.3, 2.5, 6, 9.5].entries()) {
      const biz = await signInBusiness(server, { at: north(km) })
      await createLoot(server, biz, { expiryAt: new Date(now + (i + 1) * 5 * 3600_000).toISOString() })
    }
    // Vary every signal, including an over-cap boost and a lapsed one.
    const docs = await Loot.find().sort({ _id: 1 })
    const tweaks = [
      { saveCount: 4, claimCount: 3, shareCount: 1, trendingScore: 12 },
      {
        publishedAt: new Date(now - 30 * 3600_000),
        boost: { active: true, multiplier: 5, endsAt: new Date(now + 3600_000) },
      },
      { trendingScore: 3, boost: { active: true, multiplier: 1.2, endsAt: new Date(now - 1000) } },
      { saveCount: 40 },
    ]
    await Promise.all(docs.map((doc, i) => Loot.updateOne({ _id: doc._id }, tweaks[i])))

    const rows = await Loot.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [ORIGIN.longitude, ORIGIN.latitude] },
          key: 'location',
          distanceField: 'distanceMeters',
          spherical: true,
        },
      },
      { $addFields: { score: scoreExpression({ radiusKm, now }) } },
    ])
    expect(rows).toHaveLength(4)
    for (const row of rows) {
      const expected = scoreLoot(
        {
          ...row,
          distanceKm: row.distanceMeters / 1000,
          radiusKm,
          createdAt: row.publishedAt ?? row.createdAt,
        },
        now,
      )
      expect(row.score).toBeCloseTo(expected, 10)
    }
  })

  it('lets urgency and engagement lift a farther loot, without boosts dominating', async () => {
    const near = await signInBusiness(server, { at: north(3) })
    const far = await signInBusiness(server, { at: north(6) })
    const calm = await createLoot(server, near, { expiryAt: new Date(Date.now() + 20 * 24 * 3600_000).toISOString() })
    const hot = await createLoot(server, far, { expiryAt: new Date(Date.now() + 30 * 60_000).toISOString() })
    await Loot.updateOne({ _id: hot.id }, { saveCount: 30, claimCount: 20 })
    expect(ids(await nearby().expect(200))).toEqual([hot.id, calm.id])

    // A huge paid boost is capped, so it can't bury the hot loot.
    await Loot.updateOne(
      { _id: calm.id },
      { boost: { active: true, multiplier: 100, endsAt: new Date(Date.now() + 3600_000) } },
    )
    expect(ids(await nearby().expect(200))).toEqual([hot.id, calm.id])
  })
})

describe('GET /v1/feed/fresh', () => {
  it('lists newest first within the radius', async () => {
    const biz = await signInBusiness(server)
    const older = await createLoot(server, biz)
    await Loot.updateOne({ _id: older.id }, { publishedAt: new Date(Date.now() - 3600_000) })
    const newer = await createLoot(server, biz)
    const draft = await createLoot(server, biz, { status: 'draft' })

    const first = await request(server.app)
      .get('/v1/feed/fresh')
      .query({ ...ORIGIN, limit: 1 })
      .expect(200)
    expect(ids(first)).toEqual([newer.id])
    const second = await request(server.app)
      .get('/v1/feed/fresh')
      .query({ ...ORIGIN, limit: 1, cursor: first.body.cursor })
      .expect(200)
    expect(ids(second)).toEqual([older.id])
    expect(second.body.cursor).toBeNull()
    expect([...ids(first), ...ids(second)]).not.toContain(draft.id)
  })
})
