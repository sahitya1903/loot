'use client'

import { useQuery } from '@tanstack/react-query'
import { getMySavedLoot } from '@loot/shared/api'
import { queryKeys } from '@loot/shared/api'
import { useAuthStore } from '@/stores/auth'
import { FeedList } from '@/components/feed/FeedList'

export default function SavedPage() {
  const profile = useAuthStore((s) => s.profile)
  const q = useQuery({
    queryKey: profile?.userId ? queryKeys.user.saved(profile.userId) : ['user', 'saved', 'noop'],
    enabled: !!profile?.userId,
    queryFn: () => getMySavedLoot({ limit: 24 }),
  })

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Saved loot</h1>
        <p className="text-sm text-white/55">Your stash. Hits the moment any of them start to expire.</p>
      </header>
      <FeedList
        items={q.data?.items ?? []}
        source="search"
        isLoading={q.isLoading}
        emptyTitle="Nothing saved yet"
        emptyBody="Tap the bookmark on any loot to keep it here."
      />
    </div>
  )
}
