# IELTS++ Development Starting Phase

## Purpose

This document organizes the first development phase for IELTS++. It is updated to align with the detailed backend documentation in [`backend/`](backend/) and frontend documentation in [`frontend/`](frontend/).

Use this file before starting the full 8-week MVP plan in [`mvp-development-workplan.md`](mvp-development-workplan.md).

---

## Starting Phase Goal

Create a clean full-stack foundation so development can begin without re-deciding the architecture, route structure, API contracts, UI system, or MVP scope.

By the end of this phase, the project should have:

- Next.js App Router project structure.
- Tailwind CSS plus accessible in-house UI primitives configured.
- Supabase Auth connected.
- Supabase Postgres connected through Prisma.
- Supabase Storage buckets planned or created.
- Redis/BullMQ worker scaffold planned or created.
- Base frontend route groups and layouts.
- Base backend route-handler utilities.
- First profile/resource API and UI slice.
- Clear testing and QA commands.

---

## Required Reading Before Coding

### Development Overview

- [`README.md`](README.md)
- [`technical-architecture.md`](technical-architecture.md)
- [`technical-complexity-report.md`](technical-complexity-report.md)
- [`mvp-development-workplan.md`](mvp-development-workplan.md)

### Backend Docs

- [`backend/README.md`](backend/README.md)
- [`backend/setup-and-env.md`](backend/setup-and-env.md)
- [`backend/data-model.md`](backend/data-model.md)
- [`backend/api-spec.md`](backend/api-spec.md)
- [`backend/security-and-compliance.md`](backend/security-and-compliance.md)

### Frontend Docs

- [`frontend/README.md`](frontend/README.md)
- [`frontend/routes-and-navigation.md`](frontend/routes-and-navigation.md)
- [`frontend/ui-system.md`](frontend/ui-system.md)
- [`frontend/state-and-api-integration.md`](frontend/state-and-api-integration.md)
- [`frontend/screens-and-flows.md`](frontend/screens-and-flows.md)

---

## Locked MVP Decisions

- Product scope: learner MVP plus basic admin screens.
- Frontend: Next.js App Router, TypeScript, Tailwind CSS, in-house UI primitives with selective shadcn-style patterns.
- Backend: Next.js route handlers.
- Auth: Supabase Auth.
- Database: Supabase Postgres.
- ORM: Prisma.
- Storage: Supabase Storage.
- Async jobs: Redis + BullMQ.
- LLM/transcription: provider abstraction.
- Content: original, licensed, public-domain-valid, or internally generated/reviewed only.
- Score prediction: shown only after all four modules are complete.

Do not include these in the starting phase:

- Payments/subscriptions.
- Live teacher/examiner marketplace.
- Native mobile app.
- Global leaderboard/community.
- Advanced AI tutor.
- Personalized study plan engine.
- Full production-grade visual test builder.

---

## Phase 1 — Repository And App Foundation

### Tasks

- Initialize or verify the Next.js App Router project.
- Configure TypeScript.
- Configure linting and formatting.
- Configure Tailwind CSS.
- Configure UI primitives: either **shadcn/ui** (`components.json` + CLI) or **in-house** components that meet [`frontend/accessibility-responsive.md`](frontend/accessibility-responsive.md). The current repo uses in-house primitives plus **Sonner** toasts.
- Create route groups:
  - `(public)` for landing/public pages (optional — landing may live at `app/page.tsx`).
  - `(auth)` for login/register/reset pages.
  - `(learner)` for protected learner pages.
  - `(admin)` for protected admin pages.
- Create initial folders for:
  - Shared UI components.
  - Frontend API client.
  - Supabase clients.
  - Backend API utilities.
  - Prisma schema.
  - Worker/queue process.

### Frontend References

- [`frontend/routes-and-navigation.md`](frontend/routes-and-navigation.md)
- [`frontend/ui-system.md`](frontend/ui-system.md)

### Acceptance Criteria

- App starts locally.
- Landing page placeholder renders.
- Login/register placeholders render.
- Dashboard placeholder renders behind **authentication** (`middleware.ts`: Supabase session or dev cookie).
- Admin routes render only for profiles with **`admin` / `reviewer` / `evaluator`** roles (`src/app/(admin)/layout.tsx`), in addition to middleware auth.
- Tailwind and shared UI components render (shadcn optional if in-house kit is used).

---

## Phase 2 — Service Setup

### Supabase

Set up:

- Supabase project.
- Supabase Auth settings.
- Supabase Postgres database.
- Supabase Storage buckets:
  - `listening-audio`
  - `speaking-recordings`
  - `generated-audio`
  - `reports`

### Prisma

Set up:

- `DATABASE_URL`.
- `DIRECT_URL` if needed.
- Prisma schema file.
- Prisma client generation.
- Initial migration workflow.

### Redis / BullMQ

Set up or scaffold:

- Redis connection.
- Worker entry point.
- Queue names:
  - `writing-evaluation`
  - `speaking-transcription`
  - `speaking-evaluation`
  - `score-prediction`
  - `content-validation`
  - `media-processing`
- Job status constants:
  - `queued`
  - `processing`
  - `succeeded`
  - `failed`
  - `needs_review`

### LLM / Transcription

Create placeholders for:

- Provider name.
- API key.
- Model names.
- Prompt version.
- Input/output JSON logging.
- Service abstraction.

### Backend References

