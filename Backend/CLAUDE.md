# Loot — Backend (Firebase Functions)

Guidance for Claude Code when working in this subfolder.

## Product

This is the Backend for **Loot**, a hyperlocal real-time discovery platform. Read the root `../CLAUDE.md` first for product positioning, forbidden vocabulary, and architectural pillars. Everything below assumes that context.

## Task continuity

For any multi-step task, write `.claude/tasks/<task-slug>/PLAN.md` and `TODO.md` before touching code. Mark items `- [x]` immediately when each step completes. Resume from the first unchecked item.

## Stack

| Layer | Tech |
|---|---|
| Runtime | Node 22, ES Modules |
| Framework | Firebase Functions v2 |
| Region | `asia-south1` (always) |
| Primary DB | Firestore |
| Geo / Postgres | Neon Postgres + PostGIS |
| Vectors | Qdrant |
| Media | AWS S3 + CloudFront |
| Moderation | AWS Rekognition |
| Auth OTP | WhatsApp Cloud API → Firebase SMS fallback |
| Payments | Razorpay (boosts, pro subscriptions) |

## Commands

```bash
cd functions
npm run lint          # ESLint (also predeploy hook)
npm run test          # Vitest
npm run test:coverage
npm run serve         # Firebase emulators (functions only)
npm run deploy        # Deploy all functions
npm run logs          # Tail function logs

# Single test
npx vitest run tests/<file>.test.js
```

## Module organization

Flat file structure inside `functions/`. Each `.js` file exports related Cloud Functions; `index.js` re-exports everything. `options.js` sets the global `asia-south1` region and **must be imported first** in every file.

Functional modules (Loot domain):

| File | Responsibility |
|---|---|
| `loot.js` | Loot CRUD (create / update / archive / soft-delete), media URL generation, view tracking |
| `feed.js` | Feed fanout to followers on loot creation; backfill on follow; per-user feed materialization |
| `nearbyLoot.js` | Geospatial sync (Firestore → Postgres+PostGIS), nearby-loot queries, geoHash indexing |
| `discovery.js` | Trending, fresh, locality, category-affinity ranking; trend-score updater |
| `claim.js` | Claim & save mutations, redemption issuance, claim-count rollup |
| `expiry.js` | Lifecycle transitions (active → expiring → expired → archived); scheduled sweeps; "ending soon" alerts |
| `loot_alert.js` | FCM templates: new-loot-nearby, ending-soon, trending-near-you, business-you-follow-dropped, claim-velocity |
| `business.js` | Professional account onboarding, branch/outlet management, verification, branding assets |
| `boost.js` | Razorpay-backed loot boosts (hierarchy: organic > paid signal mix; never paid-only) |
| `analytics.js` | Pro-account analytics (impressions, claim rate, completion, demographics) |
| `login.js` | WhatsApp/SMS OTP auth (kept from infrastructure) |
| `profile.js` | Personal & professional profile mutations (kept) |
| `notifications.js` | FCM token fanout primitives (kept; consumed by `loot_alert.js`) |
| `razorpay.js` | Payment plan/subscription/webhook plumbing (kept) |
| `safeDeletes.js` | Cascade deletion triggers (kept) |
| `reports.js` | Loot reports & moderation queue (kept) |
| `rekognition.js` | Media moderation hook (kept) |
| `roles.js` | Pro-vs-personal account-type guards (rewritten — no more event RBAC) |
| `counters.js` | Counter rollup helpers (kept) |
| `options.js` | `setGlobalOptions({ region: "asia-south1" })` |
| `index.js` | Re-exports + a few small utility callables (geocode, S3 cleanup) |

**Concepts deleted** (do not reintroduce): event participants, event chat, event presence, RSVPs, invite keys, role permissions per event, network graph derived from shared events, bulk invites, face-matching gallery search, app-store submission flows. Keep face/InsightFace plumbing only if reused for recommendation embeddings; otherwise prune.

## Function patterns

Three call types — all require `region: "asia-south1"` (set globally via `options.js`, but you may override per function).

**Callable (`onCall`)**

```js
import "./options.js";
import { onCall } from "firebase-functions/v2/https";

export const createLoot = onCall({
  secrets: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"],
  memory: "512MiB",
}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  // require pro account
  // ...
});
```

Always check `request.auth?.uid`. Mutations that create or modify loot must additionally check `accountType === "professional"` (see `roles.js`).

**Firestore trigger**

```js
import { onDocumentCreated } from "firebase-functions/v2/firestore";

export const onLootCreated = onDocumentCreated({
  document: "loots/{lootId}",
}, async (event) => {
  const lootId = event.params.lootId;
  const data = event.data.data();
  // fanout, geo sync, alert dispatch...
});
```

**Scheduled**

```js
import { onSchedule } from "firebase-functions/v2/scheduler";

export const sweepExpiredLoot = onSchedule({
  schedule: "*/5 * * * *",
  timeZone: "Asia/Kolkata",
}, async () => { /* ... */ });
```

## Secrets & config

Use `defineSecret()` / `defineString()` from `firebase-functions/params`. Access via `.value()` inside handlers.

Env files (per Firebase project): `functions/.env.<project-id>`.

## Account-type guard

Loot has two account types — personal (consume) and professional (create). Pro-only callables:

```js
import { requireProfessional } from "./roles.js";

export const createLoot = onCall(/* ... */, async (request) => {
  await requireProfessional(request.auth.uid);
  // ...
});
```

`requireProfessional` reads `users/{uid}.accountType` and throws `permission-denied` if not `professional`.

## Firestore schema (high-level)

See `ARCHITECTURE.md` for the full schema. Top-level collections:

- `users/{userId}` — personal & pro accounts (discriminator: `accountType`)
- `businesses/{businessId}` — pro account profile (1:1 with a `users/{uid}` for the owner)
- `loots/{lootId}` — the discovery object
- `lootInteractions/{lootId}/saves|claims|views|shares|reports|reviews/{userId|autoId}`
- `feed/{userId}/items/{lootId}` — materialized per-user feed
- `notifications/{userId}/items/{notifId}` — alert log
- `localities/{geoCellId}` — denormalized hot-cell stats for trending nearby

## Geo

Geospatial discovery is load-bearing. Loot writes mirror to Neon Postgres + PostGIS via Firestore triggers. Nearby queries hit Postgres, not Firestore (already proven via the legacy nearbyEvents code — adapt that pipeline to `nearbyLoot.js`).

## Tests

Vitest, `node` env, `globals: true`. Tests live in `functions/tests/`. Add tests for new domain logic in `claim.js`, `expiry.js`, `discovery.js`, and `roles.js`.

## graphify

A graphify graph exists at `graphify-out/` but was built against the pre-Loot codebase — treat as stale until rebuilt. After substantive changes run `graphify update .` from `Backend/`.
