import RedisMock from 'ioredis-mock'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { createApp } from '../src/app.js'
import { loadEnv } from '../src/config/env.js'
import { createLogger } from '../src/lib/logger.js'

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

export async function startTestServer() {
  const mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())
  // Build unique and TTL indexes up front so uniqueness is enforced in tests.
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()))

  const redis = new RedisMock()
  const otpSender = createCapturingOtpSender()
  const app = createApp({ env: testEnv, logger: createLogger(testEnv), redis, otpSender })

  return {
    app,
    redis,
    otpSender,
    async reset() {
      await redis.flushall()
      otpSender.codes.clear()
      otpSender.fail = false
      await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})))
    },
    async stop() {
      await mongoose.disconnect()
      await mongo.stop()
    },
  }
}
