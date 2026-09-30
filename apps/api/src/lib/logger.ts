import { pino, type Logger } from 'pino'
import type { Env } from '../config/env.js'

export type { Logger }

export function createLogger(env: Pick<Env, 'NODE_ENV' | 'LOG_LEVEL'>): Logger {
  return pino({
    level: env.LOG_LEVEL,
    redact: ['req.headers.authorization', 'req.headers.cookie'],
    transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
  })
}
