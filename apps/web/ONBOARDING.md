# Loot — Web App Onboarding

Welcome to Loot's web frontend. The product is a **hyperlocal real-time discovery platform**: businesses post loot (offers / drops / opportunities) and nearby users discover them in a feed-first, urgency-driven UX.

> Read root [`CLAUDE.md`](../CLAUDE.md) for the product positioning and the forbidden-vocabulary list before writing code.

## Prerequisites

- Node.js >= 20
- A Loot Firebase project (ask the team for project ID)
- `.env.dev` (and `.env.staging` / `.env.prod` if needed) populated by the team

## Setup

```bash
npm install          # from the repo root — installs every workspace
cd apps/web
cp .env.dev .env.local
npm run dev
```

App boots at http://localhost:3000.

## Where to start reading

1. [`ARCHITECTURE.md`](./ARCHITECTURE.md) — directory map, data flow, design system
2. [`packages/shared/src/types/models.ts`](../../packages/shared/src/types/models.ts) — `Loot`, `Business`, `User`, etc.
3. [`src/app/(main)/feed/page.tsx`](./src/app/(main)/feed/page.tsx) — primary surface
4. [`src/components/loot/LootCard.tsx`](./src/components/loot/LootCard.tsx) — feed card
5. [`src/hooks/use-nearby-feed.ts`](./src/hooks/use-nearby-feed.ts) — feed fetch + infinite scroll
6. [`packages/shared/src/api/loot.ts`](../../packages/shared/src/api/loot.ts) — API client surface

## Mental model

The default authenticated screen is the **Feed**. Everything else is reachable from there.

```
Feed (Nearby | Following | Trending | Fresh)
 ├─ tap card → Loot Detail (claim, save, share)
 │   └─ tap business → Business Profile (their loots, follow, branches)
 ├─ tap Nearby tab in nav → Map view
 ├─ tap Search → Categories + Locality trends
 ├─ tap Saved → User's saved loot list
 ├─ tap Claims → User's claimed redemptions (codes / QR)
 └─ tap Profile → Personal: my activity / Pro: dashboard
```

## Account types

You'll see this distinction throughout:

- **Personal** — consumer. Bottom nav: Feed · Nearby · Saved · Claims · Profile
- **Professional** — business. Bottom nav: Dashboard · Create · Analytics · Branches · Profile (with consumer toggle)

Components in `src/components/pro/` are pro-only — they crash if rendered for a personal account (we use a `RequireProfessional` wrapper).

## Common tasks

### Add a new feed query

1. Add the API function in `packages/shared/src/api/feed.ts`
2. Add the query key in `packages/shared/src/api/keys.ts`
3. Add a hook in `src/hooks/use-<name>-feed.ts` that uses `useInfiniteQuery`
4. Wire it into `src/app/(main)/feed/page.tsx`

### Add a new loot card field

1. Update `Loot` in `packages/shared/src/types/models.ts`
2. Update the Cloud Function payload (Backend `loot.js`)
3. Update `LootCard` / `LootDetailHero` to render
4. Add a Vitest test if the field affects layout/logic

### Change urgency thresholds

Edit `packages/shared/src/ranking/format.ts`. Add a Vitest test asserting the new tier boundaries.

### Add a pro-only screen

1. Add the route under `src/app/(main)/pro/`
2. Wrap the layout with `<RequireProfessional>` (lives in `src/components/pro/RequireProfessional.tsx`)
3. Add the tab to the pro bottom-nav in `src/components/layout/BottomNav.tsx`

### Test against staging Firebase

```bash
npm run dev:staging
```

## Tooling

- **ESLint:** `npm run lint:fix`
- **Type-check:** `npm run type-check`
- **Unit tests:** `npm run test`
- **E2E:** `npm run test:e2e:ui` (interactive)

## Forbidden patterns

This codebase descends from a previous product. Treat anything in this list as a bug:

- `Event*` types or imports — replace with `Loot*`
- `events/[id]` URLs — replace with `loot/[id]`
- `organizer` / `host` / `attendee` / `participant` — use `business` / `user`
- `RSVP` / `interested` / `going` — use `claim` / `saved`
- `inviteKey`, `whoCanJoin`, `whoCanUpload` — delete
- Calendar widgets, schedule pickers — delete (use a single `expiryAt` picker)
- Photo galleries owned by an "event" — loot has its own `media[]` array

## Troubleshooting

**Feed shows nothing** — check `geoStore.status`. If `denied` you'll see the "Set your city" fallback. If `granted` but `coords === null`, the browser hasn't fired `geolocation.getCurrentPosition` yet.

**Claim button does nothing** — check `requireProfessional` is NOT being applied to a consumer mutation. `claimLoot` is a personal-account action, not pro. Also check `expiryAt > now`.

**Pro dashboard 404s** — `profile.accountType` is `personal`. You need to convert via `/onboarding/professional` or test with a pro test account.

**Countdown stuck on "Expired"** — `useCountdown` returns `tier: 'expired'` when `expiryAt - now <= 0`. Confirm the loot's `expiryAt` is a millisecond timestamp.

## Task continuity

For any multi-step task, write `.claude/tasks/<task-slug>/PLAN.md` and `TODO.md` first. Mark items `- [x]` as you go.
