'use client'

import { useEffect } from 'react'
import { useGeoStore } from '@/stores/geo'

const STALE_MS = 5 * 60_000

/**
 * Wires up the geo store: requests location on mount when status is idle,
 * and refreshes if the cached fix is older than STALE_MS.
 */
export function useGeo() {
  const { coords, status, lastUpdated, request } = useGeoStore()

  useEffect(() => {
    if (status === 'idle') {
      void request()
      return
    }
    if (status === 'granted' && lastUpdated && Date.now() - lastUpdated > STALE_MS) {
      void request()
    }
  }, [status, lastUpdated, request])

  return { coords, status, refresh: request }
}
