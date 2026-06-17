# DOshomik IELTS Agent Guide

## Project Identity

**DOshomik IELTS** is an IELTS preparation platform with owned resources, original practice material, mock tests, profile tracking, and score prediction. The platform serves learners (primarily in Bangladesh) preparing for the IELTS exam, moving from Basic English foundations to full IELTS readiness.

- **Tech Stack:** Next.js 16.2 · React 19 · TypeScript 5 · Tailwind CSS 4 · Prisma 6 · PostgreSQL (Supabase) · Supabase Auth · Strapi CMS 5 · BullMQ (Redis) · Sentry · PostHog
- **Runtime:** Node 20, pnpm workspace
- **Auth:** Supabase Auth (production) / Dev-auth cookie (development)
- **Hosting:** Docker compose (app + DB + Redis + Strapi + Worker)

---

## 1. Project Topology

```
doshomik-ielts/
├── prisma/                     # DB schema (40+ models, 776 lines), migrations, seed
├── src/
│   ├── app/                    # Next.js App Router (pages + API routes)
│   │   ├── (auth)/             # Login, Register, ResetPassword
│   │   ├── (learner)/          # Dashboard, Resources, Practice, MockTests, Attempts...
│   │   ├── (admin)/            # Admin pages (role-gated: admin/reviewer/evaluator)
│   │   ├── api/                # 18 API endpoint groups (~100+ endpoints)
│   │   ├── layout.tsx / providers.tsx / page.tsx / globals.css / global-error.tsx
│   │   └── changelog/
│   ├── components/
│   │   ├── ui/                 # 14 primitive components (CVA + Tailwind v4)
│   │   ├── layout/             # 7 layout components (header/sidebar/nav shells)
│   │   ├── ielts/              # 9 IELTS-specific (speaking recorder, writing editor, timer, renderer...)
│   │   ├── admin/              # 21 admin panel components
│   │   ├── dashboard/          # Summary, score trend, streak, achievements
│   │   ├── resources/          # List, detail, save button
│   │   ├── auth/               # LogoutButton
│   │   ├── feedback/           # BetaFeedback form
│   │   └── analytics/          # PostHogIdentity
│   ├── lib/
│   │   ├── prisma.ts           # Singleton PrismaClient
│   │   ├── utils.ts            # cn() = clsx + twMerge
│   │   ├── audit.ts / slug.ts / rate-limit.ts
│   │   ├── auth/               # session, roles, dev-session, admin-api
│   │   ├── api/                # response, client, validation, logging
│   │   ├── supabase/           # browser + server clients
│   │   ├── env/                # Server env validation (Zod)
│   │   ├── hooks/              # useApiQuery, useApiMutation, useDraftPersistence
│   │   ├── evaluation/         # LLM providers + deterministic fallback
│   │   ├── queue/              # BullMQ connection, enqueue, queue names
│   │   ├── resilience/         # Circuit breakers (5 services)
│   │   ├── security/           # CSRF protection
│   │   ├── analytics/          # PostHog wrapper
│   │   ├── strapi/             # Strapi fetcher with local fallback
│   │   ├── attempts/           # Mock test attempt navigation/timing logic
│   │   ├── resources/          # Resource constants & labels
│   │   ├── referral/           # Referral codes + credit ledger
│   │   ├── tests/              # Test helpers & factories
│   │   ├── validators/         # Zod schemas (auth, profile, resource, admin)
│   │   └── observability/      # JSON logger
│   └── workers/                # BullMQ worker entrypoint
├── docs/                       # Full product documentation
├── strapi-cms/                 # Strapi CMS 5 (separate pnpm workspace package)
├── tests/
│   ├── p0/                     # 5 test files, 38 P0 tests (must always pass)
│   ├── e2e/                    # 14 Playwright E2E specs
│   └── integration/
├── docker-compose.yml          # 5 services: app, db, redis, strapi, worker
├── Dockerfile                  # Multi-stage: base → deps → builder → runner / runner-worker
├── next.config.ts              # Sentry + CSP headers + standalone output
├── playwright.config.ts        # E2E on port 3002
├── eslint.config.mjs           # Flat config: next/core-web-vitals + typescript
├── tsconfig.json               # @/ → src/ alias, strict mode
└── package.json                # pnpm scripts for dev/build/test/worker/strapi/prisma
```

