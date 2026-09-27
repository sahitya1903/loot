# Loot — Web App Architecture

Web frontend for **Loot**, a hyperlocal real-time discovery platform. Read `../../CLAUDE.md` for product positioning before working here.

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 + React 19 |
| Styling | TailwindCSS 4 |
| State (client) | Zustand 5 |
| State (server) | TanStack Query 5 |
| Firebase | SDK v12 (auth, firestore, functions) |
| Forms | React Hook Form 7 + Zod |
| Animation | Framer Motion 12 + GSAP |
| Maps | Google Maps JS API |
| Testing | Vitest, Playwright |
| Hosting | Vercel |

## Directory structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                       # Landing
│   ├── login/
│   ├── onboarding/
│   │   ├── personal/                  # personal-account onboarding
│   │   └── professional/              # business onboarding (category, verification, branding)
│   ├── (main)/
│   │   ├── layout.tsx                 # Auth guard + adaptive bottom nav
│   │   ├── feed/                      # Nearby | Following | Trending | Fresh
│   │   ├── nearby/                    # Map view of loot pins
│   │   ├── loot/[id]/                 # Detail: media-first, claim CTA, business strip
│   │   ├── business/[id]/             # Their loots, follow button, branches
│   │   ├── search/                    # Category browse, locality trends
│   │   ├── saved/                     # Personal: saved loot
│   │   ├── claims/                    # Personal: redemptions
│   │   ├── notifications/
│   │   ├── profile/
│   │   ├── pro/                       # Professional-only
│   │   │   ├── dashboard/
│   │   │   ├── create/
│   │   │   ├── loot/[id]/             # manage / edit / boost / analytics
│   │   │   ├── branches/
│   │   │   └── analytics/
│   │   └── settings/
│   └── api/                           # health
│
├── components/
│   ├── ui/                            # design-system primitives (button, sheet, chip, …)
│   ├── loot/
│   │   ├── LootCard.tsx               # vertical immersive card
│   │   ├── LootMedia.tsx              # video/image carousel
│   │   ├── LootCountdown.tsx          # countdown chip (ending soon pulse)
│   │   ├── LootMeta.tsx               # business strip + distance + claim count
│   │   ├── LootActions.tsx            # claim / save / share
│   │   └── LootDetailHero.tsx
│   ├── feed/
│   │   ├── FeedTabs.tsx               # Nearby / Following / Trending / Fresh
│   │   ├── FeedList.tsx               # virtualized infinite scroll
│   │   └── FeedEmpty.tsx
│   ├── business/
│   │   ├── BusinessHeader.tsx
│   │   ├── BusinessBadge.tsx          # "verified business" treatment
│   │   └── BranchPicker.tsx
│   ├── nearby/
│   │   ├── NearbyMap.tsx
│   │   └── NearbyCluster.tsx
│   ├── claim/
│   │   ├── ClaimSheet.tsx             # bottom sheet with redemption code/QR
│   │   └── RedemptionQR.tsx
│   ├── pro/                           # pro-only components (dashboard, create form, analytics)
│   ├── layout/                        # bottom-nav, top-bar
│   ├── common/
│   └── providers/                     # QueryClientProvider, ThemeProvider, GeoProvider
│
├── hooks/
│   ├── use-auth.ts
│   ├── use-geo.ts                     # current location, watchPosition, permission gating
│   ├── use-nearby-feed.ts             # paginated nearby feed
│   ├── use-following-feed.ts
│   ├── use-trending-feed.ts
│   ├── use-fresh-feed.ts
│   ├── use-loot.ts                    # single loot detail
│   ├── use-claim.ts                   # claim mutation + redemption fetch
│   ├── use-save.ts
│   ├── use-business.ts
│   ├── use-countdown.ts               # second-precision countdown for expiryAt
│   └── use-toast.ts
│
├── lib/
│   ├── firebase/
│   │   ├── config.ts                  # web Firebase init + configureLootClient()
│   │   ├── auth.ts                    # OTP + Google + Apple
│   │   └── firestore.ts
│   ├── razorpay.ts                    # boost checkout
│   ├── motion.ts                      # animation presets (urgency pulse, tap feedback)
│   ├── utils.ts
│   └── logger.ts
│
├── stores/
│   ├── auth.ts
│   └── geo.ts                         # current location, denied/granted state
│
└── types/
    └── google-maps.d.ts               # web-only ambient types
