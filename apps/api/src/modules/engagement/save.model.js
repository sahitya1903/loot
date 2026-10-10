import { Schema, model } from 'mongoose'

const saveSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lootId: { type: Schema.Types.ObjectId, ref: 'Loot', required: true },
  },
  { collection: 'saves', timestamps: { createdAt: true, updatedAt: false } },
)
// The database, not the client, stops double saves.
saveSchema.index({ userId: 1, lootId: 1 }, { unique: true })
// "Saved" tab, newest first.
saveSchema.index({ userId: 1, _id: -1 })

export const Save = model('Save', saveSchema)
