'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { LootCountdown } from './LootCountdown'
import { LootMeta } from './LootMeta'
import { LootMedia } from './LootMedia'
import { LootActions } from './LootActions'
import { useLootMedia, useTrackLootView } from '@/hooks/use-loot'
import clsx from 'clsx'
import { Flame, MapPin } from 'lucide-react'
import { formatDistance } from '@loot/shared/geo'

export function LootCard({ item, source }) {
  const cardRef = useRef(null)
  const trackView = useTrackLootView()

  // Hydrate signed media URLs lazily — only when the card scrolls into view
  const { data: media } = useLootMedia(item.id)
  const primary = media?.urls?.[0]

  // Fire `trackLootView` once per card per session as it enters viewport
  useEffect(() => {
    if (!cardRef.current) return
    let fired = false
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!fired && e.intersectionRatio > 0.5) {
            fired = true
            trackView.mutate({ lootId: item.id, source })
            obs.disconnect()
            break
          }
        }
      },
      { threshold: [0, 0.5, 1] }
    )
    obs.observe(cardRef.current)
    return () => obs.disconnect()
  }, [item.id, source, trackView])

  const isTrending = item.status === 'trending' || item.trendingScore > 1.5

  return (
    <article
      ref={cardRef}
      className="overflow-hidden rounded-[20px] bg-[var(--surface,_#161618)] shadow-[0_2px_30px_-12px_rgba(0,0,0,0.6)] ring-1 ring-white/5"
    >
      <div className="relative">
        <Link href={`/loot/${item.id}`} className="block">
          <LootMedia
            url={primary?.url ?? null}
            thumbnailUrl={primary?.thumbnailUrl ?? null}
            mediaType={item.primaryMediaType}
            alt={item.title}
          />
        </Link>

        {/* overlay: countdown + distance */}
        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between">
          <LootCountdown expiryAt={item.expiryAt} />
          {item.distanceKm != null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11px] font-medium text-white backdrop-blur">
              <MapPin size={12} aria-hidden />
              {formatDistance(item.distanceKm)}
            </span>
          )}
        </div>

        {isTrending && (
          <span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-[var(--accent,_#ff4d6d)] to-[var(--accent-2,_#c4ff3b)] px-2.5 py-1 text-[11px] font-bold text-black">
            <Flame size={12} aria-hidden />
            Trending
          </span>
        )}
      </div>

      <div className="space-y-3 p-4">
        <Link href={`/loot/${item.id}`} className="block">
          <h3 className="text-lg leading-tight font-semibold text-balance text-white">
            {item.title}
          </h3>
        </Link>

        <LootMeta item={item} />

        <LootActions lootId={item.id} disabled={item.status === 'expired'} />
      </div>
    </article>
  )
}

export function LootCardSkeleton({ className }) {
  return (
    <div
      className={clsx(
        'animate-pulse overflow-hidden rounded-[20px] bg-[var(--surface,_#161618)] ring-1 ring-white/5',
        className
      )}
    >
      <div className="aspect-[4/5] w-full bg-zinc-800/60" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-3/4 rounded bg-zinc-800/60" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-zinc-800/60" />
          <div className="h-3 w-1/3 rounded bg-zinc-800/60" />
        </div>
      </div>
    </div>
  )
}
