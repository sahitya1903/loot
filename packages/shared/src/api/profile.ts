// Profile API client.

import { callFunction, getLootClient } from '../client'
import { doc, getDoc } from 'firebase/firestore'
import type {
  UpdateProfileRequest, UpdateProfileResponse,
  GenericResponse,
} from '../types'

export function updateProfile(req: UpdateProfileRequest) {
  return callFunction<UpdateProfileRequest, UpdateProfileResponse>('updateProfile', req)
}

export function updateUsername(username: string) {
  return callFunction<{ username: string }, GenericResponse>('updateUsername', { username })
}

export function getProfilePictureUploadUrl() {
  return callFunction<Record<string, never>, {
    success: boolean
    uploadUrl?: string
    fields?: Record<string, string>
    s3Key?: string
  }>('getProfilePictureUploadUrl', {})
}

export function deleteProfilePicture() {
  return callFunction<Record<string, never>, GenericResponse>('deleteProfilePicture', {})
}

// Quick counter reads for trivial UI badges.
export async function getFollowingCount(userId: string): Promise<number> {
  return readCounter(userId, 'followingCount')
}

export async function getSavesCount(userId: string): Promise<number> {
  return readCounter(userId, 'savesCount')
}

export async function getClaimsCount(userId: string): Promise<number> {
  return readCounter(userId, 'claimsCount')
}

async function readCounter(userId: string, field: string): Promise<number> {
  try {
    const db = getLootClient().getDb()
    const snap = await getDoc(doc(db, 'users', userId))
    if (snap.exists() && typeof snap.data()[field] === 'number') {
      return snap.data()[field] as number
    }
  } catch (e) {
    console.error(`profile.readCounter(${field}) failed`, e)
  }
  return 0
}
