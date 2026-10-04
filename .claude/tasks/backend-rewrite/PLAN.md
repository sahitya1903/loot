# PLAN — Rewrite Loot backend as a self-written API

Decided 2026-09-30: replace the Firebase backend (`Backend/`) with a self-written
API. Updated 2026-10-08: the API is plain JavaScript (the whole repo dropped TypeScript), and
`Backend/` plus every Firebase dependency in the clients are gone (see `.claude/tasks/remove-firebase/`). Clients stay Next.js (web) + Expo (Android). Product rules in the root
`CLAUDE.md` (vocabulary, account model, lifecycle, ranking pillars) do not change.

## Target stack

| Layer | Pick |
|---|---|
| API | `apps/api` — Node.js + Express 5 (JavaScript ESM), zod validation, pino logging |
| Database | MongoDB Atlas (Mumbai): `2dsphere` geo, Atlas Search, Atlas Vector Search |
| Data access | Mongoose |
| Cache / counters / rate limits | Redis (ioredis) |
| Jobs | BullMQ (loot lifecycle, trending decay, alert fan-out) |
| Real-time | Socket.io + Redis adapter (rooms per loot and per geohash cell) |
| Auth | WhatsApp Cloud API OTP → JWT access token (15 min, `jose`) + rotating refresh tokens with reuse detection |
| Media | Cloudflare Stream (video, HLS) + R2/Images (images), direct upload from clients |
| Moderation | AWS Rekognition |
| Push | `expo-notifications` in the app; server-side sender not decided (Expo push service or FCM/APNs directly) |
| Payments | Razorpay (orders, subscriptions, verified webhooks) |
| Hosting | Railway/Render to start → AWS ap-south-1 later |
| Tests | Vitest + Supertest + mongodb-memory-server + ioredis-mock |
| Monitoring | Sentry, PostHog |

## Phases

**0. Foundations (this session)** — plan, updated tech-stack PDF, `apps/api` scaffold:
config, logging, Mongo + Redis connections, error handling, health check, the full
OTP → JWT → refresh auth flow, account-type guard, tests.

**1. Core API** — users/profile, businesses + branches, loot CRUD with media upload,
Nearby feed (`$geoNear` → filter → score → cursor page), Following/Trending/Fresh feeds,
save/claim/redemption (unique indexes), lifecycle jobs, trending in Redis, push alerts,
Socket.io real-time.

**2. Clients** — ~~REST client in `@loot/shared`~~ and ~~web auth off Firebase~~ are done;
remaining: build the Android MVP against the new API, and share request schemas (zod) via
`@loot/shared` as endpoints land.

**3. Business & money** — Razorpay boosts + pro subscriptions, analytics (time-series
events collection), moderation queue, reports.

**4. Launch** — decide whether any Firestore/Neon data needs migrating into MongoDB, CI
(GitHub Actions), deploy. (`Backend/` is already retired.)

## Key design rules

- Loot documents embed a GeoJSON `location` point (copied from the branch) with a `2dsphere` index.
- Counters live on documents (`$inc`); raw engagement events go to a time-series collection.
- Trending = Redis sorted sets with time decay, written back as `trendingScore` by a job. No single signal dominates; boost multiplier capped at 1.3.
- Expiry = delayed BullMQ job at `expiryAt` + periodic sweeper. Never a TTL index on loot (we archive, not delete).
- Unique indexes on `{userId, lootId}` for saves and claims.
- Only `professional` accounts create/manage loot — enforced by `requireAccountType` middleware.
- OTPs and refresh tokens are stored hashed; OTP sends are rate-limited per phone and IP.

## Open questions / notes

- ~~`@loot/shared` can't be imported by the API~~ — resolved 2026-10-08: shared is plain JS ESM
  with `.js` import extensions, so Node, Next and Metro all load it as-is (no build step).
- Repo stays on npm workspaces for now; pnpm + Turborepo is optional, decide in phase 4.
- Email OTP (SES) from the old backend is not carried over yet — confirm whether it's still needed.
