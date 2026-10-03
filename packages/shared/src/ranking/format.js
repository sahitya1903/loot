// Urgency tier classification + countdown label formatting.
//
// Used by LootCard / LootCountdown / LootDetailHero to drive the visual
// urgency surface (chip color, pulse, "Ending soon" copy, expired state).

const HOUR_MS = 3600_000
const TWO_HOURS_MS = 2 * HOUR_MS
const DAY_MS = 24 * HOUR_MS

/**
 * @param {string | number | null | undefined} expiryAt ISO-8601 string (as the API returns) or epoch ms
 * @returns {number} epoch ms, or 0 when missing/unparseable
 */
export function expiryAtToMs(expiryAt) {
  if (!expiryAt) return 0
  if (typeof expiryAt === 'number') return expiryAt
  const ms = Date.parse(expiryAt)
  return Number.isNaN(ms) ? 0 : ms
}

/** @returns {'normal' | 'warm' | 'urgent' | 'expired'} */
export function urgencyTier(expiryAt) {
  const ms = expiryAtToMs(expiryAt) - Date.now()
  if (ms <= 0) return 'expired'
  if (ms < TWO_HOURS_MS) return 'urgent'
  if (ms < DAY_MS) return 'warm'
  return 'normal'
}

export function countdown(expiryAt) {
  const ms = expiryAtToMs(expiryAt) - Date.now()
  if (ms <= 0) {
    return { totalSeconds: 0, label: 'Expired', tier: 'expired' }
  }
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  let label
  if (days > 0) label = `${days}d ${hours}h`
  else if (hours > 0) label = `${hours}h ${minutes}m`
  else if (minutes >= 1) label = `${minutes}m ${seconds.toString().padStart(2, '0')}s`
  else label = `${seconds}s`

  return { totalSeconds, label, tier: urgencyTier(expiryAt) }
}
