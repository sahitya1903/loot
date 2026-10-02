'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useLoot, useLootMedia } from '@/hooks/use-loot'
import { LootCountdown } from '@/components/loot/LootCountdown'
import { LootMedia } from '@/components/loot/LootMedia'
import { LootActions } from '@/components/loot/LootActions'
import { formatDistance } from '@loot/shared/geo'
import { BadgeCheck, MapPin } from 'lucide-react'

export default function LootDetailPage() {
  const params = useParams()
  const lootId = params?.id ?? null
  const { data, isLoading } = useLoot(lootId)
  const { data: media } = useLootMedia(lootId)

  if (isLoading || !data?.loot) {
    return (
      <div className="space-y-4">
        <div className="aspect-[4/5] w-full animate-pulse rounded-2xl bg-zinc-800/60" />
        <div className="h-8 w-3/4 animate-pulse rounded bg-zinc-800/60" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-800/60" />
      </div>
    )
  }

  const loot = data.loot
  const primary = media?.urls?.[0]

  return (
    <article className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl">
        <LootMedia
          url={primary?.url ?? null}
          thumbnailUrl={primary?.thumbnailUrl ?? null}
          mediaType={loot.media[0]?.mediaType ?? 'image'}
          alt={loot.title}
        />
        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between">
          <LootCountdown expiryAt={loot.expiryAt} />
        </div>
      </div>

      <header className="space-y-2">
        <h1 className="text-2xl leading-tight font-bold text-white">{loot.title}</h1>
        <div className="flex items-center gap-2 text-sm text-white/70">
          <MapPin size={14} aria-hidden />
          <span>{loot.location?.name}</span>
        </div>
      </header>

      <Link
        href={`/business/${loot.businessId}`}
        className="flex items-center gap-3 rounded-xl bg-white/5 p-3 transition hover:bg-white/10"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
          {loot.businessId.slice(0, 2).toUpperCase()}
        </span>
        <div className="flex flex-1 items-center gap-1 text-sm text-white">
          <span>View business</span>
          <BadgeCheck size={14} className="text-[var(--accent,_#ff4d6d)]" aria-hidden />
        </div>
      </Link>

      <p className="text-sm leading-relaxed whitespace-pre-line text-white/85">
        {loot.description}
      </p>

      {loot.terms && (
        <details className="rounded-xl bg-white/5 p-3 text-sm text-white/70">
          <summary className="cursor-pointer font-medium text-white">Fine print</summary>
          <p className="mt-2 whitespace-pre-line">{loot.terms}</p>
        </details>
      )}

      <div className="grid grid-cols-3 gap-2 text-center text-xs text-white/60">
        <Stat label="Views" value={formatNumber(loot.viewCount)} />
        <Stat label="Saves" value={formatNumber(loot.saveCount)} />
        <Stat label="Claims" value={formatNumber(loot.claimCount)} />
      </div>

      <div className="sticky right-0 bottom-20 left-0 z-20">
        <LootActions lootId={loot.id} disabled={['expired', 'archived'].includes(loot.status)} />
      </div>

      {loot.distanceKm != null && (
        <p className="text-center text-xs text-white/40">{formatDistance(loot.distanceKm)}</p>
      )}
    </article>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <div className="text-base font-semibold text-white">{value}</div>
      <div className="mt-0.5 text-[10px] tracking-wide text-white/45 uppercase">{label}</div>
    </div>
  )
}

function formatNumber(n) {
  if (n < 1000) return String(n)
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}k`
  return `${(n / 1_000_000).toFixed(1)}M`
}
