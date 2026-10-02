// Loot — direct Firestore reads + real-time listeners.
// Mutations should always go through Cloud Functions in `lib/api/*`.

import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore'
import { getFirebaseDb } from './config'

function tsToWire(timestamp) {
  if (!timestamp) return { _seconds: 0, _nanoseconds: 0 }
  return { _seconds: timestamp.seconds, _nanoseconds: timestamp.nanoseconds }
}

// ============================================================================
// User
// ============================================================================

export async function createUserIfNotExists(userId, displayName) {
  const db = getFirebaseDb()
  const ref = doc(db, 'users', userId)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    const newUser = {
      userId,
      name: displayName || '',
      username: '',
      profilePicture: '',
      about: '',
      // accountType is intentionally NOT set here — user picks personal/professional in onboarding.
      followingCount: 0,
      savesCount: 0,
      claimsCount: 0,
    }
    await setDoc(ref, { ...newUser, createdAt: Timestamp.now(), updatedAt: Timestamp.now() })
    return { profile: { ...newUser, accountType: 'personal' }, isNewUser: true }
  }

  const data = snap.data()
  return {
    profile: hydrateUser(userId, data),
    isNewUser: false,
  }
}

export async function fetchUser(userId) {
  const db = getFirebaseDb()
  const snap = await getDoc(doc(db, 'users', userId))
  if (!snap.exists()) return null
  return hydrateUser(userId, snap.data())
}

export const fetchUserProfile = fetchUser

function hydrateUser(userId, data) {
  return {
    userId,
    name: data.name || '',
    username: data.username || '',
    profilePicture: data.profilePicture || '',
    about: data.about || '',
    accountType: data.accountType || 'personal',
    businessId: data.businessId,
    phoneNumber: data.phoneNumber,
    followingCount: data.followingCount ?? 0,
    savesCount: data.savesCount ?? 0,
    claimsCount: data.claimsCount ?? 0,
    serviceCity: data.serviceCity,
    serviceCityCoordinates: data.serviceCityCoordinates,
    interests: data.interests,
    createdAt: data.createdAt instanceof Timestamp ? tsToWire(data.createdAt) : undefined,
    updatedAt: data.updatedAt instanceof Timestamp ? tsToWire(data.updatedAt) : undefined,
  }
}

// ============================================================================
// Business
// ============================================================================

export async function fetchBusiness(businessId) {
  const db = getFirebaseDb()
  const snap = await getDoc(doc(db, 'businesses', businessId))
  if (!snap.exists()) return null
  return snap.data()
}

// ============================================================================
// Loot
// ============================================================================

export async function fetchLoot(lootId) {
  const db = getFirebaseDb()
  const snap = await getDoc(doc(db, 'loots', lootId))
  if (!snap.exists()) return null
  return snap.data()
}

export function subscribeToLoot(lootId, cb) {
  const db = getFirebaseDb()
  return onSnapshot(doc(db, 'loots', lootId), (snap) => {
    cb(snap.exists() ? snap.data() : null)
  })
}

export function subscribeToMyAlerts(userId, max = 30, cb) {
  const db = getFirebaseDb()
  const q = query(
    collection(db, 'users', userId, 'notifications'),
    orderBy('createdAt', 'desc'),
    limit(max)
  )
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ alertId: d.id, ...d.data() })))
  })
}

export async function hasSavedLoot(userId, lootId) {
  const db = getFirebaseDb()
  const snap = await getDoc(doc(db, 'users', userId, 'savedLoot', lootId))
  return snap.exists()
}

export async function hasClaimedLoot(userId, lootId) {
  const db = getFirebaseDb()
  const snap = await getDoc(doc(db, 'users', userId, 'claimedLoot', lootId))
  return snap.exists()
}

// ============================================================================
// Search (basic, by-username; richer search lives in the Cloud Function)
// ============================================================================

export async function searchBusinesses(searchQuery, max = 20) {
  const db = getFirebaseDb()
  const lower = searchQuery.toLowerCase().trim()
  if (!lower) return []
  const q = query(
    collection(db, 'businesses'),
    where('username', '>=', lower),
    where('username', '<=', lower + ''),
    limit(max)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data())
}
