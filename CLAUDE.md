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
/Backend           Firebase project — functions/ (Node 22 ESM), firestore.rules, firestore.indexes.json
/apps/web          Next.js 16 App Router — landing, share-link pages, business dashboard
                   (TS, Tailwind 4, Radix, TanStack Query, Zustand, Firebase web SDK)
/apps/mobile       Expo (React Native) — the consumer feed app
/packages/shared   @loot/shared — framework-free types, Cloud Function API client, geo + ranking helpers
```

npm workspaces: run `npm install` once at the repo root (covers `apps/*` and `packages/*`).
`Backend/functions` is **not** a workspace — it keeps its own `package.json`/lockfile for Firebase deploys.

Domain code both apps need (model types, API calls, query keys, geo/ranking helpers) goes in
`packages/shared`, never duplicated into an app. It must stay React- and DOM-free; each app injects
its Firebase instances via `configureLootClient()`.

`Backend/` and `apps/web/` have their own `CLAUDE.md`, `ARCHITECTURE.md`, and `ONBOARDING.md`; `apps/mobile/` has `CLAUDE.md` + `AGENTS.md`.

## Shared infrastructure (carried over, still useful)

- Firebase Auth — phone OTP via WhatsApp Cloud API → SMS fallback
- Firestore — primary metadata DB, asia-south1 region
- AWS S3 + CloudFront — media storage and signed download URLs
- AWS Rekognition — content moderation
- Neon Postgres + PostGIS — geospatial queries (already in use; load-bearing for Nearby feed)
- Razorpay — payments (boosts, pro subscriptions)
- Qdrant — vector DB (recommendation embeddings)

## Task continuity

For any multi-step task, write a plan + checklist in `.claude/tasks/<task-slug>/PLAN.md` and `TODO.md`. Mark items `- [x]` immediately when each step completes. When resuming, read the existing plan first and continue from the first unchecked item.

## graphify

Knowledge graphs at `Backend/graphify-out/` and `apps/web/graphify-out/` may be stale (built against the pre-Loot codebase). Trust the current source files over the graph. After substantive changes, run `graphify update .` from the modified subfolder.
