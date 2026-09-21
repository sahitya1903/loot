'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { subscribeToMyAlerts } from '@/lib/firebase/firestore'
import { Bell } from 'lucide-react'
import type { LootAlert } from '@/types'

export default function NotificationsPage() {
  const profile = useAuthStore((s) => s.profile)
  const [alerts, setAlerts] = useState<LootAlert[] | null>(null)

  useEffect(() => {
    if (!profile?.userId) return
    const unsub = subscribeToMyAlerts(profile.userId, 50, setAlerts)
    return () => unsub()
  }, [profile?.userId])

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-white">Notifications</h1>
      </header>

      {alerts === null ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-800/60" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center px-6 text-center text-white/55">
          <Bell className="mb-2 h-8 w-8" aria-hidden />
          <p className="text-sm">All quiet. We&apos;ll ping you when loot drops nearby.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li key={a.alertId}>
              <Link
                href={a.lootId ? `/loot/${a.lootId}` : a.businessId ? `/business/${a.businessId}` : '#'}
                className={`flex items-start gap-3 rounded-xl p-3 ring-1 ring-white/5 transition hover:bg-white/5 ${
                  a.readAt ? 'bg-[var(--surface,_#161618)]' : 'bg-[var(--accent,_#ff4d6d)]/10'
                }`}
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
