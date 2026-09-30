import cors from 'cors'
import express, { type Express } from 'express'
import helmet from 'helmet'
import { pinoHttp } from 'pino-http'
import type { Env } from './config/env.js'
import { isMongoReady } from './lib/db.js'
import type { Logger } from './lib/logger.js'
import type { Redis } from './lib/redis.js'
import { requireAuth } from './middleware/auth.js'
import { createErrorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { createAuthRouter } from './modules/auth/auth.routes.js'
import { createAuthService } from './modules/auth/auth.service.js'
import type { OtpSender } from './modules/auth/otpSender.js'
import { createTokenService } from './modules/auth/tokens.js'
import { createUsersRouter } from './modules/users/users.routes.js'

export interface AppDeps {
  env: Env
  logger: Logger
  redis: Redis
  otpSender: OtpSender
}

export function createApp({ env, logger, redis, otpSender }: AppDeps): Express {
  const tokens = createTokenService(env)
  const auth = createAuthService({ env, logger, otpSender, tokens })

  const app = express()
  // Behind one proxy (Railway/Render/load balancer) in production, so req.ip is the client's IP.
  if (env.NODE_ENV === 'production') app.set('trust proxy', 1)

  app.use(pinoHttp({ logger }))
  app.use(helmet())
  app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }))
  app.use(express.json({ limit: '100kb' }))

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.get('/ready', async (_req, res) => {
    // ioredis queues commands while disconnected, so bound the wait.
    const redisReady = await Promise.race([
      redis.ping().then(() => true, () => false),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1_000)),
    ])
    const ready = isMongoReady() && redisReady
    res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not_ready', mongo: isMongoReady(), redis: redisReady })
  })

  const v1 = express.Router()
  v1.use('/auth', createAuthRouter(auth, redis))
  v1.use('/', createUsersRouter(requireAuth(tokens)))
  app.use('/v1', v1)

  app.use(notFoundHandler)
  app.use(createErrorHandler(logger))
  return app
}
