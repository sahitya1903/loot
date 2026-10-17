# TODO — backend rewrite

## Phase 0 — Foundations
- [x] Write PLAN.md + TODO.md
- [x] Regenerate docs/Loot-Tech-Stack.pdf for the self-written stack
- [x] Scaffold apps/api (package.json, tsconfig, env config, logger, app, server bootstrap)
- [x] Mongo + Redis connections, error handling, health check
- [x] Auth: user model, OTP model, refresh-token model
- [x] Auth: WhatsApp sender (dev mode logs OTP), send/verify OTP, refresh rotation, logout
- [x] Middleware: validate (zod), requireAuth, requireAccountType, Redis rate limiter
- [x] GET /v1/me
- [x] Tests: auth flow end to end (Vitest + Supertest + mongodb-memory-server)
- [x] Verify: install, type-check, tests, build, boot
- [x] Root: `api` script; .env.example; README section in root CLAUDE.md

## Phase 1 — Core API
Built for the Android MVP (see `.claude/tasks/android-mvp/` in git history). Remaining items below.
- [x] PUT /v1/me/account-type
- [x] PATCH /v1/me profile update, username uniqueness
- [ ] Profile picture upload URL
- [x] Business onboarding (personal → professional), branches, follows
- [x] Loot model + indexes; create/update/publish/archive (business only); drafts
- [ ] Media upload URLs (Cloudflare Stream / R2) + ready webhooks + Rekognition
- [x] Nearby feed ($geoNear + scoring + cursor pagination)
- [x] Fresh feed
- [ ] Following / Trending feeds
- [x] Save / claim / redemption codes (stock-safe, one-time redeem)
- [x] BullMQ: expiry, ending-soon, sweeper
- [ ] BullMQ: trending decay (Redis sorted sets → trendingScore)
- [ ] Push tokens + loot alerts (GET /v1/me/alerts, mark read)
- [x] Socket.io rooms (loot, geohash cell, user) + Redis adapter

## Phase 2 — Clients
- [x] @loot/shared importable by the API (plain JS ESM, no build step)
- [x] REST client in @loot/shared behind configureLootClient() (+ contract test against the API)
- [x] Web: auth + data layer off Firebase (pages call REST endpoints; 404 until Phase 1 builds them)
- [x] Share request schemas (zod) via @loot/shared as endpoints land
- [x] Mobile: Android MVP on the new API

## Phase 3 — Business & money
- [ ] Razorpay boosts + pro subscriptions + webhooks
- [ ] Analytics (time-series events)
- [ ] Reports + moderation queue

## Phase 4 — Launch
- [x] Old data: nothing to migrate (Firestore/Neon was unreachable and is deleted)
- [ ] GitHub Actions CI
- [x] Update CLAUDE.md files + docs; retire Backend/
