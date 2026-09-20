'use client'

import { useQuery } from '@tanstack/react-query'
import { getFreshFeed } from '@/lib/api/feed'
import { queryKeys } from '@/lib/api/keys'
import type { LootCategory, FeedResponse } from '@/types'

export function useFreshFeed(coords: { lat: number; lng: number } | null, radiusKm = 5, category?: LootCategory) {
  return useQuery<FeedResponse>({
    queryKey: queryKeys.feed.fresh(coords?.lat ?? 0, coords?.lng ?? 0, radiusKm, category),
    enabled: !!coords,
    queryFn: () =>
      getFreshFeed({
        latitude: coords!.lat,
        longitude: coords!.lng,
        radiusKm,
        category,
        limit: 20,
      }),
    staleTime: 30_000,
  })
}
