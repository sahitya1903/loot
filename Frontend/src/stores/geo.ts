// Geo store — current device location for the Nearby feed.

import { create } from 'zustand'

export type GeoStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'

interface GeoState {
  coords: { lat: number; lng: number } | null
  status: GeoStatus
  lastUpdated: number | null
  request: () => Promise<void>
  set: (coords: { lat: number; lng: number }) => void
  clear: () => void
}

export const useGeoStore = create<GeoState>((set, get) => ({
  coords: null,
  status: 'idle',
  lastUpdated: null,

  request: async () => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      set({ status: 'unavailable' })
      return
    }
    set({ status: 'requesting' })
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          set({
            coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
            status: 'granted',
            lastUpdated: Date.now(),
          })
          resolve()
        },
        (err) => {
          set({ status: err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable' })
          resolve()
        },
        { enableHighAccuracy: false, maximumAge: 5 * 60 * 1000, timeout: 10_000 },
      )
    })
  },

  set: (coords) => set({ coords, status: 'granted', lastUpdated: Date.now() }),
  clear: () => set({ coords: null, status: 'idle', lastUpdated: null }),
}))
