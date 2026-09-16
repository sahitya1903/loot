# Loot — Backend Architecture

This describes the Cloud Functions backend for **Loot**, a hyperlocal real-time discovery platform. Read `/Users/harshverma/Documents/Loot/CLAUDE.md` for product positioning before working here.

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node 22, ES Modules |
| Framework | Firebase Functions v2 |
| Region | `asia-south1` |
| Primary DB | Firestore |
| Geo DB | Neon Postgres + PostGIS |
| Vectors | Qdrant |
| Media | AWS S3 (storage) + CloudFront (CDN) |
| Moderation | AWS Rekognition |
| OTP | WhatsApp Cloud API → Firebase SMS fallback |
| Payments | Razorpay |

## Module map

```
functions/
├── options.js            # setGlobalOptions({ region: "asia-south1" }) — import first
├── index.js              # Re-exports + tiny utility callables (geocode, S3 cleanup)
│
│   # Loot domain
├── loot.js               # CRUD: createLoot, updateLoot, archiveLoot, deleteLoot, getLoot,
│                         #         getUploadUrl (media), getLootMediaUrls, trackLootView
├── feed.js               # fanoutLootToFollowers (trigger), backfillFollowFeed (trigger),
│                         #   getNearbyFeed / getFollowingFeed / getTrendingFeed / getFreshFeed
├── nearbyLoot.js         # syncLootToPostgres (trigger), getNearbyLoot (callable),
│                         #   geoHash indexing, locality clustering
├── discovery.js          # recomputeTrendingScore (scheduled), getLocalityTrends,
│                         #   getCategoryFeed, ranking helpers
├── claim.js              # claimLoot, saveLoot, unsaveLoot, issueRedemption, getRedemption
├── expiry.js             # advanceLifecycle (scheduled, every 5min), notifyEndingSoon,
│                         #   archiveExpiredLoot, recomputeTrendingFlag
├── loot_alert.js         # Notification dispatchers (templates listed below)
├── business.js           # onboardBusiness, updateBusiness, addBranch, removeBranch,
│                         #   submitVerification, getBusinessAnalyticsAccess
├── boost.js              # createBoost (Razorpay-backed), expireBoost (scheduled),
│                         #   ranking-signal contribution (capped — never dominates)
├── analytics.js          # getLootImpressions, getClaimFunnel, getAudienceBreakdown,
│                         #   getBranchPerformance — pro-only
│
│   # Infrastructure (kept from Momento, repurposed)
├── login.js              # sendWhatsappOtp, verifyWhatsappOtp
├── profile.js            # updateProfile, updateUsername, deleteAccount
├── notifications.js      # sendToUserDevices, FCM token mgmt (low-level primitive)
├── razorpay.js           # plans, subscriptions, payment webhook
├── rekognition.js        # moderation hook for loot_media
├── reports.js            # report submission, moderation queue
├── roles.js              # requireProfessional / requirePersonal guards
├── safeDeletes.js        # cascade deletion triggers
├── counters.js           # generic counter rollup helper
└── tests/                # Vitest suites
```

## Domain: Loot

A `loot` is a temporary, geo-scoped discovery object. **Not** an event.

### Firestore: `loots/{lootId}`

```
{
  // identity
  id: string,
  businessId: string,                   // owner pro account
  branchId?: string,                    // optional outlet
  
  // content
  title: string,
  description: string,
  media: [{ s3Key, thumbnailS3Key?, mimeType, mediaType: "image"|"video", durationMs? }],
  category: string,                     // see categories enum
  tags: string[],
  terms?: string,                       // fine print
  
  // geo
  location: { name: string, placeId?: string },
  latitude: number,
  longitude: number,
  geoHash: string,                      // 7-char default
  visibilityRadiusKm: number,           // default 5
  
  // lifecycle
  status: "draft"|"active"|"trending"|"expiring"|"expired"|"archived",
  lootType: "deal"|"drop"|"experience"|"flash"|"opportunity",
  redemptionType: "in_store"|"online_code"|"first_come"|"none",
  outletInfo?: { hours?, instructions? },
  
  // time
  createdAt: timestamp,
  updatedAt: timestamp,
  expiryAt: timestamp,                  // single expiry — NEVER startDateTime/endDateTime
  
  // engagement
  viewCount: int,
  saveCount: int,
  claimCount: int,
  shareCount: int,
  trendingScore: float,                 // recomputed by discovery.js
  velocityScore: float,                 // claims-per-hour-since-publish
}
```

