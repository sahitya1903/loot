import type { ErrorRequestHandler, RequestHandler } from 'express'
import { ZodError } from 'zod'
import { HttpError } from '../lib/errors.js'
import type { Logger } from '../lib/logger.js'

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: { code: 'route_not_found', message: `No route for ${req.method} ${req.path}` } })
}

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 11000
}

export function createErrorHandler(logger: Logger): ErrorRequestHandler {
  return (err, _req, res, _next) => {
    if (err instanceof HttpError) {
      if (err.retryAfterSeconds !== undefined) res.set('Retry-After', String(err.retryAfterSeconds))
      res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } })
      return
    }

    if (err instanceof ZodError) {
      const details = err.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }))
      res.status(400).json({ error: { code: 'validation_failed', message: 'Request is invalid', details } })
      return
    }

    if (isDuplicateKeyError(err)) {
      res.status(409).json({ error: { code: 'already_exists', message: 'Resource already exists' } })
      return
    }

    // express.json() parse failures
    if (err?.type === 'entity.parse.failed') {
      res.status(400).json({ error: { code: 'invalid_json', message: 'Request body is not valid JSON' } })
      return
    }

    logger.error({ err }, 'Unhandled error')
    res.status(500).json({ error: { code: 'internal_error', message: 'Something went wrong' } })
  }
}
