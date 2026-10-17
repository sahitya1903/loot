# Loot

Hyperlocal, real-time discovery: businesses post **loot** (offers, drops, opportunities) and people
nearby find them in an urgency-driven feed. Product rules live in [CLAUDE.md](CLAUDE.md).

## Status

| Phase | What | State |
| --- | --- | --- |
| 0 — Foundations | `apps/api` scaffold, phone OTP → JWT auth, shared REST client, web sign-in | ✅ Done |
| 1 — Core API | Profiles, businesses + branches, loot CRUD, Nearby + Fresh feeds, save/claim/redemption, lifecycle jobs, real-time | ✅ Mostly done |
| 2 — Clients | Android MVP on the API; web is wired to the client | ✅ Android MVP done |
| 3 — Business & money | Razorpay boosts + pro subscriptions, analytics, moderation | Not started |
| 4 — Launch | CI, deploy | Not started |

**What works today (Android MVP):** sign in with a phone OTP; see live loot near you (GPS or a chosen
area) ranked by distance, freshness, urgency and engagement; save and claim loot and get a one-time
redemption code (QR + text); watch claim counts, stock and "redeemed" update live. Businesses
onboard with a branch, create and publish loot, and redeem customers' codes at the counter.

**Not built yet:** media upload (loot photos are pasted https links), Following and Trending feeds,
push notifications, map view, video, analytics, payments. The web app still calls some endpoints that
don't exist and shows errors there. The checklist is in
[.claude/tasks/backend-rewrite/TODO.md](.claude/tasks/backend-rewrite/TODO.md).

## Repo

```
apps/api          Node + Express 5 API — MongoDB (Mongoose), Redis, BullMQ, Socket.io, zod, jose JWT
apps/web          Next.js 16 — landing page, sign-in, feed pages, business dashboard (planned)
apps/mobile       Expo SDK 57 (React Native, Expo Router) — the Android app
packages/shared   @loot/shared — REST client, zod request schemas, ranking, realtime contract, geo helpers
```

Plain JavaScript (ESM) everywhere, npm workspaces, Node 22+.

## Run it

Install once from the repo root. Use the folder's exact on-disk casing (`loot`, lowercase) or
Next and Metro can't resolve `@loot/shared`.

```bash
npm install
```

### API

Needs MongoDB and Redis, for example:

```bash
docker run -d --name loot-mongo -p 27017:27017 mongo
docker run -d --name loot-redis -p 6379:6379 redis:7-alpine
```

```bash
cp apps/api/.env.example apps/api/.env   # fill in JWT_ACCESS_SECRET and OTP_SECRET (32+ chars each)
npm run seed                             # demo businesses + live loot around Bengaluru (re-runnable)
npm run api                              # http://localhost:4000 — /health, /ready; Socket.io on the same port
```

The same process runs the BullMQ worker: each live loot gets delayed "ending soon" and "expired" jobs,
and a sweeper runs every minute to catch anything missed. Feeds and claims also check `expiryAt`
directly, so expired loot never shows or sells even if a job is late.

### Mobile (Android)

**Expo Go** — fastest for development. Start the API first, then:

```bash
npm run mobile   # press `a` for the Android emulator, or scan the QR code with Expo Go on a phone
```

The app calls the API on the machine running Metro, port 4000 (its LAN IP from a phone). On the
Android emulator, `10.0.2.2` is more reliable than the LAN IP (no firewall prompts):

```bash
cd apps/mobile && EXPO_PUBLIC_API_URL=http://10.0.2.2:4000 npx expo start --android
```

**Standalone APK** — the JavaScript is bundled in, so no Metro is needed. The API URL is baked in at
build time, so pick the one the device will reach (`10.0.2.2` for the emulator, your LAN IP for a phone
on the same Wi-Fi):

```bash
cd apps/mobile
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000 npx expo prebuild -p android
cd android && EXPO_PUBLIC_API_URL=http://10.0.2.2:4000 ./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk  (adb install -r <that file>)
```

