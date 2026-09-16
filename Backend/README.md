# Momento — Firebase Backend

Cloud Functions, Firestore rules, and server-side logic for the Momento event management platform.

## Quick Start

```bash
cd functions
npm install
firebase login
firebase use momento-dev-e3b30

npm run lint      # ESLint
npm run test      # Vitest
npm run serve     # Start emulators
npm run deploy    # Deploy all functions
```

## Documentation

- [Onboarding Guide](./ONBOARDING.md) — setup, patterns, and getting started
- [Architecture Overview](./ARCHITECTURE.md) — detailed technical architecture
- [Project Guidance](./CLAUDE.md) — cross-repo context and conventions

## Firebase Environments

| Environment | Project ID | Usage |
|-------------|-----------|---------|
| Development | `momento-dev-e3b30` | Development and testing |
| Production | `momento-b7d02` | Live users |

## Related Repos

| Repo | Description |
|------|-------------|
| [Momento (Flutter)](../Momento/) | Mobile app (Android & iOS) |
| [momento-web](../momento-web/) | Next.js web frontend |
