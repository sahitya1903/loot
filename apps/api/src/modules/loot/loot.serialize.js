import { LIVE_LOOT_STATUSES } from '@loot/shared'
import { fromPoint } from '../../lib/geo.js'
import { toBusinessSummary } from '../businesses/business.model.js'

/**
 * The status clients should show. Jobs flip live loot to `expired` within a minute of
 * expiryAt; until then, derive it so nothing ever displays as live past its expiry.
 */
export function effectiveStatus(loot, now = Date.now()) {
  if (LIVE_LOOT_STATUSES.includes(loot.status) && loot.expiryAt.getTime() <= now) return 'expired'
  return loot.status
}

export function remainingQuantity(loot) {
  return loot.totalQuantity == null ? null : Math.max(0, loot.totalQuantity - loot.claimCount)
}

function offerFields(loot) {
  return {
    offerText: loot.offerText ?? null,
    originalPrice: loot.originalPrice ?? null,
    offerPrice: loot.offerPrice ?? null,
    currency: loot.currency ?? 'INR',
    totalQuantity: loot.totalQuantity ?? null,
    remainingQuantity: remainingQuantity(loot),
  }
}

/** Full Loot (see @loot/shared models). */
export function toLoot(loot, business, viewer) {
  return {
    id: loot._id.toString(),
    businessId: loot.businessId.toString(),
    branchId: loot.branchId.toString(),
    business: toBusinessSummary(business),
    title: loot.title,
    description: loot.description,
    media: loot.media.map((m) => ({ url: m.url, thumbnailUrl: m.thumbnailUrl ?? null, mediaType: m.mediaType })),
    category: loot.category,
    tags: loot.tags,
    terms: loot.terms ?? null,
    ...offerFields(loot),
    location: { name: loot.locationName, address: loot.address },
    ...fromPoint(loot.location),
    geoHash: loot.geoHash,
    visibilityRadiusKm: loot.visibilityRadiusKm,
    status: effectiveStatus(loot),
    lootType: loot.lootType,
    redemptionType: loot.redemptionType,
    outletInfo: { hours: loot.outletInfo?.hours ?? null, phone: loot.outletInfo?.phone ?? null },
    createdAt: loot.createdAt.toISOString(),
    updatedAt: loot.updatedAt.toISOString(),
    publishedAt: loot.publishedAt?.toISOString() ?? null,
    expiryAt: loot.expiryAt.toISOString(),
    viewCount: loot.viewCount,
    saveCount: loot.saveCount,
    claimCount: loot.claimCount,
    redeemedCount: loot.redeemedCount,
    shareCount: loot.shareCount,
    trendingScore: loot.trendingScore,
    ...(viewer ? { viewer } : {}),
  }
}

/** Slim LootFeedItem for feeds and lists. */
export function toFeedItem(loot, business, { distanceKm = null, viewer } = {}) {
  const primary = loot.media[0]
  return {
    id: loot._id.toString(),
    businessId: loot.businessId.toString(),
    businessName: business?.businessName ?? '',
    businessUsername: business?.username ?? '',
    businessVerified: business?.verified ?? false,
    businessLogo: business?.logo ?? null,
    branchName: loot.locationName,
    title: loot.title,
    thumbnailUrl: primary ? (primary.thumbnailUrl ?? (primary.mediaType === 'image' ? primary.url : null)) : null,
    primaryMediaUrl: primary?.url ?? null,
    primaryMediaType: primary?.mediaType ?? 'image',
    category: loot.category,
    status: effectiveStatus(loot),
    ...offerFields(loot),
    expiryAt: loot.expiryAt.toISOString(),
    createdAt: loot.createdAt.toISOString(),
    ...fromPoint(loot.location),
    distanceKm,
    claimCount: loot.claimCount,
    saveCount: loot.saveCount,
    trendingScore: loot.trendingScore,
    ...(viewer ? { viewer } : {}),
  }
}

/** Payload of the `loot:counters` socket event. */
export function toLootCounters(loot) {
  return {
    lootId: loot._id.toString(),
    status: effectiveStatus(loot),
    claimCount: loot.claimCount,
    saveCount: loot.saveCount,
    remainingQuantity: remainingQuantity(loot),
  }
}
