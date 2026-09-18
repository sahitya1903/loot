// Distance label formatter — "240m away", "1.4km away", "12km away"

export function formatDistance(km: number | null | undefined): string {
  if (km == null || !Number.isFinite(km)) return ''
  if (km < 1) {
    const m = Math.round(km * 1000 / 10) * 10
    return `${m}m away`
  }
  if (km < 10) {
    return `${km.toFixed(1)}km away`
  }
  return `${Math.round(km)}km away`
}
