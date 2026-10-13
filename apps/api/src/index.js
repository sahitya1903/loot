import { createServer } from 'node:http'
import mongoose from 'mongoose'
import { createApp } from './app.js'
import { loadEnv } from './config/env.js'
import { connectMongo } from './lib/db.js'
import { createLogger } from './lib/logger.js'
import { createRedis } from './lib/redis.js'
import { createLoggingOtpSender, createWhatsAppOtpSender } from './modules/auth/otpSender.js'
import { createTokenService } from './modules/auth/tokens.js'
import { createSocketRealtime } from './realtime/socket.js'

// Load .env when present (local development); hosted environments set real env vars.
try {
  process.loadEnvFile()
} catch {
  // no .env file
}

const env = loadEnv()
const logger = createLogger(env)

await connectMongo(env.MONGODB_URI, logger)
const redis = createRedis(env.REDIS_URL, logger)

const otpSender =
  env.WHATSAPP_PHONE_NUMBER_ID && env.WHATSAPP_ACCESS_TOKEN
    ? createWhatsAppOtpSender({
        phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
        accessToken: env.WHATSAPP_ACCESS_TOKEN,
        template: env.WHATSAPP_OTP_TEMPLATE,
      })
    : createLoggingOtpSender(logger)

const tokens = createTokenService(env)
const realtime = createSocketRealtime({ env, tokens, logger, redis })

const app = createApp({ env, logger, redis, otpSender, realtime, tokens })
// Express handles plain HTTP; Socket.io takes /socket.io/ on the same port.
const server = createServer(app)
realtime.io.attach(server)

server.listen(env.PORT, () => {
  logger.info(`Loot API listening on http://localhost:${env.PORT}`)
})

async function shutdown(signal) {
  logger.info({ signal }, 'Shutting down')
  // Closing Socket.io also closes the HTTP server.
  await realtime.close()
  await Promise.allSettled([mongoose.disconnect(), redis.quit()])
  process.exit(0)
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))
