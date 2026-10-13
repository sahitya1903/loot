import { MAX_WATCHED_LOOT, REALTIME_EVENTS } from '@loot/shared'
import { io as connect } from 'socket.io-client'
import request from 'supertest'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ORIGIN, createLoot, north, signIn, signInBusiness, startTestServer } from './helpers.js'

let server
const sockets = []

beforeAll(async () => {
  server = await startTestServer({ socket: true })
})
beforeEach(() => server.reset())
afterEach(() => {
  for (const socket of sockets.splice(0)) socket.disconnect()
})
afterAll(() => server.stop())

function open(token) {
  const socket = connect(server.url, {
    transports: ['websocket'],
    auth: token ? { token } : {},
    reconnection: false,
    forceNew: true,
  })
  sockets.push(socket)
  return new Promise((resolve, reject) => {
    socket.once('connect', () => resolve(socket))
    socket.once('connect_error', reject)
  })
}

/** Resolves with the next `event`, or rejects after `ms`. */
function nextEvent(socket, event, ms = 2000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`No ${event} within ${ms}ms`)), ms)
    socket.once(event, (payload) => {
      clearTimeout(timer)
      resolve(payload)
    })
  })
}

/** Collects every `event` for `ms`. */
async function collect(socket, event, ms = 300) {
  const seen = []
  const listener = (payload) => seen.push(payload)
  socket.on(event, listener)
  await new Promise((resolve) => setTimeout(resolve, ms))
  socket.off(event, listener)
  return seen
}

const watch = (socket, lootIds) => socket.emitWithAck(REALTIME_EVENTS.watchLoot, { lootIds })

describe('loot counters', () => {
  it('pushes save and claim counters to anonymous watchers until they unwatch', async () => {
    const biz = await signInBusiness(server)
    const loot = await createLoot(server, biz, { totalQuantity: 5 })
    const other = await createLoot(server, biz)
    const user = await signIn(server)

    const watcher = await open()
    const bystander = await open()
    expect(await watch(watcher, [loot.id])).toEqual({ ok: true })
    expect(await watch(bystander, [other.id])).toEqual({ ok: true })

    const bystanderSaw = collect(bystander, REALTIME_EVENTS.lootCounters, 500)
    let pushed = nextEvent(watcher, REALTIME_EVENTS.lootCounters)
    await request(server.app)
      .put(`/v1/loot/${loot.id}/save`)
      .set(...user.auth)
      .expect(200)
    expect(await pushed).toEqual({
      lootId: loot.id,
      status: 'active',
      claimCount: 0,
      saveCount: 1,
      remainingQuantity: 5,
    })

    pushed = nextEvent(watcher, REALTIME_EVENTS.lootCounters)
    await request(server.app)
      .post(`/v1/loot/${loot.id}/claim`)
      .set(...user.auth)
      .expect(201)
    expect(await pushed).toMatchObject({ lootId: loot.id, claimCount: 1, remainingQuantity: 4 })
    expect(await bystanderSaw).toEqual([])

    expect(await watcher.emitWithAck(REALTIME_EVENTS.unwatchLoot, { lootIds: [loot.id] })).toEqual({ ok: true })
    const afterUnwatch = collect(watcher, REALTIME_EVENTS.lootCounters)
    await request(server.app)
      .delete(`/v1/loot/${loot.id}/save`)
      .set(...user.auth)
      .expect(200)
    expect(await afterUnwatch).toEqual([])
  })

  it('serves the same counters over REST as the fallback', async () => {
    const biz = await signInBusiness(server)
    const loot = await createLoot(server, biz, { totalQuantity: 3 })
    const res = await request(server.app).get(`/v1/loot/${loot.id}/counters`).expect(200)
    expect(res.body.counters).toEqual({
      lootId: loot.id,
      status: 'active',
      claimCount: 0,
      saveCount: 0,
      remainingQuantity: 3,
    })

    const draft = await createLoot(server, biz, { status: 'draft' })
    await request(server.app).get(`/v1/loot/${draft.id}/counters`).expect(404)
  })

  it('validates payloads and caps watched loot', async () => {
    const socket = await open()
    const invalid = await socket.emitWithAck(REALTIME_EVENTS.watchLoot, { lootIds: ['nope'] })
    expect(invalid).toMatchObject({ ok: false, error: { code: 'validation_failed' } })

    const ids = (n, offset) => Array.from({ length: n }, (_, i) => (i + offset).toString(16).padStart(24, '0'))
    expect(await watch(socket, ids(MAX_WATCHED_LOOT, 0))).toEqual({ ok: true })
    // Re-watching the same ids is fine; one more is not.
    expect(await watch(socket, ids(10, 0))).toEqual({ ok: true })
    expect(await watch(socket, ids(1, MAX_WATCHED_LOOT))).toMatchObject({
      ok: false,
      error: { code: 'too_many_watched' },
    })
  })
})

describe('new loot nearby', () => {
  it('announces newly live loot to viewers watching that area only', async () => {
    const nearViewer = await open()
    const farViewer = await open()
    const watchArea = (socket, at) => socket.emitWithAck(REALTIME_EVENTS.watchArea, at)
    expect(await watchArea(nearViewer, ORIGIN)).toEqual({ ok: true })
    expect(await watchArea(farViewer, north(300))).toEqual({ ok: true })

    const farSaw = collect(farViewer, REALTIME_EVENTS.lootPublished, 600)
    const announced = nextEvent(nearViewer, REALTIME_EVENTS.lootPublished)
    const biz = await signInBusiness(server, { at: north(3) })
    const loot = await createLoot(server, biz)

    expect(await announced).toMatchObject({
      id: loot.id,
      businessName: 'Third Wave Cafe',
      status: 'active',
      distanceKm: null,
    })
    expect(await farSaw).toEqual([])
  })

  it('announces a draft when it is published, not when it is saved', async () => {
    const viewer = await open()
    await viewer.emitWithAck(REALTIME_EVENTS.watchArea, ORIGIN)
    const biz = await signInBusiness(server)

    const whileDraft = collect(viewer, REALTIME_EVENTS.lootPublished)
    const draft = await createLoot(server, biz, { status: 'draft' })
    expect(await whileDraft).toEqual([])

    const announced = nextEvent(viewer, REALTIME_EVENTS.lootPublished)
    await request(server.app)
      .post(`/v1/loot/${draft.id}/publish`)
      .set(...biz.auth)
      .expect(200)
    expect((await announced).id).toBe(draft.id)
  })
})

describe('signed-in sockets', () => {
  it('tells the claimant, and only them, when their code is redeemed', async () => {
    const biz = await signInBusiness(server)
    const loot = await createLoot(server, biz)
    const claimant = await signIn(server)
    const someoneElse = await signIn(server)
    const { redemption } = (
      await request(server.app)
        .post(`/v1/loot/${loot.id}/claim`)
        .set(...claimant.auth)
        .expect(201)
    ).body

    const mine = await open(claimant.token)
    const theirs = await open(someoneElse.token)
    const theySaw = collect(theirs, REALTIME_EVENTS.redemptionUpdated, 600)
    const update = nextEvent(mine, REALTIME_EVENTS.redemptionUpdated)
    await request(server.app)
      .post('/v1/businesses/me/redemptions')
      .set(...biz.auth)
      .send({ code: redemption.code })
      .expect(200)

    expect((await update).redemption).toMatchObject({ code: redemption.code, status: 'used' })
    expect(await theySaw).toEqual([])
  })

  it('refuses an invalid token instead of silently connecting anonymously', async () => {
    await expect(open('not-a-real-token')).rejects.toThrow('invalid_token')
  })
})
