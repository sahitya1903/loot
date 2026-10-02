import { Schema, model } from 'mongoose'

export const ACCOUNT_TYPES = ['personal', 'professional']

const userSchema = new Schema(
  {
    phoneNumber: { type: String, required: true, unique: true },
    name: { type: String, default: '' },
    // Chosen during profile setup; sparse so users without one don't collide.
    username: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
    profilePicture: { type: String, default: '' },
    about: { type: String, default: '' },

    accountType: { type: String, enum: ACCOUNT_TYPES, default: 'personal', required: true },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business' },

    followingCount: { type: Number, default: 0 },
    savesCount: { type: Number, default: 0 },
    claimsCount: { type: Number, default: 0 },

    serviceCity: { type: String },
    interests: { type: [String], default: [] },
  },
  { collection: 'users', timestamps: true },
)

export const User = model('User', userSchema)

/** The user shape returned by the API. Never return raw documents. */
export function toPublicUser(user) {
  return {
    userId: user._id.toString(),
    phoneNumber: user.phoneNumber,
    name: user.name,
    username: user.username ?? null,
    profilePicture: user.profilePicture,
    about: user.about,
    accountType: user.accountType,
    businessId: user.businessId?.toString() ?? null,
    followingCount: user.followingCount,
    savesCount: user.savesCount,
    claimsCount: user.claimsCount,
    serviceCity: user.serviceCity ?? null,
    interests: user.interests,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }
}
