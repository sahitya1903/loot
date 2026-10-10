import { Schema, model } from 'mongoose'

const followSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  },
  { collection: 'follows', timestamps: { createdAt: true, updatedAt: false } },
)
followSchema.index({ userId: 1, businessId: 1 }, { unique: true })

export const Follow = model('Follow', followSchema)
