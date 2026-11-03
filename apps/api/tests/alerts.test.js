import RedisMock from 'ioredis-mock'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { LootAlert } from '../src/modules/alerts/alert.model.js'
import { runAlertJob } from '../src/modules/alerts/alerts.jobs.js'
import { createExpoPushSender } from '../src/modules/alerts/expoPush.js'
import { fanOutEndingSoon, fanOutLootDrop, timeLeft } from '../src/modules/alerts/fanout.js'
import { PushToken } from '../src/modules/alerts/pushToken.model.js'
import { createLogger } from '../src/lib/logger.js'
import { runLifecycleJob } from '../src/modules/loot/lifecycle.jobs.js'
import { Loot } from '../src/modules/loot/loot.model.js'
import {
  createCapturingAlerts,
  createCapturingPushSender,
  createCapturingRealtime,
  createLoot,
  signIn,
  signInBusiness,
  startTestServer,
  testEnv,
} from './helpers.js'

let server

beforeAll(async () => {
  server = await startTestServer()
})
beforeEach(() => server.reset())
afterAll(() => server.stop())

const HOUR = 3600_000
const token = (n) => `ExponentPushToken[device-${n}]`

const registerToken = (who, value, platform = 'android') =>
  request(server.app)
    .post('/v1/me/push-tokens')
    .set(...who.auth)
    .send({ token: value, platform })

const follow = (who, biz) =>
  request(server.app)
    .put(`/v1/businesses/${biz.business.businessId}/follow`)
    .set(...who.auth)
    .expect(200)

const inbox = (who, query = {}) =>
  request(server.app)
    .get('/v1/me/alerts')
    .query(query)
    .set(...who.auth)

function seedAlerts(user, count) {
  return LootAlert.insertMany(
    Array.from({ length: count }, (_, i) => ({
      userId: user.userId,
      type: 'followed_business_drop',
      title: `Drop ${i}`,
      body: 'Body',
    })),
  )
}

describe('push tokens', () => {
  it('needs a session and a real Expo token', async () => {
    await request(server.app)
      .post('/v1/me/push-tokens')
      .send({ token: token(1), platform: 'android' })
      .expect(401)
    const hunter = await signIn(server)
    const res = await registerToken(hunter, 'not-a-token').expect(400)
    expect(res.body.error.code).toBe('validation_failed')
    await registerToken(hunter, token(1), 'windows').expect(400)
  })

  it('registers once per device and moves a device to whoever signs in on it', async () => {
    const first = await signIn(server)
    const second = await signIn(server)
    await registerToken(first, token(1)).expect(204)
    await registerToken(first, token(1)).expect(204)
    expect(await PushToken.countDocuments()).toBe(1)

    await registerToken(second, token(1)).expect(204)
    const row = await PushToken.findOne({ token: token(1) })
    expect(row.userId.toString()).toBe(second.user.userId)
  })

  it('only lets the owner remove a token', async () => {
    const owner = await signIn(server)
    const other = await signIn(server)
    await registerToken(owner, token(1)).expect(204)

    await request(server.app)
      .delete('/v1/me/push-tokens')
      .set(...other.auth)
      .send({ token: token(1) })
      .expect(204)
    expect(await PushToken.countDocuments()).toBe(1)

    await request(server.app)
      .delete('/v1/me/push-tokens')
      .set(...owner.auth)
      .send({ token: token(1) })
      .expect(204)
    expect(await PushToken.countDocuments()).toBe(0)
  })
})

