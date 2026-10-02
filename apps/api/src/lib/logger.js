import { pino } from 'pino'

export function createLogger(env) {
  return pino({
    level: env.LOG_LEVEL,
    redact: ['req.headers.authorization', 'req.headers.cookie'],
    transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
  })
}
