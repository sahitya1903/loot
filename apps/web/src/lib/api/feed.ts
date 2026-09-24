// Feed surfaces — Nearby, Following, Trending, Fresh.

import { callFunction } from '@/lib/firebase/functions'
import type {
  NearbyFeedRequest,
  FeedResponse,
  FollowingFeedRequest,
  TrendingFeedRequest,
  FreshFeedRequest,
  CategoryFeedRequest,
} from '@/types'

// Nearby uses the PostGIS-backed Cloud Function. Returns LootFeedItem[].
export function getNearbyFeed(req: NearbyFeedRequest) {
  return callFunction<NearbyFeedRequest, FeedResponse>('getNearbyLoot', req)
    .then(hydrateFeedShape)
}

export function getFollowingFeed(req: FollowingFeedRequest = {}) {
  return callFunction<FollowingFeedRequest, FeedResponse>('getFollowingFeed', req)
    .then(hydrateFeedShape)
}

export function getTrendingFeed(req: TrendingFeedRequest = {}) {
  return callFunction<TrendingFeedRequest, FeedResponse>('getTrendingFeed', req)
    .then(hydrateFeedShape)
}

export function getFreshFeed(req: FreshFeedRequest) {
  return callFunction<FreshFeedRequest, FeedResponse>('getFreshFeed', req)
    .then(hydrateFeedShape)
}

export function getCategoryFeed(req: CategoryFeedRequest) {
  // Category-scoped queries use the trending feed with a category filter;
  // alias here so callers don't have to know the routing detail.
  return callFunction<CategoryFeedRequest, FeedResponse>('getTrendingFeed', req)
    .then(hydrateFeedShape)
}

// `getNearbyLoot` returns `{ items: [{ lootId, distanceKm, score }] }` —
// a thin reference list. The feed UI expects fully-hydrated `LootFeedItem`s,
// so this normalizer pads the shape; downstream code can fetch full details
// via `getLoot`/`getLootMediaUrls` on viewport entry.
function hydrateFeedShape(resp: FeedResponse): FeedResponse {
  if (!resp.items) return { ...resp, items: [], hasMore: !!resp.cursor }
  return resp
}
