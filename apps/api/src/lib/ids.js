import { Types } from 'mongoose'

/**
 * Parses a path parameter as an ObjectId. A malformed id can't match anything,
 * so it gets the same error as an unknown one.
 * @param {string} value
 * @param {() => Error} notFoundError
 */
export function parseObjectId(value, notFoundError) {
  if (typeof value !== 'string' || !Types.ObjectId.isValid(value) || !/^[a-f\d]{24}$/i.test(value)) {
    throw notFoundError()
  }
  return new Types.ObjectId(value)
}
