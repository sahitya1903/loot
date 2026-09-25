'use client'

import { useQuery } from '@tanstack/react-query'
import { getTrendingFeed } from '@loot/shared/api'
import { queryKeys } from '@loot/shared/api'
import { geoCellId as cellIdFor } from '@loot/shared/geo'
import type { LootCategory, FeedResponse } from '@loot/shared/types'

export function useTrendingFeed(coords: { lat: number; lng: number } | null, category?: LootCategory) {
  const cellId = coords ? cellIdFor(coords.lat, coords.lng) : null
  return useQuery<FeedResponse>({
    queryKey: queryKeys.feed.trending(cellId, category),
    enabled: !!coords,
    queryFn: () => getTrendingFeed({
      geoCellId: cellId ?? undefined,
      latitude: coords!.lat,
      longitude: coords!.lng,
      category,
      limit: 20,
    }),
    staleTime: 60_000,
  })
}