---

## 2. Route Architecture

### Route Groups

| Group | Layout | Auth |
|---|---|---|
| `(public)/` | `PublicHeader` | None (public) |
| `(auth)/` | None (inline) | Redirect to dashboard if already logged in |
| `(learner)/` | `DashboardLayout` → `LearnerHeader` + `BetaFeedback` | `requireCurrentUser()` at page level |
| `(admin)/` | `AdminLayout` → `AdminHeaderNav` + `MobileNav` | `getCurrentUser()` + `canAccessAdminRoutes()` in layout |

### Public Routes

| Path | Purpose | Layout |
|---|---|---|
| `/` | Landing page (dark single-scroll with hero, courses, testimonials) | PublicHeader |
| `/changelog` | Release notes | PublicHeader |

### Learner Routes

| Path | Purpose |
|---|---|
| `/dashboard` | Summary, streak, achievements, recent attempts |
| `/resources` | Resource library (search/filter/paginate/save) |
| `/resources/[id]` | Resource detail (reading body, examples) |
| `/practice` | Practice module listing |
| `/practice/[id]` | Practice exercise |
| `/mock-tests` | Available mock test listing |
| `/mock-tests/[id]` | Test detail + start |
| `/attempts/[id]` | Active attempt UI (section-by-section) |
| `/attempts/[id]/report` | Score report (post-completion) |
| `/evaluations/[id]` | Evaluation detail + feedback |
| `/profile` | Profile editing |
| `/progress` | Resource progress tracking |
| `/flashcards` | SM-2 spaced repetition decks |
| `/referrals` | Referral program |
| `/welcome` | New user onboarding |

---

## 3. API Convention

All API routes return a uniform envelope:

```typescript
type ApiEnvelope<T> =
  | { data: T; error: null }
  | { data: null; error: ApiError }
```

**Standard handler pattern:**
```typescript
export async function GET(request: Request) {
  // 1. Parse/validate query params
  const q = parseQuery(request, schema);
  if (q.response) return q.response;

  // 2. Auth check
  const user = await requireCurrentUser();

  // 3. Business logic
  const result = await doSomething(q.data);

  // 4. Return envelope
  return ok(result);
}
```

API helpers in `src/lib/api/`:
- `response.ts`: `ok(data)` and `fail(error, status)` envelope builders
- `validation.ts`: `parseQuery()`, `paginationSchema`, `paginateArray()`
- `client.ts`: `apiFetch<T>()` for client-side calls
- `logging.ts`: `logRouteError()`

### Error Codes
`VALIDATION_ERROR` · `UNAUTHORIZED` · `UNAUTHENTICATED` · `FORBIDDEN` · `NOT_FOUND` · `CONFLICT` · `RATE_LIMITED` · `SERVICE_UNAVAILABLE` · `INTERNAL_ERROR` · `INVALID_STATE` · `INVALID_DIRECTION` · `SKIP_NOT_ALLOWED` · `TIME_EXPIRED` · `INSUFFICIENT_CREDITS` · `CSRF_REJECTED`

### Key Endpoint Groups

