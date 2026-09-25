// TanStack Query key factory.
// Centralizing keys means cache invalidation stays in sync across the app.

import type { LootCategory, LootStatus } from '../types'

export const queryKeys = {
  feed: {
    nearby: (lat: number, lng: number, radius: number, category?: LootCategory) =>
      ['feed', 'nearby', lat.toFixed(3), lng.toFixed(3), radius, category ?? null] as const,
    following: (userId: string) => ['feed', 'following', userId] as const,
    trending: (geoCellId: string | null, category?: LootCategory) =>
      ['feed', 'trending', geoCellId, category ?? null] as const,
    fresh: (lat: number, lng: number, radius: number, category?: LootCategory) =>
      ['feed', 'fresh', lat.toFixed(3), lng.toFixed(3), radius, category ?? null] as const,
  },
  loot: {
    detail: (id: string) => ['loot', id] as const,
    media: (id: string) => ['loot', id, 'media'] as const,
    analytics: (id: string) => ['loot', id, 'analytics'] as const,
  },
  business: {
    detail: (id: string) => ['business', id] as const,
    loots: (id: string, status?: LootStatus | 'all_active') =>
      ['business', id, 'loots', status ?? 'all_active'] as const,
    analytics: (id: string) => ['business', id, 'analytics'] as const,
  },
  user: {
    me: () => ['user', 'me'] as const,
    saved: (id: string) => ['user', id, 'saved'] as const,
    claimed: (id: string) => ['user', id, 'claimed'] as const,
  },
  alerts: () => ['alerts'] as const,
  locality: (geoCellId: string) => ['locality', geoCellId] as const,
} as const