describe('alerts inbox', () => {
  it('lists the newest first with the unread count, page by page', async () => {
    const hunter = await signIn(server)
    await seedAlerts(hunter.user, 3)

    const first = await inbox(hunter, { limit: 2 }).expect(200)
    expect(first.body.items.map((a) => a.title)).toEqual(['Drop 2', 'Drop 1'])
    expect(first.body.unreadCount).toBe(3)
    expect(first.body.items[0]).toMatchObject({ type: 'followed_business_drop', readAt: null, lootId: null })

    const second = await inbox(hunter, { limit: 2, cursor: first.body.cursor }).expect(200)
    expect(second.body.items.map((a) => a.title)).toEqual(['Drop 0'])
    expect(second.body.cursor).toBeNull()
  })

  it('marks one alert read, keeping the first read time', async () => {
    const hunter = await signIn(server)
    const [alert] = await seedAlerts(hunter.user, 1)
    const path = `/v1/me/alerts/${alert.id}/read`

    const first = await request(server.app)
      .post(path)
      .set(...hunter.auth)
      .expect(200)
    expect(first.body.alert.readAt).toEqual(expect.any(String))
    const again = await request(server.app)
      .post(path)
      .set(...hunter.auth)
      .expect(200)
    expect(again.body.alert.readAt).toBe(first.body.alert.readAt)
    expect((await inbox(hunter).expect(200)).body.unreadCount).toBe(0)
  })

  it("hides other users' alerts", async () => {
    const owner = await signIn(server)
    const other = await signIn(server)
    const [alert] = await seedAlerts(owner.user, 1)

    expect((await inbox(other).expect(200)).body.items).toEqual([])
    const res = await request(server.app)
      .post(`/v1/me/alerts/${alert.id}/read`)
      .set(...other.auth)
      .expect(404)
    expect(res.body.error.code).toBe('alert_not_found')
    await request(server.app)
      .post('/v1/me/alerts/nope/read')
      .set(...other.auth)
      .expect(404)
  })

  it('marks everything read', async () => {
    const hunter = await signIn(server)
    await seedAlerts(hunter.user, 3)
    const res = await request(server.app)
      .post('/v1/me/alerts/read-all')
      .set(...hunter.auth)
      .expect(200)
    expect(res.body).toEqual({ updated: 3 })
    expect((await inbox(hunter).expect(200)).body.unreadCount).toBe(0)
  })
})

describe('alert hooks', () => {
  it('fires when loot goes live, not for drafts until they are published', async () => {
    const biz = await signInBusiness(server)
    const live = await createLoot(server, biz)
    const draft = await createLoot(server, biz, { status: 'draft' })
    expect(server.alerts.calls).toEqual([{ type: 'published', lootId: live.id }])

    await request(server.app)
      .post(`/v1/loot/${draft.id}/publish`)
      .set(...biz.auth)
      .expect(200)
    expect(server.alerts.calls).toEqual([
      { type: 'published', lootId: live.id },
      { type: 'published', lootId: draft.id },
    ])
  })

  it('fires when a loot enters its ending-soon window, from the job or the sweeper', async () => {
    const biz = await signInBusiness(server)
    const byJob = await createLoot(server, biz)
    const bySweep = await createLoot(server, biz)
    await Loot.updateMany({}, { expiryAt: new Date(Date.now() + HOUR) })

    const alerts = createCapturingAlerts()
    const realtime = createCapturingRealtime()
    await runLifecycleJob({ name: 'expiring', data: { lootId: byJob.id } }, { realtime, alerts })
    await runLifecycleJob({ name: 'sweep', data: {} }, { realtime, alerts })
    // Already expiring: nothing changes, so no second alert.
    await runLifecycleJob({ name: 'expiring', data: { lootId: byJob.id } }, { realtime, alerts })

    expect(alerts.calls).toEqual([
      { type: 'endingSoon', lootId: byJob.id },
      { type: 'endingSoon', lootId: bySweep.id },
    ])
  })
})

