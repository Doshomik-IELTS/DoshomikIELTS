# IELTS++ Development Plan (from current baseline)

**Last updated:** 2026-05-10 (synced to current code and typecheck status)

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

## Current baseline (snapshot — verified 2026-05-10)

### Routes and shells

- **Next.js App Router** with `(auth)`, `(learner)`, `(admin)`. Marketing home is `src/app/page.tsx` (no `(public)` group).
- **Learner URLs** present as pages (many are UI scaffolds): `dashboard`, `profile`, `resources`, `resources/[id]`, `practice`, `practice/[id]`, `practice/[id]/result`, `mock-tests`, `mock-tests/[id]`, `attempts/[id]`, `attempts/[id]/score`, `evaluations/[id]`.
- **Admin URLs** under `/admin/...`: dashboard, `resources` (+ `new`, `[id]`), `tests` (+ `new`, `[id]`), `reviews` (+ `[id]`).

### Auth and security

- **`middleware.ts`**: requires Supabase session or dev cookie for protected path prefixes; redirects to `/login?next=…` when unauthenticated.
- **`src/app/(admin)/layout.tsx`**: **role gate** — only `admin`, `reviewer`, or `evaluator` roles may access `/admin/*`; others redirect to `/dashboard` (see [`backend/security-and-compliance.md`](backend/security-and-compliance.md)).
- **Local dev**: `prisma/seed.ts` adds an `admin` role to the demo profile (`dev:demo`) so `/admin` can be exercised after `pnpm db:seed`. Production users must receive roles through a controlled process.

### API (route handlers)

**Implemented:**

- `GET /api/health` — Health check
- `GET /api/me` — Current user profile
- `PATCH /api/profile` — Profile updates
- `GET /api/resources` — List all resources
- `GET /api/resources/[id]` — Get single resource
- `POST /api/resources/[id]/save` — Save/bookmark resource
- `GET /api/dashboard` — Learner dashboard stats
- `GET /api/practice` — List practice items (uses published resources)
- `POST /api/practice/[id]/attempt` — Create practice attempt with auto-scoring
- `GET /api/practice/attempts` — Practice attempt history
- `GET /api/mock-tests` — List published mock tests
- `GET /api/mock-tests/[id]` — Get test structure (without answer keys)
- `POST /api/mock-tests/[id]/start` — Start a mock test attempt
- `POST /api/attempts/[attemptId]/answers` — Save draft answers
- `POST /api/attempts/[attemptId]/submit-section` — Submit a section (auto-scores reading/listening)
- `GET /api/attempts/[attemptId]` — Get attempt details with module progress
- `POST /api/attempts/[attemptId]/predict-score` — Generate score prediction (all 4 modules)
- `POST /api/evaluations/writing` — Submit writing for evaluation
- `POST /api/evaluations/speaking` — Submit speaking for evaluation
- `GET /api/evaluations/[id]` — Get evaluation status and result
- `GET /api/admin/resources` — Admin resource CRUD
- `GET /api/admin/resources/[id]` — Admin single resource
- `PATCH /api/admin/resources/[id]` — Update resource
- `DELETE /api/admin/resources/[id]` — Delete resource
- `GET /api/admin/stats` — Admin dashboard counts
- `GET /api/admin/tests` — Admin test list
- `POST /api/admin/tests` — Create test
- `GET /api/admin/tests/[id]` — Get test with sections and questions
- `PATCH /api/admin/tests/[id]` — Update test
- `DELETE /api/admin/tests/[id]` — Delete test
- `GET /api/admin/reviews` — Combined content/writing/speaking review queue
- `GET /api/admin/reviews/[id]` — Review detail
- `PATCH /api/admin/reviews/[id]` — Review action endpoint
- `GET /api/dev-auth/login` — Dev login
- `POST /api/dev-auth/register` — Dev register
- `DELETE /api/dev-auth/logout` — Dev logout

**Not implemented yet:** Media upload signed URLs and real background job processing.

**Build status:** `npm run typecheck` is green as of this snapshot.

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
| 2.1 | **Me + profile** | **Done** — APIs + wired profile UI with Query/RHF/toast. Dashboard **complete** with `/api/dashboard`. |
| 2.2 | **Resources** | **Done** — list/detail pages with TanStack Query; save API + DB model implemented. |
| 2.3 | **Practice** | **Mostly done** — APIs plus list/attempt/result pages exist; needs UX hardening and tests. |

---

## Phase 3 — Mock tests and attempts

