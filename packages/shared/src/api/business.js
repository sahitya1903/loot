// Business — onboarding, profile, branches, follow.

import { apiRequest, pathParam } from '../client.js'

/**
 * @param {{ accountType: 'personal' | 'professional' }} req
 * @returns {Promise<{ user: import('../models.js').AppUser }>}
 */
export function chooseAccountType({ accountType }) {
  return apiRequest('PUT', '/v1/me/account-type', { body: { accountType } })
}

/**
 * Creates the signed-in user's business and upgrades them to a professional account.
 * @returns {Promise<{ business: import('../models.js').Business }>}
 */
export function onboardBusiness(req) {
  return apiRequest('POST', '/v1/businesses', { body: req })
}

export function updateBusiness(req) {
  return apiRequest('PATCH', '/v1/businesses/me', { body: req })
}

/** @returns {Promise<{ branch: import('../models.js').BranchLocation }>} */
export function addBranch(req) {
  return apiRequest('POST', '/v1/businesses/me/branches', { body: req })
}

export function removeBranch({ branchId }) {
  return apiRequest('DELETE', `/v1/businesses/me/branches/${pathParam(branchId)}`)
}

export function submitVerification(req) {
  return apiRequest('POST', '/v1/businesses/me/verification', { body: req })
}

export function followBusiness({ businessId }) {
  return apiRequest('PUT', `/v1/businesses/${pathParam(businessId)}/follow`)
}

export function unfollowBusiness({ businessId }) {
  return apiRequest('DELETE', `/v1/businesses/${pathParam(businessId)}/follow`)
}

/** @returns {Promise<{ business: import('../models.js').Business, isFollowing: boolean }>} */
export function getBusiness({ businessId }) {
  return apiRequest('GET', `/v1/businesses/${pathParam(businessId)}`)
}

/**
 * @param {{ businessId: string, status?: string, cursor?: string, limit?: number }} req
 *   status 'all_active' (default) = active + trending + expiring
 * @returns {Promise<import('../models.js').Page<import('../models.js').LootFeedItem>>}
 */
export function getBusinessLoot({ businessId, ...query }) {
  return apiRequest('GET', `/v1/businesses/${pathParam(businessId)}/loot`, { query })
}
