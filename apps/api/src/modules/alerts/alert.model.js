import { LOOT_ALERT_TYPES } from '@loot/shared'
import { Schema, model } from 'mongoose'

/** Alerts older than this disappear from the inbox. */
export const ALERT_RETENTION_DAYS = 30

const alertSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: LOOT_ALERT_TYPES, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    lootId: { type: Schema.Types.ObjectId, ref: 'Loot' },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business' },
    imageUrl: { type: String },
    readAt: { type: Date },
  },
  { collection: 'loot_alerts', timestamps: { createdAt: true, updatedAt: false } },
)
// Inbox, newest first, and the unread count.
alertSchema.index({ userId: 1, _id: -1 })
alertSchema.index({ userId: 1, readAt: 1 })
// One alert of each type per user per loot, so a rerun fan-out job can't send twice.
// Partial, so future alerts that aren't about a loot don't collide on a missing lootId.
alertSchema.index(
  { userId: 1, type: 1, lootId: 1 },
  { unique: true, partialFilterExpression: { lootId: { $exists: true } } },
)
alertSchema.index({ createdAt: 1 }, { expireAfterSeconds: ALERT_RETENTION_DAYS * 24 * 3600 })

export const LootAlert = model('LootAlert', alertSchema)

/** Alert document → the shared `LootAlert` shape. */
export function toLootAlert(alert) {
  return {
    alertId: alert._id.toString(),
    type: alert.type,
    title: alert.title,
    body: alert.body,
    lootId: alert.lootId?.toString() ?? null,
    businessId: alert.businessId?.toString() ?? null,
    imageUrl: alert.imageUrl ?? null,
    createdAt: alert.createdAt.toISOString(),
    readAt: alert.readAt?.toISOString() ?? null,
  }
}
