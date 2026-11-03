import { PUSH_PLATFORMS } from '@loot/shared'
import { Schema, model } from 'mongoose'

// One row per device. A token belongs to whoever registered it last, so a shared phone that
// switches accounts stops getting the previous account's pushes.
const pushTokenSchema = new Schema(
  {
    token: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    platform: { type: String, enum: PUSH_PLATFORMS, required: true },
  },
  { collection: 'push_tokens', timestamps: true },
)

export const PushToken = model('PushToken', pushTokenSchema)
