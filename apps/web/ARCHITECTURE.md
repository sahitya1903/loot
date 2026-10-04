# Loot — Web App Architecture

Web frontend for **Loot**, a hyperlocal real-time discovery platform. Read `../../CLAUDE.md` for product positioning before working here.

## Stack

| Layer          | Tech                                                                   |
| -------------- | ---------------------------------------------------------------------- |
| Framework      | Next.js 16 (App Router, Turbopack)                                     |
| Language       | JavaScript (ESM; `.jsx` for files with JSX) + React 19 — no TypeScript |
| Styling        | TailwindCSS 4                                                          |
| State (client) | Zustand 5                                                              |
| State (server) | TanStack Query 5                                                       |
| Backend        | `apps/api` (Node + Express) through the `@loot/shared` REST client     |
| Forms          | React Hook Form 7 + Zod                                                |
| Animation      | Framer Motion 12 + GSAP                                                |
| Maps           | Google Maps JS API                                                     |
| Testing        | Vitest, Playwright                                                     |
| Hosting        | Vercel                                                                 |

There is no Firebase anywhere in the web app.

## Directory structure

What exists today. Items marked _(planned)_ are part of the design but not built yet.

```
src/
├── app/
│   ├── layout.jsx                     # Root layout (theme, providers)
│   ├── page.jsx                       # Landing
│   ├── login/                         # Phone OTP sign-in
│   ├── onboarding/                    # Personal vs Professional choice
│   ├── (main)/
│   │   ├── layout.jsx                 # Auth guard + adaptive bottom nav
│   │   ├── feed/                      # Nearby | Following | Trending | Fresh
│   │   ├── home/
│   │   ├── nearby/                    # Map view of loot pins
│   │   ├── loot/[id]/                 # Detail: media-first, claim CTA, business strip
│   │   ├── business/[id]/             # Their loots, follow button, branches
│   │   ├── search/                    # Category browse
│   │   ├── saved/                     # Personal: saved loot
│   │   ├── claims/                    # Personal: redemptions
│   │   ├── notifications/             # Loot alerts (polled)
│   │   ├── profile/ (+ edit/)
│   │   ├── settings/                  # blocked, reports, subscription, verified
│   │   └── pro/                       # (planned) dashboard, create, loot/[id], branches, analytics
│   └── api/health/                    # Next.js route handler
│
├── components/
│   ├── ui/                            # design-system primitives
│   ├── landing/                       # marketing landing sections
│   ├── loot/                          # LootCard, LootMedia, LootCountdown, LootMeta, LootActions
│   ├── feed/                          # FeedTabs, FeedList (infinite scroll), FeedEmpty
│   ├── layout/                        # bottom-nav, sidebar
│   ├── login/                         # LoginPolaroidCollage
│   ├── common/                        # smart-banner ("open in app")
│   ├── analytics/                     # Airbridge loader
│   ├── providers.jsx                  # QueryClient + Theme + session restore
│   └── providers/SmoothScrollProvider.jsx
│
├── hooks/
│   ├── use-auth.js                    # reads the auth store
│   ├── use-geo.js                     # current location, permission gating
│   ├── use-nearby-feed.js / use-following-feed.js / use-trending-feed.js / use-fresh-feed.js
│   ├── use-loot.js                    # detail, media, claim/save/share mutations, redemption
│   ├── use-countdown.js               # second-precision countdown for expiryAt
│   └── use-toast.js, use-theme.jsx, use-debounce.js, …
│
├── lib/
│   ├── api.js                         # configureLootClient(): API URL + localStorage token store
│   ├── auth.js                        # OTP sign-in, restoreSession(), signOut()
│   ├── razorpay.js                    # checkout loader
│   ├── motion.js                      # animation presets
│   ├── utils.js
│   └── logger.js
│
└── stores/
    ├── auth.js                        # profile, business, isInitialized, isNewUser
    └── geo.js                         # current location, denied/granted state
```

### Shared with mobile and the API — `@loot/shared` (`packages/shared/src/`)

Framework-free domain code. Import it; don't copy it.

```
packages/shared/src/
├── client.js        # configureLootClient(), apiRequest() (bearer auth, refresh on 401), ApiError
├── models.js        # enum constants (LOOT_CATEGORIES, LOOT_STATUSES, …) + JSDoc model shapes
├── api/             # keys (query-key factory), auth, profile, business, loot, claim, feed, alerts, subscription
├── geo/             # geohash, distance (haversine), format ("2.3 km away")
└── ranking/         # format — urgency tier classification for UI
```

Subpath imports: `@loot/shared/models`, `@loot/shared/api`, `@loot/shared/geo`, `@loot/shared/ranking`.

## Data flow

```
Component
  → useQuery / useMutation
    → packages/shared/src/api/*   (one function per REST endpoint)
      → apiRequest()  (packages/shared/src/client.js)
        → apps/api  /v1/...  → MongoDB / Redis
```

- `src/lib/api.js` configures the client once: base URL from `NEXT_PUBLIC_API_URL`
  (default `http://localhost:4000`), tokens in `localStorage` under `loot_session`.
  `components/providers.jsx` imports it before anything else runs.
- Access tokens last 15 minutes. The client refreshes them before expiry or after a 401, one
  refresh at a time (the API revokes the whole session if a refresh token is reused).
- Failures throw `ApiError` with `status`, `code` (stable, e.g. `otp_invalid`), `message` and `details`.
- Lists are cursor-paginated: `{ items, cursor }`, `cursor` is `null` on the last page.
- Endpoints the API hasn't built yet answer 404 — see `.claude/tasks/backend-rewrite/TODO.md`.
- Nothing is real-time yet; the notifications page polls every 30 s. Socket.io is planned.

