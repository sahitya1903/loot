import { Redis } from 'ioredis'
import type { Logger } from './logger.js'

export type { Redis }

export function createRedis(url: string, logger: Logger): Redis {
  const redis = new Redis(url)
  redis.on('error', (err) => logger.error({ err }, 'Redis error'))
  redis.on('ready', () => logger.info('Redis connected'))
  return redis
}
