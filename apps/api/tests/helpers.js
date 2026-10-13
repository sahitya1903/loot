import { createServer } from 'node:http'
import RedisMock from 'ioredis-mock'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { loadEnv } from '../src/config/env.js'
import { createLogger } from '../src/lib/logger.js'
import { createTokenService } from '../src/modules/auth/tokens.js'
import { createSocketRealtime } from '../src/realtime/socket.js'

export const testEnv = loadEnv({
  NODE_ENV: 'test',
  LOG_LEVEL: 'silent',
  MONGODB_URI: 'unused-in-tests',
  REDIS_URL: 'unused-in-tests',
  JWT_ACCESS_SECRET: 'test-jwt-secret-that-is-at-least-32-chars',
  OTP_SECRET: 'test-otp-secret-that-is-at-least-32-chars',
})

/** Captures OTPs instead of sending them, so tests can read the latest code per phone. */
export function createCapturingOtpSender() {
  const codes = new Map()
  const sender = {
    codes,
    fail: false,
    async send(phoneNumber, code) {
      if (sender.fail) throw new Error('simulated delivery failure')
      codes.set(phoneNumber, code)
    },
  }
  return sender
}

/** Records Socket.io broadcasts instead of sending them. */
export function createCapturingRealtime() {
  const events = []
  return {
    events,
    lootCounters(loot) {
      events.push({ type: 'counters', lootId: loot._id.toString(), claimCount: loot.claimCount, status: loot.status })
    },
    lootPublished(loot, business) {
      events.push({ type: 'published', lootId: loot._id.toString(), businessId: business._id.toString() })
    },
    redemptionUpdated(claim) {
      events.push({ type: 'redemption', code: claim.code, status: claim.status })
    },
    async close() {},
  }
}

/**
 * @param {object} [options]
 * @param {boolean} [options.socket] serve over a real HTTP port with Socket.io attached
 *   (no Redis adapter); `url` is then the base URL and `realtime.events` stays empty.
 */
export async function startTestServer({ socket = false } = {}) {
  const mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())
  // Build unique and TTL indexes up front so uniqueness is enforced in tests.
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()))

  const logger = createLogger(testEnv)
  const tokens = createTokenService(testEnv)
  const redis = new RedisMock()
  const otpSender = createCapturingOtpSender()
  const realtime = socket ? createSocketRealtime({ env: testEnv, tokens, logger }) : createCapturingRealtime()
  const scheduled = []
  const lifecycle = { scheduleLoot: (loot) => scheduled.push(loot._id.toString()) }
  const app = createApp({ env: testEnv, logger, redis, otpSender, realtime, lifecycle, tokens })

  let url
  if (socket) {
    const httpServer = createServer(app)
    realtime.io.attach(httpServer)
    await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve))
    url = `http://127.0.0.1:${httpServer.address().port}`
  }

  return {
    app,
    url,
    redis,
    otpSender,
    realtime,
    scheduled,
    async reset() {
      await redis.flushall()
      otpSender.codes.clear()
      if (realtime.events) realtime.events.length = 0
      scheduled.length = 0
      otpSender.fail = false
      await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})))
    },
    async stop() {
      await realtime.close()
      await mongoose.disconnect()
      await mongo.stop()
    },
  }
}

// ---------------------------------------------------------------- fixtures

/** Bengaluru, Indiranagar 100ft Road. */
export const ORIGIN = { latitude: 12.9719, longitude: 77.6412 }

/** A point `km` north of ORIGIN (1 degree of latitude ≈ 111.2 km). */
export function north(km) {
  return { latitude: ORIGIN.latitude + km / 111.195, longitude: ORIGIN.longitude }
}

let phoneSeq = 0

/** Signs in a fresh phone number; returns { token, user, auth: [header, value] }. */
export async function signIn(server, phoneNumber = `+9198${String(++phoneSeq).padStart(8, '0')}`) {
  await request(server.app).post('/v1/auth/otp/send').send({ phoneNumber }).expect(200)
  const code = server.otpSender.codes.get(phoneNumber)
  const res = await request(server.app).post('/v1/auth/otp/verify').send({ phoneNumber, code }).expect(200)
  return { token: res.body.accessToken, user: res.body.user, auth: ['Authorization', `Bearer ${res.body.accessToken}`] }
}

/** Signs in and onboards a business with one branch at `at`. */
export async function signInBusiness(server, { at = ORIGIN, username = `biz${++phoneSeq}` } = {}) {
  const session = await signIn(server)
  const res = await request(server.app)
    .post('/v1/businesses')
    .set(...session.auth)
    .send({
      businessName: 'Third Wave Cafe',
      username,
      category: 'cafe',
      branch: { name: 'Indiranagar', address: '100ft Road', ...at },
    })
    .expect(201)
  return { ...session, business: res.body.business, branchId: res.body.business.branchLocations[0].branchId }
}

export function lootBody(branchId, overrides = {}) {
  return {
    title: 'Two-for-one cold brew',
    description: 'Every cold brew is buy one get one until the timer runs out.',
    category: 'food_drink',
    branchId,
    offerText: 'Buy 1 Get 1',
    originalPrice: 240,
    offerPrice: 120,
    expiryAt: new Date(Date.now() + 6 * 3600_000).toISOString(),
    media: [{ url: 'https://images.example.com/brew.jpg', mediaType: 'image' }],
    ...overrides,
  }
}

/** Creates a published loot as `biz`; returns the API's loot. */
export async function createLoot(server, biz, overrides = {}) {
  const res = await request(server.app)
    .post('/v1/loot')
    .set(...biz.auth)
    .send(lootBody(biz.branchId, overrides))
  if (res.status !== 201) throw new Error(`createLoot ${res.status}: ${JSON.stringify(res.body)}`)
  return res.body.loot
}
