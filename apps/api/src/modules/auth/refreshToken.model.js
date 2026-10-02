import { Schema, model } from 'mongoose'

// Refresh tokens rotate on every use. All tokens from one login share a `familyId`;
// presenting an already-rotated token revokes the whole family (likely theft).
const refreshTokenSchema = new Schema(
  {
    // SHA-256 of the token; the token itself is only ever held by the client.
    tokenHash: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    familyId: { type: String, required: true, index: true },
    revokedAt: { type: Date },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { collection: 'refresh_tokens', timestamps: true },
)

export const RefreshToken = model('RefreshToken', refreshTokenSchema)