- [`backend/setup-and-env.md`](backend/setup-and-env.md)
- [`backend/background-jobs.md`](backend/background-jobs.md)
- [`backend/storage-and-media.md`](backend/storage-and-media.md)

### Acceptance Criteria

- Supabase project details are available in local env.
- Prisma can connect to database.
- Storage buckets are created or documented.
- Worker process can start or has a clear scaffold.
- LLM/transcription providers are configurable, not hardcoded in route handlers.

---

## Phase 3 — Environment Variables

Create local environment configuration based on [`backend/setup-and-env.md`](backend/setup-and-env.md).

Minimum variables:

```bash
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
DIRECT_URL=
REDIS_URL=
LLM_PROVIDER=
LLM_API_KEY=
LLM_MODEL_WRITING=
LLM_MODEL_SPEAKING=
TRANSCRIPTION_PROVIDER=
TRANSCRIPTION_API_KEY=
MAX_SPEAKING_AUDIO_MB=
MAX_SPEAKING_AUDIO_SECONDS=
SIGNED_URL_TTL_SECONDS=
```

Acceptance criteria:

- Secrets are not committed.
- Public Supabase variables are available to the browser.
- Service role key is server-only.
- Database connection works.
- Redis connection works or is clearly stubbed for local development.

---

## Phase 4 — First Data Model Slice

Start with the smallest useful Prisma schema slice:

- `Profile`
- `Role`
- `Resource`
- `ResourceVersion`
- `PracticeAttempt` placeholder
- `Test` placeholder
- `MockTestAttempt` placeholder
- `MediaAsset` placeholder
- `LlmJob` placeholder
- `AuditLog` placeholder

Avoid implementing every final schema field before the first vertical slice works.

Backend reference:

- [`backend/data-model.md`](backend/data-model.md)

Acceptance criteria:

- Prisma migration succeeds.
- Prisma client generates.
- Basic seed script can create initial published resources.
- Data model keeps learner-visible content separate from answer keys.

---

## Phase 5 — First Backend API Slice

Build these first APIs:

- `GET /api/health`
- `GET /api/me`
- `PATCH /api/profile`
- `GET /api/resources`
- `GET /api/resources/:id`

API requirements:

- Use standard response envelope.
- Validate Supabase session for protected routes.
- Resolve app profile from Supabase auth user.
- Return only `published` resources to learner APIs.
- Never return answer keys from learner-facing APIs.

Backend reference:

- [`backend/api-spec.md`](backend/api-spec.md)
- [`backend/security-and-compliance.md`](backend/security-and-compliance.md)

Acceptance criteria:

- Health route works without auth.
- Protected routes reject unauthenticated requests.
- Profile endpoint returns authenticated user profile.
- Resource endpoint returns only published resources.
- Error responses follow the documented envelope.

---

## Phase 6 — First Frontend Slice

Build the first learner-facing UI flow:

1. Landing page.
2. Register/login pages.
3. Protected dashboard shell.
4. Profile page.
5. Resource list.
6. Resource detail.

Frontend requirements:

- Use shared API client.
- Handle loading, empty, and error states.
- Use protected layout for learner pages.
- Redirect logged-out users to login.
- Use Tailwind plus the repo's in-house UI components.

Frontend references:

- [`frontend/screens-and-flows.md`](frontend/screens-and-flows.md)
- [`frontend/state-and-api-integration.md`](frontend/state-and-api-integration.md)
- [`frontend/accessibility-responsive.md`](frontend/accessibility-responsive.md)

Acceptance criteria:

- User can log in and reach dashboard.
- User can view/update profile.
- User can browse published resources.
- Empty/loading/error states are visible.
- UI is usable on mobile for resource/profile screens.

---

## Phase 7 — First Admin Slice

Build only the minimal admin foundation:

- Admin protected layout.
- Admin dashboard placeholder.
- Resource list by status if backend endpoint exists.
- Resource create/edit form can be stubbed if backend is not ready.
- Copyright safety warning visible on admin content screens.

Frontend reference:

- [`frontend/admin-ui.md`](frontend/admin-ui.md)

Backend reference:

- [`backend/security-and-compliance.md`](backend/security-and-compliance.md)

Acceptance criteria:

- Learners cannot access admin pages.
- Admin/reviewer roles can access admin shell.
- Copyright warning is visible in admin resource/review screens.

---

## Phase 8 — Starting QA Checklist

Before moving into full Week 1/2 development, verify:

- App starts cleanly.
- TypeScript passes.
- Lint/check command passes if configured.
- Prisma migration works.
- Supabase Auth works locally.
- Protected route pattern works.
- Public routes remain public.
- Storage buckets exist or are documented.
- Worker process can start or is scaffolded.
- No secrets are committed.
- Frontend links to existing API routes only or handles unavailable routes gracefully.
- No learner payload contains answer keys.

Testing references:

- [`../testing-plans/backend-testing-plan.md`](../testing-plans/backend-testing-plan.md)
- [`../testing-plans/frontend-testing-plan.md`](../testing-plans/frontend-testing-plan.md)

---

## Starting Phase Output

At the end of the starting phase, the repo should be ready for the 8-week MVP plan.

Next document:

- [`mvp-development-workplan.md`](mvp-development-workplan.md)

Supporting docs:

- [`frontend/README.md`](frontend/README.md)
- [`backend/README.md`](backend/README.md)
- [`technical-complexity-report.md`](technical-complexity-report.md)