| Group | Endpoints |
|---|---|
| `/api/me` | GET current user |
| `/api/profile` | PATCH profile |
| `/api/dev-auth/*` | login, register, logout (dev only) |
| `/api/resources` | GET list (search/filter), GET by id, POST save/unsave |
| `/api/mock-tests` | GET list (paginated, filtered by type), GET detail, POST start |
| `/api/attempts/[id]` | GET, POST answers, POST submit-section, GET report, GET predict-score, GET can-proceed |
| `/api/practice` | GET practice items, POST attempt |
| `/api/evaluations/*` | POST writing, POST speaking, GET by id |
| `/api/dashboard` | GET dashboard data |
| `/api/progress` | GET/PATCH progress, POST check-unlock |
| `/api/achievements` | GET user achievements |
| `/api/flashcards/*` | CRUD decks, POST study, POST review |
| `/api/media/*` | POST upload-url, GET download-url |
| `/api/referrals/*` | GET me, POST apply, POST generate, GET redemptions, GET credits |
| `/api/credits` | GET balance, GET ledger |
| `/api/admin/*` | CRUD resources, tests, flashcards, reviews |
| `/api/feedback` | POST submit, GET admin list |
| `/api/health` | GET full service health check |

---

## 4. Database Schema (Prisma)

### Core Enums
`AppRole` (learner, admin, reviewer, evaluator) · `ContentStatus` (draft, review, published, archived) · `Difficulty` (basic, intermediate, advanced) · `ResourceCategory` (8 values) · `TestType` (practice, short_mock, full_mock) · `IeltsModule` (listening, reading, writing, speaking) · `AttemptStatus` (in_progress, submitted, evaluating, completed, failed) · `JobStatus` (queued, processing, succeeded, failed, needs_review) · `ProgressStatus` · `GenerationStatus` · `CreditTxType` · `RewardTrigger` · `ReferralStatus` · `RedemptionStatus`

### Core Models
| Model | Key Relationships | Purpose |
|---|---|---|
| **Profile** | → Role[], Resource[], PracticeAttempt[], MockTestAttempt[], etc. | User identity, preferences, streak |
| **Role** | → Profile | AppRole-based access control |
| **Resource** | → ResourceVersion, SavedResource, ResourceProgress, ResourcePrerequisite | Learning content with versioning |
| **Test** | → TestSection[], TestVersion, MockTestAttempt[] | Mock test definitions |
| **TestSection** | → Test, QuestionGroup[], Question[], AttemptAnswer[] | Per-module section (listening/reading/writing/speaking) |
| **QuestionGroup** | → TestSection, Question[] | Grouped questions with shared instructions |
| **Question** | → AnswerKey, AttemptAnswer[] | Individual question with optional source span |
| **AnswerKey** | → Question | Canonical + accepted answers with scoring rules |

### Attempt & Scoring Models
| Model | Notes |
|---|---|
| **MockTestAttempt** | Status machine: in_progress → submitted → (evaluating →) completed/failed |
| **AttemptAnswer** | Per-question answer, supports draft mode via `answerJson.isDraft` |
| **ModuleScore** | One per module per attempt; confidence: low/medium/high |
| **ScorePrediction** | Created only after all 4 module scores exist; has disclaimer text |
| **WritingEvaluation** | Connected to LlmJob; supports needsHumanReview flag |
| **SpeakingEvaluation** | Similar pattern; connects to MediaAsset for audio |
| **LlmJob** | Tracks LLM calls with retries, provider metadata, IO JSON |

### Engagement & Growth
| Model | Notes |
|---|---|
| **FlashCardDeck** | Category-tagged decks with ContentStatus workflow |
| **FlashCard** | SM-2 fields: interval, repetitions, easeFactor, nextReview |
| **CardReviewLog** | SM-2 quality rating (0-5) per review |
| **ResourceProgress** | Per-resource, progress percentage + time spent |
| **ResourcePrerequisite** | Directed graph: resource → prerequisite |
| **Achievement** | Slug-identified achievements |
| **ProfileAchievement** | Many-to-many junction |
| **Referral** | Unique code, status machine |
| **ReferralRedemption** | Tracks referee, rewards, status |
| **CreditLedger** | All credit transactions (referral_bonus, redemption, admin_grant, etc.) |

---

## 5. UI Component System

### Primitives (`src/components/ui/`)
All use CVA (`class-variance-authority`) for variants + `cn()` for class merging.

