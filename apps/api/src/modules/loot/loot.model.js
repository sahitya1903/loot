import { LIVE_LOOT_STATUSES, LOOT_CATEGORIES, LOOT_STATUSES, LOOT_TYPES, REDEMPTION_TYPES } from '@loot/shared'
import { Schema, model } from 'mongoose'
import { pointSchema } from '../../lib/geo.js'

const mediaSchema = new Schema(
  {
    url: { type: String, required: true },
    thumbnailUrl: { type: String },
    mediaType: { type: String, enum: ['image', 'video'], required: true },
  },
  { _id: false },
)

const lootSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    branchId: { type: Schema.Types.ObjectId, required: true },

    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, enum: LOOT_CATEGORIES, required: true },
    lootType: { type: String, enum: LOOT_TYPES, default: 'deal' },
    redemptionType: { type: String, enum: REDEMPTION_TYPES, default: 'in_store' },
    tags: { type: [String], default: [] },
    terms: { type: String },
    media: { type: [mediaSchema], default: [] },

    offerText: { type: String },
    originalPrice: { type: Number },
    offerPrice: { type: Number },
    currency: { type: String, default: 'INR' },

    // null = unlimited. claimCount only moves through conditional $inc (see claims), so
    // claimCount <= totalQuantity always holds.
    totalQuantity: { type: Number, default: null },
    claimCount: { type: Number, default: 0 },
    redeemedCount: { type: Number, default: 0 },
    saveCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    trendingScore: { type: Number, default: 0 },

    // Copied from the branch so the feed is a single $geoNear.
    location: { type: pointSchema, required: true },
    geoHash: { type: String, required: true },
    locationName: { type: String, required: true },
    address: { type: String, default: '' },
    outletInfo: { hours: String, phone: String },
    visibilityRadiusKm: { type: Number, default: 10 },

    status: { type: String, enum: LOOT_STATUSES, default: 'draft', required: true },
    // Single expiry, never start/end pairs. No TTL index: expired loot is kept for history.
    expiryAt: { type: Date, required: true },
    publishedAt: { type: Date },
    expiredAt: { type: Date },
    archivedAt: { type: Date },

    boost: {
      type: new Schema({ active: Boolean, multiplier: Number, startedAt: Date, endsAt: Date }, { _id: false }),
      default: undefined,
    },
  },
  { collection: 'loot', timestamps: true },
)

// Nearby/Fresh feeds: $geoNear with { status, expiryAt } in its query.
lootSchema.index({ location: '2dsphere', status: 1, expiryAt: 1 })
// A business's own loot lists.
lootSchema.index({ businessId: 1, status: 1, _id: -1 })
// Lifecycle sweeper.
lootSchema.index({ status: 1, expiryAt: 1 })

export const Loot = model('Loot', lootSchema)

/** Mongo filter for loot a customer can see and claim right now. */
export function liveLootFilter(now = new Date()) {
  return { status: { $in: LIVE_LOOT_STATUSES }, expiryAt: { $gt: now } }
}
