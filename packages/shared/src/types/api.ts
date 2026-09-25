// Loot — API request/response types for Cloud Functions
// All callable functions live in asia-south1.

import type {
  AppUser,
  Business,
  BranchLocation,
  Loot,
  LootFeedItem,
  LootMedia,
  LootCategory,
  LootStatus,
  LootType,
  RedemptionType,
  Redemption,
  LootAlert,
  LocalityTrend,
  AccountType,
  BusinessCategory,
} from './models'

// ============================================================================
// Auth
// ============================================================================

export interface SendOtpRequest {
  phoneNumber: string
}

export interface SendOtpResponse {
  success: boolean
  errorMessage?: string
}

export interface VerifyOtpRequest {
  phoneNumber: string
  otp: string
}

export interface VerifyOtpResponse {
  success: boolean
  token?: string
  errorMessage?: string
}

// ============================================================================
// Profile
// ============================================================================

export interface UpdateProfileRequest {
  name?: string
  username?: string
  about?: string
  serviceCity?: string
  serviceCityCoordinates?: { latitude: number; longitude: number }
  interests?: string[]
}

export interface UpdateProfileResponse {
  success: boolean
  errorMessage?: string
}

export interface ChooseAccountTypeRequest {
  accountType: AccountType
}

export interface ChooseAccountTypeResponse {
  success: boolean
  businessId?: string // returned when accountType === 'professional'
  errorMessage?: string
}

// ============================================================================
// Business onboarding (pro only)
// ============================================================================

export interface OnboardBusinessRequest {
  businessName: string
  username: string
  category: BusinessCategory
  about?: string
  branchLocations: Array<{
    name: string
    address: string
    latitude: number
    longitude: number
    hours?: string
    phone?: string
  }>
}

export interface OnboardBusinessResponse {
  success: boolean
  businessId?: string
  errorMessage?: string
}

export interface UpdateBusinessRequest {
  businessName?: string
  about?: string
  category?: BusinessCategory
  logo?: string
  banner?: string
}

export interface UpdateBusinessResponse {
  success: boolean
  errorMessage?: string
}

export interface AddBranchRequest {
  name: string
  address: string
  latitude: number
  longitude: number
  hours?: string
  phone?: string
}

export interface AddBranchResponse {
  success: boolean
  branch?: BranchLocation
  errorMessage?: string
}

export interface RemoveBranchRequest {
  branchId: string
}

export interface SubmitVerificationRequest {
  documentType: 'gst' | 'business_license' | 'utility_bill' | 'other'
  documentS3Key: string
  notes?: string
}

export interface SubmitVerificationResponse {
  success: boolean
  status: 'submitted' | 'under_review' | 'rejected'
  errorMessage?: string
}

// ============================================================================
// Loot CRUD (pro only)
// ============================================================================

export interface CreateLootRequest {
  title: string
  description: string
  category: LootCategory
  tags?: string[]
  lootType: LootType
  redemptionType: RedemptionType
  expiryAt: number // ms timestamp; must be future
  visibilityRadiusKm?: number // default 5
  branchId?: string
  outletInfo?: { hours?: string; instructions?: string; phone?: string }
  terms?: string
  // media is uploaded separately via getLootUploadUrl, then attached
  mediaCount: number
}

export interface CreateLootResponse {
  success: boolean
  lootId?: string
  uploadSlots?: Array<{ slot: number; uploadUrl: string; s3Key: string }>
  errorMessage?: string
}

export interface UpdateLootRequest {
  lootId: string
  title?: string
  description?: string
  category?: LootCategory
  tags?: string[]
  expiryAt?: number
  visibilityRadiusKm?: number
  outletInfo?: { hours?: string; instructions?: string; phone?: string }
  terms?: string
}

export interface UpdateLootResponse {
  success: boolean
  errorMessage?: string
}

export interface ArchiveLootRequest {
  lootId: string
}

export interface DeleteLootRequest {
  lootId: string
}

export interface AttachLootMediaRequest {
  lootId: string
  media: Array<Pick<LootMedia, 's3Key' | 'mimeType' | 'mediaType' | 'durationMs' | 'width' | 'height'>>
}

export interface GetLootRequest {
  lootId: string
}

export interface GetLootResponse {
  success: boolean
  loot?: Loot
  mediaUrls?: string[] // signed
  errorMessage?: string
}

export interface GetLootMediaUrlsRequest {
  lootId: string
}

export interface GetLootMediaUrlsResponse {
  success: boolean
  urls?: Array<{ url: string; thumbnailUrl?: string; mimeType: string }>
  errorMessage?: string
}

export interface TrackLootViewRequest {
  lootId: string
  source: 'nearby' | 'following' | 'trending' | 'fresh' | 'business' | 'search' | 'detail' | 'notification'
  watchTimeMs?: number
}

// ============================================================================
// Feeds
// ============================================================================

export interface NearbyFeedRequest {
  latitude: number
  longitude: number
  radiusKm?: number // default = user setting or 5
  category?: LootCategory
  cursor?: string
  limit?: number // default 20
}