## State

### Zustand — `src/stores/auth.js`

```js
{
  profile,        // AppUser from the API (accountType, businessId, …); null when signed out
  business,       // Business, for pro accounts
  isLoading,
  isInitialized,  // true once restoreSession() has run
  isNewUser,      // true until onboarding finishes (survives reloads via sessionStorage)
}
```

Signed in means `profile !== null`. Components read it through `useAuth()`.

### Zustand — `src/stores/geo.js`

Current coordinates plus permission status (`idle | requesting | granted | denied | unavailable`).

### TanStack Query keys — `packages/shared/src/api/keys.js`

One factory for every query key (`queryKeys.feed.nearby(lat, lng, radius, category)`,
`queryKeys.loot.detail(id)`, `queryKeys.alerts()`, …) so cache invalidation stays in sync.

## Feed-first architecture

The default authenticated landing is `/feed`. It hosts four tabs:

1. **Nearby** — `useNearbyFeed({ coords, radiusKm })` → `GET /v1/feed/nearby`
2. **Following** — `useFollowingFeed(userId)` → `GET /v1/feed/following`
3. **Trending** — `useTrendingFeed(coords)` → `GET /v1/feed/trending` (by geohash-5 cell)
4. **Fresh** — `useFreshFeed(coords)` → `GET /v1/feed/fresh`

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
**Professional:** Dashboard · Create · Analytics · Branches · Profile _(planned — the `/pro/*` routes don't exist yet)_

Visual differentiation:

- Pro accounts have a `Business` badge in the top bar and an accent color shift
- Pro-only routes are hidden from personal accounts; the API enforces it regardless (`requireAccountType`)

## Authentication

Phone OTP only: the API sends a 6-digit code over WhatsApp (`POST /v1/auth/otp/send`), then
`POST /v1/auth/otp/verify` returns the user plus an access token and a rotating refresh token.
`src/lib/auth.js` wraps this (`sendPhoneOtp`, `verifyPhoneOtp`, `restoreSession`, `signOut`).

New users land on `/onboarding` to choose Personal or Professional (`PUT /v1/me/account-type`).
The pro path (category, operating locations, branding, verification) is planned.

## Geo

`useGeo` requests permission, sets `geoStore` coordinates and re-fetches when stale. Feed queries depend on coordinates — they don't fire until they're available.

`packages/shared/src/geo/distance.js` computes haversine distance for display ("2.3 km away"). `packages/shared/src/geo/geohash.js` derives a geohash-5 cell for trending lookups.

## Urgency surfaces

Every loot has `expiryAt` (ISO-8601 string from the API). Display tiers (`packages/shared/src/ranking/format.js`):

| Time left | Treatment                                   |
| --------- | ------------------------------------------- |
| > 24h     | grey chip, no animation                     |
| 2h – 24h  | amber chip, gentle fade-pulse               |
| < 2h      | red chip, pulse + "Ending soon" label       |
| 0         | "Expired" chip, card greyed, claim disabled |

`useCountdown(expiryAt)` returns `{ totalSeconds, label, tier }`, ticking once per second.

## Forms

React Hook Form + Zod. Use the enum constants from `@loot/shared/models` so client validation
matches the API, e.g. for the (planned) pro create-loot form:

```js
import { LOOT_CATEGORIES, REDEMPTION_TYPES } from '@loot/shared/models'

const lootSchema = z.object({
  title: z.string().min(3).max(80),
  description: z.string().max(500),
  category: z.enum(LOOT_CATEGORIES),
  expiryAt: z.iso.datetime().refine((t) => Date.parse(t) > Date.now(), 'must be in the future'),
  visibilityRadiusKm: z.number().min(0.5).max(50).default(5),
  redemptionType: z.enum(REDEMPTION_TYPES),
  branchId: z.string().optional(),
  terms: z.string().max(1000).optional(),
})
```

## Design system

TailwindCSS 4 with CSS variables in `src/app/globals.css`. Dark-first.

Intended palette (check `globals.css` for the live values):

```css
--accent: oklch(0.74 0.22 12); /* neon coral */
--accent-2: oklch(0.85 0.2 130); /* electric lime */
--bg: oklch(0.12 0.02 270); /* near-black with cool tilt */
--surface: oklch(0.18 0.02 270);
--urgency-amber: oklch(0.82 0.18 75);
--urgency-red: oklch(0.66 0.24 27);
```

Radii: tight `4px`, default `12px`, card `20px`. Motion: 220ms cubic-bezier(0.22, 1, 0.36, 1) for entrances; tap feedback 120ms scale 0.97.

## Path aliases

`@/` → `src/` (`jsconfig.json`).

## Environment

All variables are listed in `.env.example`; the API base URL is `NEXT_PUBLIC_API_URL`.

Env files: `.env.dev`, `.env.staging`, `.env.prod` → auto-copied to `.env.local` by `npm run dev*`.

## Testing

```bash
npm run test          # Vitest
npm run test:watch
npm run test:e2e      # Playwright
```

- `src/lib/auth.test.js` — session restore, OTP sign-in, onboarding flag, sign-out
- `packages/shared/src/client.test.js` — token refresh, retry on 401, error mapping
- `apps/api/tests/sharedClient.test.js` — the shared client against the real API
- Next to add: `ranking/format` tier boundaries, `use-countdown` expiry crossover, E2E feed → detail → claim

## CI/CD

Hosted on Vercel; the branch flow is in `CONTRIBUTING.md`. There are no GitHub Actions workflows yet (planned in the backend rewrite, Phase 4).
