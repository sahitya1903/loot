# Loot — Firebase Backend

Cloud Functions, Firestore rules, and server-side logic for Loot, a hyperlocal real-time discovery platform.

## Quick Start

```bash
cd functions
npm install
firebase login
firebase use <loot-dev-project-id>

npm run lint      # ESLint
npm run test      # Vitest
npm run serve     # Start emulators
npm run deploy    # Deploy all functions
```

## Documentation

- [Onboarding Guide](./ONBOARDING.md) — setup, patterns, and getting started
- [Architecture Overview](./ARCHITECTURE.md) — detailed technical architecture
- [Project Guidance](./CLAUDE.md) — context and conventions

## Firebase Environments

| Environment | Project ID | Usage |
|-------------|-----------|---------|
| Development | _TBD — Loot dev project_ | Development and testing |
| Production | _TBD — Loot prod project_ | Live users |