On Windows, build from a short path without spaces (copy the repo to e.g. `C:\lb` and `npm install`
there): React Native's native build fails on paths with spaces, and a OneDrive folder would sync
gigabytes of build output. Gradle needs **JDK 17** (React Native's supported version): newer JDKs,
including the JDK 25 now bundled with Android Studio, fail the CMake configure step with
"A restricted method in java.lang.System has been called". Point `JAVA_HOME` at a JDK 17, e.g.
Temurin 17, or the one Gradle auto-provisions into `%USERPROFILE%\.gradle\jdks\`. The first build
also downloads the NDK and CMake (~1 GB) and takes 10–20 minutes. An http API URL makes
[app.config.js](apps/mobile/app.config.js) allow cleartext traffic and build only `arm64-v8a` +
`x86_64`; an https URL keeps the release strict and builds every ABI. The release APK is signed
with the debug keystore — fine for demos, not for the Play Store.

With an Expo account you can build in the cloud instead: `npx eas-cli@latest build -p android --profile preview`
(profiles in [eas.json](apps/mobile/eas.json); set `EXPO_PUBLIC_API_URL` to a URL the phone can reach).

The generated `android/` folder is gitignored; change native settings in `app.json` / `app.config.js`.

### Web

```bash
npm run web      # http://localhost:3000 — first run creates apps/web/.env.dev from .env.example
```

## Demo script

With the API running and `npm run seed` done:

| Who | Phone (type without +91) | Sign-in code |
| --- | --- | --- |
| Hunter (personal) | `9999900100` | printed in the API log |
| Brew Lab Cafe | `9999900001` | 〃 |
| Neon Alley | `9999900002` | 〃 |
| Kinetic Studio | `9999900003` | 〃 |
| Thread & Loom | `9999900004` | 〃 |

1. **Hunter:** sign in → *Choose an area* → *Indiranagar, Bengaluru*. The feed shows 12 live loot,
   most urgent and nearest first, with countdowns, distance, price and stock.
2. Open *Buy 1 Get 1 cold brew* → *Claim this loot*. A QR code and a `LOOT-XXXXXX` code appear;
   claiming again returns the same code. It's also under the *Claims* tab.
3. Leave that screen open. On a second device (or with the API), sign in as **Brew Lab Cafe** →
   *Redeem* tab → type the code (case and the `LOOT-` prefix don't matter). The hunter's screen flips
   to *Redeemed* live; redeeming the same code again is refused.
4. **Business:** *My loot* → *+ New loot* → fill in an offer, pick *Ends in 1 hour* → *Publish now*.
   It goes live in hunters' feeds straight away (an open Nearby feed shows a "new loot nearby" pill).
5. **No GPS needed:** deny location or pick any preset area; the choice is remembered.

## Development stand-ins

These are deliberate fallbacks so everything runs locally without third-party accounts. None of them
pretends the production integration exists.

| Production | In development |
| --- | --- |
| WhatsApp Cloud API sends the OTP | Without `WHATSAPP_*` credentials the API logs each OTP (`DEV OTP` line) instead; production refuses to start without them |
| Cloudflare R2 / Stream media upload | Loot media are https image links typed into the form; the seed uses placeholder photos |
| Push notifications | Not built; live updates arrive over Socket.io while the app is open |
| Scanning the QR code at the counter | The business types the code shown under the QR |

## Known limitations

- **Media:** no uploads or video yet (P1). The QR code encodes `loot:redeem:<code>`; there's no scanner in the business app yet.
- **Feeds:** Nearby and Fresh only. Following and Trending return 404, and `trendingScore` stays 0 until trending decay jobs exist.
- **Live "new loot nearby"** covers geohash cells about 20 km around the viewer; beyond that, loot appears on refresh.
- **Sockets** keep the identity they connected with after the 15-minute access token expires; they pick up the refreshed token on the next reconnect.
- **Account switching:** a business owner can switch their account type back to personal and claim their own loot.
- **Release APKs** are signed with the debug key and, when pointed at an http API, allow cleartext traffic.

## Check

```bash
npm run lint     # every workspace (the mobile app uses `expo lint`)
npm test         # API (Vitest + in-memory MongoDB + Socket.io), web, shared
```

`TEST_REDIS_URL=redis://localhost:6379/15 npm test --workspace=apps/api` also runs the BullMQ test
against a real Redis (database 15 is wiped by that test).

A pre-commit hook runs ESLint and Prettier on staged files.
