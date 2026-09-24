# Loot — Frontend (Next.js)

Guidance for Claude Code when working in this subfolder.

## Product

This is the Frontend for **Loot**, a hyperlocal real-time discovery platform. Read the root `../CLAUDE.md` first for product positioning, forbidden vocabulary, and architectural pillars. Everything below assumes that context.

The web app is **mobile-first**. Every layout is designed for vertical phone viewports first; desktop is a graceful upscale, not the primary surface.

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 App Router |
| Language | TypeScript 5 + React 19 |
| Styling | TailwindCSS 4 |
| Client state | Zustand 5 |
| Server state | TanStack Query 5 |
| Firebase | firebase 12 (auth + firestore + functions) |
| Forms | React Hook Form 7 + Zod |
| Animation | Framer Motion + GSAP |
| Testing | Vitest (unit), Playwright (E2E) |
| Hosting | Vercel |

## Commands

```bash
npm run dev            # localhost:3000 (.env.dev)
npm run dev:staging
npm run dev:prod
npm run build
npm run lint           # ESLint
npm run lint:fix
npm run type-check
npm run test           # Vitest single
npm run test:watch
npm run test:e2e
```

## App-router structure

The primary surface is the **feed**. Loot details are secondary; `/business/{id}`, search, settings are tertiary.

```
src/app/
├── page.tsx                     # Public landing
├── layout.tsx                   # Root layout (theme, providers)
├── login/
├── onboarding/                  # Personal vs Professional choice + flows
├── (main)/                      # Authenticated route group
│   ├── layout.tsx               # Auth guard + bottom nav
│   ├── feed/                    # PRIMARY surface — Nearby/Following/Trending/Fresh tabs
│   ├── nearby/                  # Map-based discovery
│   ├── loot/[id]/               # Loot detail (claim, save, share)
│   ├── business/[id]/           # Business profile (their loots, follow, branches)
│   ├── search/                  # Category & locality exploration
│   ├── saved/                   # User's saved loot
│   ├── claims/                  # User's claimed redemptions
│   ├── notifications/
│   ├── profile/                 # Personal: my saves/claims; Pro: my dashboard
│   ├── pro/                     # Professional-only routes
│   │   ├── dashboard/           # Loot list + analytics overview
│   │   ├── create/              # Create loot
│   │   ├── loot/[id]/           # Manage loot (edit, archive, boost, analytics)
│   │   ├── branches/            # Branch/outlet management
│   │   └── analytics/
│   └── settings/
└── api/                         # Next.js API routes (heic-convert, download, health)
```

## Data flow

```
Component
  → useQuery / useMutation (TanStack Query)
    → API client function (src/lib/api/*.ts)
      → callFunction() wrapper (src/lib/firebase/functions.ts)
        → Cloud Function (asia-south1)
```

Real-time loot views, feed, claim counts use direct Firestore listeners (read-only).

## Forbidden patterns in this codebase

The repo descends from a previous product. Treat these as bugs to fix:

- Any `Event*` type, `event*` route, `events/[id]` URL → use `Loot*` / `loot*` / `loot/[id]`
- `organizer`, `host`, `creator` of content → `business`
- `attendee`, `participant`, `whoCanJoin`, `whoCanUpload` → not applicable; delete
- `RSVP`, `interested`, `going` → `claim`, `saved`
- `inviteKey`, whitelisting, request-to-join → not applicable; delete
- Calendar widgets, multi-day spans, `startDateTime` + `endDateTime` pairs → use single `expiryAt`
- Photo galleries owned by an "event" → loot has its own `media[]`; no multi-uploader gallery model

When you encounter these, redesign — don't blindly rename.

## Account types

- `accountType: "personal"` — bottom nav: Feed / Nearby / Saved / Claims / Profile
- `accountType: "professional"` — bottom nav: Dashboard / Create / Analytics / Branches / Profile (with toggle to consumer surfaces)

Pro UI uses a distinct visual treatment — different accent color, "Business" badge, dashboard density.

## State

**Zustand** (client):
```ts
// stores/auth.ts
interface AuthState {
  user: FirebaseUser | null
  profile: AppUser | null            // includes accountType + businessId
  business: Business | null          // hydrated when accountType === "professional"
  geo: { lat: number; lng: number } | null  // current location for Nearby feed
  isInitialized: boolean
}
```

**TanStack Query** (server): query keys live in `src/lib/api/keys.ts`.

## Path aliases

`@/` maps to `src/`.
```ts
import { LootCard } from '@/components/loot/LootCard'
import { useNearbyFeed } from '@/hooks/use-nearby-feed'
import { claimLoot } from '@/lib/api/loot'
```

## Design language

- Mobile-native, dark-first, energetic
- High contrast, vivid accent (e.g. neon coral / electric lime)
- Vertical scroll, swipe interactions, sticky CTAs
- Urgency baked into every loot card: countdown chip, "ending soon" pulse, claim count badge
- No calendar/agenda/dashboard-table aesthetics

Tokens live in `tailwind.config` + `src/app/globals.css`. See `ARCHITECTURE.md` for the design system summary.

## Env

Zod-validated in `src/lib/env.ts`. Files: `.env.dev`, `.env.staging`, `.env.prod` (auto-copied to `.env.local` by `npm run dev*`).

## Task continuity

For any multi-step task, write `.claude/tasks/<task-slug>/PLAN.md` and `TODO.md` before touching code. Mark items `- [x]` as soon as each step completes.
