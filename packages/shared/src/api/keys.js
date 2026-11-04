// TanStack Query key factory.
// Centralizing keys means cache invalidation stays in sync across the app.

export const queryKeys = {
  feed: {
    nearby: (lat, lng, radius, category) => [
      'feed',
      'nearby',
      lat.toFixed(3),
      lng.toFixed(3),
      radius,
      category ?? null,
    ],
    // Coordinates only set distanceKm here; pass them when you send them.
    following: (userId, category, lat, lng) => [
      'feed',
      'following',
      userId,
      category ?? null,
      lat?.toFixed(3) ?? null,
      lng?.toFixed(3) ?? null,
    ],
    trending: (lat, lng, radius, category) => [
      'feed',
      'trending',
      lat.toFixed(3),
      lng.toFixed(3),
      radius ?? null,
      category ?? null,
    ],
    fresh: (lat, lng, radius, category) => ['feed', 'fresh', lat.toFixed(3), lng.toFixed(3), radius, category ?? null],
  },
  loot: {
    detail: (id) => ['loot', id],
    media: (id) => ['loot', id, 'media'],
    analytics: (id) => ['loot', id, 'analytics'],
    redemption: (id) => ['loot', id, 'redemption'],
    counters: (id) => ['loot', id, 'counters'],
  },
  business: {
    mine: () => ['business', 'me'],
    detail: (id) => ['business', id],
    loots: (id, status) => ['business', id, 'loots', status ?? 'all_active'],
    analytics: (id) => ['business', id, 'analytics'],
  },
  user: {
    me: () => ['user', 'me'],
    saved: (id) => ['user', id, 'saved'],
    claimed: (id) => ['user', id, 'claimed'],
  },
  alerts: () => ['alerts'],
  locality: (geoCellId) => ['locality', geoCellId],
}
