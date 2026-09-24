'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { getFollowingFeed } from '@/lib/api/feed'
import { queryKeys } from '@/lib/api/keys'
import type { FeedResponse } from '@/types'

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