describe('fanOutLootDrop', () => {
  it("alerts the business's followers and pushes to their devices, once", async () => {
    const biz = await signInBusiness(server)
    const fan = await signIn(server)
    const stranger = await signIn(server)
    await follow(fan, biz)
    await registerToken(fan, token(1)).expect(204)
    await registerToken(fan, token(2), 'ios').expect(204)
    await registerToken(stranger, token(3)).expect(204)
    const loot = await createLoot(server, biz)

    const push = createCapturingPushSender()
    const deps = { push, redis: new RedisMock() }
    expect(await fanOutLootDrop(loot.id, deps)).toMatchObject({ alerts: 1, pushed: 2 })
    expect(push.sent.map((m) => m.to).sort()).toEqual([token(1), token(2)])
    expect(push.sent[0]).toMatchObject({
      title: 'Third Wave Cafe just dropped loot',
      body: 'Two-for-one cold brew · Buy 1 Get 1',
      data: { type: 'followed_business_drop', lootId: loot.id, alertId: expect.any(String) },
    })

    const { body } = await inbox(fan).expect(200)
    expect(body.items).toMatchObject([
      { type: 'followed_business_drop', lootId: loot.id, imageUrl: 'https://images.example.com/brew.jpg' },
    ])
    expect((await inbox(stranger).expect(200)).body.items).toEqual([])

    // A retried job finds the alert already there and sends nothing.
    expect(await fanOutLootDrop(loot.id, deps)).toMatchObject({ alerts: 0, pushed: 0 })
    expect(push.sent).toHaveLength(2)
  })

  it('pages through followers', async () => {
    const biz = await signInBusiness(server)
    const fans = [await signIn(server), await signIn(server), await signIn(server)]
    for (const fan of fans) await follow(fan, biz)
    const loot = await createLoot(server, biz)

    const result = await fanOutLootDrop(loot.id, { push: createCapturingPushSender() }, { batchSize: 2 })
    expect(result.alerts).toBe(3)
  })

  it('pushes one drop per business per hour, but every drop reaches the inbox', async () => {
    const biz = await signInBusiness(server)
    const fan = await signIn(server)
    await follow(fan, biz)
    await registerToken(fan, token(1)).expect(204)
    const first = await createLoot(server, biz)
    const second = await createLoot(server, biz, { title: 'Free cookie' })

    const push = createCapturingPushSender()
    const deps = { push, redis: new RedisMock() }
    await fanOutLootDrop(first.id, deps)
    expect(await fanOutLootDrop(second.id, deps)).toMatchObject({ alerts: 1, pushed: 0 })
    expect(push.sent).toHaveLength(1)
    expect((await inbox(fan).expect(200)).body.items).toHaveLength(2)
  })

  it('deletes tokens Expo says are no longer registered', async () => {
    const biz = await signInBusiness(server)
    const fan = await signIn(server)
    await follow(fan, biz)
    await registerToken(fan, token(1)).expect(204)
    await registerToken(fan, token(2)).expect(204)
    const loot = await createLoot(server, biz)

    const push = createCapturingPushSender()
    push.deadTokens.add(token(1))
    await fanOutLootDrop(loot.id, { push })
    expect((await PushToken.find().lean()).map((t) => t.token)).toEqual([token(2)])
  })

  it('skips loot that is no longer live', async () => {
    const biz = await signInBusiness(server)
    const fan = await signIn(server)
    await follow(fan, biz)
    const loot = await createLoot(server, biz)
    await Loot.updateOne({ _id: loot.id }, { status: 'archived' })
    expect(await fanOutLootDrop(loot.id, { push: createCapturingPushSender() })).toMatchObject({ alerts: 0 })
  })
})

describe('fanOutEndingSoon', () => {
  async function endingSoonLoot() {
    const biz = await signInBusiness(server)
    const loot = await createLoot(server, biz)
    await Loot.updateOne({ _id: loot.id }, { status: 'expiring', expiryAt: new Date(Date.now() + 45 * 60_000) })
    return loot
  }

  it('nudges savers who have not claimed and reminds code holders', async () => {
    const loot = await endingSoonLoot()
    const saver = await signIn(server)
    const claimer = await signIn(server)
    const bystander = await signIn(server)
    for (const who of [saver, claimer]) {
      await request(server.app)
        .put(`/v1/loot/${loot.id}/save`)
        .set(...who.auth)
        .expect(200)
    }
    await request(server.app)
      .post(`/v1/loot/${loot.id}/claim`)
      .set(...claimer.auth)
      .expect(201)
    await registerToken(saver, token(1)).expect(204)
    await registerToken(claimer, token(2)).expect(204)

    const push = createCapturingPushSender()
    expect(await fanOutEndingSoon(loot.id, { push })).toMatchObject({ alerts: 2, pushed: 2 })

    const [saverAlert] = (await inbox(saver).expect(200)).body.items
    expect(saverAlert).toMatchObject({ type: 'loot_ending_soon', title: 'Ending soon: Two-for-one cold brew' })
    expect(saverAlert.body).toContain('ends in 45 minutes')
    const [claimerAlert] = (await inbox(claimer).expect(200)).body.items
    expect(claimerAlert).toMatchObject({ type: 'redemption_reminder', lootId: loot.id })
    expect((await inbox(bystander).expect(200)).body.items).toEqual([])

    expect(await fanOutEndingSoon(loot.id, { push })).toMatchObject({ alerts: 0, pushed: 0 })
  })

  it('does nothing for loot that is not ending soon', async () => {
    const biz = await signInBusiness(server)
    const loot = await createLoot(server, biz)
    expect(await fanOutEndingSoon(loot.id, { push: createCapturingPushSender() })).toMatchObject({ alerts: 0 })
  })
})

