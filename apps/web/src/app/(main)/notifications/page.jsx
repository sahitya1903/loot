'use client'

import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listLootAlerts, markAlertRead, markAllAlertsRead, queryKeys } from '@loot/shared/api'
import { useAuthStore } from '@/stores/auth'
import { Bell } from 'lucide-react'

export default function NotificationsPage() {
  const profile = useAuthStore((s) => s.profile)
  const queryClient = useQueryClient()
  const { data, error, refetch } = useQuery({
    queryKey: queryKeys.alerts(),
    enabled: !!profile,
    queryFn: () => listLootAlerts({ limit: 50 }),
    // Poll while the page is open; the phone app gets pushes.
    refetchInterval: (query) => (query.state.error ? false : 30_000),
  })
  const alerts = data?.items ?? null
  const unreadCount = data?.unreadCount ?? 0

  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.alerts() })
  const readAll = useMutation({ mutationFn: markAllAlertsRead, onSuccess: refresh })
  const open = (alert) => {
    if (!alert.readAt) markAlertRead(alert.alertId).then(refresh, () => {})
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Notifications</h1>
        {unreadCount > 0 ? (
          <button
            type="button"
            disabled={readAll.isPending}
            onClick={() => readAll.mutate()}
            className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Mark all read
          </button>
        ) : null}
      </header>

      {error ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center px-6 text-center text-white/55">
          <Bell className="mb-2 h-8 w-8" aria-hidden />
          <p className="text-sm">Couldn&apos;t load notifications.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      ) : alerts === null ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-800/60" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center px-6 text-center text-white/55">
          <Bell className="mb-2 h-8 w-8" aria-hidden />
          <p className="text-sm font-semibold text-white">All quiet</p>
          <p className="mt-1 max-w-sm text-sm">
            We&apos;ll ping you when businesses you follow drop loot, or loot you saved is about to
            end.
          </p>
          <Link
            href="/feed"
            className="mt-4 rounded-full bg-[var(--accent,_#ff4d6d)] px-5 py-2 text-sm font-semibold text-black"
          >
            Browse the feed
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li key={a.alertId}>
              <Link
                onClick={() => open(a)}
                href={
                  a.lootId ? `/loot/${a.lootId}` : a.businessId ? `/business/${a.businessId}` : '#'
                }
                className={`flex items-start gap-3 rounded-xl p-3 ring-1 ring-white/5 transition hover:bg-white/5 ${a.readAt ? 'bg-[var(--surface,_#161618)]' : 'bg-[var(--accent,_#ff4d6d)]/10'}`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <Bell size={16} className="text-white/70" aria-hidden />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white">{a.title}</div>
                  <div className="text-xs text-white/65">{a.body}</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
