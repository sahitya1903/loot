// Loot — follow API.
// Personal users follow businesses. There is no user→user follow in Loot.
// (For backwards compat with old call sites, this file re-exports the
//  business-follow callables from `business.ts`.)

export { followBusiness, unfollowBusiness } from './business.js'

import { getLootClient } from '../client.js'
import { doc, getDoc } from 'firebase/firestore'

/**
 * Is the calling user following this business?
 * Cheap direct read — used by the business-profile follow button.
 */
export async function isFollowingBusiness(businessId) {
  const { getCurrentUserId, getDb } = getLootClient()
  const uid = getCurrentUserId()
  if (!uid) return false
  const snap = await getDoc(doc(getDb(), 'users', uid, 'following', businessId))
  return snap.exists()
}