describe('runAlertJob', () => {
  it('queues a receipt check for accepted pushes', async () => {
    const biz = await signInBusiness(server)
    const fan = await signIn(server)
    await follow(fan, biz)
    await registerToken(fan, token(1)).expect(204)
    const loot = await createLoot(server, biz)

    const queued = []
    const push = createCapturingPushSender()
    const result = await runAlertJob(
      { name: 'drop', data: { lootId: loot.id } },
      { push, queueReceipts: (tickets) => queued.push(tickets) },
    )
    expect(result).toEqual({ alerts: 1, pushed: 1 })
    expect(queued).toEqual([[{ id: expect.any(String), token: token(1) }]])
  })

  it('deletes tokens whose receipts say the device is gone', async () => {
    const hunter = await signIn(server)
    await registerToken(hunter, token(1)).expect(204)
    const push = { checkReceipts: async () => ({ deadTokens: [token(1)] }) }
    expect(await runAlertJob({ name: 'receipts', data: { tickets: [] } }, { push })).toEqual({ deadTokens: 1 })
    expect(await PushToken.countDocuments()).toBe(0)
  })

  it('rejects unknown jobs', async () => {
    await expect(runAlertJob({ name: 'nope', data: {} }, { push: createCapturingPushSender() })).rejects.toThrow(
      'Unknown alert job',
    )
  })
})

describe('createExpoPushSender', () => {
  const logger = createLogger(testEnv)

  function fakeFetch(respond) {
    const calls = []
    const fetch = async (url, init) => {
      const body = JSON.parse(init.body)
      calls.push({ url, body, headers: init.headers })
      return { ok: true, status: 200, json: async () => respond(url, body) }
    }
    return { fetch, calls }
  }

  it('sends in batches of 100 and reports dead tokens', async () => {
    const { fetch, calls } = fakeFetch((_url, batch) => ({
      data: batch.map((m) =>
        m.to === token(5)
          ? { status: 'error', message: 'gone', details: { error: 'DeviceNotRegistered' } }
          : { status: 'ok', id: `id-${m.to}` },
      ),
    }))
    const sender = createExpoPushSender({ logger, fetch, accessToken: 'secret' })
    const messages = Array.from({ length: 150 }, (_, i) => ({ to: token(i), title: 'T', body: 'B' }))

    const result = await sender.send(messages)
    expect(calls.map((c) => c.body.length)).toEqual([100, 50])
    expect(calls[0].url).toBe('https://exp.host/--/api/v2/push/send')
    expect(calls[0].headers.Authorization).toBe('Bearer secret')
    expect(calls[0].body[0]).toMatchObject({ channelId: 'loot', priority: 'high', sound: 'default' })
    expect(result.deadTokens).toEqual([token(5)])
    expect(result.tickets).toHaveLength(149)
  })

  it('reads receipts and reports undeliverable devices', async () => {
    const { fetch, calls } = fakeFetch(() => ({
      data: { a: { status: 'ok' }, b: { status: 'error', details: { error: 'DeviceNotRegistered' } } },
    }))
    const sender = createExpoPushSender({ logger, fetch })
    const result = await sender.checkReceipts([
      { id: 'a', token: token(1) },
      { id: 'b', token: token(2) },
    ])
    expect(calls[0].url).toBe('https://exp.host/--/api/v2/push/getReceipts')
    expect(calls[0].headers.Authorization).toBeUndefined()
    expect(result.deadTokens).toEqual([token(2)])
  })

  it('throws when Expo rejects the request, so the job retries', async () => {
    const fetch = async () => ({ ok: false, status: 500, json: async () => ({ errors: [{ code: 'INTERNAL' }] }) })
    const sender = createExpoPushSender({ logger, fetch })
    await expect(sender.send([{ to: token(1), title: 'T', body: 'B' }])).rejects.toThrow('Expo push /send failed')
  })
})

describe('timeLeft', () => {
  const now = Date.parse('2026-11-04T10:00:00Z')
  const at = (ms) => new Date(now + ms)
  it('rounds to friendly units', () => {
    expect(timeLeft(at(30_000), now)).toBe('1 minute')
    expect(timeLeft(at(45 * 60_000), now)).toBe('45 minutes')
    expect(timeLeft(at(70 * 60_000), now)).toBe('about an hour')
    expect(timeLeft(at(2 * HOUR), now)).toBe('about 2 hours')
  })
})
