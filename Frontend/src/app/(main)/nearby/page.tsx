'use client'

import { FeedList } from '@/components/feed/FeedList'
import { useGeo } from '@/hooks/use-geo'
import { useNearbyFeed } from '@/hooks/use-nearby-feed'
import { useState } from 'react'
import { LOOT_CATEGORIES, type LootCategory } from '@/types'
import clsx from 'clsx'

export default function NearbyPage() {
  const { coords, status, refresh } = useGeo()
  const [category, setCategory] = useState<LootCategory | undefined>(undefined)

  const q = useNearbyFeed({ coords, category, radiusKm: 5 })
  const items = q.data?.pages.flatMap((p) => p.items) ?? []

  if (status === 'denied') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="text-xl font-bold text-white">Loot needs your location</h1>
        <p className="mt-1 max-w-sm text-sm text-white/60">
          Nearby is the heart of Loot. Allow location to see what&apos;s dropping around you right now.
        </p>
        <button
          onClick={() => refresh()}
          className="mt-4 rounded-full bg-[var(--accent,_#ff4d6d)] px-5 py-2 text-sm font-semibold text-black"
        >
          Allow location
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Nearby</h1>
        <p className="text-sm text-white/55">What&apos;s dropping within 5km right now.</p>
      </header>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
        <Chip active={!category} onClick={() => setCategory(undefined)}>All</Chip>
        {LOOT_CATEGORIES.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
            {c.replace(/_/g, ' ')}
          </Chip>
        ))}
      </div>

      <FeedList
        items={items}
        source="nearby"
        isLoading={q.isLoading}
        hasMore={q.hasNextPage}
        onLoadMore={() => q.fetchNextPage()}
      />
    </div>
  )
}

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'shrink-0 rounded-full px-3 py-1 text-xs font-medium capitalize transition',
        active ? 'bg-white text-black' : 'bg-white/5 text-white/70 hover:bg-white/10',
      )}
    >
      {children}
    </button>
  )
}
