# IELTS++ Backend Documentation

## Overview

The IELTS++ backend powers an owned IELTS resource and mock-test platform. It supports learner accounts, profiles, text resources, practice attempts, full mock tests, objective scoring, LLM-assisted writing/speaking evaluation, score prediction, media storage, and future admin review workflows.

V1 is a learner MVP. Full admin CRUD can be added later; initial content may be seeded or inserted by maintainers.

## Implementation status (HTTP APIs)

**Implemented** in `src/app/api/`:

| Method | Path | Status | Notes |
|--------|------|--------|--------|
| `GET` | `/api/health` | ✅ Done | Health check. |
| `GET` | `/api/me` | ✅ Done | Current profile + roles. |
| `PATCH` | `/api/profile` | ✅ Done | Validates body with Zod. |
| `GET` | `/api/resources` | ✅ Done | Published resources with filters. |
| `GET` | `/api/resources/[id]` | ✅ Done | Single resource. |
| `POST` | `/api/resources/[id]/save` | ✅ Done | Bookmark resource. |
| `GET` | `/api/dashboard` | ✅ Done | Dashboard stats. |
| `GET` | `/api/practice` | ✅ Done | List practice items. |
| `POST` | `/api/practice/[id]/attempt` | ✅ Done | Create practice attempt. |
| `GET` | `/api/practice/attempts` | ✅ Done | Practice history. |
| `GET` | `/api/mock-tests` | ✅ Done | List published tests. |
| `GET` | `/api/mock-tests/[id]` | ✅ Done | Test structure (no answer keys). |
| `POST` | `/api/mock-tests/[id]/start` | ✅ Done | Start mock test attempt. |
| `POST` | `/api/attempts/[id]/answers` | ✅ Done | Save draft answers. |
| `POST` | `/api/attempts/[id]/submit-section` | ✅ Done | Submit section (auto-scores). |
| `GET` | `/api/attempts/[id]` | ✅ Done | Attempt details + progress. |
| `POST` | `/api/attempts/[id]/predict-score` | ✅ Done | Score prediction (4 modules). |
| `POST` | `/api/evaluations/writing` | ✅ Done | Submit writing for eval. |
| `POST` | `/api/evaluations/speaking` | ✅ Done | Submit speaking for eval. |
| `GET` | `/api/evaluations/[id]` | ✅ Done | Evaluation status/result. |
| `GET` | `/api/admin/resources` | ✅ Done | Admin resource list. |
| `POST` | `/api/admin/resources` | ✅ Done | Create resource. |
| `GET` | `/api/admin/resources/[id]` | ✅ Done | Get resource. |
| `PATCH` | `/api/admin/resources/[id]` | ✅ Done | Update resource. |
| `DELETE` | `/api/admin/resources/[id]` | ✅ Done | Delete resource. |
| `GET` | `/api/admin/stats` | ✅ Done | Dashboard counts. |
| `GET` | `/api/admin/tests` | ✅ Done | List tests. |
| `POST` | `/api/admin/tests` | ✅ Done | Create test. |
| `GET` | `/api/admin/tests/[id]` | ✅ Done | Get test with questions. |
| `PATCH` | `/api/admin/tests/[id]` | ✅ Done | Update test. |
| `DELETE` | `/api/admin/tests/[id]` | ✅ Done | Delete test. |
| `GET` | `/api/admin/reviews` | ✅ Done | Combined content/writing/speaking review queue. |
| `GET` | `/api/admin/reviews/[id]` | ✅ Done | Review detail. |
| `PATCH` | `/api/admin/reviews/[id]` | ✅ Done | Review actions for content and evaluation review. |
| `POST` | `/api/dev-auth/login` | ✅ Done | Dev session login. |
| `POST` | `/api/dev-auth/logout` | ✅ Done | Dev session logout. |
| `POST` | `/api/dev-auth/register` | ✅ Done | Dev session registration. |
| `POST` | `/api/media/upload-url` | ✅ Done | Signed upload URL for speaking audio. |
| `GET` | `/api/media/[assetId]/download-url` | ✅ Done | Signed download URL. |

**Still pending:**
- Transcription provider integration (if needed for audio)
- Database-backed worker/media/admin regression tests
- Full admin test builder with all CRUD operations
- Speaking audio transcription workflow

**Recent additions (2026-05-10):**
- Production LLM provider (OpenAI/Anthropic) in `src/lib/evaluation/llm-provider.ts`
- Schema validation using Zod in `src/lib/evaluation/schemas.ts`
- EvaluationCalibration tracking in `src/lib/evaluation/calibration.ts`
- P0 tests passing (12 tests)
- Admin questions CRUD (`POST /api/admin/questions`, `GET/PATCH/DELETE /api/admin/questions/[id]`)
- Admin test sections create (`POST /api/admin/tests/[id]/sections`)
- Attempt report endpoint (`GET /api/attempts/[id]/report`)
- Full schema with TestGenerationJob, ScoreMapping, EvaluationCalibration models

**Current backend P0:** keep `npm run typecheck`, `npm run lint`, and `npm run test:p0` green while adding database-backed coverage for worker/media/admin flows.

## Backend Document Map

