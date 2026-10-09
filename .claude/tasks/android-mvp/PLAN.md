# PLAN — Android MVP (deadline Sat 2026-10-17)

Brief: working Android customer journey on the self-written API — OTP sign-in → nearby feed →
loot details → save / claim → redemption code a business can validate — plus the minimal
business side (onboard, create/manage loot, redeem codes). Supersedes Phase 1 + "Mobile: Android
MVP" in `.claude/tasks/backend-rewrite/TODO.md` for the items listed here.

## Verified starting state (2026-10-14)

- API: auth (OTP send/verify, refresh rotation + reuse detection, logout), `GET /v1/me`,
  `requireAccountType`, Redis rate limiter. 21 tests pass, lint clean.
- `@loot/shared`: REST client for ~40 endpoints (only 5 exist), models, geo + urgency helpers. 8 tests pass.
- Mobile: a single placeholder `App.jsx` (Expo SDK 57). No router, no deps beyond expo.
- No BullMQ, Socket.io, media upload, loot/business/claim models yet.
- Docker daemon not running (no local Mongo/Redis); Android SDK + `Medium_Phone_API_37.0` AVD present.

## Decisions

- **Lifecycle** stays `draft → active → trending → expiring → expired → archived` (root CLAUDE.md).
  No `scheduled` state: CLAUDE.md forbids start/end pairs; a draft is published explicitly.
- **Claim = redemption.** One `claims` collection, unique `{userId, lootId}`; serialized as the
  shared `Redemption` shape with a unique code. Claiming is idempotent (re-claim returns the same code).
- **Stock:** `totalQuantity` (null = unlimited) + `claimCount`. Claim does a conditional `$inc`
  (live, unexpired, stock left) first, then inserts the claim; a duplicate insert rolls the `$inc`
  back. Never oversells; works without transactions (mongodb-memory-server is standalone).
- **Redemption:** business-scoped atomic `issued → used`; other businesses' codes look not-found.
  Valid until loot expiry, but at least 1 h after claiming.
- **Save & claim are personal-account actions** (CLAUDE.md account model).
- **Ranking:** weights + a JS `scoreLoot` live in `@loot/shared/ranking`; the API builds the same
  formula as a Mongo expression so `$geoNear → filter → score → sort → cursor page` runs in one
  aggregation. A test asserts both agree. Cursor carries `asOf` so scores are stable across pages.
- **Expiry correctness never depends on jobs:** every read filters `expiryAt > now`. BullMQ
  delayed jobs + a 1-minute sweeper update `status` (needs real Redis; disabled in tests).
- **Real-time:** Socket.io rooms `loot:<id>` broadcast counters; Redis adapter when Redis is up.
  Clients refetch over REST on reconnect.
- **Media:** MVP takes https image/video URLs on loot create (seed uses hosted images). R2 direct
  upload is P1.
- **Mobile styling:** StyleSheet + theme tokens. NativeWind deferred (setup risk on SDK 57 this week).

## Order

1. Shared: zod schemas, model shapes, ranking, new client functions
2. API: profile/account-type, businesses + branches
3. API: loot model, CRUD, publish/archive
4. API: nearby + fresh feeds
5. API: save, claim, redemption
6. API: lifecycle jobs + Socket.io
7. API: seed script, local run
8. Mobile: router, session, sign-in, feed, details, saved, claims, location, profile
9. Mobile: business onboarding, create loot, redeem
10. Android build + docs
