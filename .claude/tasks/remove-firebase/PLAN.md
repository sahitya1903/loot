# PLAN — Remove Firebase; apps/api (Node + Express) is the only backend; JavaScript only

Decided 2026-10-08 (user): the self-written Express API in `apps/api` is the only backend, and
"for now" the whole repo is JavaScript, not TypeScript. The Firebase backend (`Backend/`) is
deleted and no client talks to Firebase (Auth, Firestore, Functions, Storage).

## What was done

1. Committed the Phase 0 API work on branch `chore/remove-firebase`; `.gitattributes` marks
   binaries so the tech-stack PDF isn't line-ending converted.
2. Deleted `Backend/` (still in git history).
3. Converted apps/api, packages/shared, apps/web, apps/mobile to JavaScript with the TypeScript
   compiler (comments and blank lines preserved), then Prettier. Shared uses `.js` import
   extensions so Node loads it directly — no build step. Lost header comments restored.
4. `@loot/shared`: REST client (`configureLootClient({ baseUrl, tokenStore, onSessionExpired })`,
   `apiRequest`, `ApiError`, single-flight token refresh), auth API matching apps/api, every other
   API function mapped to a `/v1` REST path (the contract Phase 1 implements), `models.js` with
   enum constants + JSDoc shapes, ISO timestamps.
5. apps/web: `lib/api.js` + `lib/auth.js` replace `lib/firebase/`; phone-OTP-only login (Google,
   Apple, email removed); notifications poll the API; event-invite leftovers removed (login,
   smart banner, CSS); firebase dependency, env vars, image host, health check updated.
6. Tests: shared client unit tests, web auth tests, and an API contract test running the shared
   client against the real API. Fixed the pre-existing ThemeProvider bug that failed 5 tests.
7. Docs: root CLAUDE.md, web CLAUDE/ARCHITECTURE/ONBOARDING/README/CONTRIBUTING/docs, mobile docs,
   backend-rewrite PLAN/TODO.

## Consequences / follow-ups

- Web pages that call endpoints apps/api doesn't have yet get 404s until Phase 1 builds them.
- Deleting `Backend/` removes code only; any live Firestore/Neon data stays in those services.
  Whether to migrate it is an open Phase 4 question.
- Not done (needs product input): the landing page is still the old event-photo marketing copy;
  `LandingTrustBanner` shows unverified claims (Product Hunt #1, SOC 2, "Firebase Award").
- `ThemeToggle` and `ThemeProvider` are two separate theme systems with different storage keys.
- `docs/Loot-Tech-Stack.pdf` still says TypeScript and FCM via firebase-admin.
- `apps/web/graphify-out/` is stale (pre-Loot TypeScript code); graphify isn't installed here.
- Onboarding sends professional users to `/pro/dashboard`, which doesn't exist yet.
