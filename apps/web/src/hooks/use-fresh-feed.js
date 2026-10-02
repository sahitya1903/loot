'use client'

import { useQuery } from '@tanstack/react-query'
import { getFreshFeed } from '@loot/shared/api'
import { queryKeys } from '@loot/shared/api'

export function useFreshFeed(coords, radiusKm = 5, category) {
  return useQuery({
    queryKey: queryKeys.feed.fresh(coords?.lat ?? 0, coords?.lng ?? 0, radiusKm, category),
    enabled: !!coords,
    queryFn: () =>
      getFreshFeed({
        latitude: coords.lat,
        longitude: coords.lng,
        radiusKm,
        category,
        limit: 20,
      }),
    staleTime: 30_000,
  })
}
