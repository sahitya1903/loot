'use client'

import { useEffect, useRef } from 'react'
import { LootCard, LootCardSkeleton } from '@/components/loot/LootCard'
import { FeedEmpty } from './FeedEmpty'
import type { LootFeedItem, FeedSource } from '@/types'

interface Props {
  items: LootFeedItem[]
  source: FeedSource
  isLoading: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  emptyTitle?: string
  emptyBody?: string
}

export function FeedList({ items, source, isLoading, hasMore, onLoadMore, emptyTitle, emptyBody }: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sentinelRef.current || !onLoadMore || !hasMore) return
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) onLoadMore()
      },
      { rootMargin: '600px 0px 0px 0px' },
    )
    obs.observe(sentinelRef.current)
    return () => obs.disconnect()
  }, [onLoadMore, hasMore])

  if (isLoading && items.length === 0) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <LootCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!isLoading && items.length === 0) {
    return <FeedEmpty title={emptyTitle} body={emptyBody} />
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <LootCard key={item.id} item={item} source={source} />
      ))}
      {hasMore && <div ref={sentinelRef} className="col-span-full h-10" />}
    </div>
  )
}
