# IELTS++ Development Plan (from current baseline)

**Last updated:** 2026-05-13 (synced to current codebase — all major features implemented)

**Purpose:** A single, actionable roadmap from the *present* repository state to the MVP described across `docs/development/`. This document does not replace detailed specs; it sequences work and points to them.

---

## Authoritative references

| Area | Document |
|------|----------|
| Starting checklist and phases | [`development-starting-phase.md`](development-starting-phase.md) |
| 8-week sequencing | [`mvp-development-workplan.md`](mvp-development-workplan.md) |
| Architecture | [`technical-architecture.md`](technical-architecture.md) |
| Frontend routes, UI, state, screens | [`frontend/routes-and-navigation.md`](frontend/routes-and-navigation.md), [`frontend/ui-system.md`](frontend/ui-system.md), [`frontend/state-and-api-integration.md`](frontend/state-and-api-integration.md), [`frontend/screens-and-flows.md`](frontend/screens-and-flows.md) |
| Mock test / writing-speaking / admin UI | [`frontend/mock-test-ui.md`](frontend/mock-test-ui.md), [`frontend/writing-speaking-ui.md`](frontend/writing-speaking-ui.md), [`frontend/admin-ui.md`](frontend/admin-ui.md) |
| Quality bar | [`frontend/accessibility-responsive.md`](frontend/accessibility-responsive.md), [`../testing-plans/frontend-testing-plan.md`](../testing-plans/frontend-testing-plan.md) |
| Security & compliance | [`backend/security-and-compliance.md`](backend/security-and-compliance.md), [`../testing-plans/security-and-compliance-testing-plan.md`](../testing-plans/security-and-compliance-testing-plan.md) |
| Backend | [`backend/README.md`](backend/README.md), [`backend/api-spec.md`](backend/api-spec.md), [`backend/data-model.md`](backend/data-model.md) |

---

## Current baseline (snapshot — verified 2026-05-13)

### Routes and shells

- **Next.js App Router** with `(auth)`, `(learner)`, `(admin)`. Marketing home is `src/app/page.tsx` (no `(public)` group).
- **Learner URLs** fully implemented: `dashboard`, `profile`, `resources`, `resources/[id]`, `flashcards`, `flashcards/[id]`, `flashcards/[id]/study`, `practice`, `practice/[id]`, `practice/[id]/result`, `mock-tests`, `mock-tests/[id]`, `attempts/[id]`, `attempts/[id]/score`, `attempts/[id]/report`, `evaluations/[id]`, `referrals`.
- **Admin URLs** under `/admin/...`: dashboard, `resources` (+ `new`, `[id]`), `tests` (+ `new`, `[id]`), `flashcards` (+ `[id]`), `reviews` (+ `[id]`).

### Auth and security

- **`middleware.ts`**: requires Supabase session or dev cookie for protected path prefixes; redirects to `/login?next=…` when unauthenticated.
- **`src/app/(admin)/layout.tsx`**: **role gate** — only `admin`, `reviewer`, or `evaluator` roles may access `/admin/*`; others redirect to `/dashboard` (see [`backend/security-and-compliance.md`](backend/security-and-compliance.md)).
- **Local dev**: `prisma/seed.ts` adds an `admin` role to the demo profile (`dev:demo`) so `/admin` can be exercised after `pnpm db:seed`. Production users must receive roles through a controlled process.

### API (route handlers)

**All implemented** — 63 route handler files covering:

- Auth: `/api/me`, `/api/profile`, `/api/dev-auth/{login,register,logout}`
- Resources: `/api/resources`, `/api/resources/[id]`, `/api/resources/[id]/save` (POST + DELETE)
- Progress & Achievements: `/api/progress`, `/api/progress/[resourceId]`, `/api/progress/check-unlock`, `/api/achievements`
- Flashcards: `/api/flashcards/decks`, `/api/flashcards/decks/[id]`, `/api/flashcards/decks/[id]/progress`, `/api/flashcards/study/[deckId]`
- Practice: `/api/practice`, `/api/practice/[id]/attempt`, `/api/practice/attempts`
- Mock Tests: `/api/mock-tests`, `/api/mock-tests/[id]`, `/api/mock-tests/[id]/start`
- Attempts: `/api/attempts/[id]`, `/api/attempts/[id]/answers`, `/api/attempts/[id]/submit-section`, `/api/attempts/[id]/can-proceed`, `/api/attempts/[id]/report`, `/api/attempts/[id]/predict-score`
- Evaluations: `/api/evaluations/writing`, `/api/evaluations/speaking`, `/api/evaluations/[id]`
- Referrals & Credits: `/api/referrals/me`, `/api/referrals/apply`, `/api/referrals/generate`, `/api/referrals/me/redemptions`, `/api/referrals/me/credits`, `/api/credits`, `/api/credits/ledger`
- Media: `/api/media/upload-url`, `/api/media/[assetId]/download-url`
- Admin Resources, Tests, Reviews, Flashcards, Referrals: full CRUD
- Dashboard: `/api/dashboard` (now includes streak data)

