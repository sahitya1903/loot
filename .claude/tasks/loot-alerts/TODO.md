# TODO — loot alerts + push

- [x] Write PLAN.md + TODO.md
- [x] Shared: PushTokenBody schema, alert API functions, LootAlert/Page shape
- [x] API: PushToken + LootAlert models
- [x] API: push-token and alerts routes
- [x] API: Expo push sender
- [x] API: fan-out (follow drop, ending soon, redemption reminder) + BullMQ queue/worker
- [x] API: hook publish + expiring transitions; wire into index.js and app.js
- [x] API tests: routes, fan-out, push sender, hooks
- [x] Mobile: expo-notifications, register/unregister, tap → loot, Alerts screen
- [x] Web: notifications page on the real endpoint, mark read
- [x] Docs: README, DEPLOY.md (FCM key), CLAUDE.md, backend-rewrite TODO/PLAN, apps/mobile/CLAUDE.md
- [x] Verify: lint, tests, mobile bundle (expo export)
- [ ] Try a real push on a device build (needs the user + FCM key)
