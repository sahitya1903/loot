# Architecture Overview

This document describes the high-level architecture of the Momento Web application.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client Layer                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Next.js Application                     │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐  │  │
│  │  │   App   │  │  Hooks  │  │ Stores  │  │ Components  │  │  │
│  │  │ Router  │  │         │  │(Zustand)│  │  (React)    │  │  │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └──────┬──────┘  │  │
│  │       │            │            │               │         │  │
│  │       └────────────┴────────────┴───────────────┘         │  │
│  │                           │                                │  │
│  │                    ┌──────┴──────┐                        │  │
│  │                    │  TanStack   │                        │  │
│  │                    │   Query     │                        │  │
│  │                    └──────┬──────┘                        │  │
│  └───────────────────────────┼───────────────────────────────┘  │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Firebase Layer                            │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  ┌──────────┐ │
│  │    Auth     │  │  Firestore  │  │  Storage  │  │Functions │ │
│  │  (OAuth,    │  │    (DB)     │  │  (Media)  │  │ (Cloud)  │ │
│  │   Phone)    │  │             │  │           │  │          │ │
│  └─────────────┘  └─────────────┘  └───────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      External Services                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Google Maps  │  │  AWS Cognito │  │  Vercel Analytics    │  │
│  │   (Places)   │  │  (Liveness)  │  │  + Speed Insights    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (main)/            # Authenticated routes
│   ├── login/             # Authentication
│   ├── onboarding/        # User setup
│   └── api/               # API routes
│       └── health/        # Health check endpoint
│
├── components/            # React components
│   ├── ui/               # Reusable UI primitives
│   ├── layout/           # App layout components
│   └── login/            # Auth-specific components
│
├── lib/                  # Core utilities
│   ├── firebase/         # Firebase clients
│   ├── api/             # Cloud Functions clients
│   ├── env.ts           # Environment validation
│   ├── logger.ts        # Structured logging
│   └── utils.ts         # Utility functions
│
├── hooks/               # Custom React hooks
├── stores/              # Zustand state stores
└── types/               # TypeScript types
```

## Data Flow

### Authentication Flow

```
User → Login Page → Firebase Auth → Custom Token → Firestore User Doc
                         │
                         └─→ Auth Store (Zustand) → Protected Routes
```

### Data Fetching Pattern

```
Component → TanStack Query → Firebase SDK → Firestore
                │
                └─→ Cache → Component (on subsequent requests)
```

## Key Technologies

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 16 | Server/Client rendering |
| Language | TypeScript | Type safety |
| Styling | TailwindCSS 4 | Utility-first CSS |
| UI | Radix UI | Accessible primitives |
| Animation | Framer Motion | Motion design |
| State (Client) | Zustand | Global client state |
| State (Server) | TanStack Query | Server state/caching |
| Backend | Firebase | Auth, DB, Storage, Functions |

## Environment Strategy

| Environment | Branch | Firebase Project | URL |
|-------------|--------|------------------|-----|
| Development | local | momento-dev-e3b30 | localhost:3000 |
| Staging | develop | momento-dev-e3b30 | staging.momentomemories.com |
| Production | main | momento-b7d02 | www.momentomemories.com |
