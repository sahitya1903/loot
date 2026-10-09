# TODO — Android MVP

## Shared
- [ ] zod schemas (business, branch, loot create/update, feed query, profile) in @loot/shared
- [ ] Model JSDoc: offer/price, quantity, viewer state, branch on loot
- [ ] Ranking weights + scoreLoot; new client fns (getMyBusiness, publishLoot, redeemCode, getNearby...)

## API
- [ ] PATCH /v1/me, PUT /v1/me/account-type
- [ ] Businesses: onboard, get, get mine, update, branches add/remove
- [ ] Loot model + indexes; create/update/publish/archive/get; business loot list
- [ ] Nearby + fresh feeds ($geoNear, score, cursor)
- [ ] Save/unsave, saved list
- [ ] Claim, claims list, redemption by loot, business redeem
- [ ] Views/shares counters
- [ ] Lifecycle: sweeper + BullMQ delayed jobs
- [ ] Socket.io counters (+ Redis adapter)
- [ ] Tests for every rule above
- [ ] Seed script + run locally against real Mongo/Redis

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
