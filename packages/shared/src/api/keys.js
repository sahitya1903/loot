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
    following: (userId) => ['feed', 'following', userId],
    trending: (geoCellId, category) => ['feed', 'trending', geoCellId, category ?? null],
    fresh: (lat, lng, radius, category) => ['feed', 'fresh', lat.toFixed(3), lng.toFixed(3), radius, category ?? null],
  },
  loot: {
    detail: (id) => ['loot', id],
    media: (id) => ['loot', id, 'media'],
    analytics: (id) => ['loot', id, 'analytics'],
  },
  business: {
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
