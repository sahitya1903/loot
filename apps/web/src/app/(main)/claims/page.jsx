'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { getMyClaimedLoot } from '@loot/shared/api'
import { queryKeys } from '@loot/shared/api'
import { useAuthStore } from '@/stores/auth'
import { LootCountdown } from '@/components/loot/LootCountdown'
import { Ticket } from 'lucide-react'

export default function ClaimsPage() {
  const profile = useAuthStore((s) => s.profile)
  const q = useQuery({
    queryKey: profile?.userId
      ? queryKeys.user.claimed(profile.userId)
      : ['user', 'claimed', 'noop'],
    enabled: !!profile?.userId,
    queryFn: () => getMyClaimedLoot({ limit: 30 }),
  })

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-white">My claims</h1>
        <p className="text-sm text-white/55">
          Show your code at the counter. Codes expire — claim it, redeem it, done.
        </p>
      </header>

      {q.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-800/60" />
          ))}
        </div>
      ) : q.data?.items.length ? (
        <ul className="space-y-3">
          {q.data.items.map((it) => (
            <li key={it.id}>
              <Link
                href={`/loot/${it.id}`}
                className="flex items-center gap-3 rounded-2xl bg-[var(--surface,_#161618)] p-3 ring-1 ring-white/5 transition hover:bg-white/5"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <Ticket className="h-5 w-5 text-[var(--accent,_#ff4d6d)]" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-white">{it.title}</div>
                  <div className="truncate text-xs text-white/55">{it.businessName}</div>
                  {it.redemption?.code && (
                    <div className="mt-1 inline-block rounded bg-white/10 px-2 py-0.5 font-mono text-[11px] tracking-wider text-white">
                      {it.redemption.code}
                    </div>
                  )}
                </div>
                <LootCountdown expiryAt={it.expiryAt} compact />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center text-white/55">
          <Ticket className="h-10 w-10" aria-hidden />
          <p className="mt-2 text-sm">
            No claims yet. Hit Claim on something you spot in the feed.
          </p>
        </div>
      )}
    </div>
  )
}
