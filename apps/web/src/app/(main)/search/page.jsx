'use client'

import { useState } from 'react'
import { Search, MapPin } from 'lucide-react'
import { LOOT_CATEGORIES } from '@loot/shared/models'
import { useGeo } from '@/hooks/use-geo'
import { useNearbyFeed } from '@/hooks/use-nearby-feed'
import { FeedList } from '@/components/feed/FeedList'
import clsx from 'clsx'

export default function SearchPage() {
  const { coords } = useGeo()
  const [category, setCategory] = useState(undefined)

  const q = useNearbyFeed({ coords, category, radiusKm: 20, enabled: !!category })
  const items = q.data?.pages.flatMap((p) => p.items) ?? []

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Discover</h1>
        <p className="text-sm text-white/55">
          Browse by category. Free-text search is coming soon.
        </p>
      </header>

      <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-3 text-sm text-white/45">
        <Search size={16} aria-hidden />
        <span>Free-text search coming soon</span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {LOOT_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c === category ? undefined : c)}
            className={clsx(
              'rounded-2xl px-4 py-6 text-left text-sm font-semibold capitalize transition',
              category === c
                ? 'bg-[var(--accent,_#ff4d6d)] text-black'
                : 'bg-white/5 text-white hover:bg-white/10'
            )}
          >
            {c.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {category && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm tracking-wide text-white/50 uppercase">
            <MapPin size={14} aria-hidden />
            <span className="capitalize">{category.replace(/_/g, ' ')} near you</span>
          </h2>
          <FeedList
            items={items}
            source="search"
            isLoading={q.isLoading}
            hasMore={q.hasNextPage}
            onLoadMore={() => q.fetchNextPage()}
            emptyTitle="Nothing in this category right now"
            emptyBody="Try another category or expand your radius."
          />
        </section>
      )}
    </div>
  )
}
