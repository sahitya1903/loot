# Loot — Backend Onboarding

Welcome to Loot's Cloud Functions backend. This is a hyperlocal real-time discovery platform: businesses post **loot** (offers / drops / opportunities) and nearby users discover them in a feed-first, urgency-driven UX.

> Read root [`CLAUDE.md`](../CLAUDE.md) for the product positioning and the forbidden-vocabulary list before writing code.

## What this backend does

- **Cloud Functions** — callable APIs, Firestore triggers, scheduled jobs (region: `asia-south1`)
- **Firestore Security Rules** — pro-vs-personal account-type access
- **Firestore Indexes** — composite indexes for feed / discovery queries
- **Geo pipeline** — Postgres + PostGIS sync for nearby loot
- **FCM** — loot alerts (new nearby, ending soon, trending)

## Prerequisites

- Node.js >= 22
- Firebase CLI: `npm install -g firebase-tools`
- Access to a Loot Firebase project (ask the team)
- Env values (`.env.<project-id>`) from team

## Setup

```bash
cd Backend/functions
npm install
firebase login
firebase use <loot-project-id>
```

Run emulators:
```bash
npm run serve
```

Deploy:
```bash
npm run deploy
```

Single test:
```bash
npx vitest run tests/<file>.test.js
```

## Where to start reading

If you're new, follow this order:

1. [`ARCHITECTURE.md`](./ARCHITECTURE.md) — module map, schema, ranking, lifecycle
2. [`functions/options.js`](./functions/options.js) — global region setup
3. [`functions/loot.js`](./functions/loot.js) — the core CRUD surface
4. [`functions/feed.js`](./functions/feed.js) — fanout + four feed types
5. [`functions/nearbyLoot.js`](./functions/nearbyLoot.js) — geo pipeline
6. [`functions/discovery.js`](./functions/discovery.js) — ranking + trending
7. [`functions/expiry.js`](./functions/expiry.js) — lifecycle scheduler
8. [`functions/loot_alert.js`](./functions/loot_alert.js) — notification templates

## Function patterns

Every callable: import `./options.js` first; check `request.auth?.uid`; for mutations on loot/business, call `requireProfessional`.

```js
import "./options.js";
import { onCall } from "firebase-functions/v2/https";
import { requireProfessional } from "./roles.js";

export const createLoot = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  await requireProfessional(request.auth.uid);
  // ...
});
```

## Account types

Two types — strictly separated:

| | Personal | Professional |
|---|---|---|
| Can create loot | ❌ | ✅ |
| Can claim / save | ✅ | ❌ |
| Can follow businesses | ✅ | ✅ |
| Can manage branches | ❌ | ✅ |
| Can view analytics | ❌ | ✅ |
| Can boost loot | ❌ | ✅ |

Stored as `users/{uid}.accountType: "personal" | "professional"`.

## Common tasks

### Add a new callable

1. Pick the right module (`loot.js`, `claim.js`, etc. — see ARCHITECTURE)
2. `import "./options.js"` first
3. Auth-check; pro-check if mutating loot/business
4. Export from the module + re-export from `index.js`
5. Write a Vitest test in `tests/`

### Add a Firestore trigger

1. Use `onDocumentCreated/Updated/Deleted` from `firebase-functions/v2/firestore`
2. Triggers stay in the module they belong to (e.g. fanout in `feed.js`, geo sync in `nearbyLoot.js`)
3. Re-export from `index.js`

### Add a scheduled job

1. Use `onSchedule` with `timeZone: "Asia/Kolkata"` for India-local cadence
2. Lifecycle / urgency jobs live in `expiry.js`; trending recomputes in `discovery.js`

### Tune ranking weights

Edit weights in `discovery.js`. Add a Vitest test that constructs a few synthetic loots and asserts the ordering. Avoid letting any single signal dominate — paid boosts cap their multiplier.

## External services

Same set as the prior Momento codebase, repurposed:

| Service | Purpose |
|---|---|
| AWS S3 + CloudFront | Loot media |
| AWS Rekognition | Moderation |
| Google Geocoding | Place lookup |
| WhatsApp Cloud API + Firebase SMS | OTP auth |
| Razorpay | Pro subscriptions + loot boosts |
| Qdrant | Recommendation embeddings |
| Neon Postgres + PostGIS | Nearby-loot queries |
| FCM | Loot alerts |

## Testing

```bash
npm run test                          # full suite
npm run test:coverage                 # with coverage
npx vitest run tests/loot.test.js     # single file
```

Add tests for:
- Pro-vs-personal guards (`roles.test.js`)
- Lifecycle transitions (`expiry.test.js`)
- Composite ranking (`discovery.test.js`)
- Geo round-trip (`nearbyLoot.test.js`)

## Troubleshooting

**Function deploys but nothing happens** — check region. Everything is `asia-south1`. If the client is calling the default region, it'll silently miss.

**`permission-denied` on a mutation** — almost always the pro-account guard. Confirm the caller's `users/{uid}.accountType`.

**Geo query returns empty** — confirm the loot is `active`, has lat/lng, and the Postgres trigger has fired (look at recent rows in `loots_geo`).

**Trending never flips** — `discovery.js` runs every 10 min. Check it's deployed. Also check that the locality threshold isn't set too high for an empty geoHash cell.

## Task continuity

For multi-step work, write `.claude/tasks/<slug>/PLAN.md` and `TODO.md` first. Mark items `- [x]` as you go.
