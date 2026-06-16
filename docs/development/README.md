# IELTS++ Development Docs

**Last updated:** 2026-06-17 — Design system finalized (purple-indigo primary, Poppins font, `@theme inline` tokens, auth modal flow, dark landing page).

This folder contains implementation-focused documentation for building the IELTS++ MVP.

## Current Implementation Status (2026-06-17)

### ✅ All Major Features Implemented

The IELTS++ platform has completed its core MVP feature set. Learner-facing features, app admin workflows, Strapi content authoring, and baseline PostHog learner analytics are implemented. The design system has been updated with a purple-indigo primary (`#6556ff`), Poppins font family, CSS variable-based design tokens via `@theme inline`, auth modal flow, and a dark-themed single-scroll landing page. Current focus is on production hardening.

### ✅ Completed APIs (100+ endpoints)
- **Auth**: `/api/me`, `/api/profile`, dev-auth endpoints
- **Resources**: `/api/resources`, `/api/resources/[id]`, `/api/resources/[id]/save`
- **Dashboard**: `/api/dashboard` (with streak/achievements)
- **Progress & Achievements**: `/api/progress`, `/api/progress/[resourceId]`, `/api/progress/check-unlock`, `/api/achievements`
- **Flashcards**: `/api/flashcards/decks`, `/api/flashcards/decks/[id]`, `/api/flashcards/decks/[id]/progress`, `/api/flashcards/study/[deckId]`
- **Practice**: `/api/practice`, `/api/practice/[id]/attempt`, `/api/practice/attempts`
- **Mock Tests**: `/api/mock-tests`, `/api/mock-tests/[id]`, `/api/mock-tests/[id]/start`
- **Attempts**: `/api/attempts/[id]`, `/api/attempts/[id]/answers`, `/api/attempts/[id]/submit-section`, `/api/attempts/[id]/can-proceed`, `/api/attempts/[id]/report`, `/api/attempts/[id]/predict-score`
- **Evaluations**: `/api/evaluations/writing`, `/api/evaluations/speaking`, `/api/evaluations/[id]`
- **Referrals & Credits**: `/api/referrals/me`, `/api/referrals/apply`, `/api/referrals/generate`, `/api/referrals/me/redemptions`, `/api/referrals/me/credits`, `/api/credits`, `/api/credits/ledger`
- **Media**: `/api/media/upload-url`, `/api/media/[assetId]/download-url`
- **Admin**: Strapi entry panels for resources/tests; app CRUD/workflows for flashcards, reviews, referrals, media, question groups, and legacy/fallback content tooling
- **Feedback**: `/api/feedback` (submit + admin list)

### ✅ Completed Data Models
- All core models: Profile, Role, Resource, Test, TestSection, Question, QuestionGroup, AnswerKey, MockTestAttempt, ModuleScore, ScorePrediction
- Evaluation models: WritingEvaluation, SpeakingEvaluation, ContentReview, LlmJob, EvaluationCalibration
- Content pipeline: TestGenerationJob, TestVersion, ScoreMapping
- Engagement: FlashcardDeck, FlashcardCard, FlashcardReview, ResourceProgress, ResourcePrerequisite
- Growth: Referral, ReferralRedemption, ReferralConfig, CreditLedger
- Media: MediaAsset
- Audit: AuditLog, ResourceVersion
- External: ExternalStudyRecord

### ✅ Completed Features
- Production LLM provider (OpenAI/Anthropic/Gemini) with deterministic fallback
- Schema validation for LLM outputs using Zod
- P0 integration tests (38/38 passing)
- Speaking audio upload API with signed URLs + UI components
- Strapi CMS for resource and mock-test authoring, with app admin panels linking to Strapi
- Flashcard system with SM-2 spaced repetition
- Referral and credits system
- Progress tracking with streaks and achievements
- Beta feedback collection
- Changelog page
- Rate limiting on all sensitive endpoints
- Audit logging for all admin write operations
- Sentry error tracking configured
- PostHog learner analytics configured behind env vars
- BullMQ worker with 6 queue processors
- Drag-and-drop reordering for sections, groups, and questions
- Source-span highlighting for Reading/Listening
- Strict Listening one-play simulation UI
- Bulk question paste for admin authoring
- Sticky learner header and mobile navigation for learner/admin shells

## Current Focus: Production Hardening

1. **Production LLM/TTS workers** — Replace deterministic provider with production LLM for test generation and TTS audio generation.
2. **Server-side strict audio events** — Add `AttemptEvent` tracking for anti-cheat enforcement on Listening one-play.
3. **Staging verification** — Verify all P0 fixes against real Supabase/Redis/LLM services.
4. **E2E coverage** — Expand Playwright tests beyond scaffold level.
5. **Weakness detection** — Deferred to Phase 4 polish; PostHog now captures baseline learner/product analytics.

---

## Start Here

1. [`launch-readiness-plan.md`](launch-readiness-plan.md) — current public-launch blockers, acceptance criteria, and launch gates.
2. [`development-plan.md`](development-plan.md) — baseline vs repo, phased roadmap, MVP checklist.
3. [`development-starting-phase.md`](development-starting-phase.md) — immediate starting-phase checklist.
4. [`mvp-development-workplan.md`](mvp-development-workplan.md) — 8-week full-stack workplan.
5. [`technical-complexity-report.md`](technical-complexity-report.md) — complexity, risk, and priority guidance.
6. [`technical-architecture.md`](technical-architecture.md) — overall stack, hosting, storage, modules, and architecture.
7. [`content/mock-test-implementation-plan.md`](content/mock-test-implementation-plan.md) — research-backed plan for full IELTS mock tests, scoring, practice modules, and LLM generation/evaluation.
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
| [`frontend/admin-ui.md`](frontend/admin-ui.md) | Strapi content authoring panels and admin review screens. |
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
- [`content/mock-test-implementation-plan.md`](content/mock-test-implementation-plan.md)
- [`content/resource-admin-dashboard-plan.md`](content/resource-admin-dashboard-plan.md) — historical custom resource admin plan; Strapi is now the authoring path.
- [`technical-complexity-report.md`](technical-complexity-report.md)
- [`technical-architecture.md`](technical-architecture.md)
- [`evaluation-methods.md`](evaluation-methods.md)

## Related Product/Strategy Docs

These remain one level up in `docs/`:

- [`../product-requirements.md`](../product-requirements.md)
- [`../content-strategy.md`](../content-strategy.md)
- [`../market-research-analysis.md`](../market-research-analysis.md)
- [`../prospective-features.md`](../prospective-features.md)
