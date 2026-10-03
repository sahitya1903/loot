// Profile — the signed-in user's own account.

import { apiRequest } from '../client.js'

/**
 * @param {{ name?: string, username?: string, about?: string, serviceCity?: string, interests?: string[] }} req
 * @returns {Promise<{ user: import('../models.js').AppUser }>}
 */
export function updateProfile(req) {
  return apiRequest('PATCH', '/v1/me', { body: req })
}

export function updateUsername(username) {
  return updateProfile({ username })
}

/** @returns {Promise<{ uploadUrl: string, fields?: Record<string, string>, key: string }>} */
export function getProfilePictureUploadUrl() {
  return apiRequest('POST', '/v1/me/profile-picture/upload-url')
}

export function deleteProfilePicture() {
  return apiRequest('DELETE', '/v1/me/profile-picture')
}
