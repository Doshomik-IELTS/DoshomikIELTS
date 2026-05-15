# IELTS++ Frontend Documentation

## Overview

The IELTS++ frontend is a responsive Next.js App Router application for learners and basic admins. It supports public marketing/auth pages, learner dashboard with streak tracking and achievements, resources with bookmarks, spaced-repetition flashcards, practice, full mock tests with per-section timers, writing tasks with word count and auto-save, speaking with audio recording, evaluation feedback, score prediction, referral program, and admin content workflows.

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

> **Last updated:** 2026-05-16

| Area | Status |
|------|--------|
| Middleware auth for learner/admin **paths** | ✅ Implemented (`middleware.ts`). |
| **Admin role** gate | ✅ Implemented (`src/app/(admin)/layout.tsx` — roles from backend docs). |
| **Profile** vertical slice | ✅ Complete - Reference implementation: RHF+zod, Sonner, API hooks (`src/components/profile/profile-editor.tsx`). |
| **Login/Register/Reset** | ✅ Complete - Dev auth endpoints with forms (`src/app/(auth)/login`, `src/app/(auth)/register`, `src/app/(auth)/reset-password`). |
| **Welcome** | ✅ Complete - Onboarding/welcome page (`src/app/(learner)/welcome/page.tsx`). |
| **Dashboard** | ✅ Complete - Includes streak, longest streak, progress bar, module score cards, recent attempts, achievements panel (`src/components/dashboard/dashboard-summary.tsx`, `streak-badge.tsx`, `achievements-panel.tsx`). |
| **Resources** | ✅ Complete — list/detail/save with icon bookmark button (`src/components/resources/resource-list.tsx`, `resource-detail.tsx`, `resource-save-button.tsx`). |
| **Flashcards** | ✅ Complete — deck grid, deck detail, SM-2 study session with flip cards and quality rating (`src/app/(learner)/flashcards/`). |
| **Practice** | ✅ Complete - List/attempt/result pages exist with proper loading/error states. |
| **Mock Tests** | ✅ Complete - List/detail/start/attempt pages with score display (`/attempts/[id]/score`). Includes test timer with auto-submit. |
| **Test Timer** | ✅ Complete - Per-section countdown timer with auto-submit on expiry (`src/components/ielts/test-timer.tsx`, integrated into attempt page). |
| **Writing Editor** | ✅ Complete - Live word count, progress bar, auto-save to localStorage, task-type-aware limits (`src/components/ielts/writing-editor.tsx`). |
| **Attempt Report** | ✅ Complete - `/attempts/[id]/report` shows detailed results. |
| **Attempt Score** | ✅ Complete - `/attempts/[id]/score` shows module bands and overall prediction. |
| **Evaluations** | ✅ Complete - Status/result page (`/evaluations/[id]`) with production LLM provider. |
| **Speaking Recording** | ✅ Complete - Speaking recorder and submission components (`src/components/ielts/speaking-recorder.tsx`, `speaking-submission.tsx`). |
| **Score Badge** | ✅ Complete - Band display component (`src/components/ielts/score-badge.tsx`). |
| **Streak Badge** | ✅ Complete - Flame icon with streak and longest streak display (`src/components/dashboard/streak-badge.tsx`). |
| **Achievements Panel** | ✅ Complete - Grid of earned/locked achievement badges (`src/components/dashboard/achievements-panel.tsx`). |
| **Referrals** | ✅ Complete - Referral page with code generation and credits display. |
| **Beta Feedback** | ✅ Complete - Feedback submission component (`src/components/feedback/beta-feedback.tsx`). |
| **Changelog** | ✅ Complete - Changelog page (`/changelog`). |
| **Admin Resources** | ✅ Complete - CRUD with editor (`src/components/admin/resource-editor.tsx`). |
| **Admin Tests** | ✅ Complete - CRUD with form, sections, questions, question groups, visual test builder (`/admin/tests/[id]/builder`), test preview (`/admin/tests/[id]/preview`), section editors (reading, listening, writing, speaking), media asset picker, test generation panel, test import panel, advanced tools. |
| **Admin Flashcards** | ✅ Complete - Deck list with create/delete, deck editor with inline card CRUD (`src/app/(admin)/admin/flashcards/`, `/admin/flashcards/[id]`). |
| **Admin Reviews** | ✅ Complete - List/detail/action UI passes typecheck. |
| **Resource Save Button** | ✅ Complete - Icon and button variants with POST/DELETE toggle (`src/components/resources/resource-save-button.tsx`). |
| **Section Renderer** | ✅ Complete - `IeltsSectionRenderer` renders sections with question groups (`src/components/ielts/ielts-section-renderer.tsx`). |
| **Question Renderer** | ✅ Complete - `ObjectiveQuestionRenderer` for MC, T/F/NG, matching, etc. (`src/components/ielts/objective-question-renderer.tsx`). |

