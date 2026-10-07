# Contributing to Loot

## Setup

```bash
# 1. Clone and install (from the repo root — npm workspaces)
npm install
cd apps/web

# 2. Start dev server (the first run creates .env.dev from .env.example;
#    ask a teammate for staging/prod values)
npm run dev          # localhost:3000, API at NEXT_PUBLIC_API_URL (default localhost:4000)
npm run dev:staging  # localhost:3000 against the staging API
```

## API (local)

```bash
# From the repo root (needs MongoDB + Redis; copy apps/api/.env.example to apps/api/.env first)
npm run api
# API at http://localhost:4000. Without WhatsApp credentials it logs OTPs instead of sending them.
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
feat(feed): add category filter to Nearby
fix(loot): stop countdown at zero
chore(deps): bump next to 16.2.4
```

## Pre-commit Hooks

Husky runs automatically on every commit:

- **pre-commit**: runs `lint-staged` (ESLint + Prettier on staged files, in every workspace)

The commit message format isn't enforced by a hook — follow it anyway.

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

- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] PR title follows Conventional Commits format
- [ ] PR targets `staging` branch

## Environment Files

| File           | Purpose                              |
| -------------- | ------------------------------------ |
| `.env.example` | Template — commit changes here       |
| `.env.local`   | Your local overrides — never commit  |
| `.env.dev`     | Development values                   |
| `.env.staging` | Staging values                       |
| `.env.prod`    | Production values — handle with care |
