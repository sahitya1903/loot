'use client'

import { useState, useMemo } from 'react'
import { FeedTabs, type FeedTab } from '@/components/feed/FeedTabs'
import { FeedList } from '@/components/feed/FeedList'
import { useGeo } from '@/hooks/use-geo'
import { useNearbyFeed } from '@/hooks/use-nearby-feed'
import { useFollowingFeed } from '@/hooks/use-following-feed'
import { useTrendingFeed } from '@/hooks/use-trending-feed'
import { useFreshFeed } from '@/hooks/use-fresh-feed'
import { useAuthStore } from '@/stores/auth'
import type { FeedSource, LootFeedItem } from '@loot/shared/types'

export default function FeedPage() {
  const [tab, setTab] = useState<FeedTab>('nearby')
  const { coords, status, refresh } = useGeo()
  const profile = useAuthStore((s) => s.profile)

  const nearby = useNearbyFeed({ coords, enabled: tab === 'nearby' })
  const following = useFollowingFeed(tab === 'following' ? profile?.userId ?? null : null)
  const trending = useTrendingFeed(tab === 'trending' ? coords : null)
  const fresh = useFreshFeed(tab === 'fresh' ? coords : null)

  const items: LootFeedItem[] = useMemo(() => {
    switch (tab) {
      case 'nearby':
        return nearby.data?.pages.flatMap((p) => p.items) ?? []
      case 'following':
        return following.data?.pages.flatMap((p) => p.items) ?? []
      case 'trending':
        return trending.data?.items ?? []
      case 'fresh':
        return fresh.data?.items ?? []
    }
  }, [tab, nearby.data, following.data, trending.data, fresh.data])

  const isLoading =
    (tab === 'nearby' && nearby.isLoading) ||
    (tab === 'following' && following.isLoading) ||
    (tab === 'trending' && trending.isLoading) ||
    (tab === 'fresh' && fresh.isLoading)

  const source: FeedSource = tab

  if (status === 'denied' && tab !== 'following') {
    return (
      <div className="space-y-4">
        <FeedTabs active={tab} onChange={setTab} />
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
          <h2 className="text-xl font-semibold text-white">Turn on location</h2>
          <p className="mt-1 max-w-sm text-sm text-white/60">
            Loot is hyperlocal — we need your location to show what&apos;s near you right now.
          </p>
          <button
            onClick={() => refresh()}
            className="mt-4 rounded-full bg-[var(--accent,_#ff4d6d)] px-5 py-2 text-sm font-semibold text-black"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <FeedTabs active={tab} onChange={setTab} />
      <FeedList
        items={items}
        source={source}
        isLoading={isLoading}
        hasMore={tab === 'nearby' ? nearby.hasNextPage : tab === 'following' ? following.hasNextPage : false}
        onLoadMore={() => {
          if (tab === 'nearby') nearby.fetchNextPage()
          else if (tab === 'following') following.fetchNextPage()
        }}
        emptyTitle={tab === 'following' ? 'Follow some businesses' : undefined}
        emptyBody={tab === 'following' ? "You'll see new loot from businesses you follow here." : undefined}
      />
    </div>
  )
}
