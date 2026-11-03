# Loot alerts + push notifications

Closes the Phase 1 item "Push tokens + loot alerts" in `.claude/tasks/backend-rewrite/TODO.md`.

## What users get

| Alert type (`LOOT_ALERT_TYPES`) | Who | When |
|---|---|---|
| `followed_business_drop` | followers of the business | a loot goes live (create-as-active or publish) |
| `loot_ending_soon` | users who saved the loot and have not claimed it | the loot enters `expiring` |
| `redemption_reminder` | users holding an unused code for the loot | the loot enters `expiring` |

Every alert lands in the inbox (`GET /v1/me/alerts`). A push is sent too when the user has a
registered device. Follow drops push at most once per user per business per hour (Redis cooldown)
so a business posting five loot doesn't send five pushes; the inbox still lists all five.

Deferred (need a stored user location or business-side alerts): `new_loot_nearby`,
`trending_near_you`, `claim_velocity`.

## Decisions

- **Push transport: Expo push service** (`https://exp.host/--/api/v2/push/send`, plain `fetch`,
  no SDK). The app is Expo; this needs no per-platform code on the server. Android delivery still
  goes through FCM, so EAS needs the FCM V1 key and the app needs `google-services.json`. That
  is push delivery only, not a Firebase backend. `EXPO_ACCESS_TOKEN` is optional.
- Tokens Expo reports as `DeviceNotRegistered` are deleted right away.
- **Fan-out runs in BullMQ** (`loot-alerts` queue), so publishing stays fast and a big follower
  list is processed in batches. Job ids (`drop-<lootId>`, `ending-<lootId>`) dedupe; a unique
  index on `(userId, type, lootId)` makes reruns harmless.
- Alerts are kept 30 days (TTL index).
- Tests run fan-out in-process with a capturing push sender.

## API

- `POST /v1/me/push-tokens` `{ token, platform }`: upsert, moves a token to the signed-in user.
- `DELETE /v1/me/push-tokens` `{ token }`: called before sign-out.
- `GET /v1/me/alerts?cursor&limit` → `{ items, cursor, unreadCount }`.
- `POST /v1/me/alerts/:alertId/read`, `POST /v1/me/alerts/read-all`.

## Code

- `apps/api/src/modules/alerts/`: `pushToken.model.js`, `alert.model.js`, `alerts.routes.js`,
  `fanout.js` (who gets what), `expoPush.js` (sender), `alerts.jobs.js` (queue + worker).
- Hooks: `loot.routes.js` `published()` → `alerts.lootPublished(loot)`; lifecycle `expiring`
  transitions (job + sweeper) → `alerts.lootEndingSoon(loot)`.
- `@loot/shared`: `PushTokenBody` schema, `registerPushToken` / `unregisterPushToken` /
  `markAllAlertsRead`, `queryKeys.alerts` already exists.
- Mobile: `expo-notifications`; `src/lib/push.jsx` registers after sign-in, unregisters on
  sign-out, opens the loot when a notification is tapped; an Alerts screen behind a bell on the Feed.
- Web: notifications page drops the "coming soon" branch, marks alerts read.
