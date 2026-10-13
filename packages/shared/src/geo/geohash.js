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

/** Size in degrees of one geoHash cell at this precision. */
export function geoHashCellSize(precision) {
  const bits = precision * 5
  return { latDegrees: 180 / 2 ** Math.floor(bits / 2), lngDegrees: 360 / 2 ** Math.ceil(bits / 2) }
}

/**
 * The cell containing the point plus its 8 neighbours (fewer near the poles), so a
 * radius search never misses loot just across a cell edge.
 * @returns {string[]}
 */
export function geoHashNeighborhood(lat, lng, precision) {
  const { latDegrees, lngDegrees } = geoHashCellSize(precision)
  const cells = new Set()
  for (const dLat of [-1, 0, 1]) {
    for (const dLng of [-1, 0, 1]) {
      const cellLat = Math.max(-90, Math.min(90, lat + dLat * latDegrees))
      const cellLng = ((((lng + dLng * lngDegrees + 180) % 360) + 360) % 360) - 180
      cells.add(geoHash(cellLat, cellLng, precision))
    }
  }
  return [...cells]
}
