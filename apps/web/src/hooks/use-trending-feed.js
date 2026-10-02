'use client'

import { useQuery } from '@tanstack/react-query'
import { getTrendingFeed } from '@loot/shared/api'
import { queryKeys } from '@loot/shared/api'
import { geoCellId as cellIdFor } from '@loot/shared/geo'

export function useTrendingFeed(coords, category) {
  const cellId = coords ? cellIdFor(coords.lat, coords.lng) : null
  return useQuery({
    queryKey: queryKeys.feed.trending(cellId, category),
    enabled: !!coords,
    queryFn: () =>
      getTrendingFeed({
        geoCellId: cellId ?? undefined,
        latitude: coords.lat,
        longitude: coords.lng,
        category,
        limit: 20,
      }),
    staleTime: 60_000,
  })
}
