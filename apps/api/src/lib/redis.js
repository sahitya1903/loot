import { Redis } from 'ioredis'

export function createRedis(url, logger) {
  const redis = new Redis(url)
  redis.on('error', (err) => logger.error({ err }, 'Redis error'))
  redis.on('ready', () => logger.info('Redis connected'))
  return redis
}
