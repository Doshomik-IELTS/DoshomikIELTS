# IELTS++ Documentation Index

This folder contains product, strategy, market, content, and development documentation for IELTS++.

## Start Here

1. [`development/README.md`](development/README.md) — development documentation index.
2. [`development/launch-readiness-plan.md`](development/launch-readiness-plan.md) — current launch blockers, acceptance criteria, and release gates.
3. [`development/development-plan.md`](development/development-plan.md) — baseline-aware roadmap and MVP checklist (updated with repo status).
4. [`development/development-starting-phase.md`](development/development-starting-phase.md) — immediate starting-phase checklist.
5. [`development/mvp-development-workplan.md`](development/mvp-development-workplan.md) — full 8-week MVP development plan.
6. [`product-requirements.md`](product-requirements.md) — core product requirements.
7. [`development/technical-complexity-report.md`](development/technical-complexity-report.md) — complexity, risks, and priorities.

---

## Product And Strategy Docs

| Document | Purpose |
|---|---|
| [`product-requirements.md`](product-requirements.md) | Product goal, users, resources, practice, mock tests, account/profile, score prediction, and MVP non-goals. |
| [`content-strategy.md`](content-strategy.md) | Original content strategy, copyright policy, LLM-generated content rules, listening content rules, and quality control. |
| [`market-research-analysis.md`](market-research-analysis.md) | Competitor research and market feature patterns. |
| [`prospective-features.md`](prospective-features.md) | MVP, differentiator, post-MVP, and premium feature ideas. |

---

## Development Docs

All development-focused files now live in [`development/`](development/).

| Document | Purpose |
|---|---|
| [`development/README.md`](development/README.md) | Development docs index and reading order. |
| [`development/launch-readiness-plan.md`](development/launch-readiness-plan.md) | Current launch blockers, required fixes, verification commands, and release gates. |
| [`development/development-plan.md`](development/development-plan.md) | Current baseline, phased roadmap, and MVP checklist vs implementation. |
| [`development/development-starting-phase.md`](development/development-starting-phase.md) | Starting-phase setup and first implementation checklist. |
| [`development/mvp-development-workplan.md`](development/mvp-development-workplan.md) | Week-wise full-stack MVP plan. |
| [`development/mock-test-implementation-plan.md`](development/mock-test-implementation-plan.md) | Research-backed full mock test implementation, scoring, LLM generation/evaluation, and practice module plan. |
| [`development/resource-admin-dashboard-plan.md`](development/resource-admin-dashboard-plan.md) | Plan: create/manage all resource categories from the admin dashboard (APIs, UX, phases). |
| [`development/frontend/README.md`](development/frontend/README.md) | Frontend route map, UI foundation, learner/admin screens, and frontend tests. |
| [`development/technical-architecture.md`](development/technical-architecture.md) | Architecture, stack, hosting, storage, modules, data model sketch, and security. |
| [`development/technical-complexity-report.md`](development/technical-complexity-report.md) | Complexity ratings, risk register, priorities, and mitigation guidance. |
| [`development/evaluation-methods.md`](development/evaluation-methods.md) | Reading/listening scoring, writing/speaking evaluation, and score prediction rules. |
| [`development/backend/README.md`](development/backend/README.md) | Backend documentation index and implementation overview. |

---

## Testing plans

All QA and test plans are indexed in [`testing-plans/README.md`](testing-plans/README.md).

| Document | Purpose |
|---|---|
| [`testing-plans/frontend-testing-plan.md`](testing-plans/frontend-testing-plan.md) | Frontend automated, manual, accessibility, and responsive test plan. |
| [`testing-plans/backend-testing-plan.md`](testing-plans/backend-testing-plan.md) | Backend test checklist for auth, resources, practice, mock tests, evaluation, score, media, and jobs. |
| [`testing-plans/security-and-compliance-testing-plan.md`](testing-plans/security-and-compliance-testing-plan.md) | Security and compliance testing: authZ, IDOR, rate limits, media, content, audit, score disclaimers, leakage, periodic checks. |

---

## Frontend Development Directory

All frontend-specific implementation docs live in [`development/frontend/`](development/frontend/).

