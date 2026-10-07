# Loot Web

Web application for Loot — built with **Next.js 16**, **JavaScript (React 19)**, and **TailwindCSS**. It talks to the Loot API (`apps/api`) through the `@loot/shared` REST client.

## Quick Start

```bash
# From the repo root: install every workspace, then start the API
npm install
npm run api            # needs apps/api/.env, MongoDB and Redis — see apps/api/.env.example

# In apps/web (first run creates .env.dev from .env.example)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

| Category      | Technology                            |
| ------------- | ------------------------------------- |
| **Framework** | Next.js 16 (App Router)               |
| **Language**  | JavaScript (ESM, JSX) — no TypeScript |
| **Styling**   | TailwindCSS 4                         |
| **UI**        | Radix UI (shadcn/ui)                  |
| **State**     | Zustand + TanStack Query              |
| **Backend**   | `apps/api` (Node + Express) over REST |
| **Hosting**   | Vercel                                |

## Scripts

| Command                 | Description              |
| ----------------------- | ------------------------ |
| `npm run dev`           | Start development server |
| `npm run build`         | Production build         |
| `npm run start`         | Start production server  |
| `npm run lint`          | Run ESLint               |
| `npm run test`          | Run unit tests           |
| `npm run test:coverage` | Run tests with coverage  |
| `npm run test:e2e`      | Run E2E tests            |

## Environment Configuration

`npm run dev` copies `.env.dev` to `.env.local` (creating `.env.dev` from `.env.example` on first run). Configure:

| Variable                            | Required | Description                                         |
| ----------------------------------- | -------- | --------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`               | Yes      | Loot API base URL (default `http://localhost:4000`) |
| `NEXT_PUBLIC_APP_URL`               | Yes      | This app's public URL                               |
| `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` | Yes      | Google Places API (address autocomplete)            |
| `NEXT_PUBLIC_AIRBRIDGE_APP`         | No       | Airbridge deep links (disabled when unset)          |
| `NEXT_PUBLIC_AIRBRIDGE_WEB_TOKEN`   | No       | Airbridge web token                                 |

## Deployment

| Environment | API            | URL                   |
| ----------- | -------------- | --------------------- |
| Development | localhost:4000 | localhost:3000        |
| Staging     | TBD            | staging.<loot-domain> |
| Production  | TBD            | www.<loot-domain>     |

Hosted on Vercel; see [CONTRIBUTING.md](./CONTRIBUTING.md) for the branch flow. There are no GitHub Actions workflows yet.

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
│   ├── login/           # Phone OTP sign-in
│   ├── onboarding/      # Account type choice
│   └── api/health/      # Health endpoint
├── components/          # React components
├── hooks/               # Custom hooks
├── lib/
│   ├── api.js           # Configures the @loot/shared client (API URL, token storage)
│   ├── auth.js          # Sign-in, session restore, sign-out
│   └── logger.js        # Structured logging
└── stores/              # Zustand stores
```

Loot domain code — the REST client, enum constants and model shapes, query keys, geo and
ranking helpers — lives in [`@loot/shared`](../../packages/shared) and is shared with the
mobile app and the API.

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

## Related

- [`apps/api`](../api) — the backend (Express + MongoDB + Redis)
- [`apps/mobile`](../mobile) — the Expo consumer app
