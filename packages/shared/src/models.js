// Loot domain model: enum values (used for validation on both sides) and JSDoc
// shapes of what the API returns. Timestamps are ISO-8601 strings.

export const ACCOUNT_TYPES = ['personal', 'professional']

export const LOOT_STATUSES = ['draft', 'active', 'trending', 'expiring', 'expired', 'archived']

export const LOOT_TYPES = ['deal', 'drop', 'experience', 'flash', 'opportunity']

export const REDEMPTION_TYPES = ['in_store', 'online_code', 'first_come', 'none']

export const LOOT_CATEGORIES = [
  'food_drink',
  'nightlife',
  'retail',
  'wellness',
  'entertainment',
  'services',
  'experiences',
  'flash_commerce',
  'creator',
  'other',
]

export const BUSINESS_CATEGORIES = [
  'cafe',
  'restaurant',
  'bar_club',
  'retail_store',
  'salon_spa',
  'gym_studio',
  'venue',
  'service_provider',
  'creator',
  'other',
]

export const FEED_SOURCES = ['nearby', 'following', 'trending', 'fresh', 'business', 'search', 'detail', 'notification']

export const SHARE_CHANNELS = ['native', 'whatsapp', 'copy_link', 'other']

export const LOOT_ALERT_TYPES = [
  'new_loot_nearby',
  'loot_ending_soon',
  'trending_near_you',
  'followed_business_drop',
  'claim_velocity',
  'redemption_reminder',
]

/** Boost multipliers are capped so paid reach never dominates ranking. */
export const MAX_BOOST_MULTIPLIER = 1.3

/**
 * @typedef {object} AppUser
 * @property {string} userId
 * @property {string} phoneNumber
 * @property {string} name
 * @property {string | null} username
 * @property {string} profilePicture
 * @property {string} about
 * @property {'personal' | 'professional'} accountType
 * @property {string | null} businessId set when accountType is 'professional'
 * @property {number} followingCount
 * @property {number} savesCount
 * @property {number} claimsCount
 * @property {string | null} serviceCity
 * @property {string[]} interests
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {object} BranchLocation
 * @property {string} branchId
 * @property {string} name
 * @property {string} address
 * @property {number} latitude
 * @property {number} longitude
 * @property {string} geoHash
 * @property {string} [hours]
 * @property {string} [phone]
 */

/**
 * @typedef {object} Business
 * @property {string} businessId
 * @property {string} ownerUserId
 * @property {string} businessName
 * @property {string} username unique @-handle
 * @property {string} category one of BUSINESS_CATEGORIES
 * @property {string} [logo]
 * @property {string} [banner]
 * @property {string} [about]
 * @property {boolean} verified
 * @property {string} [verifiedAt]
 * @property {BranchLocation[]} branchLocations
 * @property {number} followersCount
 * @property {number} lootCount active + trending + expiring
 * @property {number} totalClaimsCount
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {object} LootMedia
 * @property {string} key storage key
 * @property {string} [thumbnailKey]
 * @property {string} mimeType
 * @property {'image' | 'video'} mediaType
 * @property {number} [durationMs]
 * @property {number} [width]
 * @property {number} [height]
 */

/**
 * @typedef {object} Loot
 * @property {string} id
 * @property {string} businessId
 * @property {string} [branchId]
 * @property {string} title
 * @property {string} description
 * @property {LootMedia[]} media
 * @property {string} category one of LOOT_CATEGORIES
 * @property {string[]} tags
 * @property {string} [terms]
 * @property {{ name: string, placeId?: string }} location
 * @property {number} latitude
 * @property {number} longitude
 * @property {string} geoHash
 * @property {number} visibilityRadiusKm
 * @property {string} status one of LOOT_STATUSES
 * @property {string} lootType one of LOOT_TYPES
 * @property {string} redemptionType one of REDEMPTION_TYPES
 * @property {{ hours?: string, instructions?: string, phone?: string }} [outletInfo]
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string} expiryAt single expiry, never start/end pairs
 * @property {number} viewCount
 * @property {number} saveCount
 * @property {number} claimCount
 * @property {number} shareCount
 * @property {number} trendingScore
 * @property {number} velocityScore
 * @property {{ active: boolean, multiplier: number, startedAt: string, endsAt: string }} [boost]
 */

/**
 * Slim shape returned by feed endpoints.
 * @typedef {object} LootFeedItem
 * @property {string} id
 * @property {string} businessId
 * @property {string} businessName
 * @property {string} businessUsername
 * @property {boolean} businessVerified
 * @property {string} [businessLogo]
 * @property {string} title
 * @property {string} [thumbnailUrl]
 * @property {string} [primaryMediaUrl]
 * @property {'image' | 'video'} primaryMediaType
 * @property {string} category
 * @property {string} status
 * @property {string} expiryAt
 * @property {number} distanceKm
 * @property {number} claimCount
 * @property {number} saveCount
 * @property {number} trendingScore
 */

/**
 * @typedef {object} Redemption
 * @property {string} redemptionId
 * @property {string} userId
 * @property {string} lootId
 * @property {string} businessId
 * @property {string} [branchId]
 * @property {string} redemptionType
 * @property {string} [code] e.g. "LOOT-7Q3X"
 * @property {string} [qrPayload]
 * @property {'issued' | 'used' | 'expired'} status
 * @property {string} issuedAt
 * @property {string} expiresAt
 * @property {string} [usedAt]
 */

/**
 * @typedef {object} LootAlert
 * @property {string} alertId
 * @property {string} type one of LOOT_ALERT_TYPES
 * @property {string} title
 * @property {string} body
 * @property {string} [lootId]
 * @property {string} [businessId]
 * @property {string} [imageUrl]
 * @property {string} createdAt
 * @property {string} [readAt]
 */

/**
 * Cursor-paginated list response.
 * @template T
 * @typedef {object} Page
 * @property {T[]} items
 * @property {string | null} cursor pass back to get the next page; null at the end
 */
