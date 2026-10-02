import { forbidden, unauthorized } from '../lib/errors.js'
import { User } from '../modules/users/user.model.js'

/** Verifies the `Authorization: Bearer <access token>` header and sets `req.auth`. */
export function requireAuth(tokens) {
  return async (req, _res, next) => {
    const header = req.get('authorization')
    const match = header?.match(/^Bearer (.+)$/i)
    if (!match?.[1]) throw unauthorized()

    try {
      req.auth = await tokens.verifyAccessToken(match[1])
    } catch {
      throw unauthorized('invalid_token', 'Access token is invalid or expired')
    }
    next()
  }
}

export function getAuth(req) {
  if (!req.auth) throw unauthorized()
  return req.auth
}

/**
 * Restricts a route to one account type (e.g. only `professional` accounts create loot).
 * Reads the account type from the database, not the token, so an upgrade or downgrade
 * takes effect immediately. Must run after `requireAuth`.
 */
export function requireAccountType(accountType) {
  return async (req, _res, next) => {
    const { userId } = getAuth(req)
    const user = await User.findById(userId).select('accountType').lean()
    if (!user) throw unauthorized('user_not_found', 'Account no longer exists')
    if (user.accountType !== accountType) {
      throw forbidden('account_type_required', `This action requires a ${accountType} account`)
    }
    next()
  }
}
