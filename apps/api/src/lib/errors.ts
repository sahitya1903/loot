// Every error response has the shape { error: { code, message, details? } }.
// `code` is a stable snake_case string clients can switch on; `message` is for humans.

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
    readonly retryAfterSeconds?: number,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export const badRequest = (code: string, message: string, details?: unknown) =>
  new HttpError(400, code, message, details)

export const unauthorized = (code = 'unauthorized', message = 'Authentication required') =>
  new HttpError(401, code, message)

export const forbidden = (code: string, message: string) => new HttpError(403, code, message)

export const notFound = (code = 'not_found', message = 'Not found') => new HttpError(404, code, message)

export const tooManyRequests = (code: string, message: string, retryAfterSeconds?: number) =>
  new HttpError(429, code, message, undefined, retryAfterSeconds)
