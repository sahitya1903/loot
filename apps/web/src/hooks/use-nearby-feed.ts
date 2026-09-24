'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { getNearbyFeed } from '@/lib/api/feed'
import { queryKeys } from '@/lib/api/keys'
import type { LootCategory, FeedResponse, NearbyFeedRequest } from '@/types'

interface Args {
  coords: { lat: number; lng: number } | null
  radiusKm?: number
  category?: LootCategory
  enabled?: boolean
}

/**
 * Infinite-scroll Nearby feed. Disabled until coords are available so we never
 * fire a query without geo.
 */
export function useNearbyFeed({ coords, radiusKm = 5, category, enabled = true }: Args) {
  return useInfiniteQuery<FeedResponse>({
    queryKey: queryKeys.feed.nearby(coords?.lat ?? 0, coords?.lng ?? 0, radiusKm, category),
    enabled: !!coords && enabled,
    initialPageParam: null as NearbyFeedRequest['cursor'],
    queryFn: ({ pageParam }) =>
      getNearbyFeed({
        latitude: coords!.lat,
        longitude: coords!.lng,
        radiusKm,
        category,
        cursor: pageParam ?? undefined,
        limit: 20,
      }),
    getNextPageParam: (last) => last?.cursor ?? null,
    staleTime: 30_000, // 30s — this feed moves fast
    refetchOnWindowFocus: true,
  })
}
