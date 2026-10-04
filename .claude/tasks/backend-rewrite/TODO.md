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
- [ ] Profile update, username uniqueness
- [ ] Business onboarding (personal → professional), branches
- [ ] Loot model + indexes; create/update/archive (professional only)
- [ ] Media upload URLs (Cloudflare Stream / R2) + ready webhooks + Rekognition
- [ ] Nearby feed ($geoNear + scoring + cursor pagination)
- [ ] Following / Trending / Fresh feeds
- [ ] Save / claim / redemption codes
- [ ] BullMQ: expiry, ending-soon, sweeper, trending decay
- [ ] FCM tokens + loot alerts
- [ ] Socket.io rooms (loot, geohash cell)

## Phase 2 — Clients
- [x] @loot/shared importable by the API (plain JS ESM, no build step)
- [x] REST client in @loot/shared behind configureLootClient() (+ contract test against the API)
- [x] Web: auth + data layer off Firebase (pages call REST endpoints; 404 until Phase 1 builds them)
- [ ] Share request schemas (zod) via @loot/shared as endpoints land
- [ ] Mobile: Android MVP on the new API

## Phase 3 — Business & money
- [ ] Razorpay boosts + pro subscriptions + webhooks
- [ ] Analytics (time-series events)
- [ ] Reports + moderation queue

## Phase 4 — Launch
- [ ] Decide whether Firestore/Neon data needs migrating to MongoDB
- [ ] GitHub Actions CI
- [x] Update CLAUDE.md files + docs; retire Backend/ (2026-10-08)