| Component | Variants | Notes |
|---|---|---|
| `Button` | default/secondary/outline/ghost/destructive × default/sm/lg | Focus-visible ring, disabled opacity |
| `Card` | default/muted/interactive/elevated/callout | Composed: Header, Title, Content, Footer |
| `Badge` | default/neutral/success/warning/danger/info/review | Rounded pill with ring |
| `Input` / `Textarea` | Standard HTML with CVA styling | Focus ring, error state |
| `Label` | Ref forwarding with CVA | |
| `Skeleton` | Animated pulse placeholder | |
| `State` | empty/error/loading | Full-page state messages with optional action |
| `PageHeader` | Title + description + optional actions | |
| `Breadcrumbs` | Responsive breadcrumb trail | |
| `ContentPanel` | Themed content container | |
| `SkipNav` | Accessibility skip-to-content link | |
| `ErrorBoundary` | Class component, dev mode shows stack | |

### IELTS Components (`src/components/ielts/`)
| Component | Purpose |
|---|---|
| `ielts-section-renderer` | Renders any test section module (reading/listening/writing/speaking) |
| `objective-question-renderer` | Renders multiple-choice, short-answer, matching, etc. |
| `writing-editor` | Rich text editor for writing responses |
| `speaking-recorder` | Audio recording UI with MediaRecorder |
| `speaking-submission` | Speaking response submission (text or audio) |
| `test-timer` | Section-level countdown timer |
| `score-badge` | Band score display badge |
| `evaluation-status-badge` | Shows evaluation status (queued/processing/completed) |
| `feedback-display` | Criteria-level feedback rendering |

### Layout Components (`src/components/layout/`)
| Component | Purpose |
|---|---|
| `PublicHeader` | Sticky header for landing page (Features/Modules/How it works nav) |
| `LearnerHeader` | Sticky header with nav + more dropdown + mobile menu; collapses during active attempts |
| `DashboardLayout` | Wraps learner pages with header + main content + BetaFeedback |
| `AdminLayout` | Wraps admin pages with header + AdminHeaderNav + MobileNav |
| `AdminHeaderNav` | Horizontal nav for admin |
| `MobileNav` | Slide-out navigation for mobile |
| `SidebarNav` | Side navigation (admin) |

### Design Language
- **Colors:** Purple-indigo primary (`#6556ff`), semantic tokens via `@theme inline` in Tailwind v4 (see `src/app/globals.css` for full token set)
- **Typography:** Poppins (sans-serif) + Geist Mono (monospace) variable fonts
- **Auth flow:** Modal-based login/register/reset with standalone fallback pages
- **Landing page:** Dark-themed single-scroll layout with floating mockup, feature grid, FAQ accordion
- **App pages:** Light theme (slate-50 background, white cards with subtle borders)
- **Icons:** lucide-react throughout
- **Layout:** max-w-7xl centered content (max-w-6xl for learner)
- **Transitions:** Hover lift (`hover:-translate-y-0.5 hover:shadow-md`) on cards

---

## 6. Evaluation System

### Provider Architecture

```
evaluateResponse(request)
  ├── LLM_PROVIDER + LLM_API_KEY set → evaluateWithLLM()
  │     ├── provider === "openai"    → evaluateWithOpenAI()
  │     ├── provider === "anthropic" → evaluateWithAnthropic()
  │     └── provider === "gemini"    → evaluateWithGemini()
  └── fallback → evaluateWithDeterministicProvider()
```

### Evaluation Flow
1. Learner submits Writing/Speaking response
2. `POST /api/evaluations/writing` (or `/speaking`) creates `WritingEvaluation` / `SpeakingEvaluation` + `LlmJob`
3. Job enqueued to BullMQ (`writing-evaluation` / `speaking-evaluation`)
4. Worker picks up job → calls `processLlmJob(llmJobId)`
5. Calls `evaluateResponse()` → LLM or deterministic
6. Results saved to `WritingEvaluation` + `ModuleScore` (upsert)
7. `completeAttemptIfReady()` checks if all 4 modules scored → marks attempt `completed`

