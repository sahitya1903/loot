@AGENTS.md

# Loot — mobile app

Consumer app for **Loot** (Expo / React Native). Read `../../CLAUDE.md` for product
positioning, forbidden vocabulary, and the account model before working here.

- Shared domain code (types, Cloud Function client, geo, ranking helpers) comes from
  `@loot/shared` (`packages/shared`). Don't copy those into this app — import them.
- Before calling any `@loot/shared` API function, wire Firebase once at startup with
  `configureLootClient({ getFunctions, getDb, getCurrentUserId })`
  (see `apps/web/src/lib/firebase/config.ts` for the web equivalent). Functions region is
  `asia-south1`.
- Install packages from the repo root workspace: `npx expo install <pkg>` inside this folder
  resolves SDK-compatible versions; npm workspaces hoists them to the root `node_modules`.
