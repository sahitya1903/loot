# Loot — Web App Onboarding

Welcome to Loot's web frontend. The product is a **hyperlocal real-time discovery platform**: businesses post loot (offers / drops / opportunities) and nearby users discover them in a feed-first, urgency-driven UX.

> Read root [`CLAUDE.md`](../../CLAUDE.md) for the product positioning and the forbidden-vocabulary list before writing code.

## Prerequisites

- Node.js >= 22
- MongoDB and Redis running locally (for the API) — e.g. `docker run -d -p 27017:27017 mongo` and `docker run -d -p 6379:6379 redis`
- `.env.dev` (and `.env.staging` / `.env.prod` if needed) populated by the team, or copy `.env.example`

## Setup

```bash
npm install                          # from the repo root — installs every workspace
cp apps/api/.env.example apps/api/.env   # then fill in the two secrets it asks for
npm run api                          # API on http://localhost:4000

cd apps/web
cp .env.example .env.dev             # NEXT_PUBLIC_API_URL defaults to http://localhost:4000
npm run dev                          # web on http://localhost:3000
```

In development without WhatsApp credentials, the API **logs the OTP** to its console instead of sending it — sign in with any phone number and copy the code from the API logs.

## Where to start reading

1. [`ARCHITECTURE.md`](./ARCHITECTURE.md) — directory map, data flow, design system
2. [`packages/shared/src/models.js`](../../packages/shared/src/models.js) — `Loot`, `Business`, `AppUser` shapes + enum constants
3. [`src/app/(main)/feed/page.jsx`](<./src/app/(main)/feed/page.jsx>) — primary surface
4. [`src/components/loot/LootCard.jsx`](./src/components/loot/LootCard.jsx) — feed card
5. [`src/hooks/use-nearby-feed.js`](./src/hooks/use-nearby-feed.js) — feed fetch + infinite scroll
6. [`packages/shared/src/client.js`](../../packages/shared/src/client.js) and [`api/`](../../packages/shared/src/api) — how the app talks to the API
7. [`src/lib/auth.js`](./src/lib/auth.js) — sign-in and session restore

## Mental model

The default authenticated screen is the **Feed**. Everything else is reachable from there.

```
Feed (Nearby | Following | Trending | Fresh)
 ├─ tap card → Loot Detail (claim, save, share)
 │   └─ tap business → Business Profile (their loots, follow, branches)
 ├─ tap Nearby tab in nav → Map view
 ├─ tap Search → Categories
 ├─ tap Saved → User's saved loot list
 ├─ tap Claims → User's claimed redemptions (codes / QR)
 └─ tap Profile → Personal: my activity / Pro: dashboard (planned)
```

## Account types

You'll see this distinction throughout:

- **Personal** — consumer. Bottom nav: Feed · Nearby · Saved · Claims · Profile
- **Professional** — business. Bottom nav: Dashboard · Create · Analytics · Branches · Profile (planned — the `/pro` routes aren't built yet)

The API is the source of truth: professional-only endpoints reject personal accounts with `403 account_type_required`, whatever the UI shows.

## Common tasks

### Call a new API endpoint

1. Add the function in `packages/shared/src/api/<area>.js` using `apiRequest(method, path, { body, query })`
2. Export it from `packages/shared/src/api/index.js`
3. Add a query key in `packages/shared/src/api/keys.js` if it's a read
4. Use it from a hook in `src/hooks/` with `useQuery` / `useInfiniteQuery` / `useMutation`
5. Build the endpoint in `apps/api` (it answers 404 until then)

### Add a new loot card field

1. Add it to the `Loot` / `LootFeedItem` JSDoc shapes in `packages/shared/src/models.js`
2. Return it from the API endpoint in `apps/api`
3. Render it in `LootCard` / the loot detail page
4. Add a Vitest test if the field affects layout/logic

### Change urgency thresholds

Edit `packages/shared/src/ranking/format.js`. Add a Vitest test asserting the new tier boundaries.

### Add a pro-only screen (once `/pro` exists)

1. Add the route under `src/app/(main)/pro/`
2. Guard it on `profile.accountType === 'professional'` in the layout
3. Add the tab to the pro bottom-nav in `src/components/layout/bottom-nav.jsx`

### Test against staging

```bash
npm run dev:staging   # uses .env.staging (points NEXT_PUBLIC_API_URL at the staging API)
```

## Tooling

- **ESLint:** `npm run lint:fix`
- **Unit tests:** `npm run test`
- **E2E:** `npm run test:e2e:ui` (interactive)

This app is plain JavaScript — there is no type-check step. Use JSDoc where a shape isn't obvious.

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

**Every page shows errors / 404s** — most endpoints aren't built in `apps/api` yet (see `.claude/tasks/backend-rewrite/TODO.md`). Sign-in and `/v1/me` work today.

**Sign-in fails with a network error** — the API isn't running, or `NEXT_PUBLIC_API_URL` is wrong, or the web origin isn't in the API's `CORS_ORIGINS`.

**Feed shows nothing** — check `geoStore.status`. If `denied` you'll see the "Set your city" fallback. If `granted` but `coords === null`, the browser hasn't fired `geolocation.getCurrentPosition` yet.

**`Module not found: @loot/shared` in `next build`** — the workspace links were created through a differently-cased repo path than the folder's real name. Delete `node_modules/@loot` and run `npm install` from the repo root using the exact folder casing.

**Countdown stuck on "Expired"** — `useCountdown` returns `tier: 'expired'` when `expiryAt - now <= 0`. Confirm the loot's `expiryAt` is an ISO-8601 string (or epoch ms) in the future.

## Task continuity

For any multi-step task, write `.claude/tasks/<task-slug>/PLAN.md` and `TODO.md` first. Mark items `- [x]` as you go.
