'use client'

import Link from 'next/link'
import { BadgeCheck } from 'lucide-react'
import { formatDistance } from '@/lib/geo/format'
import clsx from 'clsx'
import type { LootFeedItem } from '@/types'

interface Props {
  item: Pick<
    LootFeedItem,
    'businessId' | 'businessName' | 'businessUsername' | 'businessVerified' | 'businessLogo' | 'distanceKm' | 'claimCount' | 'category'
  >
}

export function LootMeta({ item }: Props) {
  return (
    <div className="flex items-center gap-2.5">
      <Link
        href={`/business/${item.businessId}`}
        className="flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10"
      >
        {item.businessLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.businessLogo} alt={item.businessName} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-white/70">
            {item.businessName.slice(0, 2).toUpperCase()}
          </span>
        )}
      </Link>
      <div className="flex min-w-0 flex-col leading-tight">
        <Link href={`/business/${item.businessId}`} className="flex items-center gap-1 truncate text-sm font-medium text-white">
          <span className="truncate">@{item.businessUsername || item.businessName}</span>
          {item.businessVerified && (
            <BadgeCheck size={14} className="shrink-0 text-[var(--accent,_#ff4d6d)]" aria-label="Verified business" />
          )}
        </Link>
        <span className={clsx('truncate text-[11px] text-white/55')}>
          {[item.category && labelForCategory(item.category), formatDistance(item.distanceKm), claimsLabel(item.claimCount)]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </div>
    </div>
  )
}

function labelForCategory(c: string): string {
  return c.replace(/_/g, ' ')
}

function claimsLabel(count: number): string {
  if (!count) return ''
  if (count < 1000) return `${count} claims`
  return `${(count / 1000).toFixed(1)}k claims`
}
