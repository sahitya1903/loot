import { conflict, forbidden, unauthorized } from '../lib/errors.js'
import { Business } from '../modules/businesses/business.model.js'
import { User } from '../modules/users/user.model.js'

function bearerToken(req) {
  const header = req.get('authorization')
  return header?.match(/^Bearer (.+)$/i)?.[1]
}

async function verify(tokens, token) {
  try {
    return await tokens.verifyAccessToken(token)
  } catch {
    throw unauthorized('invalid_token', 'Access token is invalid or expired')
  }
}

/** Verifies the `Authorization: Bearer <access token>` header and sets `req.auth`. */
export function requireAuth(tokens) {
  return async (req, _res, next) => {
    const token = bearerToken(req)
    if (!token) throw unauthorized()
    req.auth = await verify(tokens, token)
    next()
  }
}

/**
 * For public reads that personalize when signed in (feeds, loot details). No header: anonymous.
 * A bad or expired token is still a 401, so the client refreshes instead of silently losing state.
 */
export function optionalAuth(tokens) {
  return async (req, _res, next) => {
    const token = bearerToken(req)
    if (token) req.auth = await verify(tokens, token)
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

/**
 * Professional account that has completed business onboarding. Sets `req.business` to the
 * caller's own business, so handlers never trust a client-supplied business id.
 * Must run after `requireAuth` and `requireAccountType('professional')`.
 */
export function requireBusiness() {
  return async (req, _res, next) => {
    const business = await Business.findOne({ ownerUserId: getAuth(req).userId })
    if (!business) throw conflict('business_profile_required', 'Set up your business profile first')
    req.business = business
    next()
  }
}