| Document | Purpose |
|---|---|
| [`development/frontend/README.md`](development/frontend/README.md) | Frontend overview, scope, priorities, and reading order. |
| [`development/frontend/routes-and-navigation.md`](development/frontend/routes-and-navigation.md) | Route groups, protected routes, navigation, breadcrumbs, and attempt navigation safety. |
| [`development/frontend/ui-system.md`](development/frontend/ui-system.md) | Tailwind/shadcn design system, shared components, status colors, and score UI rules. |
| [`development/frontend/screens-and-flows.md`](development/frontend/screens-and-flows.md) | Learner and admin screen flows from landing through final score. |
| [`development/frontend/state-and-api-integration.md`](development/frontend/state-and-api-integration.md) | API client, server/client state, mutations, polling, and sensitive-data rules. |
| [`development/frontend/mock-test-ui.md`](development/frontend/mock-test-ui.md) | Mock test UI, section renderers, draft safety, submission, and score gating. |
| [`development/frontend/writing-speaking-ui.md`](development/frontend/writing-speaking-ui.md) | Writing/Speaking submission, recording/upload, evaluation status, and feedback UI. |
| [`development/frontend/admin-ui.md`](development/frontend/admin-ui.md) | Basic admin dashboard, resource/test management, review queue, and content warnings. |
| [`development/frontend/accessibility-responsive.md`](development/frontend/accessibility-responsive.md) | Accessibility baseline and responsive behavior requirements. |

---

## Backend Development Directory

All backend-specific implementation docs live in [`development/backend/`](development/backend/).

| Document | Purpose |
|---|---|
| [`development/backend/README.md`](development/backend/README.md) | Backend overview, stack, build order, complexity priorities, and risk mitigation. |
| [`development/backend/setup-and-env.md`](development/backend/setup-and-env.md) | Services, environment variables, local setup, migrations, buckets, and deployment notes. |
| [`development/backend/data-model.md`](development/backend/data-model.md) | Prisma-oriented data model for identity, resources, tests, attempts, evaluations, media, and jobs. |
| [`development/backend/database-management-and-data-model.md`](development/backend/database-management-and-data-model.md) | Database environments, migrations, Prisma workflow, access rules, and MVP data model. |
| [`development/backend/api-spec.md`](development/backend/api-spec.md) | API conventions, auth, resources, practice, mock tests, evaluations, score, and media endpoints. |
| [`development/backend/evaluation-and-scoring.md`](development/backend/evaluation-and-scoring.md) | Reading/listening scoring, Writing/Speaking evaluation, and score prediction rules. |
| [`development/backend/storage-and-media.md`](development/backend/storage-and-media.md) | Supabase Storage buckets, signed URL flow, validation, and copyright restrictions. |
| [`development/backend/background-jobs.md`](development/backend/background-jobs.md) | BullMQ queues, job statuses, retry rules, workers, and failure handling. |
| [`development/backend/security-and-compliance.md`](development/backend/security-and-compliance.md) | Authentication, authorization, rate limits, media security, content compliance, and audit logs. |

---

## Recommended Reading Order

### Solo Developer / Full-Stack Implementer

1. `development/launch-readiness-plan.md`
2. `development/development-starting-phase.md`
3. `development/mvp-development-workplan.md`
4. `development/technical-complexity-report.md`
5. `development/frontend/README.md`
6. `development/backend/README.md`
7. `development/backend/setup-and-env.md`
8. `development/backend/data-model.md`
9. `development/backend/api-spec.md`
10. `testing-plans/README.md`

### Product / Content Planning

1. `product-requirements.md`
2. `content-strategy.md`
3. `market-research-analysis.md`
4. `prospective-features.md`

---

## Current MVP Decisions

- Timeline: 8 weeks.
- Team assumption: solo developer.
- Frontend: Next.js App Router, Tailwind CSS, in-house UI primitives with selective shadcn-style patterns.
- Backend: Next.js route handlers.
- Auth: Supabase Auth.
- Database: Supabase Postgres.
- ORM: Prisma.
- Storage: Supabase Storage.
- Jobs: Redis + BullMQ.
- LLM/transcription: provider abstraction.
- Scope: learner MVP plus basic admin screens.
- Content: original/licensed/public-domain-valid only.
- Score prediction: shown only after all four modules are complete.

## Current P0 Tasks

1. Keep `npm run typecheck`, `npm run lint`, and `npm run test:p0` green.
2. Replace the deterministic local evaluation provider with the selected production LLM/transcription provider.
3. Add deeper database-backed tests for attempts, score gating, evaluations, media authorization, and admin actions.
4. Complete speaking audio UI integration against the signed media endpoints.
5. Expand E2E coverage after the local Next dev server startup issue is resolved.

---

## Non-Negotiable Rules

- Do not host Cambridge IELTS PDFs, scans, audio, passages, questions, or answer explanations.
- Do not host commercial IELTS book content.
- Keep answer keys hidden from learner-facing APIs/screens.
- Keep learner recordings private.
- Use signed URLs for private media.
- Label all score predictions as unofficial estimates.
- Do not show full predicted score before a complete four-module attempt.
