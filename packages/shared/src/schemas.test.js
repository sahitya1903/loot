import { describe, expect, it } from 'vitest'
import { CreateLootBody, NearbyFeedQuery, RedeemBody, UpdateLootBody } from './schemas.js'
import { scoreLoot } from './ranking/score.js'

const HOUR = 3600_000
const branchId = '64b7f0c2a1b2c3d4e5f60718'

const validLoot = () => ({
  title: 'Two-for-one cold brew',
  category: 'food_drink',
  branchId,
  offerText: 'Buy 1 Get 1',
  expiryAt: new Date(Date.now() + 3 * HOUR).toISOString(),
})

describe('CreateLootBody', () => {
  it('applies defaults', () => {
    const loot = CreateLootBody.parse(validLoot())
    expect(loot).toMatchObject({ status: 'active', lootType: 'deal', redemptionType: 'in_store', media: [] })
    expect(loot.expiryAt).toBeInstanceOf(Date)
  })

  it('requires an offer description or price', () => {
    const rest = { ...validLoot(), offerText: undefined }
    expect(CreateLootBody.safeParse(rest).success).toBe(false)
    expect(CreateLootBody.safeParse({ ...rest, offerPrice: 99 }).success).toBe(true)
  })

  it('rejects an offer price above the original price', () => {
    const result = CreateLootBody.safeParse({ ...validLoot(), originalPrice: 100, offerPrice: 150 })
    expect(result.error?.issues[0].path).toEqual(['offerPrice'])
  })

  it('rejects past and far-future expiry', () => {
    expect(CreateLootBody.safeParse({ ...validLoot(), expiryAt: new Date(Date.now() - HOUR) }).success).toBe(false)
    expect(CreateLootBody.safeParse({ ...validLoot(), expiryAt: new Date(Date.now() + 40 * 24 * HOUR) }).success).toBe(
      false,
    )
  })

  it('rejects unknown categories and bad branch ids', () => {
    expect(CreateLootBody.safeParse({ ...validLoot(), category: 'concert' }).success).toBe(false)
    expect(CreateLootBody.safeParse({ ...validLoot(), branchId: 'nope' }).success).toBe(false)
  })
})

describe('UpdateLootBody', () => {
  it('allows partial updates and clearing optional fields', () => {
    expect(UpdateLootBody.parse({ totalQuantity: null, offerText: null })).toEqual({
      totalQuantity: null,
      offerText: null,
    })
  })

  it('rejects status changes and unknown fields', () => {
    expect(UpdateLootBody.safeParse({ status: 'active' }).success).toBe(false)
    expect(UpdateLootBody.safeParse({ claimCount: 0 }).success).toBe(false)
  })
})

describe('NearbyFeedQuery', () => {
  it('coerces query strings', () => {
    expect(NearbyFeedQuery.parse({ latitude: '12.97', longitude: '77.59' })).toMatchObject({
      latitude: 12.97,
      longitude: 77.59,
      radiusKm: 10,
      limit: 10,
    })
  })
})

describe('RedeemBody', () => {
  it('normalizes the code', () => {
    expect(RedeemBody.parse({ code: ' loot-7q3 xab ' }).code).toBe('LOOT-7Q3XAB')
    expect(RedeemBody.parse({ code: '7Q3XAB' }).code).toBe('LOOT-7Q3XAB')
    expect(RedeemBody.safeParse({ code: 'LOOT-12' }).success).toBe(false)
  })
})

describe('scoreLoot', () => {
  const now = Date.now()
  const base = { radiusKm: 10, createdAt: now - HOUR, expiryAt: now + 48 * HOUR }

  it('prefers closer loot, all else equal', () => {
    expect(scoreLoot({ ...base, distanceKm: 0.5 }, now)).toBeGreaterThan(scoreLoot({ ...base, distanceKm: 8 }, now))
  })

  it('boosts loot that is ending soon', () => {
    const soon = { ...base, distanceKm: 2, expiryAt: now + HOUR }
    expect(scoreLoot(soon, now)).toBeGreaterThan(scoreLoot({ ...base, distanceKm: 2 }, now))
  })

  it('caps the paid boost so it never dominates', () => {
    const plain = scoreLoot({ ...base, distanceKm: 2 }, now)
    const boosted = scoreLoot(
      { ...base, distanceKm: 2, boost: { active: true, multiplier: 5, endsAt: now + HOUR } },
      now,
    )
    expect(boosted / plain).toBeCloseTo(1.3)
  })

  it('stays between 0 and 1.3', () => {
    const huge = { ...base, distanceKm: 0, saveCount: 1e6, claimCount: 1e6, trendingScore: 1e6 }
    expect(scoreLoot(huge, now)).toBeLessThanOrEqual(1)
  })
})
