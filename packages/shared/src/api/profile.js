// Profile API client.

import { callFunction, getLootClient } from '../client.js'
import { doc, getDoc } from 'firebase/firestore'

export function updateProfile(req) {
  return callFunction('updateProfile', req)
}

export function updateUsername(username) {
  return callFunction('updateUsername', { username })
}

export function getProfilePictureUploadUrl() {
  return callFunction('getProfilePictureUploadUrl', {})
}

export function deleteProfilePicture() {
  return callFunction('deleteProfilePicture', {})
}

// Quick counter reads for trivial UI badges.
export async function getFollowingCount(userId) {
  return readCounter(userId, 'followingCount')
}

export async function getSavesCount(userId) {
  return readCounter(userId, 'savesCount')
}

export async function getClaimsCount(userId) {
  return readCounter(userId, 'claimsCount')
}

async function readCounter(userId, field) {
  try {
    const db = getLootClient().getDb()
    const snap = await getDoc(doc(db, 'users', userId))
    if (snap.exists() && typeof snap.data()[field] === 'number') {
      return snap.data()[field]
    }
  } catch (e) {
    console.error(`profile.readCounter(${field}) failed`, e)
  }
  return 0
}