### LLM Prompts
- System prompt: IELTS rubric definition (4 criteria)
- User prompt: Template with `{{RESPONSE}}`, `{{WORD_COUNT}}`, `{{TASK_TYPE}}`
- Temperature: 0.3 for scoring consistency
- Output validated via Zod `evaluationSchema`
- Circuit breakers protect each provider (3 failures → 30s open)

### Deterministic Fallback Algorithm
- **Length band:** word count vs target (250 for writing, 90 for speaking)
- **Coherence band:** average sentence length
- **Lexical band:** unique word ratio
- **Grammar band:** capitalisation, punctuation, comma usage
- **Pronunciation band:** fixed at 5.5 for speaking
- Triggers `needsHumanReview` when too short or band < 4

---

## 7. Background Jobs (BullMQ)

### Queues
| Queue Name | Handler | Concurrency |
|---|---|---|
| `writing-evaluation` | `processLlmJob` → `processWritingJob` | env WORKER_CONCURRENCY (default 2) |
| `speaking-transcription` | (future) | 2 |
| `speaking-evaluation` | `processLlmJob` → `processSpeakingJob` | 2 |
| `score-prediction` | (future) | 2 |
| `content-validation` | (future) | 2 |
| `media-processing` | (future) | 2 |

### Job Config
- **Max retries:** 3
- **Backoff:** exponential, starting at 5s
- **Completion TTL:** 24 hours
- **Failure TTL:** 7 days
- **Events logged:** completed, failed (with attempt count), error, stalled

### Worker Entry
```
pnpm worker:dev      → tsx src/workers/index.ts
```
Starts workers for all queues, handles SIGTERM graceful shutdown.

---

## 8. Security & Compliance

### Content Policy (Non-Negotiable)
1. **No copyrighted IELTS content** — No Cambridge PDFs, scans, passages, audio, questions, or answer explanations
2. **Answer keys hidden** — Never returned in learner-facing API responses
3. **Private recordings** — Speaking audio via signed URLs with TTL
4. **Score disclaimers** — All scores labelled as "unofficial practice estimates"
5. **Full score gating** — Overall prediction only after all 4 modules complete

### Security Mechanisms
| Mechanism | Implementation |
|---|---|
| **CSRF** | Origin/referer verification on mutating methods; dev mode bypassed |
| **Rate Limiting** | Redis-backed with in-process fallback; 6 named limiters: auth (5/min), submission (30/min), evaluation (10/min), media (20/min), prediction (5/min), referral (3/min) |
| **Circuit Breakers** | 5 services: Strapi, Supabase, OpenAI, Anthropic, Gemini (3 failures → 30s half-open) |
| **Authorization** | Role-gated admin via `ADMIN_ACCESS_ROLES = ["admin", "reviewer", "evaluator"]` |
| **Audit Logging** | All admin writes logged to `AuditLog` table with actor, action, entity, metadata |
| **CSP** | Strict policy: self + PostHog + Sentry scripts; Supabase/Strapi connects; no object-src |
| **Sentry** | Error tracking with session replays (masked all text, blocked all media) |
| **HSTS** | max-age=31536000; includeSubDomains; preload |
| **Permissions Policy** | Microphone=self only, camera/geolocation/payment/usb all denied |

---

## 9. Auth Architecture

### Production Flow
```
1. User submits email/password to Supabase Auth
2. Supabase sets session cookie (httpOnly)
3. createSupabaseServerClient() reads cookie via next/headers
4. getCurrentUser() → supabase.auth.getUser() → prisma.profile.upsert()
5. requireCurrentUser() throws "UNAUTHENTICATED" if no session
```

### Dev Mode Flow
```
1. POST /api/dev-auth/login → sets "dev-session" cookie
2. readDevSession() reads cookie
3. getCurrentUser() → getOrCreateDevProfile(role) → auto-creates Profile + Role
4. Dev env vars provide seed credentials (learner + admin)
```

