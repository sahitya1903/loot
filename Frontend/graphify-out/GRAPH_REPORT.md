# Graph Report - /Users/harshverma/momento-web (2026-04-27)

## Corpus Check

- 37 files · ~0 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 715 nodes · 906 edges · 50 communities detected
- Extraction: 62% EXTRACTED · 38% INFERRED · 0% AMBIGUOUS · INFERRED: 348 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)

- [[_COMMUNITY_Admin & Settings UI|Admin & Settings UI]]
- [[_COMMUNITY_Firebase Client + RBAC|Firebase Client + RBAC]]
- [[_COMMUNITY_Event Gallery & Affiliates API|Event Gallery & Affiliates API]]
- [[_COMMUNITY_Affiliate Invitations|Affiliate Invitations]]
- [[_COMMUNITY_App Layout & Routing|App Layout & Routing]]
- [[_COMMUNITY_Chat & Block Management|Chat & Block Management]]
- [[_COMMUNITY_Auth & OTP Login|Auth & OTP Login]]
- [[_COMMUNITY_API Routes (WatermarkHEIC)|API Routes (Watermark/HEIC)]]
- [[_COMMUNITY_Architecture Patterns|Architecture Patterns]]
- [[_COMMUNITY_Feed & Discovery|Feed & Discovery]]
- [[_COMMUNITY_Blog Pages|Blog Pages]]
- [[_COMMUNITY_Project Documentation|Project Documentation]]
- [[_COMMUNITY_Event Reports|Event Reports]]
- [[_COMMUNITY_Theme Provider|Theme Provider]]
- [[_COMMUNITY_Onboarding Flow|Onboarding Flow]]
- [[_COMMUNITY_Event Category Imagery|Event Category Imagery]]
- [[_COMMUNITY_Smooth Scroll Motion|Smooth Scroll Motion]]
- [[_COMMUNITY_OTP Input Component|OTP Input Component]]
- [[_COMMUNITY_Misc Landing Capture Illustration -|Misc: Landing Capture Illustration -]]
- [[_COMMUNITY_Misc CircularText()|Misc: CircularText()]]
- [[_COMMUNITY_Misc TestimonialCarousel.tsx|Misc: TestimonialCarousel.tsx]]
- [[_COMMUNITY_Misc SmartBanner()|Misc: SmartBanner()]]
- [[_COMMUNITY_Misc Environment Configuration (Zod|Misc: Environment Configuration (Zod]]
- [[_COMMUNITY_Misc Build & Deployment (Vercel, st|Misc: Build & Deployment (Vercel, st]]
- [[_COMMUNITY_Misc image_blog1|Misc: image_blog1]]
- [[_COMMUNITY_Misc AutocompleteService|Misc: AutocompleteService]]
- [[_COMMUNITY_Misc getEnvObject()|Misc: getEnvObject()]]
- [[_COMMUNITY_Misc Conventional Commits Format|Misc: Conventional Commits Format]]
- [[_COMMUNITY_Misc Image Compression & HEIC Conve|Misc: Image Compression & HEIC Conve]]
- [[_COMMUNITY_Misc Firebase Functions Local Emula|Misc: Firebase Functions Local Emula]]
- [[_COMMUNITY_Misc Next.js logo|Misc: Next.js logo]]
- [[_COMMUNITY_Misc Globe icon|Misc: Globe icon]]
- [[_COMMUNITY_Misc Apple App Store download badge|Misc: Apple App Store download badge]]
- [[_COMMUNITY_Misc Form Pattern (RHF + Zod)|Misc: Form Pattern (RHF + Zod)]]
- [[_COMMUNITY_Misc Path Aliases (@ - src)|Misc: Path Aliases (@/ -> src/)]]
- [[_COMMUNITY_Misc Routing & Route Groups|Misc: Routing & Route Groups]]
- [[_COMMUNITY_Misc Testing (Vitest unit, Playwrig|Misc: Testing (Vitest unit, Playwrig]]
- [[_COMMUNITY_Misc Security Patterns (auth.uid, p|Misc: Security Patterns (auth.uid, p]]
- [[_COMMUNITY_Misc npm Scripts|Misc: npm Scripts]]
- [[_COMMUNITY_Misc Environments Table (devstagin|Misc: Environments Table (dev/stagin]]
- [[_COMMUNITY_Misc Docker Build & Compose|Misc: Docker Build & Compose]]
- [[_COMMUNITY_Misc apihealth Endpoint|Misc: /api/health Endpoint]]
- [[_COMMUNITY_Misc Related Projects (Flutter, Fir|Misc: Related Projects (Flutter, Fir]]
- [[_COMMUNITY_Misc Prerequisites (Node 22, npm, G|Misc: Prerequisites (Node 22, npm, G]]
- [[_COMMUNITY_Misc Common Tasks (add pageAPIcom|Misc: Common Tasks (add page/API/com]]
- [[_COMMUNITY_Misc Troubleshooting|Misc: Troubleshooting]]
- [[_COMMUNITY_Misc Styling & UI (Tailwind, Radix,|Misc: Styling & UI (Tailwind, Radix,]]
- [[_COMMUNITY_Misc Camera on tripod icon|Misc: Camera on tripod icon]]
- [[_COMMUNITY_Misc File document icon|Misc: File document icon]]
- [[_COMMUNITY_Misc image_team|Misc: image_team]]

## God Nodes (most connected - your core abstractions)

1. `getFirebaseDb()` - 86 edges
2. `callFunction()` - 46 edges
3. `toast()` - 40 edges
4. `getFirebaseAuth()` - 30 edges
5. `GET()` - 14 edges
6. `loadEvent()` - 13 edges
7. `log()` - 11 edges
8. `useAuth()` - 9 edges
9. `loadData()` - 8 edges
10. `removeAffiliation()` - 7 edges

## Surprising Connections (you probably didn't know these)

- `Momento Web README Overview` --semantically_similar_to--> `Project Overview (features list)` [INFERRED] [semantically similar]
  README.md → ONBOARDING.md
- `PR Checklist` --semantically_similar_to--> `Project Overview (features list)` [INFERRED] [semantically similar]
  CONTRIBUTING.md → ONBOARDING.md
- `async()` --calls--> `unlinkProvider()` [INFERRED]
  src/app/(main)/settings/page.tsx → src/lib/firebase/auth.ts
- `loadEvents()` --calls--> `getFirebaseDb()` [INFERRED]
  src/app/(main)/settings/reports/page.tsx → src/lib/firebase/config.ts
- `loadUser()` --calls--> `fetchUser()` [INFERRED]
  src/app/(main)/users/[id]/page.tsx → src/lib/firebase/firestore.ts

## Hyperedges (group relationships)

- \*\*\*\* — [EXTRACTED 1.00]
- \*\*\*\* — [EXTRACTED 1.00]
- \*\*\*\* — [EXTRACTED 1.00]
- **Event Category Imagery** — wedding_image, birthday_image, concert_image, graduation_image, reunion_image, default_event_image [INFERRED 0.85]
- **blog_imagery** — [INFERRED 0.95]

## Communities

### Community 0 - "Admin & Settings UI"

Cohesion: 0.05
Nodes (48): signOut(), handleFileChange(), handleSubmit(), parseCSV(), getBlockedUsers(), unblockUser(), acceptJoinRequest(), createEvent() (+40 more)

### Community 1 - "Firebase Client + RBAC"

Cohesion: 0.06
Nodes (48): getFirebaseApp(), getFirebaseDb(), getFirebaseFunctions(), getFirebaseStorage(), fetchEventPreferences(), fetchParticipantRole(), hasPermission(), parseRoleSettings() (+40 more)

### Community 2 - "Event Gallery & Affiliates API"

Cohesion: 0.05
Nodes (51): getAffiliatesCount(), acceptCollaborationInvite(), addToSpotlight(), deleteGalleryMedia(), getCoverPhotoUploadUrl(), getGalleryMedia(), getGalleryUploadUrl(), getMutualEvents() (+43 more)

### Community 3 - "Affiliate Invitations"

Cohesion: 0.07
Nodes (41): acceptAffiliateInvite(), declineAffiliateInvite(), getAffiliatedWithList(), getAffiliatesList(), hasPendingAffiliateInvite(), hasSentAffiliateInvite(), isAffiliate(), removeAffiliation() (+33 more)

### Community 4 - "App Layout & Routing"

Cohesion: 0.05
Nodes (17): createOrGetPersonalChat(), AuthGuard(), EditEventDetailsPage(), EditProfilePage(), EventGalleryPage(), getDisplayableUrl(), handleMessage(), if() (+9 more)

### Community 5 - "Chat & Block Management"

Cohesion: 0.08
Nodes (27): acceptMessageRequest(), blockUser(), cancelMessageRequest(), deleteChatForMe(), deleteMessageForMe(), didIBlockUser(), getChatDetails(), isBlockedByUser() (+19 more)

### Community 6 - "Auth & OTP Login"

Cohesion: 0.09
Nodes (13): clearRecaptcha(), sendEmailLoginOtp(), sendPhoneOtp(), signInWithApple(), signInWithGoogle(), unlinkProvider(), verifyEmailLoginOtp(), verifyPhoneOtp() (+5 more)

### Community 7 - "API Routes (Watermark/HEIC)"

Cohesion: 0.2
Nodes (12): checkEnvironment(), GET(), getWatermarkBuffer(), HEAD(), isHeicImage(), POST(), applyWatermark(), convertHeicToJpeg() (+4 more)

### Community 8 - "Architecture Patterns"

Cohesion: 0.15
Nodes (17): API Client Pattern (lib/api), Authentication Flow, callFunction() wrapper (lib/firebase/functions.ts), Data Flow Pattern (Component->Query->API->callFunction->CF), Directory Structure (src/), AWS Amplify Face Liveness Component, Google/Apple OAuth Sign-In, Phone OTP (WhatsApp primary, Firebase SMS fallback) (+9 more)

### Community 9 - "Feed & Discovery"

Cohesion: 0.2
Nodes (9): fetchFeedEvents(), fetchRecentEvents(), enrichEventsWithCovers(), formatDateRange(), loadFeedEvents(), loadMoreFeedEvents(), loadMoreRecentEvents(), loadRecentEvents() (+1 more)

### Community 10 - "Blog Pages"

Cohesion: 0.22
Nodes (7): getAllBlogs(), getBlogBySlug(), NotFound(), BlogDetailPage(), BlogsPage(), generateMetadata(), generateStaticParams()

### Community 13 - "Project Documentation"

Cohesion: 0.29
Nodes (7): Tech Stack (Next.js 16, TS, Tailwind4, Zustand, TanStack Query), Graphify Rules for Project, Branch Strategy (staging<-feature/fix), PR Checklist, Contributing Setup, Project Overview (features list), Momento Web README Overview

### Community 14 - "Event Reports"

Cohesion: 0.4
Nodes (4): generateEventReport(), handleGenerateReport(), handleShare(), loadEvents()

### Community 18 - "Theme Provider"

Cohesion: 0.33
Nodes (2): Inner(), useTheme()

### Community 19 - "Onboarding Flow"

Cohesion: 0.33
Nodes (2): handleInterestsSubmit(), toggleInterest()

### Community 20 - "Event Category Imagery"

Cohesion: 1.0
Nodes (6): Birthday Event Image, Concert Event Image, Default Event Image, Graduation Event Image, Reunion Event Image, Wedding Event Image

### Community 23 - "Smooth Scroll Motion"

Cohesion: 0.5
Nodes (3): getMotionVariants(), prefersReducedMotion(), SmoothScrollProvider()

### Community 24 - "OTP Input Component"

Cohesion: 0.7
Nodes (4): focusInput(), handleInput(), handleKeyDown(), handlePaste()

### Community 25 - "Misc: Landing Capture Illustration -"

Cohesion: 0.7
Nodes (5): Landing Capture Illustration - 3D card showing mountain lake photo with camera button and thumbnail filmstrip, depicting photo capture feature, Landing Connect Illustration - 3D group chat card titled 'Project Aura Group' with messages from Alex, Elena, Ben and Sara typing indicator, depicting connection/chat feature, Landing Hero Phone Mockup - tilted iPhone showing 'Friends' Gathering' event gallery screen with grid of group photos and bottom nav (Gallery/Camera/Notifications/Profile), Landing Share Illustration - photo grid mosaic with 'Share this Gallery' modal showing Instagram, Pinterest, Twitter, Facebook icons and Copy Link button, Momento Logo - blue gradient stylized 'M' formed by two figures resembling people, app brand mark

### Community 26 - "Misc: CircularText()"

Cohesion: 0.67
Nodes (2): getRotationTransition(), getTransition()

### Community 28 - "Misc: TestimonialCarousel.tsx"

Cohesion: 0.83
Nodes (3): goTo(), next(), prev()

### Community 29 - "Misc: SmartBanner()"

Cohesion: 0.5
Nodes (2): SmartBanner(), useIsMobile()

### Community 30 - "Misc: Environment Configuration (Zod"

Cohesion: 0.5
Nodes (4): Environment Configuration (Zod-validated), Env Files (.env.dev/.staging/.prod/.local), Rationale: Zod env validation crashes early to surface missing config, Setup Steps

### Community 31 - "Misc: Build & Deployment (Vercel, st"

Cohesion: 0.5
Nodes (4): Build & Deployment (Vercel, standalone), CI/CD Workflows, next.config.ts (standalone, remotePatterns), Rationale: standalone output for Docker compatibility

### Community 32 - "Misc: image_blog1"

Cohesion: 0.5
Nodes (4): image_blog1, image_blog2, image_blog3, image_blog4

### Community 33 - "Misc: AutocompleteService"

Cohesion: 0.67
Nodes (2): AutocompleteService, Geocoder

### Community 43 - "Misc: getEnvObject()"

Cohesion: 1.0
Nodes (2): getEnvObject(), parseEnv()

### Community 45 - "Misc: Conventional Commits Format"

Cohesion: 0.67
Nodes (3): Conventional Commits Format, Husky Pre-commit Hooks (lint-staged, commitlint), Rationale: never skip hooks with --no-verify

### Community 81 - "Misc: Image Compression & HEIC Conve"

Cohesion: 1.0
Nodes (2): Image Compression & HEIC Conversion, Performance Patterns (compression, lazy load, caching)

### Community 82 - "Misc: Firebase Functions Local Emula"

Cohesion: 1.0
Nodes (2): Firebase Functions Local Emulators, Connect to Firebase Emulators

### Community 83 - "Misc: Next.js logo"

Cohesion: 1.0
Nodes (2): Next.js logo, Vercel logo

### Community 84 - "Misc: Globe icon"

Cohesion: 1.0
Nodes (2): Globe icon, Window/browser icon

### Community 85 - "Misc: Apple App Store download badge"

Cohesion: 1.0
Nodes (2): Apple App Store download badge, Google Play Store download badge

### Community 155 - "Misc: Form Pattern (RHF + Zod)"

Cohesion: 1.0
Nodes (1): Form Pattern (RHF + Zod)

### Community 156 - "Misc: Path Aliases (@/ -> src/)"

Cohesion: 1.0
Nodes (1): Path Aliases (@/ -> src/)

### Community 157 - "Misc: Routing & Route Groups"

Cohesion: 1.0
Nodes (1): Routing & Route Groups

### Community 158 - "Misc: Testing (Vitest unit, Playwrig"

Cohesion: 1.0
Nodes (1): Testing (Vitest unit, Playwright E2E)

### Community 159 - "Misc: Security Patterns (auth.uid, p"

Cohesion: 1.0
Nodes (1): Security Patterns (auth.uid, presigned URLs, env validation)

### Community 160 - "Misc: npm Scripts"

Cohesion: 1.0
Nodes (1): npm Scripts

### Community 161 - "Misc: Environments Table (dev/stagin"

Cohesion: 1.0
Nodes (1): Environments Table (dev/staging/prod)

### Community 162 - "Misc: Docker Build & Compose"

Cohesion: 1.0
Nodes (1): Docker Build & Compose

### Community 163 - "Misc: /api/health Endpoint"

Cohesion: 1.0
Nodes (1): /api/health Endpoint

### Community 164 - "Misc: Related Projects (Flutter, Fir"

Cohesion: 1.0
Nodes (1): Related Projects (Flutter, Firebase)

### Community 165 - "Misc: Prerequisites (Node 22, npm, G"

Cohesion: 1.0
Nodes (1): Prerequisites (Node 22, npm, Git)

### Community 166 - "Misc: Common Tasks (add page/API/com"

Cohesion: 1.0
Nodes (1): Common Tasks (add page/API/component)

### Community 167 - "Misc: Troubleshooting"

Cohesion: 1.0
Nodes (1): Troubleshooting

### Community 168 - "Misc: Styling & UI (Tailwind, Radix,"

Cohesion: 1.0
Nodes (1): Styling & UI (Tailwind, Radix, shadcn, Framer, GSAP, Three.js)

### Community 169 - "Misc: Camera on tripod icon"

Cohesion: 1.0
Nodes (1): Camera on tripod icon

### Community 170 - "Misc: File document icon"

Cohesion: 1.0
Nodes (1): File document icon

### Community 171 - "Misc: image_team"

Cohesion: 1.0
Nodes (1): image_team

## Knowledge Gaps

- **45 isolated node(s):** `Geocoder`, `AutocompleteService`, `Tech Stack (Next.js 16, TS, Tailwind4, Zustand, TanStack Query)`, `Form Pattern (RHF + Zod)`, `Path Aliases (@/ -> src/)` (+40 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Theme Provider`** (6 nodes): `use-theme.test.tsx`, `use-theme.tsx`, `DelayedConsumer()`, `Inner()`, `ThemeProvider()`, `useTheme()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Onboarding Flow`** (6 nodes): `handleFaceIdSuccess()`, `handleInterestsSubmit()`, `handleProfilePictureSelect()`, `handleSkipFaceId()`, `toggleInterest()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc: CircularText()`** (4 nodes): `CircularText()`, `getRotationTransition()`, `getTransition()`, `CircularText.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc: SmartBanner()`** (4 nodes): `SmartBanner()`, `smart-banner.tsx`, `use-is-mobile.ts`, `useIsMobile()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc: AutocompleteService`** (3 nodes): `AutocompleteService`, `Geocoder`, `google-maps.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc: getEnvObject()`** (3 nodes): `getEnvObject()`, `parseEnv()`, `env.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc: Image Compression & HEIC Conve`** (2 nodes): `Image Compression & HEIC Conversion`, `Performance Patterns (compression, lazy load, caching)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc: Firebase Functions Local Emula`** (2 nodes): `Firebase Functions Local Emulators`, `Connect to Firebase Emulators`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc: Next.js logo`** (2 nodes): `Next.js logo`, `Vercel logo`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc: Globe icon`** (2 nodes): `Globe icon`, `Window/browser icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc: Apple App Store download badge`** (2 nodes): `Apple App Store download badge`, `Google Play Store download badge`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc: Form Pattern (RHF + Zod)`** (1 nodes): `Form Pattern (RHF + Zod)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc: Path Aliases (@/ -> src/)`** (1 nodes): `Path Aliases (@/ -> src/)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc: Routing & Route Groups`** (1 nodes): `Routing & Route Groups`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc: Testing (Vitest unit, Playwrig`** (1 nodes): `Testing (Vitest unit, Playwright E2E)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc: Security Patterns (auth.uid, p`** (1 nodes): `Security Patterns (auth.uid, presigned URLs, env validation)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc: npm Scripts`** (1 nodes): `npm Scripts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc: Environments Table (dev/stagin`** (1 nodes): `Environments Table (dev/staging/prod)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc: Docker Build & Compose`** (1 nodes): `Docker Build & Compose`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc: /api/health Endpoint`** (1 nodes): `/api/health Endpoint`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc: Related Projects (Flutter, Fir`** (1 nodes): `Related Projects (Flutter, Firebase)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc: Prerequisites (Node 22, npm, G`** (1 nodes): `Prerequisites (Node 22, npm, Git)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc: Common Tasks (add page/API/com`** (1 nodes): `Common Tasks (add page/API/component)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc: Troubleshooting`** (1 nodes): `Troubleshooting`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc: Styling & UI (Tailwind, Radix,`** (1 nodes): `Styling & UI (Tailwind, Radix, shadcn, Framer, GSAP, Three.js)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc: Camera on tripod icon`** (1 nodes): `Camera on tripod icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc: File document icon`** (1 nodes): `File document icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc: image_team`** (1 nodes): `image_team`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `getFirebaseDb()` connect `Firebase Client + RBAC` to `Admin & Settings UI`, `Event Gallery & Affiliates API`, `Affiliate Invitations`, `App Layout & Routing`, `Chat & Block Management`, `Feed & Discovery`, `Event Reports`, `Onboarding Flow`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **Why does `toast()` connect `Admin & Settings UI` to `Event Gallery & Affiliates API`, `Affiliate Invitations`, `App Layout & Routing`, `Chat & Block Management`, `Event Reports`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `log()` connect `Admin & Settings UI` to `Firebase Client + RBAC`, `Event Gallery & Affiliates API`, `App Layout & Routing`, `Auth & OTP Login`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Are the 84 inferred relationships involving `getFirebaseDb()` (e.g. with `handleSaveInterests()` and `handleToggleVisibility()`) actually correct?**
  _`getFirebaseDb()` has 84 INFERRED edges - model-reasoned connections that need verification._
- **Are the 45 inferred relationships involving `callFunction()` (e.g. with `log()` and `getFirebaseFunctions()`) actually correct?**
  _`callFunction()` has 45 INFERRED edges - model-reasoned connections that need verification._
- **Are the 37 inferred relationships involving `toast()` (e.g. with `handleSwitchToPro()` and `handleSwitchToPersonal()`) actually correct?**
  _`toast()` has 37 INFERRED edges - model-reasoned connections that need verification._
- **Are the 28 inferred relationships involving `getFirebaseAuth()` (e.g. with `sendAffiliateInvite()` and `acceptAffiliateInvite()`) actually correct?**
  _`getFirebaseAuth()` has 28 INFERRED edges - model-reasoned connections that need verification._
