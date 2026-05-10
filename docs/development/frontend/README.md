# IELTS++ Frontend Documentation

## Overview

The IELTS++ frontend is a responsive Next.js App Router application for learners and basic admins. It supports public marketing/auth pages, learner dashboard, resources, practice, full mock tests, writing/speaking feedback, score prediction, and basic admin content workflows.

Recommended stack:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui (optional — repo currently uses **in-house** primitives in `src/components/ui/`)
- Supabase Auth client helpers
- TanStack Query for client-side API caching/mutations/polling
- React Hook Form + Zod for forms
- Sonner for toast feedback (`src/app/providers.tsx`)

## Implementation status (repository)

| Area | Status |
|------|--------|
| Middleware auth for learner/admin **paths** | ✅ Implemented (`middleware.ts`). |
| **Admin role** gate | ✅ Implemented (`src/app/(admin)/layout.tsx` — roles from backend docs). |
| **Profile** vertical slice | ✅ Complete - Reference implementation: RHF+zod, Sonner, API hooks (`src/components/profile/profile-editor.tsx`). |
| **Login/Register** | ✅ Complete - Dev auth endpoints with forms (`src/app/(auth)/login`, `src/app/(auth)/register`). |
| **Dashboard** | ✅ Complete with `/api/dashboard` (`src/components/dashboard/dashboard-summary.tsx`). |
| **Resources** | ✅ Complete — list/detail/save (`src/components/resources/`). |
| **Practice** | ✅ Complete - List/attempt/result pages exist with proper loading/error states. |
| **Mock Tests** | ✅ Complete - List/detail/start/attempt pages with score display (`/attempts/[id]/score`). |
| **Attempt Report** | ✅ Complete - `/attempts/[id]/report` shows detailed results. |
| **Evaluations** | ✅ Complete - Status/result page with production LLM provider. |
| **Admin Resources** | ✅ Complete - CRUD with editor (`src/components/admin/resource-editor.tsx`). |
| **Admin Tests** | ✅ Complete - CRUD with form, sections, and questions UI (`src/components/admin/test-*-form.tsx`, `test-section-editor.tsx`, `question-editor.tsx`). |
| **Admin Reviews** | ✅ Complete - List/detail/action UI passes typecheck. |
| **Speaking Recording** | ✅ Complete - Speaking recorder and submission components (`src/components/ielts/speaking-recorder.tsx`, `speaking-submission.tsx`). |
| **Score Badge** | ✅ Complete - Band display component (`src/components/ielts/score-badge.tsx`). |

**Current frontend P0:** keep `npm run typecheck`, `npm run lint`, and `npm run test:p0` green while adding browser/database coverage.

## Start Here

1. [`routes-and-navigation.md`](routes-and-navigation.md) — route map, layouts, protection rules, and navigation.
2. [`ui-system.md`](ui-system.md) — design system, shared components, responsive rules, and accessibility baseline.
3. [`minimal-aesthetic-improvement-plan.md`](minimal-aesthetic-improvement-plan.md) — audit findings and phased plan to polish inner pages.
4. [`screens-and-flows.md`](screens-and-flows.md) — learner/admin screens and user flows.
5. [`state-and-api-integration.md`](state-and-api-integration.md) — API client, data fetching, mutations, polling, and local draft state.
6. [`mock-test-ui.md`](mock-test-ui.md) — exam simulation UI, section flow, answer rendering, and draft safety.
7. [`writing-speaking-ui.md`](writing-speaking-ui.md) — Writing and Speaking submission, audio, evaluation status, and feedback UI.
8. [`admin-ui.md`](admin-ui.md) — basic admin resource/test/review screens.
9. [`accessibility-responsive.md`](accessibility-responsive.md) — accessibility and responsive behavior requirements.
10. [`../../testing-plans/frontend-testing-plan.md`](../../testing-plans/frontend-testing-plan.md) — frontend test plan and manual QA scenarios.

## Frontend Scope

V1 includes:

- Landing page (`/`).
- Register/login/logout/reset password (`/login`, `/register`, `/reset-password`).
- Protected learner dashboard (`/dashboard`).
- Profile form (`/profile`).
- Resource list/detail/save (`/resources`, `/resources/[id]`).
- Practice list/attempt/result (`/practice`, `/practice/[id]`, `/practice/[id]/result`).
- Mock test list/overview/active attempt/score/report (`/mock-tests`, `/mock-tests/[id]`, `/attempts/[id]`, `/attempts/[id]/score`, `/attempts/[id]/report`).
- Writing task response UI.
- Speaking text/audio response UI with recorder.
- Evaluation status and feedback pages (`/evaluations/[id]`).
- Admin resource/test/review screens (`/admin`).

V1 does not include:

- Payment/subscription UI.
- Native mobile app.
- Live human examiner booking.
- Community/leaderboard.
- Advanced AI tutor/chat.
- Full production-grade visual test builder.

## Key Frontend Rules

- Never expose answer keys in learner screens or frontend state.
- Show full predicted score only after all four modules are complete.
- Always label score predictions as unofficial estimates.
- Keep learner recordings private and use signed upload/download flows.
- Full mock tests are desktop/tablet optimized; resources and short practice must work well on mobile.
- Use clear loading, empty, error, pending, processing, failed, and needs-review states.

## Complexity Priorities

### P0 — Must Build

- Green typecheck/build across all pages.
- Normalize API helper imports and response handling.
- Keep learner answer keys out of client state.
- Harden practice and mock attempt pages with proper loading/error/empty states.
- Maintain unsaved-answer protection and draft recovery for active attempts.
- Complete speaking audio upload UI against signed media endpoints.
- Keep score result page gated behind completed modules.

### P1 — Build If Stable

- Speaking audio recording/upload.
- Admin test management UI beyond metadata shells.
- Admin review queue actions.
- Basic admin test metadata/section screens.

### P2 — Defer If Timeline Is Tight

- Full visual test builder.
- Advanced pronunciation UI.
- Personalized study plan screens.
- AI tutor/chat interface.
- Spaced repetition vocabulary UI.
- Native mobile app.
