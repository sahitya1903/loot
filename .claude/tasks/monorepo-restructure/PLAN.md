# Monorepo restructure + cleanup

## Goal

```
Loot/
├── Backend/            (unchanged)
├── apps/
│   ├── web/            ← Next.js (was Frontend/): landing, share pages, business dashboard
│   └── mobile/         ← new Expo app: consumer feed experience
└── packages/
    └── shared/         ← @loot/shared — types, API client, geo, ranking helpers
```

npm workspaces at the root (`apps/*`, `packages/*`). `Backend/functions` stays a
standalone npm project (Firebase deploys it with its own lockfile).

## Safety

65 files had uncommitted edits. Before deleting anything, the full working tree
was saved as a git stash entry ("pre-restructure backup") without touching the
working tree. Recover a deleted file with `git checkout stash@{N} -- <path>`.

## Decisions

- **Shared package is framework-free** (no React). React hooks stay in each app for
  now: Expo and Next each pin React, and a React-dependent shared package is the
  classic source of duplicate-React crashes. Hooks can move later behind peerDeps.
- **Firebase is injected, not imported.** `@loot/shared` calls
  `configureLootClient({ getFunctions, getDb, getCurrentUserId })`; each app wires its
  own Firebase instances (web SDK on web, RN-configured SDK on mobile).
- **Consumed as TS source** — Next via `transpilePackages`, Metro natively. No build step.
- **React aligned to 19.2.3** in web to match Expo SDK 57 so the workspace hoists one React.

## Removed (why)

- Unreachable code (nothing imports it): legacy landing duplicates, login/*,
  unused ui effects, LightPillar, FaceLiveness + aws-config, env.ts (AWS liveness vars),
  firebase-admin.ts, constants/* (wedding-vendor categories, networking interests),
  lib/api/neon.ts (event "network matches").
- Old photo-sharing product, still routed but unused: api/download, api/download-zip,
  api/heic-convert, lib/watermark.ts; blogs (blogs.json is empty) + nav links;
  settings/affiliates (self-described as not applying to Loot, not linked).
- Dockerfile + docker-compose (hosting is Vercel; they would not build in the workspace
  layout and referenced AWS liveness vars), `output: 'standalone'`.
- Duplicate docs/architecture.md; create-next-app default SVGs; unused images.
- Dependencies only used by removed code.
