@AGENTS.md

# Loot — mobile app

Consumer app for **Loot** (Expo / React Native). Read `../../CLAUDE.md` for product
positioning, forbidden vocabulary, and the account model before working here.

- Plain JavaScript only (`.js`/`.jsx`) — no TypeScript, same as the rest of the repo.
- Shared domain code (REST client for apps/api, domain constants, query keys, geo and ranking
  helpers) comes from `@loot/shared` (`packages/shared`). Don't copy those into this app — import them.
- Before calling any `@loot/shared` API function, configure the client once at startup with
  `configureLootClient({ baseUrl, tokenStore, onSessionExpired })`. Keep tokens in
  `expo-secure-store`, not AsyncStorage. See `apps/web/src/lib/api.js` for the web equivalent.
- There is no Firebase. Sign-in is phone OTP against apps/api (`sendOtp`, `verifyOtp`).
- If Metro (or Next's Turbopack) can't resolve `@loot/shared`, the workspace links were created
  through a differently-cased repo path than the folder's real name on disk. Delete
  `node_modules/@loot` and run `npm install` from the repo root using the folder's exact casing.
- Install packages from the repo root workspace: `npx expo install <pkg>` inside this folder
  resolves SDK-compatible versions; npm workspaces hoists them to the root `node_modules`.

## Structure

- `src/app/` — Expo Router routes only. `(tabs)/` holds the tab screens; personal accounts see
  Nearby/Saved/Claims/Profile, business accounts Nearby/My loot/Redeem/Profile (`href: null` hides the rest).
  The root `_layout.jsx` gates signed-in screens with `Stack.Protected` and holds the splash until the
  session and location are loaded.
- `src/lib/` — `api.js` (client config, SecureStore tokens, API URL), `auth.jsx` (session), `location.jsx`
  (GPS or a chosen area, persisted), `realtime.jsx` (Socket.io: watched loot, live counters with REST
  polling fallback, new-loot-nearby, redemption updates), `paging.js` (cursor lists), `errors.js` (API error copy).
- `src/components/` — shared UI (`ui.jsx`, `LootCard`, `Countdown`, `RedemptionCard`, `LootList`); theme tokens in `src/theme.js`.
- Validate forms with the zod schemas from `@loot/shared` (the API parses with the same ones).
- `EXPO_PUBLIC_API_URL` overrides the API URL (see `.env.example`); `app.config.js` derives cleartext and ABIs from it.
