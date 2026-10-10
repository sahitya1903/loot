import { Schema } from 'mongoose'

/** GeoJSON point. MongoDB stores [longitude, latitude] — in that order. */
export const pointSchema = new Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point', required: true },
    coordinates: { type: [Number], required: true },
  },
  { _id: false },
)

export function toPoint(latitude, longitude) {
  return { type: 'Point', coordinates: [longitude, latitude] }
}

export function fromPoint(point) {
  const [longitude, latitude] = point.coordinates
  return { latitude, longitude }
}
