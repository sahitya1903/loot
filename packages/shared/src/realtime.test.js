import { describe, expect, it } from 'vitest'
import { geoHash, geoHashCellSize } from './geo/geohash.js'
import { AREA_CELL_PRECISION, areaCell, areaCellsAround } from './realtime.js'

describe('area cells', () => {
  it('has the documented cell size', () => {
    expect(geoHashCellSize(4)).toEqual({ latDegrees: 180 / 1024, lngDegrees: 360 / 1024 })
    expect(geoHashCellSize(5)).toEqual({ latDegrees: 180 / 4096, lngDegrees: 360 / 8192 })
  })

  it('watches the own cell and its 8 neighbours', () => {
    const cells = areaCellsAround(12.9719, 77.6412)
    expect(cells).toHaveLength(9)
    expect(new Set(cells).size).toBe(9)
    expect(cells).toContain(areaCell(12.9719, 77.6412))
    expect(cells.every((c) => c.length === AREA_CELL_PRECISION)).toBe(true)
  })

  it('catches loot announced just across a cell edge, up to one cell away', () => {
    const { latDegrees, lngDegrees } = geoHashCellSize(AREA_CELL_PRECISION)
    const viewer = { lat: 12.9719, lng: 77.6412 }
    const watched = new Set(areaCellsAround(viewer.lat, viewer.lng))
    for (const [dLat, dLng] of [
      [latDegrees * 0.99, 0],
      [-latDegrees * 0.99, 0],
      [0, lngDegrees * 0.99],
      [0, -lngDegrees * 0.99],
      [latDegrees * 0.99, lngDegrees * 0.99],
    ]) {
      expect(watched.has(areaCell(viewer.lat + dLat, viewer.lng + dLng))).toBe(true)
    }
  })

  it('wraps around the antimeridian and clamps at the poles', () => {
    const east = areaCellsAround(0, 179.99)
    expect(east).toContain(geoHash(0, -179.99, AREA_CELL_PRECISION))
    expect(areaCellsAround(89.99, 0).length).toBeLessThan(9)
  })
})
