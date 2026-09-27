# Loot Web

Production-ready web application for Loot — built with **Next.js 16**, **TypeScript**, and **TailwindCSS**.

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Firebase config

# Start development
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

| Category      | Technology                            |
| ------------- | ------------------------------------- |
| **Framework** | Next.js 16 (App Router)               |
| **Language**  | TypeScript 5                          |
| **Styling**   | TailwindCSS 4                         |
| **UI**        | Radix UI (shadcn/ui)                  |
| **State**     | Zustand + TanStack Query              |
| **Backend**   | Firebase (Auth, Firestore, Functions) |
| **Hosting**   | Vercel                                |

## Scripts

| Command                 | Description              |
| ----------------------- | ------------------------ |
| `npm run dev`           | Start development server |
| `npm run build`         | Production build         |
| `npm run start`         | Start production server  |
| `npm run lint`          | Run ESLint               |
| `npm run type-check`    | TypeScript type checking |
| `npm run test`          | Run unit tests           |
| `npm run test:coverage` | Run tests with coverage  |
| `npm run test:e2e`      | Run E2E tests            |

## Environment Configuration

Copy `.env.example` to `.env.local` and configure:

| Variable                                   | Required | Description         |
| ------------------------------------------ | -------- | ------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | Yes      | Firebase API key    |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | Yes      | Firebase project ID |
| `NEXT_PUBLIC_APP_URL`                      | Yes      | Application URL     |
| `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`        | Yes      | Google Places API   |
| `NEXT_PUBLIC_AWS_REGION`                   | Yes      | AWS region          |
| `NEXT_PUBLIC_AWS_COGNITO_IDENTITY_POOL_ID` | Yes      | Cognito pool ID     |

Environment validation is powered by Zod — missing variables will throw descriptive errors.

## Deployment

### Environments

| Environment | Branch  | Firebase          | URL                         |
| ----------- | ------- | ----------------- | --------------------------- |
| Development | local   | TBD               | localhost:3000              |
| Staging     | develop | TBD               | staging.<loot-domain>       |
| Production  | main    | TBD               | www.<loot-domain>           |

### CI/CD Pipelines

| Workflow      | Trigger         | Actions                                |
| ------------- | --------------- | -------------------------------------- |
| PR Validation | Pull request    | Lint, type-check, test, build          |
| Staging       | Push to develop | Test, deploy to Vercel preview         |
| Production    | Push to main    | Full test, deploy, verify, tag release |

## Testing

### Unit Tests (Vitest)

```bash
npm run test              # Run once
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
```

### E2E Tests (Playwright)

```bash
npm run test:e2e          # Headless
npm run test:e2e:ui       # Interactive UI
npm run test:e2e:headed   # With browser window
```

## Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── (main)/          # Authenticated routes
│   ├── login/           # Authentication
│   ├── onboarding/      # User setup
│   └── api/health/      # Health endpoint
├── components/          # React components
├── hooks/              # Custom hooks
├── lib/                # Utilities
│   ├── firebase/       # Firebase clients (wires @loot/shared in config.ts)
│   └── logger.ts      # Structured logging
├── stores/             # Zustand stores
└── types/              # Web-only ambient types (Google Maps)
```

Loot domain code — model types, the Cloud Function API client, query keys, geo and
ranking helpers — lives in [`@loot/shared`](../../packages/shared) and is shared with
the mobile app.

## Documentation

- [Onboarding Guide](./ONBOARDING.md) — setup, patterns, and getting started
- [Architecture Overview](./ARCHITECTURE.md) — detailed technical architecture
- [Contributing Guide](./CONTRIBUTING.md) — branch strategy, commit format, PR checklist

## Health Endpoint

The `/api/health` endpoint returns system status:

```json
{
  "status": "healthy",
  "version": "0.1.0",
  "environment": "production",
  "uptime": 3600,
  "checks": [...]
}
```

## Related Projects

- [Loot Flutter App](../Loot-Flutter) — Mobile app
- [Firebase Backend](../Firebase) — Cloud Functions & Firestore
