# DOshomik IELTS — Tech Stack Report

> Generated: 2026-05-17

## Product
**DOshomik IELTS** — IELTS preparation platform with Strapi-authored original practice material, mock tests, profile tracking, LLM-powered evaluation, and score prediction.

---

## Core Stack

| Layer | Technology | Version |
|---|---|---|
| **Framework** | Next.js (App Router) | 16.2.6 |
| **Language** | TypeScript (strict mode) | 5.x |
| **UI Library** | React | 19.2.4 |
| **Runtime** | Node.js (server) + Edge (middleware) | — |
| **Build** | Turbopack | — |
| **Package Manager** | pnpm (workspace) | — |
| **CMS** | Strapi Free | 5.46.0 |

---

## Frontend

| Concern | Technology | Purpose |
|---|---|---|
| **Styling** | Tailwind CSS v4 | Utility-first CSS |
| **CSS Processing** | PostCSS (`@tailwindcss/postcss`) | Tailwind pipeline |
| **Component Primitives** | class-variance-authority (CVA) | Variant-based component styling |
| **Class Merging** | `clsx` + `tailwind-merge` | Conditional + deduplicated class names |
| **Icons** | lucide-react | Icon library |
| **Forms** | react-hook-form + `@hookform/resolvers` | Form state + validation |
| **Validation** | Zod v4 | Runtime schema validation |
| **Server State** | TanStack React Query v5 | Data fetching & caching |
| **Toasts** | sonner | Notification toasts |

---

## Backend & Data

| Concern | Technology | Purpose |
|---|---|---|
| **Database** | PostgreSQL | Primary relational datastore |
| **ORM** | Prisma v6 | Type-safe database client + migrations + seeding |
| **Auth** | Supabase Auth (SSR) | User authentication & sessions via `@supabase/ssr` |
| **Supabase Client** | `@supabase/supabase-js` v2 | Supabase SDK (storage, DB, auth) |
| **Job Queue** | BullMQ v5 | Background job processing |
| **Queue Backend** | Redis (via `ioredis` v5) | BullMQ data store |
| **Workers** | Custom (`src/workers/`) via `tsx` | BullMQ worker process for async jobs |
| **Content Authoring** | Strapi CMS | Resources, IELTS info pages, FAQs, mock-test definitions, media metadata |

---

## AI / LLM Integration

| Concern | Technology | Purpose |
|---|---|---|
| **Writing Evaluation** | LLM (pluggable: OpenAI / Anthropic / Gemini) | IELTS writing rubric scoring |
| **Speaking Evaluation** | LLM (pluggable) | IELTS speaking assessment |
| **Content Generation** | LLM | Original test passage & question generation |
| **Content Validation** | LLM | Quality check on generated content |
| **Transcription** | External provider (pluggable) | Speech-to-text for speaking audio |

Providers are configurable via env vars — no hard vendor lock-in.

---

## Observability

| Concern | Technology | Purpose |
|---|---|---|
| **Error Tracking** | Sentry (`@sentry/nextjs`) | Production error capture |
| **Performance** | Sentry Tracing | Distributed traces (1.0 dev / 0.1 prod) |
| **Session Replay** | Sentry Replay | User session recordings (masked: false) |
| **Learner Analytics** | PostHog (`posthog-js`) | Product analytics, route activity, and IELTS learner workflow events |
| **Server Instrumentation** | `instrumentation.ts` | Sentry registration for Node.js + Edge runtimes |
| **Client Instrumentation** | `instrumentation-client.ts` | Client-side Sentry init and PostHog init |

---

## Testing & QA

| Concern | Technology | Purpose |
|---|---|---|
| **E2E Testing** | Playwright v1.59 | Browser automation tests |
| **Unit/Integration** | Node.js test runner (`tsx --test`) | P0 test suite |
| **Test Target** | Chromium (Desktop) | E2E browser |
| **Base URL** | `localhost:3002` | Dev server for E2E |

---

## Code Quality

| Tool | Purpose |
|---|---|
| **ESLint v9** | Linting with `eslint-config-next` (core-web-vitals + TypeScript) |
| **TypeScript** | Strict mode, `@/*` path aliases, incremental compilation |
| **Type Check** | `tsc --noEmit` | CI-safe type validation |

---

## Database Schema (Prisma)

**25 models**, **13 enums** covering runtime state, Prisma fallback content, and Strapi materialized snapshots:

- **Users**: `Profile`, `Role` (RBAC: learner/admin/reviewer/evaluator)
- **Content**: `Resource`, `ResourceVersion`, `ResourceProgress`, `ResourcePrerequisite`, `SavedResource` (fallback/cache/progress records; Strapi is the authoring source)
- **Tests**: `Test`, `TestVersion`, `TestSection`, `QuestionGroup`, `Question`, `AnswerKey` (runtime attempt records; Strapi-authored tests materialize here before attempts)
- **Attempts**: `PracticeAttempt`, `MockTestAttempt`, `AttemptAnswer`, `ModuleScore`, `ScorePrediction`
- **Evaluations**: `WritingEvaluation`, `SpeakingEvaluation`, `LlmJob`, `ScoreMapping`, `EvaluationCalibration`
- **Media**: `MediaAsset` (Supabase storage-backed)
- **Admin**: `AuditLog`, `ContentReview`, `TestGenerationJob`, `BetaFeedback`
- **Engagement**: `Referral`, `ReferralRedemption`, `ReferralConfig`, `CreditLedger`
- **Learning**: `FlashCardDeck`, `FlashCard` (SM-2 spaced repetition), `CardReviewLog`, `Achievement`, `ProfileAchievement`
- **External**: `ExternalStudyRecord`

---

## Architecture Summary

```
┌─────────────────────────────────────────────────┐
│                   Next.js 16                     │
│  ┌──────────────┐  ┌──────────────────────────┐ │
│  │  App Router   │  │   API Routes (server)    │ │
│  │  (pages/UI)   │  │   + Server Actions       │ │
│  └──────┬───────┘  └──────────┬───────────────┘ │
│         │                     │                  │
│  ┌──────┴───────┐  ┌──────────┴───────────────┐ │
│  │ React 19 +   │  │  Prisma → PostgreSQL      │ │
│  │ TanStack Q   │  │  Supabase Auth + Storage   │ │
│  │ Tailwind v4  │  │  Strapi CMS → Content API  │ │
│  └──────────────┘  │  Redis → BullMQ Workers    │ │
│                    │  LLM APIs (writing/speak) │ │
│                    └───────────────────────────┘ │
│                                                  │
│  Sentry (error + tracing + replay) + PostHog     │
│  Playwright (E2E) / Node test runner (unit)      │
└──────────────────────────────────────────────────┘
```

**Deployment posture**: Self-hosted on owned domain. App, Strapi, DB, storage, and queue are owned infrastructure with no serverless-only dependency.
