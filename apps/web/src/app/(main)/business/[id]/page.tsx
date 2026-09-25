'use client'

import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBusiness, getBusinessLoot, followBusiness, unfollowBusiness } from '@loot/shared/api'
import { queryKeys } from '@loot/shared/api'
import { LootCard } from '@/components/loot/LootCard'
import { BadgeCheck, MapPin, Users } from 'lucide-react'
import clsx from 'clsx'

export default function BusinessProfilePage() {
  const params = useParams<{ id: string }>()
  const businessId = params?.id ?? ''
  const qc = useQueryClient()

  const businessQ = useQuery({
    queryKey: queryKeys.business.detail(businessId),
    enabled: !!businessId,
    queryFn: () => getBusiness({ businessId }),
  })

  const lootsQ = useQuery({
    queryKey: queryKeys.business.loots(businessId),
    enabled: !!businessId,
    queryFn: () => getBusinessLoot({ businessId, status: 'all_active', limit: 24 }),
  })

  const follow = useMutation({
    mutationFn: ({ following }: { following: boolean }) =>
      following ? followBusiness({ businessId }) : unfollowBusiness({ businessId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.business.detail(businessId) }),
  })

  if (businessQ.isLoading || !businessQ.data?.business) {
    return <div className="h-40 w-full animate-pulse rounded-2xl bg-zinc-800/60" />
  }

  const b = businessQ.data.business
  const isFollowing = !!businessQ.data.isFollowing

  return (
    <div className="space-y-6">
      <header className="overflow-hidden rounded-2xl bg-[var(--surface,_#161618)] ring-1 ring-white/5">
        {b.banner ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={b.banner} alt="" className="h-32 w-full object-cover" />
        ) : (
          <div className="h-24 w-full bg-gradient-to-br from-[var(--accent,_#ff4d6d)]/30 to-[var(--accent-2,_#c4ff3b)]/20" />
        )}
        <div className="-mt-8 flex items-end gap-3 p-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white/10 ring-2 ring-[var(--surface,_#161618)]">
            {b.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.logo} alt={b.businessName} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-white/70">
                {b.businessName.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 pb-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-bold text-white">{b.businessName}</h1>
              {b.verified && <BadgeCheck size={18} className="text-[var(--accent,_#ff4d6d)]" aria-label="Verified" />}
            </div>
            <div className="text-sm text-white/55">@{b.username}</div>
          </div>
          <button
            type="button"
            onClick={() => follow.mutate({ following: !isFollowing })}
            disabled={follow.isPending}
            className={clsx(
              'rounded-full px-4 py-2 text-sm font-semibold transition active:scale-[0.97]',
              isFollowing
                ? 'border border-white/15 bg-transparent text-white hover:bg-white/5'
                : 'bg-[var(--accent,_#ff4d6d)] text-black hover:brightness-110',
            )}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>

        {b.about && <p className="px-4 pb-3 text-sm text-white/75">{b.about}</p>}

        <div className="flex items-center gap-4 border-t border-white/5 px-4 py-3 text-xs text-white/65">
          <span className="inline-flex items-center gap-1.5">
            <Users size={12} aria-hidden />
            {b.followersCount} following
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={12} aria-hidden />
            {b.branchLocations.length} {b.branchLocations.length === 1 ? 'location' : 'locations'}
          </span>
          <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 capitalize">
            {b.category.replace(/_/g, ' ')}
          </span>
        </div>
      </header>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">Active loot</h2>
        {lootsQ.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="aspect-[4/5] animate-pulse rounded-2xl bg-zinc-800/60" />
            <div className="aspect-[4/5] animate-pulse rounded-2xl bg-zinc-800/60" />
          </div>
        ) : lootsQ.data?.items.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lootsQ.data.items.map((item) => (
              <LootCard key={item.id} item={item} source="business" />
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/55">No active loot from this business right now.</p>
        )}
      </section>
    </div>
  )
}
