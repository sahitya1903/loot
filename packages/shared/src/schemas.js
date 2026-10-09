// Request schemas (zod) shared by apps/api (validation) and the apps (forms).
// The API is the authority: it parses every body and query with these, so a
// client that skips them still gets a 400 `validation_failed`.

import { z } from 'zod'
import {
  ACCOUNT_TYPES,
  BUSINESS_CATEGORIES,
  FEED_SOURCES,
  LOOT_CATEGORIES,
  LOOT_TYPES,
  REDEMPTION_TYPES,
  SHARE_CHANNELS,
} from './models.js'

const MINUTE_MS = 60_000
const DAY_MS = 24 * 60 * MINUTE_MS

/** A loot must stay live at least this long after it is published. */
export const MIN_LOOT_LIFETIME_MS = 5 * MINUTE_MS
/** Loot is urgent by design: no expiry further out than this. */
export const MAX_LOOT_LIFETIME_MS = 30 * DAY_MS

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Must be a valid id')

const latitude = z.coerce.number().min(-90).max(90)
const longitude = z.coerce.number().min(-180).max(180)
const webUrl = z.url({ protocol: /^https?$/, message: 'Must be an http(s) URL' })
const optionalText = (max) => z.string().trim().max(max).optional()

export const username = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_.]{3,30}$/, '3-30 letters, numbers, dots or underscores')

// ---------------------------------------------------------------- profile

export const UpdateProfileBody = z
  .object({
    name: optionalText(60),
    username: username.optional(),
    about: optionalText(300),
    serviceCity: optionalText(60),
    interests: z.array(z.enum(LOOT_CATEGORIES)).max(LOOT_CATEGORIES.length).optional(),
  })
  .strict()

export const AccountTypeBody = z.object({ accountType: z.enum(ACCOUNT_TYPES) })

// ---------------------------------------------------------------- business

export const BranchBody = z.object({
  name: z.string().trim().min(1).max(80),
  address: z.string().trim().min(1).max(200),
  latitude,
  longitude,
  hours: optionalText(100),
  phone: optionalText(20),
})

export const OnboardBusinessBody = z.object({
  businessName: z.string().trim().min(2).max(80),
  username,
  category: z.enum(BUSINESS_CATEGORIES),
  about: optionalText(500),
  logo: webUrl.optional(),
  banner: webUrl.optional(),
  /** Every business starts with one operating location. */
  branch: BranchBody,
})

export const UpdateBusinessBody = z
  .object({
    businessName: z.string().trim().min(2).max(80).optional(),
    category: z.enum(BUSINESS_CATEGORIES).optional(),
    about: optionalText(500),
    logo: webUrl.optional(),
    banner: webUrl.optional(),
  })
  .strict()

// ---------------------------------------------------------------- loot

export const LootMediaInput = z.object({
  url: webUrl,
  mediaType: z.enum(['image', 'video']),
  thumbnailUrl: webUrl.optional(),
})

const price = z.coerce.number().min(0).max(10_000_000)

const lootFields = z.object({
  title: z.string().trim().min(3).max(80),
  description: z.string().trim().max(1000).default(''),
  category: z.enum(LOOT_CATEGORIES),
  lootType: z.enum(LOOT_TYPES).default('deal'),
  redemptionType: z.enum(REDEMPTION_TYPES).default('in_store'),
  branchId: objectId,
  /** Short headline for the offer, e.g. "Buy 1 Get 1" or "40% off". */
  offerText: optionalText(60),
  originalPrice: price.optional(),
  offerPrice: price.optional(),
  /** null (or omitted) = unlimited. */
  totalQuantity: z.coerce.number().int().min(1).max(100_000).nullable().optional(),
  expiryAt: z.coerce.date(),
  media: z.array(LootMediaInput).max(10).default([]),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
  terms: optionalText(500),
  visibilityRadiusKm: z.coerce.number().min(1).max(50).default(10),
})

