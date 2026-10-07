# CLAUDE.md — Loot

Guidance for Claude Code when working in this repository.

## What Loot is

**Loot is a hyperlocal real-time discovery platform.** Businesses post **loot** (offers, opportunities, drops) and nearby users discover them in a real-time, urgency-driven feed.

> Primary user goal — *"What exciting thing is happening around me right now?"*
> Primary business goal — *"Get nearby people to discover and convert on my loot."*

Mental model: Instagram Reels discovery + TikTok For You + live local pulse.

**Loot is NOT:** Eventbrite, Meetup, a calendar, a ticketing platform, a static catalog, or a search-heavy directory.

## Forbidden vocabulary & concepts

This repo started as a different product (an event/photo-sharing app). Migration debt is real — when you see any of these, treat it as a bug to fix, not a pattern to follow:

| Do not use | Use instead |
|---|---|
| `event`, `events`, `Event`, `Events` | `loot`, `loots`, `Loot`, `Loots` |
| `organizer`, `host`, `creator` (of content) | `business` |
| `attendee`, `participant` | `user` (or `hunter` in user-facing copy) |
| `RSVP`, `interested`, `going` | `claim`, `saved` |
| `ticket`, `ticket tier`, `seat` | `redemption` |
| `event_feed`, `event_explore`, `event_details`, `event_media`, `event_notification`, `event_expiry`, `event_category` | `loot_feed`, `nearby_loot`, `loot_details`, `loot_media`, `loot_alert`, `loot_expiry`, `loot_category` |

**Concepts to delete entirely** (not rename — they don't fit Loot):
- attendee/participant lists
- multi-day event spans, schedule blocks, start+end datetime pairs (use `expiryAt` only)
- ticket tiers, seat assignment, check-in
- invite-only whitelisting / RSVP coordination

## Architectural pillars

Loot architecture optimizes for, in order:

1. **Real-time feed systems** — Nearby, Following, Trending, Fresh
2. **Geospatial discovery** — geoHash, radius filters, distance ranking, clustering, locality
3. **Ranking & recommendation** — distance, freshness, engagement velocity, saves, claims, shares, completion rate, follow & category affinity
4. **Engagement velocity & urgency** — expiry countdowns, ending-soon, trending boosts, auto-archive
5. **Media-first mobile-native UX** — immersive, vertical scroll, swipe, dark/high-contrast, energetic

Do **not** optimize for: scheduling, attendee coordination, ticket management, event logistics, static catalogs.

Do **not** let any single signal dominate ranking (no follower-count-only or paid-boost-only feeds).

## Account model — strict separation

Two account types. They are not interchangeable.

**Personal accounts (consumer):** follow businesses, save loot, claim loot, react, share, review. **Cannot create loot.**

**Professional accounts (business):** create & manage loot, access analytics, manage branches/outlets, boost loot. Onboarding requires business category, verification, operating locations, branding assets. UI distinguishes pro accounts visually from personal.

## Loot lifecycle

`draft → active → trending → expiring → expired → archived`

Urgency is a first-class concern: feed ranking, notifications, UI badges, and recommendations all consume lifecycle state.

## Repo structure

```
/apps/api          The backend — Node.js + Express 5 (JavaScript ESM), MongoDB (Mongoose), Redis,
                   zod validation, jose JWT auth. Tests: Vitest + Supertest + mongodb-memory-server
/apps/web          Next.js 16 App Router — landing, share-link pages, business dashboard
                   (JavaScript/JSX, Tailwind 4, Radix, TanStack Query, Zustand)
/apps/mobile       Expo (React Native) — the consumer feed app
/packages/shared   @loot/shared — framework-free REST client for apps/api, domain constants +
                   JSDoc model shapes, query keys, geo + ranking helpers
```

**JavaScript only.** The whole repo is plain JavaScript (ESM; `.jsx` for files containing JSX).
Do not add TypeScript files or `tsconfig.json`. Document shapes with JSDoc (`@typedef`, `@param`)
where it helps; validate data at runtime with zod in the API.

**apps/api is the only backend.** There is no Firebase (no Auth, Firestore, Functions or Storage);
the old `Backend/` Firebase project was deleted on 2026-10-08 and lives only in git history.

npm workspaces: run `npm install` once at the repo root (covers `apps/*` and `packages/*`).
Run the API with `npm run api` after copying `apps/api/.env.example` to `apps/api/.env` (needs MongoDB + Redis).
Root scripts: `npm run lint`, `npm test` run across every workspace.

Domain code more than one app needs (API calls, enum constants, query keys, geo/ranking helpers)
goes in `packages/shared`, never duplicated into an app. It must stay React-, DOM- and Node-built-in-free
(only `fetch` and ES globals) and use explicit `.js` extensions on relative imports so Node can load it.
Each app calls `configureLootClient({ baseUrl, tokenStore })` once at startup; every API function in
`@loot/shared/api` maps to a REST endpoint under `/v1`. Endpoints the API doesn't implement yet answer 404.

`apps/web/` has its own `CLAUDE.md`, `ARCHITECTURE.md`, and `ONBOARDING.md`; `apps/mobile/` has `CLAUDE.md` + `AGENTS.md`.
The backend plan lives in `.claude/tasks/backend-rewrite/`.

## Infrastructure

In use:
- MongoDB — primary database (Atlas, Mumbai region in production); `2dsphere` indexes for geo
- Redis — rate limits (counters, trending sorted sets and job queues are planned)
- WhatsApp Cloud API — phone OTP delivery (the API issues its own JWT sessions)

Planned (see `.claude/tasks/backend-rewrite/PLAN.md`):
- BullMQ — loot lifecycle jobs (expiry, ending-soon, trending decay)
- Socket.io — real-time feed updates
- Cloudflare Stream + R2 — media upload and delivery
- AWS Rekognition — content moderation
- Razorpay — payments (boosts, pro subscriptions)
- MongoDB Atlas Vector Search — recommendation embeddings

## Task continuity

For any multi-step task, write a plan + checklist in `.claude/tasks/<task-slug>/PLAN.md` and `TODO.md`. Mark items `- [x]` immediately when each step completes. When resuming, read the existing plan first and continue from the first unchecked item.

## graphify

No knowledge graph is checked in — the old `graphify-out/` graphs were built against the pre-Loot TypeScript code and were deleted. If you use graphify, build a fresh graph from a subfolder (`graphify .`) and trust the current source over it.