### Engagement subcollections

```
loots/{lootId}/views/{autoId}            # rolling sample, not exhaustive
loots/{lootId}/saves/{userId}
loots/{lootId}/claims/{userId}           # one per user max
loots/{lootId}/shares/{autoId}
loots/{lootId}/reports/{userId}
loots/{lootId}/reviews/{userId}
loots/{lootId}/redemptions/{userId}      # post-claim issued code/QR
```

### Counters

`saveCount`, `claimCount`, `viewCount`, `shareCount` rolled up via Firestore triggers (see `counters.js`).

## Domain: Business

### Firestore: `businesses/{businessId}`

```
{
  businessId: string,                   // = the owner uid for now (1:1)
  ownerUserId: string,
  businessName: string,
  username: string,                     // @-handle, unique
  category: string,
  logo?: string,                        // S3 key
  banner?: string,
  verified: boolean,
  verifiedAt?: timestamp,
  branchLocations: [
    { branchId, name, address, latitude, longitude, geoHash, hours? }
  ],
  followersCount: int,
  lootCount: int,                       // active + trending + expiring
  totalClaimsCount: int,
  analyticsEnabled: boolean,
  createdAt, updatedAt,
}
```

### Firestore: `users/{userId}` (unified personal + pro)

```
{
  userId, name, username, profilePicture, about,
  accountType: "personal"|"professional",
  businessId?: string,                  // set if accountType === "professional"
  phoneNumber, createdAt, updatedAt,
  
  followingCount: int,                  // businesses followed (personal) or peers (pro)
  savesCount: int,                      # personal
  claimsCount: int,                     # personal
  serviceCity?, serviceCityCoordinates?,
  interests?: string[],
}
```

Subcollections: `following/{businessId|userId}`, `savedLoot/{lootId}`, `claimedLoot/{lootId}`, `accountPreferences/{userId}` (FCM tokens, notification settings).

## Feed architecture

Four feed surfaces:

1. **Nearby** — query Postgres+PostGIS by user's current geo + visibilityRadius; rank by composite score
2. **Following** — fan-in from `feed/{userId}/items` (materialized on loot create / follow)
3. **Trending** — top trendingScore loots in user's locality
4. **Fresh** — newest active loots within radius, time-decayed

### Ranking signals (composite score)

```
score = w_dist * distanceScore           # gaussian decay over visibilityRadius
      + w_fresh * freshnessScore         # exponential decay over hours since publish
      + w_velocity * velocityScore       # claims-per-hour, normalized
      + w_save * log(1 + saveCount)
      + w_share * log(1 + shareCount)
      + w_completion * completionScore   # historic claim → redemption rate per business
      + w_followAffinity * (followsBusiness ? 1 : 0)
      + w_categoryAffinity * categoryAffinityScore(user, loot.category)
      - w_seen * recentlySeenPenalty
```

Weights live in `discovery.js` and are tunable via Remote Config. **No single signal dominates** — paid boosts contribute via a capped multiplier (e.g. `min(1.3, boost_multiplier)`), not by replacing the score.

### Feed materialization

- On `loots/{id}` create: `fanoutLootToFollowers` trigger writes a thin `feed/{follower}/items/{lootId}` doc per follower (capped batch size 500). Heavy fields stay in `loots/`.
- On follow: `backfillFollowFeed` trigger pulls the followee's 5 latest active loots into the new follower's feed.

