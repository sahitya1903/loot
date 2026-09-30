# PLAN — Rewrite Loot backend as a self-written API

Decided 2026-09-30: replace the Firebase backend (`Backend/`) with a self-written
TypeScript API. Clients stay Next.js (web) + Expo (Android). Product rules in the root
`CLAUDE.md` (vocabulary, account model, lifecycle, ranking pillars) do not change.

## Target stack

| Layer | Pick |
|---|---|
| API | `apps/api` — Express 5 + TypeScript (Node ESM), zod validation, pino logging |
| Database | MongoDB Atlas (Mumbai): `2dsphere` geo, Atlas Search, Atlas Vector Search |
| Data access | Mongoose |
| Cache / counters / rate limits | Redis (ioredis) |
| Jobs | BullMQ (loot lifecycle, trending decay, alert fan-out) |
| Real-time | Socket.io + Redis adapter (rooms per loot and per geohash cell) |
| Auth | WhatsApp Cloud API OTP → JWT access token (15 min, `jose`) + rotating refresh tokens with reuse detection |
| Media | Cloudflare Stream (video, HLS) + R2/Images (images), direct upload from clients |
| Moderation | AWS Rekognition |
| Push | FCM via `firebase-admin` (server) + `expo-notifications` (app) |
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

**2. Clients** — move zod schemas into `@loot/shared`; replace the Firebase-callable API
client with a REST client (same `configureLootClient()` injection seam); swap the web data
layer; build the Android MVP against the new API.

**3. Business & money** — Razorpay boosts + pro subscriptions, analytics (time-series
events collection), moderation queue, reports.

**4. Cutover** — migrate Firestore/Neon data into MongoDB, update CLAUDE.md files and
docs, CI (GitHub Actions), retire `Backend/`.

## Key design rules

- Loot documents embed a GeoJSON `location` point (copied from the branch) with a `2dsphere` index.
- Counters live on documents (`$inc`); raw engagement events go to a time-series collection.
- Trending = Redis sorted sets with time decay, written back as `trendingScore` by a job. No single signal dominates; boost multiplier capped at 1.3.
- Expiry = delayed BullMQ job at `expiryAt` + periodic sweeper. Never a TTL index on loot (we archive, not delete).
- Unique indexes on `{userId, lootId}` for saves and claims.
- Only `professional` accounts create/manage loot — enforced by `requireAccountType` middleware.
- OTPs and refresh tokens are stored hashed; OTP sends are rate-limited per phone and IP.

## Open questions / notes

- `@loot/shared` currently exports raw `.ts` with bundler resolution; the API (NodeNext ESM)
  can't import it at runtime until shared gets a build step or the API is bundled. Resolve in phase 2.
- Repo stays on npm workspaces for now; pnpm + Turborepo is optional, decide in phase 4.
- Email OTP (SES) from the old backend is not carried over yet — confirm whether it's still needed.
