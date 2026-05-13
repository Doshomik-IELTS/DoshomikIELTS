# IELTS++ Development Docs

This folder contains implementation-focused documentation for building the IELTS++ MVP.

## Current Implementation Status (2026-05-10)

### ✅ Completed APIs
- **Auth**: `/api/me`, `/api/profile`, dev-auth endpoints
- **Resources**: `/api/resources`, `/api/resources/[id]`, `/api/resources/[id]/save`
- **Dashboard**: `/api/dashboard`
- **Practice**: `/api/practice`, `/api/practice/[id]/attempt`, `/api/practice/attempts`
- **Mock Tests**: `/api/mock-tests`, `/api/mock-tests/[id]`, `/api/mock-tests/[id]/start`
- **Attempts**: `/api/attempts/[id]`, `/api/attempts/[id]/answers`, `/api/attempts/[id]/submit-section`, `/api/attempts/[id]/predict-score`
- **Evaluations**: `/api/evaluations/writing`, `/api/evaluations/speaking`, `/api/evaluations/[id]`
- **Admin**: `/api/admin/resources`, `/api/admin/resources/[id]`, `/api/admin/stats`, `/api/admin/tests`, `/api/admin/tests/[id]`, `/api/admin/tests/[id]/publish`, `/api/admin/reviews`, `/api/admin/reviews/[id]`
- **Media**: `/api/media/upload-url`, `/api/media/[assetId]/download-url`

### ✅ Completed Data Models
- **TestGenerationJob**: For LLM test generation pipeline
- **ScoreMapping**: For raw-to-band score mappings
- **EvaluationCalibration**: For LLM evaluation calibration
- **TestSection.contentJson**: For reading passage, listening transcript, writing visual spec, speaking cue card
- **TestSection.mediaAssetId**: For listening audio
- **Question.sourceSpanJson**: For source span references

### ✅ Completed Features
- Production LLM provider (OpenAI/Anthropic) with fallback to deterministic
- Schema validation for LLM outputs using Zod
- EvaluationCalibration tracking
- P0 integration tests (12 tests passing)
- Speaking audio upload API with signed URLs
- Admin test management UI (list/create/edit/delete)

## P0 Tasks Right Now

1. **Keep core checks green.** `pnpm typecheck`, `pnpm lint`, and `pnpm test:p0` should pass before feature work.
2. **Production LLM provider** — Already implemented. Set `LLM_PROVIDER` and `LLM_API_KEY` in environment.
3. **Run database migration** — Run `pnpm prisma migrate dev` for new schema models.
4. **Speaking audio UI** — API ready, UI component needed for learner recording.
5. **Admin test sections editor** — View read-only, full CRUD pending.

For full task list, see [`mvp-remaining-tasks.md`](mvp-remaining-tasks.md).

---

## Start Here

1. [`launch-readiness-plan.md`](launch-readiness-plan.md) — current public-launch blockers, acceptance criteria, and launch gates.
2. [`development-plan.md`](development-plan.md) — baseline vs repo, phased roadmap, MVP checklist.
3. [`development-starting-phase.md`](development-starting-phase.md) — immediate starting-phase checklist.
4. [`mvp-development-workplan.md`](mvp-development-workplan.md) — 8-week full-stack workplan.
5. [`technical-complexity-report.md`](technical-complexity-report.md) — complexity, risk, and priority guidance.
6. [`technical-architecture.md`](technical-architecture.md) — overall stack, hosting, storage, modules, and architecture.
7. [`mock-test-implementation-plan.md`](mock-test-implementation-plan.md) — research-backed plan for full IELTS mock tests, scoring, practice modules, and LLM generation/evaluation.
8. [`frontend/README.md`](frontend/README.md) — frontend route map, UI plan, and frontend tasks.
9. [`backend/README.md`](backend/README.md) — backend implementation overview.
10. [`../testing-plans/README.md`](../testing-plans/README.md) — index of all testing and QA plans (frontend, backend, and future E2E/performance/security).

## Frontend

| Document | Purpose |
|---|---|
| [`frontend/README.md`](frontend/README.md) | Frontend overview, scope, and priorities. |
| [`frontend/routes-and-navigation.md`](frontend/routes-and-navigation.md) | Route map, layouts, protected route rules, and navigation safety. |
| [`frontend/ui-system.md`](frontend/ui-system.md) | Tailwind/shadcn UI system and shared components. |
| [`frontend/screens-and-flows.md`](frontend/screens-and-flows.md) | Learner and admin screens and end-to-end flows. |
| [`frontend/state-and-api-integration.md`](frontend/state-and-api-integration.md) | API client, state management, polling, and sensitive data rules. |
| [`frontend/mock-test-ui.md`](frontend/mock-test-ui.md) | Mock test interface, question rendering, draft safety, and score gating. |
| [`frontend/writing-speaking-ui.md`](frontend/writing-speaking-ui.md) | Writing/Speaking response, audio, evaluation, and feedback UI. |
| [`frontend/admin-ui.md`](frontend/admin-ui.md) | Basic admin resource/test/review screens. |
| [`frontend/accessibility-responsive.md`](frontend/accessibility-responsive.md) | Accessibility and responsive requirements. |
| [`../testing-plans/frontend-testing-plan.md`](../testing-plans/frontend-testing-plan.md) | Frontend test and QA plan. |

## Backend

| Document | Purpose |
|---|---|
| [`backend/README.md`](backend/README.md) | Backend overview, stack, build order, and priorities. |
| [`backend/setup-and-env.md`](backend/setup-and-env.md) | Required services, env vars, local setup, Prisma, buckets, and deployment notes. |
| [`backend/data-model.md`](backend/data-model.md) | Database model and major entities. |
| [`backend/database-management-and-data-model.md`](backend/database-management-and-data-model.md) | Database environments, migrations, Prisma workflow, access rules, and MVP data model. |
| [`backend/api-spec.md`](backend/api-spec.md) | Backend API conventions and endpoint specs. |
| [`backend/evaluation-and-scoring.md`](backend/evaluation-and-scoring.md) | Scoring and evaluation behavior. |
| [`backend/storage-and-media.md`](backend/storage-and-media.md) | Storage buckets, signed URLs, and media rules. |
| [`backend/background-jobs.md`](backend/background-jobs.md) | Queue/job architecture and failure handling. |
| [`backend/security-and-compliance.md`](backend/security-and-compliance.md) | Security, roles, compliance, and audit rules. |
| [`../testing-plans/backend-testing-plan.md`](../testing-plans/backend-testing-plan.md) | Backend testing checklist. |

## Planning And Risk

- [`launch-readiness-plan.md`](launch-readiness-plan.md) — current launch blockers and public-release gates.
- [`mvp-development-workplan.md`](mvp-development-workplan.md)
- [`mock-test-implementation-plan.md`](mock-test-implementation-plan.md)
- [`resource-admin-dashboard-plan.md`](resource-admin-dashboard-plan.md) — adding all resource categories from the admin dashboard (API + UI phases).
- [`technical-complexity-report.md`](technical-complexity-report.md)
- [`technical-architecture.md`](technical-architecture.md)
- [`evaluation-methods.md`](evaluation-methods.md)

## Related Product/Strategy Docs

These remain one level up in `docs/`:

- [`../product-requirements.md`](../product-requirements.md)
- [`../content-strategy.md`](../content-strategy.md)
- [`../market-research-analysis.md`](../market-research-analysis.md)
- [`../prospective-features.md`](../prospective-features.md)
