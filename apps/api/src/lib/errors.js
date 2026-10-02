// Every error response has the shape { error: { code, message, details? } }.
// `code` is a stable snake_case string clients can switch on; `message` is for humans.

export class HttpError extends Error {
  status
  code
  details
  retryAfterSeconds
  constructor(status, code, message, details, retryAfterSeconds) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
    this.retryAfterSeconds = retryAfterSeconds
    this.name = 'HttpError'
  }
}

export const badRequest = (code, message, details) => new HttpError(400, code, message, details)

export const unauthorized = (code = 'unauthorized', message = 'Authentication required') =>
  new HttpError(401, code, message)

export const forbidden = (code, message) => new HttpError(403, code, message)

export const notFound = (code = 'not_found', message = 'Not found') => new HttpError(404, code, message)

export const tooManyRequests = (code, message, retryAfterSeconds) =>
  new HttpError(429, code, message, undefined, retryAfterSeconds)
