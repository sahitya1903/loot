import { randomInt } from 'node:crypto'
import { REDEMPTION_CODE_ALPHABET, REDEMPTION_CODE_LENGTH } from '@loot/shared'
import { Schema, model } from 'mongoose'

// A claim reserves one unit of a loot for one user and carries the redemption code the
// business validates in store. Statuses: issued → used. "expired" is derived from expiresAt.
const claimSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lootId: { type: Schema.Types.ObjectId, ref: 'Loot', required: true },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    branchId: { type: Schema.Types.ObjectId, required: true },
    redemptionType: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    status: { type: String, enum: ['issued', 'used'], default: 'issued', required: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
    redeemedByUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { collection: 'claims', timestamps: true },
)
// One claim per user per loot.
claimSchema.index({ userId: 1, lootId: 1 }, { unique: true })
// "Claims" tab, newest first.
claimSchema.index({ userId: 1, _id: -1 })

export const Claim = model('Claim', claimSchema)

export function generateRedemptionCode() {
  let code = ''
  for (let i = 0; i < REDEMPTION_CODE_LENGTH; i++) {
    code += REDEMPTION_CODE_ALPHABET[randomInt(REDEMPTION_CODE_ALPHABET.length)]
  }
  return `LOOT-${code}`
}

/** Claim → the shared `Redemption` shape. */
export function toRedemption(claim, now = Date.now()) {
  const expired = claim.status === 'issued' && claim.expiresAt.getTime() <= now
  return {
    redemptionId: claim._id.toString(),
    userId: claim.userId.toString(),
    lootId: claim.lootId.toString(),
    businessId: claim.businessId.toString(),
    branchId: claim.branchId.toString(),
    redemptionType: claim.redemptionType,
    code: claim.code,
    qrPayload: `loot:redeem:${claim.code}`,
    status: expired ? 'expired' : claim.status,
    issuedAt: claim.createdAt.toISOString(),
    expiresAt: claim.expiresAt.toISOString(),
    usedAt: claim.usedAt?.toISOString() ?? null,
  }
}