### Role Hierarchy
- `learner`: Standard access to learner routes/APIs
- `admin`: Full admin access
- `reviewer`: Content review workflow access
- `evaluator`: Evaluation review access

---

## 10. Data Patterns

### Mock Test Attempt Flow
```
start → section 0 → submit section → section 1 → submit → ... → all submitted
                                                                   ↓
                                              evaluate writing/speaking (async)
                                                                   ↓
                                              all 4 modules scored → completed
                                                                   ↓
                                              score prediction unlocked
```

### Attempt Navigation Rules
- **Full mock tests:** Sequential sections only (no skipping ahead, no going back)
- **Practice / short mock:** Free navigation
- **Timed sections:** Per-section countdown based on `durationMinutes`
- **Grace period:** 5 seconds after timer expiry
- **Draft answers:** Stored with `answerJson.isDraft: true`, not counted as submitted

### Spaced Repetition (SM-2)
FlashCard SM-2 fields: `interval` (days), `repetitions` (consecutive reviews), `easeFactor` (float, default 2.5), `nextReview` (datetime). Cards sorted by `nextReview` ASC for study sessions. Review quality: 0-5 rating.

### Content Fallback
When Strapi is not configured or unreachable, the app reads from Prisma-local tables. `STRAPI_BASE_URL` + `STRAPI_API_TOKEN` must both be set to enable Strapi fetching.

---

## 11. LLM Integration

### Providers
| Provider | Default Writing Model | Default Speaking Model |
|---|---|---|
| OpenAI | `gpt-4o` | `gpt-4o-mini` |
| Anthropic | `claude-sonnet-4-20250514` | `claude-haiku-3-20240307` |
| Gemini | `gemini-2.0-flash` | `gemini-2.0-flash-lite` |

### Environment
```
LLM_PROVIDER=openai|anthropic|gemini
LLM_API_KEY=<key>
LLM_MODEL_WRITING=<model-id>
LLM_MODEL_SPEAKING=<model-id>
LLM_MODEL_CONTENT_VALIDATION=<model-id>
LLM_TIMEOUT_MS=30000
```

---

## 12. Testing

### P0 Tests (must always pass)
```
pnpm test:p0  → tsx --test tests/p0/*.test.ts
```
- `api-behavior.test.ts` — API request/response contracts
- `evaluation-provider.test.ts` — Deterministic provider scoring accuracy
- `route-contracts.test.ts` — Route handler validation
- `security-contracts.test.ts` — CSRF, rate limiting, auth checks
- `setup-env.ts` — Test environment setup

### E2E Tests (Playwright)
```
pnpm test:e2e      → playwright test
pnpm test:e2e:ui   → playwright test --ui
```
14 specs: 01-public, 02-auth, 03-learner-pages, 04-detail-pages, 05-attempts, 06-admin-pages, 07-welcome, accessibility, auth, dashboard, launch-gates, production-auth, resources, screenshots

### Quality Gates
```bash
pnpm typecheck     # tsc --noEmit — zero tolerance for type errors
pnpm lint          # ESLint flat config (next/core-web-vitals + TypeScript)
pnpm test:p0       # 38 tests must pass
pnpm build         # Production build
```

---

## 13. Environment Variables

### Required
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection (Prisma) |
| `DIRECT_URL` | Direct DB connection (migrations) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `NEXT_PUBLIC_APP_URL` | Application base URL |

### Optional — Service
| Variable | Purpose |
|---|---|
| `REDIS_URL` | Redis for BullMQ (required for workers) |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin Supabase operations |
| `STRAPI_BASE_URL` | Strapi CMS URL |
| `STRAPI_API_TOKEN` | Strapi API token |
| `STRAPI_ADMIN_URL` | Strapi admin URL |

