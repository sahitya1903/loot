// Loot — follow API.
// Personal users follow businesses. There is no user→user follow in Loot.
// (For backwards compat with old call sites, this file re-exports the
//  business-follow callables from `business.ts`.)

export { followBusiness, unfollowBusiness } from './business'

import { getFirebaseDb, getFirebaseAuth } from '@/lib/firebase/config'
import { doc, getDoc } from 'firebase/firestore'

/**
 * Is the calling user following this business?
 * Cheap direct read — used by the business-profile follow button.
 */
export async function isFollowingBusiness(businessId: string): Promise<boolean> {
  const auth = getFirebaseAuth()
  const me = auth.currentUser
  if (!me) return false
  const db = getFirebaseDb()
  const snap = await getDoc(doc(db, 'users', me.uid, 'following', businessId))
  return snap.exists()
}
