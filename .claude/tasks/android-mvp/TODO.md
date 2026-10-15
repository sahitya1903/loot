# TODO — Android MVP

## Shared
- [x] zod schemas (business, branch, loot create/update, feed query, profile) in @loot/shared
- [x] Model JSDoc: offer/price, quantity, viewer state, branch on loot
- [x] Ranking weights + scoreLoot; new client fns (getMyBusiness, publishLoot, redeemCode, getNearby...)

## API (Phases 2-3 done: 102 API tests incl. real-Redis BullMQ; smoke-tested against local Mongo + Docker Redis)
- [x] PATCH /v1/me, PUT /v1/me/account-type
- [x] Businesses: onboard, get, get mine, update, branches add/remove
- [x] Loot model + indexes; create/update/publish/archive/get; business loot list
- [x] Nearby + fresh feeds ($geoNear, score, cursor)
- [x] Save/unsave, saved list
- [x] Claim, claims list, redemption by loot, business redeem
- [x] Views/shares counters
- [x] Lifecycle: sweeper (state transitions, idempotent handlers)
- [x] Lifecycle: BullMQ delayed jobs + periodic sweeper in the server process
- [x] Socket.io counters (+ Redis adapter)
- [x] Tests for every rule above
- [x] Seed script + run locally against real Mongo/Redis

## Mobile
- [ ] Deps + Expo Router skeleton, providers, client config, secure token store
- [ ] Sign-in (phone, OTP), session restore, logout
- [ ] Location: GPS + manual fallback, persisted
- [ ] Nearby feed (FlashList, expo-image/expo-video), states
- [ ] Loot details + save + claim + live counters
- [ ] Saved, Claims (redemption code) tabs
- [ ] Profile
- [ ] Business: onboarding, my loot, create loot, redeem code
- [ ] Lint + run on emulator

## Deliver
- [ ] Android debug/dev build
- [ ] README: setup, demo script, known limitations; update backend-rewrite TODO