| # | Deliverable | Status |
|---|-------------|--------|
| 3.1 | **Mock test list** | **Done** — `/api/mock-tests` returns published tests with metadata. |
| 3.2 | **Mock test detail** | **Done** — `/api/mock-tests/[id]` returns sections/questions (no answer keys). |
| 3.3 | **Start attempt** | **Done** — `/api/mock-tests/[id]/start` creates `MockTestAttempt`. |
| 3.4 | **Save answers** | **Done** — `/api/attempts/[id]/answers` saves draft answers. |
| 3.5 | **Submit section** | **Done** — `/api/attempts/[id]/submit-section` auto-scores reading/listening, creates module scores. |
| 3.6 | **Attempt details** | **Done** — `/api/attempts/[id]` returns status, sections, module progress. |
| 3.7 | **Score prediction** | **Done** — `/api/attempts/[id]/predict-score` calculates overall band when all 4 modules complete. |
| 3.8 | **UI wiring** | **Partial** — list/detail/start/attempt pages call APIs; needs draft recovery, navigation warnings, and tests. |

---

## Phase 4 — Writing, speaking, evaluations

| # | Deliverable | Status |
|---|-------------|--------|
| 4.1 | **Writing evaluation** | **Done** — `/api/evaluations/writing` creates evaluation + LLM job. |
| 4.2 | **Speaking evaluation** | **Done** — `/api/evaluations/speaking` creates evaluation + LLM job. |
| 4.3 | **Evaluation status** | **Done** — `/api/evaluations/[id]` returns status, bands, feedback. |
| 4.4 | **Background workers** | **Partial** — BullMQ handlers persist writing/speaking outputs via deterministic provider; production provider pending. |
| 4.5 | **UI for submissions** | **Partial** — evaluation status page exists; speaking audio submission UI still pending. |

---

## Phase 5 — Admin (P1) and content workflows

| # | Deliverable | Status |
|---|-------------|--------|
| 5.1 | **Admin layout and guard** | **Done** — `AdminLayout` sidebar + route role layout. |
| 5.2 | **Resources admin** | **Done** — `/api/admin/resources`, `/api/admin/resources/[id]`, `/api/admin/stats`. |
| 5.3 | **Tests admin (CRUD)** | **Done** — `/api/admin/tests` full CRUD + sections/questions. |
| 5.4 | **Reviews admin** | **Partial** — list/detail/action UI and APIs exist; needs database-backed regression tests. |

---

## Phase 6 — Hardening and release readiness

| # | Deliverable | Status |
|---|-------------|--------|
| 6.1 | **Media upload** | **Partial** — signed upload/download APIs exist; speaking recorder UI integration pending. |
| 6.2 | **E2E tests** | **Scripts exist** — `pnpm test:e2e`; auth-guard tests added. Local startup timed out during verification on the current filesystem. |
| 6.3 | **Security tests** | **Plan exists** — implementation pending. |

---

## MVP completion checklist (P0 alignment)

- [x] Auth pages exist; middleware protects learner/admin prefixes; **admin** additionally **role-protected**.
- [x] Dashboard backed by rich APIs — **complete** with `/api/dashboard`.
- [x] Profile **PATCH** + **real form** — baseline pattern for the app.
- [x] Resource list/detail/**save** — complete.
- [x] **Practice APIs** — list, attempt, history all implemented.
- [x] **Practice UI** — wired to APIs with list, attempt form, and result display.
- [x] **Mock test APIs** — list, start, answers, submit-section, score prediction all implemented.
- [x] **Mock test UI** — wired: list, detail, start flow, active attempt with save/submit.
- [x] **Evaluation APIs** — writing/speaking submission and status implemented.
- [x] **Score prediction** — generates band scores when all 4 modules complete.
- [x] **Admin tests CRUD** — complete.
- [x] **Admin test UI** — list with filters, create/edit forms, sections view (2026-05-10).
- [x] Typecheck/build green after admin review and evaluation fixes.
- [x] Admin reviews actions — list/detail/action UI exists.
- [x] Background evaluation workers produce persisted writing/speaking scores with deterministic local provider.
- [x] Private media signed URL upload/download endpoints.
- [x] Production LLM provider integration (OpenAI/Anthropic) - implemented 2026-05-10.
- [x] Speaking audio upload API exists - UI integration pending but API ready.
- [x] P0 integration tests (12 tests passing) - implemented 2026-05-10.

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
| Speaking P1 | TBD per [`frontend/README.md`](frontend/README.md). |
| Background workers | BullMQ processing exists with deterministic local provider; production provider still needs selection/integration. |
