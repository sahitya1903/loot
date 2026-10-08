# Loot — Web App (Next.js)

Guidance for Claude Code when working in `apps/web`. Read the root `../../CLAUDE.md` first —
product positioning, forbidden vocabulary and the account model apply here unchanged.

The web app is **mobile-first**: every layout is designed for a vertical phone viewport first;
desktop is a graceful upscale.

## Stack

| Layer        | Tech                                                                  |
| ------------ | --------------------------------------------------------------------- |
| Framework    | Next.js 16 App Router (Turbopack)                                     |
| Language     | JavaScript (ESM, `.jsx` for JSX) + React 19 — no TypeScript           |
| Styling      | TailwindCSS 4 + CSS variables in `src/app/globals.css`                |
| Client state | Zustand 5                                                             |
| Server state | TanStack Query 5                                                      |
| Backend      | `apps/api` (Express) via the `@loot/shared` REST client — no Firebase |
| Animation    | Framer Motion, Lenis (smooth scroll on the landing page)              |
| Testing      | Vitest (unit), Playwright (E2E, `e2e/`)                               |
| Hosting      | Vercel                                                                |

## Commands

```bash
npm run dev            # localhost:3000; copies .env.dev → .env.local (created from .env.example on first run)
npm run dev:staging    # same, with .env.staging
npm run build
npm run lint
npm run test           # Vitest
npm run test:e2e       # Playwright (needs the dev server)
```

## Routes

The primary surface is the **feed**. Loot detail is secondary; business profile, search and
settings are tertiary.

```
src/app/
├── page.jsx                 # Public landing
├── login/                   # Phone OTP sign-in (WhatsApp)
├── onboarding/              # Personal vs Professional choice
├── (main)/                  # Signed-in routes — layout.jsx is the auth guard + nav
│   ├── feed/                # Nearby | Following | Trending | Fresh tabs
│   ├── nearby/  search/  saved/  claims/  notifications/
│   ├── loot/[id]/           # Loot detail (claim, save, share)
│   ├── business/[id]/       # Business profile
│   ├── profile/ (+ edit/)   settings/
│   └── pro/[[...section]]/  # "Coming soon" for every /pro/* link until the business tools exist
└── api/health/              # Health check
```

A real route under `pro/` (e.g. `pro/dashboard/page.jsx`) takes precedence over the placeholder.

## Data flow

```
Component → hook in src/hooks (useQuery / useMutation)
  → function in @loot/shared/api (one per REST endpoint)
    → apiRequest() in packages/shared/src/client.js (bearer token, refresh on 401)
      → apps/api /v1/...
```

- `src/lib/api.js` configures the client once (`NEXT_PUBLIC_API_URL`, tokens in `localStorage`
  under `loot_session`); `src/components/providers.jsx` imports it before anything else.
- Failures throw `ApiError` (`status`, `code`, `message`, `details`). Lists are `{ items, cursor }`.
- Query keys come from `queryKeys` in `@loot/shared/api` — never hand-write them.
- Endpoints apps/api hasn't built yet answer 404, so most signed-in pages show errors until Phase 1.
- Nothing is real-time yet; the notifications page polls.

Auth is phone OTP only. `src/lib/auth.js` owns `sendPhoneOtp`, `verifyPhoneOtp`,
`restoreSession()` (run once by `Providers`) and `signOut()`. Zustand `stores/auth.js` holds
`{ profile, business, isLoading, isInitialized, isNewUser }`; signed in means `profile !== null`.
`stores/geo.js` holds the current location for the feeds.

## Account types

- `personal` — nav: Feed / Nearby / Saved / Claims / Profile
- `professional` — nav: Dashboard / Create / Analytics / Branches / Profile, with a distinct
  accent and a "Business" badge

The API enforces account type (`403 account_type_required`); UI hiding is only cosmetic.

## Conventions

- `@/` maps to `src/` (`jsconfig.json`).
- Domain code (API calls, enums, geo, urgency tiers) comes from `@loot/shared` — don't copy it here.
- Every loot card shows urgency: countdown chip, "ending soon" pulse, claim count.
  Tiers come from `@loot/shared/ranking` (`urgencyTier`, `countdown`).
- Dark-first, high contrast, vertical scroll. No calendar/agenda/table aesthetics.