export interface FeedResponse {
  success: boolean
  items: LootFeedItem[]
  cursor?: string
  hasMore: boolean
  errorMessage?: string
}

export interface FollowingFeedRequest {
  cursor?: string
  limit?: number
}

export interface TrendingFeedRequest {
  geoCellId?: string
  latitude?: number
  longitude?: number
  category?: LootCategory
  cursor?: string
  limit?: number
}

export interface FreshFeedRequest {
  latitude: number
  longitude: number
  radiusKm?: number
  category?: LootCategory
  cursor?: string
  limit?: number
}

// ============================================================================
// Discovery
// ============================================================================

export interface CategoryFeedRequest {
  category: LootCategory
  latitude: number
  longitude: number
  radiusKm?: number
  cursor?: string
  limit?: number
}

export interface LocalityTrendRequest {
  geoCellId: string
}

export interface LocalityTrendResponse {
  success: boolean
  trend?: LocalityTrend
  errorMessage?: string
}

export interface SearchLootRequest {
  query: string
  latitude?: number
  longitude?: number
  category?: LootCategory
  limit?: number
}

export interface SearchLootResponse {
  success: boolean
  items: LootFeedItem[]
  errorMessage?: string
}

// ============================================================================
// Claim / save (personal only)
// ============================================================================

export interface ClaimLootRequest {
  lootId: string
}

export interface ClaimLootResponse {
  success: boolean
  redemption?: Redemption
  errorMessage?: string
}

export interface SaveLootRequest {
  lootId: string
}

export interface UnsaveLootRequest {
  lootId: string
}

export interface ShareLootRequest {
  lootId: string
  channel: 'native' | 'whatsapp' | 'copy_link' | 'other'
}

export interface GetMySavedLootRequest {
  cursor?: string
  limit?: number
}

export interface GetMyClaimedLootRequest {
  cursor?: string
  limit?: number
}

export interface GetMySavedLootResponse {
  success: boolean
  items: LootFeedItem[]
  cursor?: string
  hasMore: boolean
}

export interface GetMyClaimedLootResponse {
  success: boolean
  items: Array<LootFeedItem & { redemption: Redemption }>
  cursor?: string
  hasMore: boolean
}

export interface GetRedemptionRequest {
  redemptionId: string
}

export interface GetRedemptionResponse {
  success: boolean
  redemption?: Redemption
  errorMessage?: string
}

// ============================================================================
// Follow
// ============================================================================

export interface FollowBusinessRequest {
  businessId: string
}

export interface UnfollowBusinessRequest {
  businessId: string
}

export interface GenericResponse {
  success: boolean
  message?: string
  errorMessage?: string
}

// ============================================================================
// Business public surfaces
// ============================================================================

export interface GetBusinessRequest {
  businessId: string
}

export interface GetBusinessResponse {
  success: boolean
  business?: Business
  isFollowing?: boolean
  errorMessage?: string
}

export interface GetBusinessLootRequest {
  businessId: string
  status?: LootStatus | 'all_active' // 'all_active' = active + trending + expiring
  cursor?: string
  limit?: number
}

export interface GetBusinessLootResponse {
  success: boolean
  items: LootFeedItem[]
  cursor?: string
  hasMore: boolean
}

// ============================================================================
// Boost (pro only)
// ============================================================================

export interface CreateBoostRequest {
  lootId: string
  durationHours: 6 | 12 | 24 | 48
}

export interface CreateBoostResponse {
  success: boolean
  razorpayOrderId?: string
  razorpayKey?: string
  amountINR?: number
  errorMessage?: string
}

// ============================================================================
// Analytics (pro only)
// ============================================================================

export interface GetLootAnalyticsRequest {
  lootId: string
}

export interface LootAnalyticsResponse {
  success: boolean
  data?: {
    impressions: number
    uniqueViewers: number
    saves: number
    claims: number
    shares: number
    claimRate: number // claims / uniqueViewers
    completionRate: number // redemptions used / claims
    timeline: Array<{ hour: number; impressions: number; claims: number }>
    topCategories?: Array<{ category: LootCategory; count: number }>
  }
  errorMessage?: string
}

export interface GetBusinessAnalyticsRequest {
  rangeDays?: 7 | 30 | 90
}

export interface BusinessAnalyticsResponse {
  success: boolean
  data?: {
    activeLoot: number
    totalImpressions: number
    totalClaims: number
    totalShares: number
    followerGrowth: number
    branchPerformance: Array<{
      branchId: string
      name: string
      claims: number
      impressions: number
    }>
  }
  errorMessage?: string
}

// ============================================================================
// Notifications
// ============================================================================

export interface ListLootAlertsRequest {
  cursor?: string
  limit?: number
}

export interface ListLootAlertsResponse {
  success: boolean
  alerts: LootAlert[]
  cursor?: string
  hasMore: boolean
}

export interface MarkAlertReadRequest {
  alertId: string
}

// ============================================================================
// Reports / reviews
// ============================================================================

export interface ReportLootRequest {
  lootId: string
  reason: string
  description?: string
}

export interface ReviewLootRequest {
  lootId: string
  rating: number // 1-5
  text?: string
}