```

### Shared with mobile — `@loot/shared` (`packages/shared/src/`)

Framework-free domain code used by both `apps/web` and `apps/mobile`. Import it; don't copy it.

```
packages/shared/src/
├── client.ts        # configureLootClient() + callFunction() — each app injects its Firebase
├── types/           # models.ts (Loot, Business, User, …), api.ts (request/response shapes)
├── api/             # keys (query-key factory), loot, feed, claim, business, profile, follow, subscription
├── geo/             # geohash, distance (haversine), format ("2.3 km away")
└── ranking/         # format — urgency tier classification for UI
```

Subpath imports: `@loot/shared/types`, `@loot/shared/api`, `@loot/shared/geo`, `@loot/shared/ranking`.

## Data flow

```
Component
  → useQuery / useMutation
    → packages/shared/src/api/*  (typed wrappers)
      → callFunction()  (packages/shared/src/client.ts)
        → Cloud Function (asia-south1)
          → Firestore / Postgres / S3
```

Direct Firestore listeners are used for: live `viewCount` / `claimCount` on the loot detail screen, the user's `notifications` subcollection, and saved/claimed indicators in feed cards (small per-user lookup cache).

## State

### Zustand — `src/stores/auth.ts`

```ts
interface AuthState {
  user: FirebaseUser | null
  profile: AppUser | null              // includes accountType, businessId?
  business: Business | null            // hydrated for pro accounts
  isInitialized: boolean
  setUser, setProfile, setBusiness, reset
}
```

### Zustand — `src/stores/geo.ts`

```ts
interface GeoState {
  coords: { lat: number; lng: number } | null
  status: 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'
  lastUpdated: number | null
  request, set, clear
}
```

### TanStack Query keys — `packages/shared/src/api/keys.ts`

```ts
export const queryKeys = {
  feed: {
    nearby: (lat: number, lng: number, radius: number) =>
      ['feed', 'nearby', lat.toFixed(3), lng.toFixed(3), radius] as const,
    following: (userId: string) => ['feed', 'following', userId] as const,
    trending: (geoCell: string) => ['feed', 'trending', geoCell] as const,
    fresh: (lat: number, lng: number) =>
      ['feed', 'fresh', lat.toFixed(3), lng.toFixed(3)] as const,
  },
  loot: {
    detail: (id: string) => ['loot', id] as const,
    media: (id: string) => ['loot', id, 'media'] as const,
  },
  business: {
    detail: (id: string) => ['business', id] as const,
    loots: (id: string) => ['business', id, 'loots'] as const,
  },
  user: {
    saved: (id: string) => ['user', id, 'saved'] as const,
    claimed: (id: string) => ['user', id, 'claimed'] as const,
  },
}
```

## Feed-first architecture

The default authenticated landing is `/feed` (not `/profile`, not `/loot`). It hosts four tabs:

1. **Nearby** — `useNearbyFeed(coords, radius)` hits `getNearbyLoot` callable
2. **Following** — `useFollowingFeed(userId)` reads `feed/{userId}/items`
3. **Trending** — `useTrendingFeed(localityCell)` reads pre-computed trending list
4. **Fresh** — `useFreshFeed(coords)` newest active loots within radius

All four use **infinite scroll** via TanStack Query's `useInfiniteQuery`. Cards autoplay short video on viewport intersection.

## Loot card

Vertical immersive card. Layout:

```
┌──────────────────────────────────┐
│  [media — 4:5 image / video]    │
│   ⏳ ENDS IN 1H 42M (red pulse) │
│   📍 1.2 km away                │
│                                  │
│ ─────────────────────────────── │
│  @cafe_seven (verified) ✓       │
│  Free coffee for first 50       │
│  3.4k views · 87 claims · 🔥    │
│  [ CLAIM ]   [ ❤ Save ]  [ ↗ ]  │
└──────────────────────────────────┘
```

Components: `LootCard`, `LootMedia`, `LootCountdown`, `LootMeta`, `LootActions`.

## Account-aware navigation

Bottom nav adapts to `profile.accountType`:

**Personal:** Feed · Nearby · Saved · Claims · Profile
**Professional:** Dashboard · Create · Analytics · Branches · Profile (with a "consumer view" toggle to see feed)

Visual differentiation:
- Pro accounts have a `Business` badge in the top bar and an accent color shift
- Pro-only routes (`/pro/*`) are 404'd for personal accounts (auth guard)

## Authentication

| Method | Flow |
|---|---|
| Phone OTP (primary) | WhatsApp Cloud API → Firebase SMS fallback |
| Google OAuth | popup |
| Apple OAuth | popup |

After auth, onboarding asks "Personal or Professional?" — pro path collects category, operating locations, branding, and triggers verification (`submitVerification` callable).

## Geo

`GeoProvider` wraps the auth-guarded layout. On mount it requests permission, sets `geoStore.coords`, and re-fetches when stale (>5 min). Feed queries depend on `coords` — they don't fire until coords are available (with a fallback "Set your city" CTA if denied).

`packages/shared/src/geo/distance.ts` computes haversine distance for client-side display ("2.3 km away"). `packages/shared/src/geo/geohash.ts` derives a geoHash-5 cell for trending lookups.

## Urgency surfaces

Every loot has `expiryAt`. Display tiers (`packages/shared/src/ranking/format.ts`):

| Time left | Treatment |
|---|---|
| > 24h | grey chip, no animation |
| 2h – 24h | amber chip, gentle fade-pulse |
| < 2h | red chip, pulse + "Ending soon" label |
| 0 | "Expired" chip, card greyed, claim disabled |

`useCountdown(expiryAt)` returns `{ totalSeconds, label, tier }` with second-precision updates throttled to 1Hz.

## Forms

React Hook Form + Zod. Pro create-loot example:

```ts
const lootSchema = z.object({
  title: z.string().min(3).max(80),
  description: z.string().max(500),
  category: z.enum(LOOT_CATEGORIES),
  expiryAt: z.number().int().refine(t => t > Date.now(), 'must be future'),
  visibilityRadiusKm: z.number().min(0.5).max(50).default(5),
  redemptionType: z.enum(['in_store', 'online_code', 'first_come', 'none']),
  branchId: z.string().optional(),
  media: z.array(z.object({ s3Key: z.string(), mediaType: z.enum(['image', 'video']) })).min(1),
  terms: z.string().max(1000).optional(),
})
```

## Design system

TailwindCSS 4 with CSS variables in `src/app/globals.css`. Dark-first.

Tokens (also defined in `src/lib/design/tokens.ts`):

```css
--accent: oklch(0.74 0.22 12);          /* neon coral */
--accent-2: oklch(0.85 0.20 130);       /* electric lime */
--bg: oklch(0.12 0.02 270);             /* near-black with cool tilt */
--surface: oklch(0.18 0.02 270);
--surface-2: oklch(0.22 0.02 270);
--text: oklch(0.98 0 0);
--text-dim: oklch(0.72 0 0);
--urgency-amber: oklch(0.82 0.18 75);
--urgency-red: oklch(0.66 0.24 27);
```

Radii: tight `4px`, default `12px`, card `20px`. Motion: 220ms cubic-bezier(0.22, 1, 0.36, 1) for entrances; tap feedback 120ms scale 0.97.

Typographic scale: a tight sans-serif (Inter or similar) with display weight on titles. No serifs, no calendar layouts.

## Path aliases

`@/` → `src/`.

## Environment

All variables are listed in `.env.example`. Firebase vars are read in
`src/lib/firebase/config.ts`.

Env files: `.env.dev`, `.env.staging`, `.env.prod` → auto-copied to `.env.local`.

## Testing

```bash
npm run test
npm run test:watch
npm run test:e2e
```

Priority surfaces:
- `packages/shared/src/geo/distance.test.ts` — haversine correctness
- `packages/shared/src/ranking/format.test.ts` — urgency tier boundaries
- `hooks/use-countdown.test.ts` — second-precision tick + expiry crossover
- `packages/shared/src/api/loot.test.ts` — claim idempotency
- E2E: feed → loot detail → claim → redemption sheet

## CI/CD

GitHub Actions workflows in `.github/workflows/`. Auto-deploy from `staging` and `production` branches via Vercel.
