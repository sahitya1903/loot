'use client'

import { useQuery } from '@tanstack/react-query'
import { getTrendingFeed } from '@/lib/api/feed'
import { queryKeys } from '@/lib/api/keys'
import { geoCellId as cellIdFor } from '@/lib/geo/geohash'
import type { LootCategory, FeedResponse } from '@/types'

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
