'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { getFollowingFeed } from '@loot/shared/api'
import { queryKeys } from '@loot/shared/api'

export function useFollowingFeed(userId) {
  return useInfiniteQuery({
    queryKey: queryKeys.feed.following(userId ?? 'anon'),
    enabled: !!userId,
    initialPageParam: null,
    queryFn: ({ pageParam }) => getFollowingFeed({ cursor: pageParam ?? undefined, limit: 20 }),
    getNextPageParam: (last) => last?.cursor ?? null,
    staleTime: 60_000,
  })
}