### Optional — LLM & Media
| Variable | Purpose |
|---|---|
| `LLM_PROVIDER` | openai / anthropic / gemini |
| `LLM_API_KEY` | API key for LLM provider |
| `LLM_MODEL_WRITING` | Model for writing evaluation |
| `LLM_MODEL_SPEAKING` | Model for speaking evaluation |
| `TRANSCRIPTION_PROVIDER` | Speech-to-text provider |
| `MAX_SPEAKING_AUDIO_MB` | 25 (default) |
| `MAX_SPEAKING_AUDIO_SECONDS` | 300 (default) |
| `SIGNED_URL_TTL_SECONDS` | 900 (default) |

### Optional — Analytics & Monitoring
| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN |
| `SENTRY_AUTH_TOKEN` | Sentry auth token |
| `SENTRY_ORG` / `SENTRY_PROJECT` | Sentry org/project |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project key |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog API host |
| `NEXT_PUBLIC_POSTHOG_UI_HOST` | PostHog UI host |

### Dev Auth (development only)
| Variable | Purpose |
|---|---|
| `DEV_LEARNER_EMAIL` / `_PASSWORD` / `_NAME` / `_TARGET_BAND` / `_EXAM_DATE` | Learner seed |
| `DEV_ADMIN_EMAIL` / `_PASSWORD` / `_NAME` / `_TARGET_BAND` / `_EXAM_DATE` | Admin seed |

---

## 14. Coding Conventions

### TypeScript
- Strict mode enabled; `noEmit: true`
- Path alias: `@/` → `./src/`
- Prefer `type` exports over `interface` for API shapes
- Zod schemas for all runtime validation
- **Never** use `as any`, `@ts-ignore`, or `@ts-expect-error`
- Use `satisfies` for type narrowing without widening

### React
- Server components by default; `"use client"` only for hooks/browser API/state
- Async server components for data fetching where possible
- Forms: react-hook-form + zodResolver
- Mutations: `useApiMutation` (wraps useMutation + auto-invalidate + toast)
- Queries: `useApiQuery` (wraps useQuery + envelope parsing)
- Error handling: `ErrorBoundary` at route group level + `global-error.tsx`
- Stale time: 30s default for React Query

### Styling
- Tailwind CSS v4 (`@import "tailwindcss"`)
- Semantic tokens via `@theme inline {}` block
- CVA for component variants
- No CSS modules — all utility classes
- Icons: lucide-react

### Database
- Prisma ORM with PostgreSQL
- Migrations via `prisma migrate dev` / `prisma migrate deploy`
- `$transaction` for atomic multi-table operations
- Prisma singleton for connection pooling
- Service client for admin-level Supabase operations
- Indexes on foreign keys and common query patterns

### API Route Pattern
```typescript
export async function GET(request: Request) {
  const q = parseQuery(request, schema);
  if (q.response) return q.response;
  const user = await requireCurrentUser();
  return ok(await doSomething(q.data));
}
```

### Commit Style
Conventional commits observed informally. Descriptive messages with component prefix when relevant (e.g. "Refactor auth forms and enhance reset password functionality").

---

## 15. Key Architecture Decisions

| Decision | Rationale |
|---|---|
| **Next.js (full-stack)** over separate BE | Solo developer velocity; single deploy target; no cross-origin CORS |
| **Route handlers** over tRPC | No codegen step; pairs naturally with App Router; simpler mental model |
| **Supabase Auth** over Auth.js/Clerk | Managed auth + Postgres + Storage in one provider; lower cost |
| **Strapi CMS** over custom admin build | Faster content authoring setup; headless API out of the box |
| **BullMQ** over in-process evaluation | Async LLM calls need reliability, retries, dead-letter queue |
| **Deterministic fallback** | MVP works without any external API configured |
| **Tailwind v4** over v3/v2 | New project; semantic tokens via `@theme`; faster build times |
| **Zod** over io-ts/yup | First-class Next.js support; tree-shakeable; excellent error messages |
| **Sonner** over react-hot-toast | Lightweight; React 19 compatible; rich colors built-in |
| **PostHog** over GA4/Amplitude | Open-source; self-hostable; privacy-compliant default |
| **Sentry** over custom error tracking | Session replays with masking; breadcrumbs; source maps |