| Document | Purpose |
|---|---|
| [`setup-and-env.md`](setup-and-env.md) | Required services, environment variables, local setup, Prisma workflow, storage buckets, and deployment notes. |
| [`data-model.md`](data-model.md) | Prisma-oriented schema documentation for profiles, resources, tests, attempts, scores, evaluations, media, jobs, and audit logs. |
| [`database-management-and-data-model.md`](database-management-and-data-model.md) | MVP database management, migration workflow, environments, access rules, and development data model. |
| [`api-spec.md`](api-spec.md) | REST API groups, endpoint contracts, auth requirements, request/response expectations, and error conventions. |
| [`evaluation-and-scoring.md`](evaluation-and-scoring.md) | Reading/listening objective scoring, Writing/Speaking LLM evaluation, and final score prediction rules. |
| [`storage-and-media.md`](storage-and-media.md) | Supabase Storage buckets, signed URL flows, file validation, and copyright restrictions. |
| [`background-jobs.md`](background-jobs.md) | BullMQ queues, job statuses, retry rules, worker responsibilities, and failure handling. |
| [`security-and-compliance.md`](security-and-compliance.md) | Supabase session validation, roles, rate limits, signed URLs, audit logs, and copyrighted content policy. |
| [`../../testing-plans/backend-testing-plan.md`](../../testing-plans/backend-testing-plan.md) | Backend test checklist and QA scenarios. |

## Backend Stack

Recommended V1 stack:

- Runtime/API: Next.js route handlers.
- Auth: Supabase Auth.
- Database: Supabase Postgres.
- ORM/migrations: Prisma.
- Media storage: Supabase Storage.
- Queue: BullMQ.
- Queue broker: Redis.
- LLM/transcription: configurable provider service layer.

## Main Backend Modules

1. Auth and profile
2. Resource library
3. Practice attempts
4. Mock test engine
5. Reading/listening scoring
6. Writing/speaking evaluation
7. Score prediction
8. Media upload/download
9. Background jobs
10. Security, audit, and compliance

## Build Order

1. Supabase Auth integration and session validation.
2. Prisma schema and migrations.
3. Profile APIs.
4. Resource read APIs.
5. Practice attempt APIs.
6. Mock test attempt APIs.
7. Objective scoring for reading/listening.
8. Async writing/speaking evaluation submission APIs.
9. Full-test score prediction.
10. Basic admin/reviewer protection and admin CRUD.
11. Media upload/download signed URL APIs.
12. BullMQ worker handlers and deterministic provider.
13. Production LLM/transcription provider integration.

## Important Product Rules

- Do not store copyrighted Cambridge IELTS or commercial book content.
- Do not host copied book PDFs, scans, passages, questions, audio, or answer explanations.
- Store only original, licensed, public-domain-valid, or internally generated content.
- Label score predictions as unofficial estimates.
- Show full predicted overall band only after all four modules are complete.

## Technical Complexity Notes

The backend MVP is **medium-to-high complexity** because it combines authentication, content, testing, scoring, AI jobs, media storage, and admin review workflows.

### Highest Complexity Backend Areas

1. **Mock test state management**
   - Attempts move through draft, submitted, evaluating, completed, and failed states.
   - Section submission must not duplicate scores or expose answer keys.
   - Final score prediction must be blocked until all four module scores exist.

2. **Async AI evaluation**
   - Writing and Speaking evaluation should run through BullMQ jobs.
   - LLM output must be validated before saving.
   - Jobs need clear `queued`, `processing`, `succeeded`, `failed`, and `needs_review` states.

3. **Speaking audio workflow**
   - Recordings must use private Supabase Storage buckets.
   - Upload/download must use signed URLs.
   - Transcription and pronunciation analysis are optional/async.
   - Text response should remain available as a fallback.

4. **Content safety**
   - Listening content must include source/license metadata.
   - Generated content should not auto-publish.
   - Cambridge/commercial IELTS material must not be stored.

5. **Admin scope**
   - Basic resource/review admin is reasonable for MVP.
   - Full test-builder CRUD is high complexity and can be replaced with seed/manual setup if needed.

### Complexity-Based Backend Priorities

#### P0 — Must Build

- Keep green `npm run typecheck` for all backend route handlers.
- Keep BullMQ handlers for queued writing/speaking `LlmJob` records covered.
- Persist writing/speaking evaluation outputs and create/update module scores.
- Keep score prediction blocked until all required module scores exist.
- Keep answer keys out of learner APIs.
- Keep private media upload/download signed URL APIs ownership-checked before audio submission is treated as production-ready.

#### P1 — Build If Stable

- Speaking audio upload and transcription.
- Private media signed URL flow.
- Basic admin resource/review APIs.
- Dashboard/progress aggregation.
- Listening audio license metadata validation.
- Audit logs for content/review actions.

#### P2 — Defer If Timeline Is Tight

- Full admin test builder.
- Pronunciation scoring.
- Personalized study plan engine.
- AI tutor/chat backend.
- Spaced repetition engine.
- Human expert review marketplace.
- Payments/subscriptions.

### Backend Risk Mitigation

- Keep LLM provider logic behind a service abstraction.
- Store raw and parsed LLM outputs for debugging.
- Use retries with capped attempts for async jobs.
- Keep section submission idempotent where possible.
- Create explicit tests proving answer keys never appear in learner APIs.
- Use JSON fields for early evaluation outputs to avoid premature schema overdesign.
