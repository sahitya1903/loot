# TODO — remove Firebase (and convert to JavaScript)

User decisions 2026-10-08: Node + Express is the only backend; no TypeScript anywhere
"for now" — the whole repo is JavaScript.

- [x] Commit Phase 0 API + plan docs on branch chore/remove-firebase
- [x] .gitattributes (binary PDF)
- [x] Delete Backend/
- [x] Convert api, shared, web, mobile to JavaScript (verified: api tests, lint, web tests, web build, mobile bundle)
- [x] Fix pre-commit hook (ESLint config lookup from file)
- [x] Shared: REST client + token store + auth API (matches apps/api)
- [x] Shared: map API functions to REST paths; drop Firestore reads + firebase peer dep
- [x] Shared: ranking/format uses ISO timestamps
- [x] Web: replace lib/firebase with lib/api; auth store/hook/login on API OTP
- [x] Web: notifications + remaining direct Firestore reads
- [x] Web: remove event-invite leftovers (login, smart banner, CSS)
- [x] Web: drop firebase dep, env example, next.config image hosts, vitest setup, tests
- [x] Contract test: @loot/shared client against the real API (apps/api/tests/sharedClient.test.js)
- [x] Docs: root CLAUDE.md, web docs, mobile docs, backend-rewrite PLAN/TODO
- [x] Fix ThemeProvider (5 pre-existing failing tests)
- [x] Verify: install, lint, test, build, mobile bundle, API boot
- [x] Commit; drop the js-conversion-wip stash