**Current frontend P0:** keep `pnpm typecheck` and `pnpm build` green. All core learner and admin UI is implemented.

## Start Here

1. [`routes-and-navigation.md`](routes-and-navigation.md) — route map, layouts, protection rules, and navigation.
2. [`ui-system.md`](ui-system.md) — design system, shared components, responsive rules, and accessibility baseline.
3. [`minimal-aesthetic-improvement-plan.md`](minimal-aesthetic-improvement-plan.md) — audit findings and phased plan to polish inner pages.
4. [`screens-and-flows.md`](screens-and-flows.md) — learner/admin screens and user flows.
5. [`state-and-api-integration.md`](state-and-api-integration.md) — API client, data fetching, mutations, polling, and local draft state.
6. [`mock-test-ui.md`](mock-test-ui.md) — exam simulation UI, section flow, answer rendering, draft safety, and timer integration.
7. [`writing-speaking-ui.md`](writing-speaking-ui.md) — Writing and Speaking submission, audio, evaluation status, and feedback UI.
8. [`admin-ui.md`](admin-ui.md) — basic admin resource/test/review screens.
9. [`accessibility-responsive.md`](accessibility-responsive.md) — accessibility and responsive behavior requirements.
10. [`../../testing-plans/frontend-testing-plan.md`](../../testing-plans/frontend-testing-plan.md) — frontend test plan and manual QA scenarios.

## Frontend Scope

V1 includes:

- Landing page (`/`).
- Changelog page (`/changelog`).
- Register/login/logout/reset password (`/login`, `/register`, `/reset-password`).
- Welcome/onboarding page (`/welcome`).
- Protected learner dashboard with streak/achievements (`/dashboard`).
- Profile form (`/profile`).
- Resource list/detail with bookmark toggle (`/resources`, `/resources/[id]`).
- Flashcard decks with SM-2 study sessions (`/flashcards`, `/flashcards/[id]`, `/flashcards/[id]/study`).
- Practice list/attempt/result (`/practice`, `/practice/[id]`, `/practice/[id]/result`).
- Mock test list/overview/active attempt with timer/score/report (`/mock-tests`, `/mock-tests/[id]`, `/attempts/[id]`, `/attempts/[id]/score`, `/attempts/[id]/report`).
- Writing task response UI with live word count and auto-save.
- Speaking text/audio response UI with recorder.
- Evaluation status and feedback pages (`/evaluations/[id]`).
- Referral code generation and credits (`/referrals`).
- Beta feedback submission.
- Admin resource/test/review/flashcard screens (`/admin`).
- Admin test builder with section editors, question group management, media picker, test generation/import panels (`/admin/tests/[id]/builder`, `/admin/tests/[id]/preview`).

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
- Wrap `useSearchParams()` in Suspense boundaries for static page generation compatibility.

## Complexity Priorities

### P0 — Must Build

- Green typecheck/build across all pages.
- Normalize API helper imports and response handling.
- Keep learner answer keys out of client state.
- Harden practice and mock attempt pages with proper loading/error/empty states.
- Maintain unsaved-answer protection and draft recovery for active attempts.
- Per-section timer with auto-submit on expiry.
- Writing editor with live word count and auto-save.
- Keep score result page gated behind completed modules.
- Streak and achievement display in dashboard.

### P1 — Build If Stable

- Speaking audio recording/upload polish.
- Admin review queue actions refinement.
- Beta feedback admin review workflow.
- Changelog content management.

### P2 — Defer If Timeline Is Tight

- Advanced pronunciation UI.
- Personalized study plan screens.
- AI tutor/chat interface.
- Native mobile app.
- Highlighting/notes in reading passages.
