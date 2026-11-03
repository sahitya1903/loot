'use client'

import { useQuery } from '@tanstack/react-query'
import { getTrendingFeed } from '@loot/shared/api'
import { queryKeys } from '@loot/shared/api'
import { geoCellId as cellIdFor } from '@loot/shared/geo'

// One page of what's hot nearby. Trending scores move every few minutes, so this list is
// refetched rather than paged.
export function useTrendingFeed(coords, category) {
  const cellId = coords ? cellIdFor(coords.lat, coords.lng) : null
  return useQuery({
    queryKey: queryKeys.feed.trending(cellId, category),
    enabled: !!coords,
    queryFn: () =>
      getTrendingFeed({
        latitude: coords.lat,
        longitude: coords.lng,
        category,
        limit: 20,
      }),
    staleTime: 60_000,
  })
}
