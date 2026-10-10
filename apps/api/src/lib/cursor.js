import { badRequest } from './errors.js'

// Cursors are opaque to clients: base64url JSON of whatever the endpoint needs to resume.

export function encodeCursor(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

/** @returns {any} the decoded value, or undefined when no cursor was passed */
export function decodeCursor(cursor) {
  if (!cursor) return undefined
  try {
    const value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'))
    if (value && typeof value === 'object') return value
  } catch {
    // fall through
  }
  throw badRequest('invalid_cursor', 'Pagination cursor is invalid')
}

/**
 * Splits a `limit + 1` query result into the page and the next cursor.
 * @template T
 * @param {T[]} rows fetched with limit + 1
 * @param {number} limit
 * @param {(last: T) => unknown} cursorOf
 */
export function paginate(rows, limit, cursorOf) {
  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows
  return { page, cursor: hasMore ? encodeCursor(cursorOf(page[page.length - 1])) : null }
}
