# PLAN — Fix the leftovers found after removing Firebase, delete old data

Requested 2026-10-08: "fix the problems found, and delete old data".

## Problems to fix
1. `npm run web` fails on Windows: dev scripts use `cp`, npm runs scripts in cmd.exe.
2. Two theme systems: ThemeToggle keeps its own state under `theme`; ThemeProvider + the
   no-flash script use `loot-theme`. Make ThemeToggle use ThemeProvider.
3. `/pro/*` links everywhere (bottom nav, sidebar, profile, settings, onboarding) 404.
   Add one `/pro` placeholder route until the business tools are built.
4. Landing page is the old event-photo product: event photos, "Capture. Share. Relive." copy,
   made-up stats/testimonials/awards. Rewrite for Loot on the same visual system; delete
   MoodBoard, Testimonials, Stats, TrustBanner. Hero links to a non-existent `/business`.
5. Login collage, sidebar art and the 404 game still use the photo-app theme/copy.
6. `docs/Loot-Tech-Stack.pdf` says TypeScript + Firebase push — regenerate.

## Old data to delete
- Event photos and unused images in `apps/web/public`.
- Stale knowledge graph `apps/web/graphify-out/` (pre-Loot TypeScript code).
- Git stash `pre-restructure backup` — verified: all 58 files are identical in history.
- Not touched: Firestore/Neon (no project configured — `.firebaserc` was a placeholder; no CLI
  or credentials) and the local MongoDB databases (ewmp, roomify, smart_civic_db belong to
  other projects).
