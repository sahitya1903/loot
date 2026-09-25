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
  type Unsubscribe,
} from 'firebase/firestore'
import { getFirebaseDb } from './config'
import type { AppUser, Business, Loot, LootAlert } from '@loot/shared/types'

function tsToWire(timestamp: Timestamp | null | undefined): { _seconds: number; _nanoseconds: number } {
  if (!timestamp) return { _seconds: 0, _nanoseconds: 0 }
  return { _seconds: timestamp.seconds, _nanoseconds: timestamp.nanoseconds }
}

// ============================================================================
// User
// ============================================================================

export async function createUserIfNotExists(
  userId: string,
  displayName?: string | null,
): Promise<{ profile: AppUser | null; isNewUser: boolean }> {
  const db = getFirebaseDb()
  const ref = doc(db, 'users', userId)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    const newUser: Partial<AppUser> = {
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
    return { profile: { ...newUser, accountType: 'personal' } as AppUser, isNewUser: true }
  }

  const data = snap.data()
  return {
    profile: hydrateUser(userId, data),
    isNewUser: false,
  }
}

export async function fetchUser(userId: string): Promise<AppUser | null> {
  const db = getFirebaseDb()
  const snap = await getDoc(doc(db, 'users', userId))
  if (!snap.exists()) return null
  return hydrateUser(userId, snap.data())
}

export const fetchUserProfile = fetchUser

function hydrateUser(userId: string, data: Record<string, unknown>): AppUser {
  return {
    userId,
    name: (data.name as string) || '',
    username: (data.username as string) || '',
    profilePicture: (data.profilePicture as string) || '',
    about: (data.about as string) || '',
    accountType: (data.accountType as AppUser['accountType']) || 'personal',
    businessId: data.businessId as string | undefined,
    phoneNumber: data.phoneNumber as string | undefined,
    followingCount: (data.followingCount as number) ?? 0,
    savesCount: (data.savesCount as number) ?? 0,
    claimsCount: (data.claimsCount as number) ?? 0,
    serviceCity: data.serviceCity as string | undefined,
    serviceCityCoordinates: data.serviceCityCoordinates as { latitude: number; longitude: number } | undefined,
    interests: data.interests as string[] | undefined,
    createdAt: data.createdAt instanceof Timestamp ? tsToWire(data.createdAt) : undefined,
    updatedAt: data.updatedAt instanceof Timestamp ? tsToWire(data.updatedAt) : undefined,
  }
}

// ============================================================================
// Business
// ============================================================================

export async function fetchBusiness(businessId: string): Promise<Business | null> {
  const db = getFirebaseDb()
  const snap = await getDoc(doc(db, 'businesses', businessId))
  if (!snap.exists()) return null
  return snap.data() as Business
}

// ============================================================================
// Loot
// ============================================================================

export async function fetchLoot(lootId: string): Promise<Loot | null> {
  const db = getFirebaseDb()
  const snap = await getDoc(doc(db, 'loots', lootId))
  if (!snap.exists()) return null
  return snap.data() as Loot
}

export function subscribeToLoot(lootId: string, cb: (loot: Loot | null) => void): Unsubscribe {
  const db = getFirebaseDb()
  return onSnapshot(doc(db, 'loots', lootId), (snap) => {
    cb(snap.exists() ? (snap.data() as Loot) : null)
  })
}

export function subscribeToMyAlerts(
  userId: string,
  max = 30,
  cb: (alerts: LootAlert[]) => void,
): Unsubscribe {
  const db = getFirebaseDb()
  const q = query(
    collection(db, 'users', userId, 'notifications'),
    orderBy('createdAt', 'desc'),
    limit(max),
  )
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ alertId: d.id, ...(d.data() as Omit<LootAlert, 'alertId'>) })))
  })
}

export async function hasSavedLoot(userId: string, lootId: string): Promise<boolean> {
  const db = getFirebaseDb()
  const snap = await getDoc(doc(db, 'users', userId, 'savedLoot', lootId))
  return snap.exists()
}

export async function hasClaimedLoot(userId: string, lootId: string): Promise<boolean> {
  const db = getFirebaseDb()
  const snap = await getDoc(doc(db, 'users', userId, 'claimedLoot', lootId))
  return snap.exists()
}

// ============================================================================
// Search (basic, by-username; richer search lives in the Cloud Function)
// ============================================================================

export async function searchBusinesses(searchQuery: string, max = 20): Promise<Business[]> {
  const db = getFirebaseDb()
  const lower = searchQuery.toLowerCase().trim()
  if (!lower) return []
  const q = query(
    collection(db, 'businesses'),
    where('username', '>=', lower),
    where('username', '<=', lower + ''),
    limit(max),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data() as Business)
}
