import { randomUUID } from 'node:crypto'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { pinoHttp } from 'pino-http'
import { isMongoReady } from './lib/db.js'
import { optionalAuth, requireAccountType, requireAuth, requireBusiness } from './middleware/auth.js'
import { createErrorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { createAuthRouter } from './modules/auth/auth.routes.js'
import { createAuthService } from './modules/auth/auth.service.js'
import { createTokenService } from './modules/auth/tokens.js'
import { createBusinessesRouter } from './modules/businesses/businesses.routes.js'
import { createFeedRouter } from './modules/feed/feed.routes.js'
import { noopLifecycleScheduler } from './modules/loot/lifecycle.js'
import { createBusinessLootRouter, createLootRouter } from './modules/loot/loot.routes.js'
import { createUsersRouter } from './modules/users/users.routes.js'
import { noopRealtime } from './realtime/noop.js'

/**
 * @param {object} deps
 * @param {{ lootCounters: Function, lootPublished: Function }} [deps.realtime] Socket.io publisher
 * @param {{ scheduleLoot: Function }} [deps.lifecycle] BullMQ scheduler for expiry jobs
 */
export function createApp({
  env,
  logger,
  redis,
  otpSender,
  realtime = noopRealtime,
  lifecycle = noopLifecycleScheduler,
}) {
  const tokens = createTokenService(env)
  const auth = createAuthService({ env, logger, otpSender, tokens })

  const authenticated = requireAuth(tokens)
  // Route guards. Each array runs left to right; ownership comes from the database, not the client.
  const guards = {
    auth: [authenticated],
    optionalAuth: optionalAuth(tokens),
    personal: [authenticated, requireAccountType('personal')],
    business: [authenticated, requireAccountType('professional'), requireBusiness()],
  }

  const app = express()
  // Behind one proxy (Railway/Render/load balancer) in production, so req.ip is the client's IP.
  if (env.NODE_ENV === 'production') app.set('trust proxy', 1)

  app.use(
    pinoHttp({
      logger,
      // Honour an upstream request id (load balancer) or mint one; echo it back for support.
      genReqId: (req, res) => {
        const incoming = req.headers['x-request-id']
        const id = typeof incoming === 'string' && /^[\w-]{1,64}$/.test(incoming) ? incoming : randomUUID()
        res.setHeader('X-Request-Id', id)
        return id
      },
    }),
  )
  app.use(helmet())
  app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }))
  app.use(express.json({ limit: '100kb' }))

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.get('/ready', async (_req, res) => {
    // ioredis queues commands while disconnected, so bound the wait.
    const redisReady = await Promise.race([
      redis.ping().then(
        () => true,
        () => false,
      ),
      new Promise((resolve) => setTimeout(() => resolve(false), 1_000)),
    ])
    const ready = isMongoReady() && redisReady
    res
      .status(ready ? 200 : 503)
      .json({ status: ready ? 'ready' : 'not_ready', mongo: isMongoReady(), redis: redisReady })
  })

  const v1 = express.Router()
  v1.use('/auth', createAuthRouter(auth, redis))
  v1.use('/', createUsersRouter(authenticated))
  v1.use('/businesses', createBusinessLootRouter({ guards }))
  v1.use('/businesses', createBusinessesRouter(guards))
  v1.use('/loot', createLootRouter({ guards, lifecycle, realtime, logger }))
  v1.use('/feed', createFeedRouter({ guards }))
  app.use('/v1', v1)

  app.use(notFoundHandler)
  app.use(createErrorHandler(logger))
  return app
}