## Geo pipeline

Pre-existing Postgres+PostGIS pipeline (formerly `nearbyEvents.js`) repurposed:

- `syncLootToPostgres` Firestore trigger upserts active loots into a `loots_geo` table on every status change
- `getNearbyLoot` callable runs `ST_DWithin` + ranking SQL and returns `lootId[]` for hydration from Firestore
- Cleanup: when status flips to `expired` or `archived`, row is deleted from Postgres

## Lifecycle & urgency

`expiry.js` runs every 5 minutes (`onSchedule`):

1. `active → expiring` — when `expiryAt - now < 2h`
2. `expiring → expired` — when `now >= expiryAt`
3. `expired → archived` — 24h after expiry, async
4. Triggers `loot_alert.js` on transitions:
   - `expiring`: optional alert if loot has saves
   - `expired`: archive cleanup only

Trending detection (`discovery.js`):
- Recompute `trendingScore` every 10 minutes for `active` and `expiring` loots
- Set `status = "trending"` when `trendingScore` exceeds locality threshold (per geoHash-5 cell)

## Notifications (`loot_alert.js`)

Templates — all phrased for discovery + urgency, never event-style:

| Template | Body |
|---|---|
| `new_loot_nearby` | "🚨 New loot dropped near you: {title}" |
| `loot_ending_soon` | "⏳ {title} ends in {timeLeft} — claim before it's gone" |
| `trending_near_you` | "🔥 {title} is trending {distance}km away" |
| `followed_business_drop` | "{businessName} just dropped: {title}" |
| `claim_velocity` | "{claimCount}+ people claimed {title} in the last hour" |

Forbidden templates (delete on sight): "Event starts tomorrow", "Attendees joined", "Schedule updated", "X new participants".

Delivery: FCM multicast via `notifications.js#sendToUserDevices`. Token array: `users/{uid}/accountPreferences/{uid}.fcmTokens`.

## Pro-only operations

Enforced via `requireProfessional` in `roles.js`:

- `createLoot`, `updateLoot`, `archiveLoot`
- `addBranch`, `removeBranch`, `updateBusiness`, `submitVerification`
- `createBoost`
- All `analytics.*`

Personal accounts cannot call any of these — handler throws `permission-denied`.

## External integrations

| Service | Purpose |
|---|---|
| AWS S3 | Loot media storage |
| AWS CloudFront | Signed media URLs for delivery |
| AWS Rekognition | Moderation on `loot_media` upload |
| Google Geocoding | Reverse-geo, place lookup |
| WhatsApp Cloud API | Primary OTP |
| Razorpay | Pro subscriptions, boost payments |
| Qdrant | Recommendation embeddings (category/tag affinity) |
| Neon Postgres | PostGIS-backed nearby queries |
| FCM | Loot alerts |

## Media upload flow

```
1. Pro client calls getUploadUrl(lootId, mediaType)
2. Backend issues S3 presigned POST URL
3. Client uploads directly to S3
4. S3 → object trigger →
   ├─ rekognition.js  → moderate; reject + flag if violating
   ├─ thumbnails.js   → generate thumbnail
   └─ index.js        → write loots/{lootId}.media[]
```

## Download flow

```
1. Client requests media → getLootMediaUrls(lootId)
2. Backend returns CloudFront signed URLs (1h TTL)
3. Client renders via CDN
```

## Deployment

```bash
cd functions
npm run serve     # emulators
npm run deploy    # full deploy (lint runs as predeploy hook)
npm run logs
```

A Loot Firebase project does not yet exist; old project IDs (`momento-*`) belong to a different product and must not be used.

## Testing

Vitest with `node` env and `globals: true`. Tests in `functions/tests/`. Priority test surfaces: `loot.js`, `claim.js`, `expiry.js`, `discovery.js#composite-score`, `roles.js#requireProfessional`, `nearbyLoot.js#geo-pipeline`.
