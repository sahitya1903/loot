# Contributing to Momento

## Setup

```bash
# 1. Clone and install frontend
cd momento-web && npm install

# 2. Copy env template
cp .env.example .env.local
# Fill in dev values — ask a teammate for the secrets

# 3. Start dev server
npm run dev        # localhost:3000 (dev Firebase)
npm run dev:staging  # localhost:3000 (staging Firebase)
```

## Firebase Functions (local)

```bash
cd Firebase && npm run serve
# Starts emulators at localhost:4000 (UI), :5001 (functions)
# Set NEXT_PUBLIC_USE_EMULATORS=true in .env.local to connect
```

## Branch Strategy

```
staging      ← all PRs target here
production   ← merged from staging when ready to release
feature/*    ← your work branches
fix/*        ← bug fix branches
```

```bash
# Always start from staging
git checkout staging && git pull origin staging
git checkout -b feature/my-feature

# Open PR targeting staging (never production)
```

## Commit Format

Every commit must follow **Conventional Commits**:

```
type(scope): short description
```

| Type       | When to use                        |
| ---------- | ---------------------------------- |
| `feat`     | New feature                        |
| `fix`      | Bug fix                            |
| `docs`     | Docs only                          |
| `refactor` | Code change, no new feature or fix |
| `test`     | Adding or updating tests           |
| `chore`    | Build, deps, CI changes            |

Examples:

```
feat(auth): add Apple Sign-In
fix(gallery): resolve race condition on upload
chore(deps): bump firebase to 12.7.0
```

The pre-commit hook will reject commits that don't match this format.

## Pre-commit Hooks

Husky runs automatically on every commit:

- **pre-commit**: runs `lint-staged` (ESLint + Prettier on staged files)
- **commit-msg**: validates commit message format via commitlint

If the hook blocks your commit, fix the error it reports — don't skip with `--no-verify`.

## Running Tests

```bash
npm run test              # Unit tests (single run)
npm run test:watch        # Unit tests in watch mode
npm run test:coverage     # With coverage report
npm run test:e2e          # Playwright E2E (needs dev server running)
npm run test:e2e:ui       # Interactive Playwright UI
```

## PR Checklist

Before opening a PR:

- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] PR title follows Conventional Commits format
- [ ] PR targets `staging` branch

## Environment Files

| File           | Purpose                              |
| -------------- | ------------------------------------ |
| `.env.example` | Template — commit changes here       |
| `.env.local`   | Your local overrides — never commit  |
| `.env.dev`     | Dev Firebase project values          |
| `.env.staging` | Staging values                       |
| `.env.prod`    | Production values — handle with care |
