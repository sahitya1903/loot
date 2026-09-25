'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getLoot, getLootMediaUrls, trackLootView } from '@loot/shared/api'
import { claimLoot, saveLoot, unsaveLoot, shareLoot, getRedemptionByLoot } from '@loot/shared/api'
import { queryKeys } from '@loot/shared/api'
import type { FeedSource } from '@loot/shared/types'

export function useLoot(lootId: string | null) {
  return useQuery({
    queryKey: lootId ? queryKeys.loot.detail(lootId) : ['loot', 'noop'],
    enabled: !!lootId,
    queryFn: () => getLoot({ lootId: lootId! }),
  })
}

export function useLootMedia(lootId: string | null) {
  return useQuery({
    queryKey: lootId ? queryKeys.loot.media(lootId) : ['loot', 'media', 'noop'],
    enabled: !!lootId,
    queryFn: () => getLootMediaUrls({ lootId: lootId! }),
    staleTime: 30 * 60_000, // signed URLs are good for 1h; refresh aggressively
  })
}

export function useClaimLoot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (lootId: string) => claimLoot({ lootId }),
    onSuccess: (_, lootId) => {
      qc.invalidateQueries({ queryKey: queryKeys.loot.detail(lootId) })
      qc.invalidateQueries({ queryKey: ['user'] })
    },
  })
}

export function useSaveLoot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ lootId, save }: { lootId: string; save: boolean }) =>
      save ? saveLoot({ lootId }) : unsaveLoot({ lootId }),
    onSuccess: (_, { lootId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.loot.detail(lootId) })
      qc.invalidateQueries({ queryKey: ['user'] })
    },
  })
}

export function useShareLoot() {
  return useMutation({
    mutationFn: ({ lootId, channel }: { lootId: string; channel: 'native' | 'whatsapp' | 'copy_link' | 'other' }) =>
      shareLoot({ lootId, channel }),
  })
}

export function useTrackLootView() {
  return useMutation({
    mutationFn: ({ lootId, source, watchTimeMs }: { lootId: string; source: FeedSource; watchTimeMs?: number }) =>
      trackLootView({ lootId, source, watchTimeMs }),
  })
}

export function useRedemption(lootId: string | null) {
  return useQuery({
    queryKey: lootId ? ['redemption', lootId] : ['redemption', 'noop'],
    enabled: !!lootId,
    queryFn: () => getRedemptionByLoot(lootId!),
  })
}