**Build status:** `pnpm typecheck` and `pnpm build` both pass as of 2026-05-13.

### Frontend patterns

- **Reference slice:** **Profile** — `GET /api/me` + `PATCH /api/profile` via **`apiFetch`**, **`useQuery`** (`["me"]`), **`useMutation`**, **`react-hook-form` + zod`, **Sonner** toasts (`src/components/profile/profile-editor.tsx`).
- **UI kit:** in-house primitives (`Button`, `Input`, `Textarea`, `Card`, `Badge`, state helpers) — **not** a full shadcn CLI install. **Sonner** added for global toasts.
- **Current frontend risk:** active attempt and review flows are functional, but need deeper browser/database regression coverage.

### Data and workers

- **Prisma** schema is comprehensive (profiles, roles, resources, tests, attempts, evaluations, jobs, media, audit logs).
- **New models added:** `WritingEvaluation`, `SpeakingEvaluation`, `ContentReview`, `ExternalStudyRecord`.
- **Worker** scaffold exists (`src/workers`, BullMQ helpers). Writing/speaking queues now process linked `LlmJob` records through `src/lib/evaluation/provider.ts` and persist evaluation outputs/module scores. The current provider is deterministic/local, not a production LLM.

---

## Product and engineering guardrails

These are non-negotiable for implementation (see [`frontend/README.md`](frontend/README.md) and [`frontend/ui-system.md`](frontend/ui-system.md)):

- Never expose **answer keys** in learner UI or client state.
- Show **full predicted score** only after **all four modules** complete; always label predictions as **unofficial estimates**.
- Treat **recordings and sensitive media** via signed URLs and documented flows ([`backend/storage-and-media.md`](backend/storage-and-media.md)).
- **Status and errors**: design loading, empty, error, processing, and failed states—not blank screens.
- **Accessibility**: labels on fields, focus visibility, status not by color alone ([`frontend/accessibility-responsive.md`](frontend/accessibility-responsive.md)).

---

## Phase 1 — Foundation alignment (close structural gaps)

**Goal:** Make the codebase match the documented *foundation* so feature work does not accumulate debt.

| # | Deliverable | Status (2026-05-10) |
|---|-------------|---------------------|
| 1.1 | **Route groups and URLs** | **Done** for MVP path list (stubs + key pages); `(public)` remains optional. |
| 1.2 | **Auth and role protection** | **Done** for `/admin` roles via `(admin)/layout.tsx`; middleware handles authn only. |
| 1.3 | **UI system decision** | **Recorded:** in-house primitives; **Sonner** for toasts; shadcn optional later. |
| 1.4 | **Wire the API client** | **Done:** `apiFetch` + `credentials: "same-origin"`; profile uses it — **replicate** on next features. |
| 1.5 | **TanStack Query** | **Done:** profile `useQuery` / `useMutation` + `["me"]` — **replicate** on next features. |
| 1.6 | **Forms** | **Done:** profile **RHF + zod** — extend to login, register, reset. |
| 1.7 | **Mutation feedback** | **Done** for profile (Sonner). |

**Exit criteria:** All Phase 1 items complete.

---

## Phase 2 — Learner core: profile, resources, practice

| # | Deliverable | Status |
|---|-------------|--------|
| 2.1 | **Me + profile** | **Done** — APIs + wired profile UI with Query/RHF/toast. Dashboard **complete** with `/api/dashboard` + streak/achievements. |
| 2.2 | **Resources** | **Done** — list/detail pages with TanStack Query; save/unsave API + bookmark button component. |
| 2.3 | **Practice** | **Done** — APIs plus list/attempt/result pages with proper loading/error states. |
| 2.4 | **Flashcards** | **Done** — deck list/detail/study pages with SM-2 algorithm, flip card UI, quality rating, progress tracking. |
| 2.5 | **Progress tracking** | **Done** — `/api/progress`, streak/longestStreak fields, achievements API + badges. |

---

## Phase 3 — Mock tests and attempts

| # | Deliverable | Status |
|---|-------------|--------|
| 3.1 | **Mock test list** | **Done** — `/api/mock-tests` returns published tests with metadata. |
| 3.2 | **Mock test detail** | **Done** — `/api/mock-tests/[id]` returns sections/questions (no answer keys). |
| 3.3 | **Start attempt** | **Done** — `/api/mock-tests/[id]/start` creates `MockTestAttempt`. |
| 3.4 | **Save answers** | **Done** — `/api/attempts/[id]/answers` saves draft answers + localStorage. |
| 3.5 | **Submit section** | **Done** — `/api/attempts/[id]/submit-section` auto-scores reading/listening, creates module scores. |
| 3.6 | **Attempt details** | **Done** — `/api/attempts/[id]` returns status, sections, module progress, `durationMinutes`. |
| 3.7 | **Score prediction** | **Done** — `/api/attempts/[id]/predict-score` calculates overall band when all 4 modules complete. |
| 3.8 | **Timer integration** | **Done** — `TestTimer` component mounted per section; auto-submit on expiry. |
| 3.9 | **Writing editor** | **Done** — `WritingEditor` with live word count, progress bar, auto-save. |
| 3.10 | **Speaking recorder** | **Done** — MediaRecorder API + upload; integrated into attempt page. |

---

## Phase 5 — Admin (P1) and content workflows

| # | Deliverable | Status |
|---|-------------|--------|
| 5.1 | **Admin layout and guard** | **Done** — `AdminLayout` sidebar is applied once from the admin route-group layout; route role layout enforces admin/reviewer/evaluator access. |
| 5.2 | **Resources authoring** | **Done** — Strapi Resource collection is the authoring UI; `/admin/resources*` routes open Strapi entry panels. Legacy Prisma APIs remain fallback/local tooling. |
| 5.3 | **Tests authoring** | **Done** — Strapi Mock Test, Section, Question Group, and Question content types are the authoring UI; app materializes Strapi tests into Prisma on attempt start. |
| 5.4 | **Flashcard admin** | **Done** (2026-05-13) — deck list with create/delete, deck editor with inline card CRUD. |
| 5.5 | **Reviews admin** | **Done** — list/detail/action UI and APIs exist. |

---

## Phase 6 — Hardening and release readiness

| # | Deliverable | Status |
|---|-------------|--------|
| 6.1 | **Media upload** | **Done** — signed upload/download APIs + speaking recorder UI fully integrated. |
| 6.2 | **E2E tests** | **Scripts exist** — `pnpm test:e2e`; auth-guard tests added. |
| 6.3 | **Security tests** | **Plan exists** — implementation pending. |

---

## MVP completion checklist (P0 alignment)

- [x] Auth pages exist; middleware protects learner/admin prefixes; **admin** additionally **role-protected**.
- [x] Dashboard backed by rich APIs — **complete** with streak, achievements, and progress tracking (2026-05-13).
- [x] Profile **PATCH** + **real form** — baseline pattern for the app.
- [x] Resource list/detail/**save** + **unsave** — complete with bookmark button component.
- [x] **Flashcards** — deck list, study session with SM-2, admin deck/card CRUD.
- [x] **Progress tracking** — streak/longestStreak, achievements API, progress bar.
- [x] **Practice APIs** — list, attempt, history all implemented.
- [x] **Practice UI** — wired to APIs with list, attempt form, and result display.
- [x] **Mock test APIs** — list, start, answers, submit-section, score prediction all implemented.
- [x] **Mock test UI** — wired: list, detail, start flow, active attempt with per-section timer, writing editor, save/submit.
- [x] **TestTimer** — countdown per section with auto-submit on expiry (2026-05-13).
- [x] **WritingEditor** — live word count, progress bar, auto-save to localStorage (2026-05-13).
- [x] **Evaluation APIs** — writing/speaking submission and status implemented.
- [x] **Score prediction** — generates band scores when all 4 modules complete.
- [x] **Admin tests CRUD** — complete.
- [x] **Admin test UI** — list with filters, create/edit forms, sections view.
- [x] **Admin flashcards CRUD** — deck list with create/delete, inline card editor (2026-05-13).
- [x] Typecheck/build green after all feature additions (2026-05-13).
- [x] Admin reviews actions — list/detail/action UI exists.
- [x] Background evaluation workers produce persisted writing/speaking scores with deterministic local provider.
- [x] Private media signed URL upload/download endpoints.
- [x] Production LLM provider integration (OpenAI/Anthropic) with Zod validation.
- [x] Speaking recorder UI — MediaRecorder API + upload fully integrated.
- [x] Referral and credits system — APIs and learner UI.
- [x] Resource save/unsave with DELETE endpoint.
- [x] `useApiMutation` supports POST and DELETE methods.

---

## How to use this plan

1. **Track progress** in your issue tracker by phase and deliverable ID (e.g. `1.5`, `3.2`).
2. **Reconcile weekly** with [`mvp-development-workplan.md`](mvp-development-workplan.md).
3. **Update this file** when the baseline changes materially.

---

## Open decisions

| Topic | Resolution / notes |
|-------|---------------------|
| UI kit | **In-house** primitives + **Sonner**; add shadcn components selectively if needed. |
| Dev auth | Non-production; demo profile gets **admin** role via **seed** for local `/admin` only. |
| Speaking P1 | **Done** — `SpeakingRecorder` + `SpeakingSubmission` fully integrated. |
| Flashcard admin | **Done** (2026-05-13) — deck + card CRUD with inline editor. | |
| Background workers | BullMQ processing exists with deterministic local provider; production provider still needs selection/integration. |
