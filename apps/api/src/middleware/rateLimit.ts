import type { Request, RequestHandler } from 'express'
import type { Redis } from '../lib/redis.js'
import { tooManyRequests } from '../lib/errors.js'

interface RateLimitOptions {
  /** Namespaces the Redis key, e.g. `otp-send-phone`. */
  name: string
  limit: number
  windowSeconds: number
  /** What to count against. Returning undefined skips the limit for this request. */
  key: (req: Request) => string | undefined
}

/** Fixed-window rate limiter backed by Redis, so limits hold across API instances. */
export function rateLimit(redis: Redis, options: RateLimitOptions): RequestHandler {
  return async (req, _res, next) => {
    const id = options.key(req)
    if (!id) return next()

    const redisKey = `rl:${options.name}:${id}`
    const results = await redis.multi().incr(redisKey).ttl(redisKey).exec()
    const count = Number(results?.[0]?.[1] ?? 0)
    let ttl = Number(results?.[1]?.[1] ?? -1)

    // First hit in the window (or a key that somehow lost its expiry): start the window.
    if (ttl < 0) {
      await redis.expire(redisKey, options.windowSeconds)
      ttl = options.windowSeconds
    }

    if (count > options.limit) {
      throw tooManyRequests('rate_limited', 'Too many requests, try again later', ttl)
    }
    next()
  }
}
