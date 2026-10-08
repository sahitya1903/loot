# Loot

Hyperlocal, real-time discovery: businesses post **loot** (offers, drops, opportunities) and people
nearby find them in an urgency-driven feed. Product rules live in [CLAUDE.md](CLAUDE.md).

## Status

| Phase | What | State |
| --- | --- | --- |
| 0 — Foundations | `apps/api` scaffold, phone OTP → JWT auth, shared REST client, web sign-in | ✅ Done |
| 1 — Core API | Profiles, businesses + branches, loot CRUD + media, feeds, save/claim, lifecycle jobs, real-time | ⏳ Next |
| 2 — Clients | Mobile app on the API (web is wired to the client already) | Partly done |
| 3 — Business & money | Razorpay boosts + pro subscriptions, analytics, moderation | Not started |
| 4 — Launch | CI, deploy | Not started |

What works today: sign in with a phone OTP on the web, session refresh, sign out. Every other
screen calls an endpoint the API doesn't have yet and shows an error (404). The mobile app is a
placeholder screen. The checklist is in [.claude/tasks/backend-rewrite/TODO.md](.claude/tasks/backend-rewrite/TODO.md).

## Repo

```
apps/api          Node + Express 5 API — MongoDB (Mongoose), Redis, zod, jose JWT
apps/web          Next.js 16 — landing page, sign-in, feed pages, business dashboard (planned)
apps/mobile       Expo SDK 57 (React Native) — the consumer app
packages/shared   @loot/shared — REST client, domain constants, query keys, geo + urgency helpers
```

Plain JavaScript (ESM) everywhere, npm workspaces, Node 22+.

## Run it

Install once from the repo root. Use the folder's exact on-disk casing (`loot`, lowercase) or
Next and Metro can't resolve `@loot/shared`.

```bash
npm install
```

**API** — needs MongoDB and Redis (e.g. `docker run -d -p 27017:27017 mongo` and
`docker run -d -p 6379:6379 redis`).

```bash
cp apps/api/.env.example apps/api/.env   # fill in JWT_ACCESS_SECRET and OTP_SECRET
npm run api                              # http://localhost:4000, health at /health
```

Without WhatsApp credentials the API prints each OTP to its console instead of sending it, so
you can sign in with any phone number.

**Web**

```bash
npm run web      # http://localhost:3000 — first run creates apps/web/.env.dev from .env.example
```

**Mobile** — on a phone, install Expo Go and scan the QR code:

```bash
npm run mobile   # then press `a` to open an Android emulator instead
```

To build and run it from Android Studio instead: `cd apps/mobile && npx expo prebuild -p android`,
then open `apps/mobile/android` in Android Studio. Gradle needs Android Studio's bundled JDK — set
`JAVA_HOME` to `C:\Program Files\Android\Android Studio\jbr` if a newer Java is on your PATH.
The generated `android/` folder is gitignored; change native settings in `app.json`.

## Check

```bash
npm run lint     # every workspace
npm test         # API (Vitest + in-memory MongoDB), web, shared
```

A pre-commit hook runs ESLint and Prettier on staged files.
