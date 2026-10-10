import { BUSINESS_CATEGORIES, geoHash } from '@loot/shared'
import { Schema, model } from 'mongoose'
import { fromPoint, pointSchema, toPoint } from '../../lib/geo.js'

export const MAX_BRANCHES = 20

// Branches are embedded: a business has a handful, and loot copies the branch's
// location onto itself (feeds never join branches).
const branchSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  location: { type: pointSchema, required: true },
  geoHash: { type: String, required: true },
  hours: { type: String },
  phone: { type: String },
})

const businessSchema = new Schema(
  {
    // One business per professional account.
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    businessName: { type: String, required: true, trim: true },
    username: { type: String, required: true, lowercase: true, trim: true, unique: true },
    category: { type: String, enum: BUSINESS_CATEGORIES, required: true },
    logo: { type: String },
    banner: { type: String },
    about: { type: String, default: '' },
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    branches: { type: [branchSchema], default: [] },
    followersCount: { type: Number, default: 0 },
    totalClaimsCount: { type: Number, default: 0 },
  },
  { collection: 'businesses', timestamps: true },
)

export const Business = model('Business', businessSchema)

/** Branch input (BranchBody) → embedded branch fields. */
export function toBranchFields({ name, address, latitude, longitude, hours, phone }) {
  return { name, address, location: toPoint(latitude, longitude), geoHash: geoHash(latitude, longitude), hours, phone }
}

export function toPublicBranch(branch) {
  return {
    branchId: branch._id.toString(),
    name: branch.name,
    address: branch.address,
    ...fromPoint(branch.location),
    geoHash: branch.geoHash,
    hours: branch.hours ?? null,
    phone: branch.phone ?? null,
  }
}

/** Compact business shape embedded in loot responses. */
export function toBusinessSummary(business) {
  return {
    businessId: business._id.toString(),
    businessName: business.businessName,
    username: business.username,
    category: business.category,
    logo: business.logo ?? null,
    verified: business.verified,
  }
}

/** @param {number} lootCount live loot right now (computed by the caller) */
export function toPublicBusiness(business, lootCount = 0) {
  return {
    ...toBusinessSummary(business),
    ownerUserId: business.ownerUserId.toString(),
    banner: business.banner ?? null,
    about: business.about,
    verifiedAt: business.verifiedAt?.toISOString() ?? null,
    branchLocations: business.branches.map(toPublicBranch),
    followersCount: business.followersCount,
    lootCount,
    totalClaimsCount: business.totalClaimsCount,
    createdAt: business.createdAt.toISOString(),
    updatedAt: business.updatedAt.toISOString(),
  }
}