/**
 * Checks that need the whole loot (or the merged result of an update):
 * the offer is described, the price drops, the expiry is in range.
 * @param {{ offerText?: string, originalPrice?: number, offerPrice?: number, expiryAt?: Date }} loot
 * @param {{ addIssue: (issue: object) => void }} ctx
 * @param {number} [now]
 */
export function checkLootRules(loot, ctx, now = Date.now()) {
  if (!loot.offerText && loot.offerPrice === undefined) {
    ctx.addIssue({ code: 'custom', path: ['offerText'], message: 'Describe the offer or set an offer price' })
  }
  if (loot.offerPrice !== undefined && loot.originalPrice !== undefined && loot.offerPrice > loot.originalPrice) {
    ctx.addIssue({ code: 'custom', path: ['offerPrice'], message: 'Offer price cannot be above the original price' })
  }
  if (loot.expiryAt) {
    const ms = loot.expiryAt.getTime()
    if (ms < now + MIN_LOOT_LIFETIME_MS) {
      ctx.addIssue({ code: 'custom', path: ['expiryAt'], message: 'Must be at least 5 minutes from now' })
    } else if (ms > now + MAX_LOOT_LIFETIME_MS) {
      ctx.addIssue({ code: 'custom', path: ['expiryAt'], message: 'Must be within 30 days' })
    }
  }
}

export const CreateLootBody = lootFields
  .extend({ status: z.enum(['draft', 'active']).default('active') })
  .superRefine((loot, ctx) => checkLootRules(loot, ctx))

/**
 * Every field optional; `null` clears offerText/prices/quantity/terms. Status changes use publish/archive.
 * Fields with defaults are redeclared without them: `.partial()` would still fill defaults in.
 */
export const UpdateLootBody = lootFields
  .extend({
    lootType: z.enum(LOOT_TYPES),
    redemptionType: z.enum(REDEMPTION_TYPES),
    description: z.string().trim().max(1000),
    media: z.array(LootMediaInput).max(10),
    tags: z.array(z.string().trim().min(1).max(30)).max(10),
    visibilityRadiusKm: z.coerce.number().min(1).max(50),
    offerText: z.string().trim().max(60).nullable(),
    originalPrice: price.nullable(),
    offerPrice: price.nullable(),
    terms: z.string().trim().max(500).nullable(),
  })
  .partial()
  .strict()

// ---------------------------------------------------------------- feeds & lists

const limit = (max, fallback) => z.coerce.number().int().min(1).max(max).default(fallback)

export const PageQuery = z.object({
  cursor: z.string().max(200).optional(),
  limit: limit(50, 20),
})

export const NearbyFeedQuery = z.object({
  latitude,
  longitude,
  radiusKm: z.coerce.number().min(0.5).max(50).default(10),
  category: z.enum(LOOT_CATEGORIES).optional(),
  cursor: z.string().max(200).optional(),
  limit: limit(30, 10),
})

export const BusinessLootQuery = PageQuery.extend({
  status: z.enum(['all_active', 'draft', 'expired', 'archived', 'all']).default('all_active'),
})

// ---------------------------------------------------------------- engagement & redemption

export const ViewBody = z.object({
  source: z.enum(FEED_SOURCES),
  watchTimeMs: z.coerce.number().int().min(0).max(3_600_000).optional(),
})

export const ShareBody = z.object({ channel: z.enum(SHARE_CHANNELS) })

/** Unambiguous alphabet: no 0/O, 1/I/L. */
export const REDEMPTION_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const REDEMPTION_CODE_LENGTH = 6

/** Accepts "loot-7q3xab", "7Q3 XAB", "LOOT-7Q3XAB"; normalizes to "LOOT-7Q3XAB". */
export const redemptionCode = z
  .string()
  .transform((value) => value.toUpperCase().replace(/[\s-]/g, '').replace(/^LOOT/, ''))
  .pipe(z.string().regex(/^[A-Z0-9]{6}$/, 'Must be a 6-character code'))
  .transform((value) => `LOOT-${value}`)

export const RedeemBody = z.object({ code: redemptionCode })
