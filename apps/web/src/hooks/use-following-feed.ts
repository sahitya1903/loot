'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { getFollowingFeed } from '@loot/shared/api'
import { queryKeys } from '@loot/shared/api'
import type { FeedResponse } from '@loot/shared/types'

export function useFollowingFeed(userId: string | null) {
  return useInfiniteQuery<FeedResponse>({
    queryKey: queryKeys.feed.following(userId ?? 'anon'),
    enabled: !!userId,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => getFollowingFeed({ cursor: pageParam ?? undefined, limit: 20 }),
    getNextPageParam: (last) => last?.cursor ?? null,
    staleTime: 60_000,
  })
}
