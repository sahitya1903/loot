// Compact geoHash encoder — 7-char default (~150m cell).
// Mirrors the implementation in Backend/functions/loot.js.

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'

export function geoHash(lat, lng, precision = 7) {
  let minLat = -90,
    maxLat = 90,
    minLng = -180,
    maxLng = 180
  let bitsTotal = 0,
    hashIdx = 0,
    even = true
  let out = ''

  while (out.length < precision) {
    if (even) {
      const mid = (minLng + maxLng) / 2
      if (lng > mid) {
        hashIdx = (hashIdx << 1) + 1
        minLng = mid
      } else {
        hashIdx <<= 1
        maxLng = mid
      }
    } else {
      const mid = (minLat + maxLat) / 2
      if (lat > mid) {
        hashIdx = (hashIdx << 1) + 1
        minLat = mid
      } else {
        hashIdx <<= 1
        maxLat = mid
      }
    }
    even = !even
    if (++bitsTotal % 5 === 0) {
      out += BASE32[hashIdx]
      hashIdx = 0
    }
  }
  return out
}

export function geoCellId(lat, lng) {
  return geoHash(lat, lng, 5)
}
