# TODO — monorepo restructure

- [x] Back up working tree to a git stash entry
- [x] Move Frontend/ → apps/web/ (git mv)
- [x] Delete dead / legacy files in apps/web
- [x] Create packages/shared (types, api, geo, ranking) + client injection
- [x] Rewrite apps/web imports to @loot/shared; wire configureLootClient
- [x] Root workspace: package.json, lockfile, .npmrc, .husky, .gitignore
- [x] Update apps/web package.json (deps, scripts) + next.config
- [x] Scaffold apps/mobile (Expo, blank-typescript) using @loot/shared
- [x] npm install at root
- [x] Verify: web type-check, lint, tests, build; mobile type-check + bundle
- [x] Update docs (root CLAUDE.md, apps/web docs paths)
