// Loot — domain models
// Authoritative TypeScript shapes shared across the web client.
// Mirrors Firestore + Cloud Function payloads.

export interface FirebaseTimestamp {
  _seconds: number
  _nanoseconds: number
}

// ============================================================================
// Account types
// ============================================================================

export type AccountType = 'personal' | 'professional'

export interface AppUser {
  userId: string
  name: string
  username: string
  profilePicture: string
  about: string
  phoneNumber?: string

  accountType: AccountType
  businessId?: string // set when accountType === 'professional'

  followingCount: number
  savesCount: number
  claimsCount: number

  serviceCity?: string
  serviceCityCoordinates?: GeoPoint
  interests?: string[]

  createdAt?: FirebaseTimestamp
  updatedAt?: FirebaseTimestamp
}

export interface Business {
  businessId: string
  ownerUserId: string
  businessName: string
  username: string // @-handle, unique
  category: BusinessCategory
  logo?: string
  banner?: string
  about?: string

  verified: boolean
  verifiedAt?: FirebaseTimestamp

  branchLocations: BranchLocation[]
  followersCount: number
  lootCount: number // active + trending + expiring
  totalClaimsCount: number
  analyticsEnabled: boolean

  createdAt: FirebaseTimestamp
  updatedAt: FirebaseTimestamp
}

export interface BranchLocation {
  branchId: string
  name: string
  address: string
  latitude: number
  longitude: number
  geoHash: string
  hours?: string
  phone?: string
}

// ============================================================================
// Loot
// ============================================================================

export type LootStatus = 'draft' | 'active' | 'trending' | 'expiring' | 'expired' | 'archived'

export type LootType = 'deal' | 'drop' | 'experience' | 'flash' | 'opportunity'

export type RedemptionType = 'in_store' | 'online_code' | 'first_come' | 'none'

export type LootMediaType = 'image' | 'video'

export interface LootMedia {
  s3Key: string
  thumbnailS3Key?: string
  mimeType: string
  mediaType: LootMediaType
  durationMs?: number
  width?: number
  height?: number
}

export interface GeoPoint {
  latitude: number
  longitude: number
}

export interface LootLocation {
  name: string
  placeId?: string
}

export interface OutletInfo {
  hours?: string
  instructions?: string
  phone?: string
}

export interface Loot {
  // identity
  id: string
  businessId: string
  branchId?: string

  // content
  title: string
  description: string
  media: LootMedia[]
  category: LootCategory
  tags: string[]
  terms?: string

  // geo
  location: LootLocation
  latitude: number
  longitude: number
  geoHash: string
  visibilityRadiusKm: number

  // lifecycle
  status: LootStatus
  lootType: LootType
  redemptionType: RedemptionType
  outletInfo?: OutletInfo

  // time — single expiry, never start/end pairs
  createdAt: FirebaseTimestamp
  updatedAt: FirebaseTimestamp
  expiryAt: FirebaseTimestamp

  // engagement (rolled up by Cloud Function counters)
  viewCount: number
  saveCount: number
  claimCount: number
  shareCount: number
  trendingScore: number
  velocityScore: number

  // boost (capped multiplier — never dominates ranking)
  boost?: LootBoost
}

export interface LootBoost {
  active: boolean
  multiplier: number // capped at 1.3
  startedAt: FirebaseTimestamp
  endsAt: FirebaseTimestamp
  paymentId?: string
}

// Slim shape returned by feed endpoints — avoids hydrating heavy fields
export interface LootFeedItem {
  id: string
  businessId: string
  businessName: string
  businessUsername: string
  businessVerified: boolean
  businessLogo?: string

  title: string
  thumbnailUrl?: string // signed CloudFront URL
  primaryMediaUrl?: string
  primaryMediaType: LootMediaType
  category: LootCategory

  status: LootStatus
  expiryAt: FirebaseTimestamp
  distanceKm: number
  claimCount: number
  saveCount: number
  trendingScore: number
}

// ============================================================================
// Categories
// ============================================================================

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
] as const

export type LootCategory = (typeof LOOT_CATEGORIES)[number]

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
] as const

export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number]

// ============================================================================
// Interactions
// ============================================================================

export interface LootSave {
  userId: string
  lootId: string
  savedAt: FirebaseTimestamp
}

export interface LootClaim {
  userId: string
  lootId: string
  claimedAt: FirebaseTimestamp
  redemptionId?: string // populated after redemption issuance
}

export interface LootShare {
  shareId: string
  userId: string
  lootId: string
  channel: 'native' | 'whatsapp' | 'copy_link' | 'other'
  sharedAt: FirebaseTimestamp
}

export interface LootView {
  viewId: string
  userId?: string
  lootId: string
  source: FeedSource
  timestamp: FirebaseTimestamp
  watchTimeMs?: number
}

export type FeedSource = 'nearby' | 'following' | 'trending' | 'fresh' | 'business' | 'search' | 'detail' | 'notification'

export interface LootReport {
  userId: string
  lootId: string
  reason: string
  description?: string
  reportedAt: FirebaseTimestamp
}

export interface LootReview {
  userId: string
  lootId: string
  rating: number // 1-5
  text?: string
  reviewedAt: FirebaseTimestamp
}

export interface Redemption {
  redemptionId: string
  userId: string
  lootId: string
  businessId: string
  branchId?: string
  redemptionType: RedemptionType
  code?: string // e.g. "LOOT-7Q3X"
  qrPayload?: string // for QR rendering
  status: 'issued' | 'used' | 'expired'
  issuedAt: FirebaseTimestamp
  expiresAt: FirebaseTimestamp
  usedAt?: FirebaseTimestamp
}

// ============================================================================
// Notifications
// ============================================================================

export type LootAlertType =
  | 'new_loot_nearby'
  | 'loot_ending_soon'
  | 'trending_near_you'
  | 'followed_business_drop'
  | 'claim_velocity'
  | 'redemption_reminder'

export interface LootAlert {
  alertId: string
  userId: string
  type: LootAlertType
  title: string
  body: string
  lootId?: string
  businessId?: string
  imageUrl?: string
  createdAt: FirebaseTimestamp
  readAt?: FirebaseTimestamp
}

// ============================================================================
// Subscription / Boost (pro accounts)
// ============================================================================

export type SubscriptionPeriod = 'monthly' | 'annual'

export interface ProSubscriptionPlan {
  planId: string
  name: string
  description: string
  monthlyLootLimit: number
  analyticsEnabled: boolean
  multiBranchEnabled: boolean
  period: SubscriptionPeriod
  priceINR: number
  razorpayPlanId: string
}

export interface ProSubscription {
  isActive: boolean
  status: string
  planName: string | null
  period: SubscriptionPeriod | null
  razorpayPlanId: string | null
  razorpaySubscriptionId: string | null
  willRenew: boolean
  expirationDate: FirebaseTimestamp | null
  currentStart: FirebaseTimestamp | null
  currentEnd: FirebaseTimestamp | null
  createdAt: FirebaseTimestamp
  updatedAt: FirebaseTimestamp
}

// ============================================================================
// Locality / trending
// ============================================================================

export interface LocalityTrend {
  geoCellId: string // geoHash-5
  cellName?: string // human-readable label e.g. "Indiranagar"
  topLootIds: string[]
  topCategories: { category: LootCategory; count: number }[]
  activeLootCount: number
  updatedAt: FirebaseTimestamp
}
