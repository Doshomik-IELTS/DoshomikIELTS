# DOshomik IELTS Backend Documentation

## Overview

The DOshomik IELTS backend powers an owned IELTS resource and mock-test platform. It supports learner accounts, profiles, Strapi-authored resources/mock tests, practice attempts, full mock tests, spaced-repetition flashcards, referral/credits system, objective scoring, LLM-assisted writing/speaking evaluation, score prediction, media storage, and admin review workflows.

## Code Quality Status

- **TypeScript**: ✅ `pnpm typecheck` passes
- **Lint**: ✅ 0 errors (warnings are pre-existing unused imports - non-blocking)
- **API Implementation**: 100+ route files with 100+ HTTP endpoints implemented
- **Next.js**: 16.2.6 | React: 19.2.4 | Prisma: 6.19.3 | Zod: 4.4.3 | Strapi: 5.46.0
- **Tests**: ✅ `pnpm test:p0` passes (38/38)

## Implementation status (HTTP APIs)

**Implemented** in `src/app/api/`:

| Method | Path | Status | Notes |
|--------|------|--------|--------|
| `GET` | `/api/health` | ✅ Done | Health check. |
| `GET` | `/api/me` | ✅ Done | Current profile + roles. |
| `PATCH` | `/api/profile` | ✅ Done | Validates body with Zod. |
| `GET` | `/api/resources` | ✅ Done | Published Strapi resources with filters; Prisma fallback. |
| `GET` | `/api/resources/[id]` | ✅ Done | Single published Strapi resource; Prisma fallback. |
| `POST` | `/api/resources/[id]/save` | ✅ Done | Bookmark resource. |
| `DELETE` | `/api/resources/[id]/save` | ✅ Done | Remove bookmark. |
| `GET` | `/api/dashboard` | ✅ Done | Dashboard stats + streak data. |
| `GET` | `/api/progress` | ✅ Done | Learning progress with by-category breakdown. |
| `GET` | `/api/progress/[resourceId]` | ✅ Done | Resource-specific progress tracking. |
| `POST` | `/api/progress/check-unlock` | ✅ Done | Check resource unlock conditions. |
| `GET` | `/api/achievements` | ✅ Done | Streak, badges, and achievements. |
| `GET` | `/api/practice` | ✅ Done | List practice items. |
| `POST` | `/api/practice/[id]/attempt` | ✅ Done | Create practice attempt. |
| `GET` | `/api/practice/attempts` | ✅ Done | Practice history. |
| `GET` | `/api/mock-tests` | ✅ Done | List published Strapi tests; Prisma fallback. |
| `GET` | `/api/mock-tests/[id]` | ✅ Done | Test structure (no answer keys). |
| `POST` | `/api/mock-tests/[id]/start` | ✅ Done | Start mock test attempt; materializes Strapi tests into Prisma runtime rows. |
| `GET` | `/api/attempts/[attemptId]` | ✅ Done | Attempt details + progress + `durationMinutes`. |
| `POST` | `/api/attempts/[attemptId]/answers` | ✅ Done | Save draft answers. |
| `POST` | `/api/attempts/[attemptId]/submit-section` | ✅ Done | Submit section (auto-scores). |
| `GET` | `/api/attempts/[attemptId]/can-proceed` | ✅ Done | Check if learner can proceed to section. |
| `GET` | `/api/attempts/[attemptId]/report` | ✅ Done | Attempt report with scores/feedback. |
| `POST` | `/api/attempts/[attemptId]/predict-score` | ✅ Done | Score prediction (4 modules). |
| `POST` | `/api/evaluations/writing` | ✅ Done | Submit writing for eval. |
| `POST` | `/api/evaluations/speaking` | ✅ Done | Submit speaking for eval. |
| `GET` | `/api/evaluations/[id]` | ✅ Done | Evaluation status/result. |
| `GET` | `/api/flashcards/decks` | ✅ Done | Learner deck list. |
| `GET` | `/api/flashcards/decks/[id]` | ✅ Done | Deck detail with cards. |
| `GET` | `/api/flashcards/decks/[id]/progress` | ✅ Done | Deck progress (due cards, mastery). |
| `POST` | `/api/flashcards/study/[deckId]` | ✅ Done | SM-2 review submission. |
| `GET` | `/api/referrals/me` | ✅ Done | Learner's referral stats. |
| `POST` | `/api/referrals/apply` | ✅ Done | Apply referral code. |
| `GET` | `/api/referrals/generate` | ✅ Done | Generate referral code. |
| `GET` | `/api/referrals/me/redemptions` | ✅ Done | Learner's redeemed referrals. |
| `GET` | `/api/referrals/me/credits` | ✅ Done | Learner's credit balance. |
| `GET` | `/api/credits` | ✅ Done | Credit summary. |
| `GET` | `/api/credits/ledger` | ✅ Done | Credit transaction history. |
| `GET` | `/api/feedback` | ✅ Done | Admin: list beta feedback. |
| `POST` | `/api/feedback` | ✅ Done | Submit beta feedback (any auth user). |
| `POST` | `/api/media/upload-url` | ✅ Done | Signed upload URL for speaking audio. |
| `GET` | `/api/media/[assetId]/download-url` | ✅ Done | Signed download URL. |
| `GET` | `/api/admin/resources` | Legacy | Fallback/local resource list; Strapi Admin is primary authoring UI. |
| `POST` | `/api/admin/resources` | Legacy | Fallback/local create; use Strapi for new authoring. |
| `GET` | `/api/admin/resources/[id]` | Legacy | Fallback/local get. |
| `PATCH` | `/api/admin/resources/[id]` | Legacy | Fallback/local update. |
| `POST` | `/api/admin/resources/[id]/publish` | Legacy | Fallback/local publish. |
| `DELETE` | `/api/admin/resources/[id]` | Legacy | Fallback/local delete. |
| `GET` | `/api/admin/stats` | ✅ Done | Dashboard counts. |
| `GET` | `/api/admin/tests` | Legacy | Fallback/local list; Strapi Admin is primary mock-test authoring UI. |
| `POST` | `/api/admin/tests` | Legacy | Fallback/local create; use Strapi for new authoring. |
| `GET` | `/api/admin/tests/[id]` | Legacy | Fallback/local get with questions. |
| `PATCH` | `/api/admin/tests/[id]` | Legacy | Fallback/local update. |
| `DELETE` | `/api/admin/tests/[id]` | Legacy | Fallback/local delete. |
| `POST` | `/api/admin/tests/[id]/validate` | Legacy | Fallback/local validation. |
| `POST` | `/api/admin/tests/[id]/publish` | Legacy | Fallback/local publish. |
| `POST` | `/api/admin/tests/[id]/duplicate` | Legacy | Fallback/local duplicate. |
| `POST` | `/api/admin/tests/[id]/sections` | Legacy | Fallback/local section create. |
| `GET` | `/api/admin/tests/[id]/sections` | Legacy | Fallback/local section list. |
| `GET` | `/api/admin/reviews` | ✅ Done | Combined content/writing/speaking review queue. |
| `GET` | `/api/admin/reviews/[id]` | ✅ Done | Review detail. |
| `PATCH` | `/api/admin/reviews/[id]` | ✅ Done | Review actions for content and evaluation review. |
| `POST` | `/api/admin/questions` | ✅ Done | Create question with answer key and optional source span. |
| `GET` | `/api/admin/questions/[id]` | ✅ Done | Get question details. |
| `PATCH` | `/api/admin/questions/[id]` | ✅ Done | Update question. |
| `DELETE` | `/api/admin/questions/[id]` | ✅ Done | Delete question. |
| `GET` | `/api/admin/flashcards/decks` | ✅ Done | Admin flashcard deck list. |
| `POST` | `/api/admin/flashcards/decks` | ✅ Done | Create flashcard deck. |
| `GET` | `/api/admin/flashcards/decks/[id]` | ✅ Done | Get deck with cards. |
| `PATCH` | `/api/admin/flashcards/decks/[id]` | ✅ Done | Update deck. |
| `DELETE` | `/api/admin/flashcards/decks/[id]` | ✅ Done | Delete deck. |
| `POST` | `/api/admin/flashcards/decks/[id]/cards` | ✅ Done | Add card to deck. |
| `PATCH` | `/api/admin/flashcards/cards/[id]` | ✅ Done | Update card. |
| `DELETE` | `/api/admin/flashcards/cards/[id]` | ✅ Done | Delete card. |
| `GET` | `/api/admin/referrals` | ✅ Done | Referral program analytics. |
| `POST` | `/api/admin/referrals` | ✅ Done | Create referral program config. |
| `GET` | `/api/admin/referrals/[code]/status` | ✅ Done | Referral status. |
| `PATCH` | `/api/admin/referrals/[code]/status` | ✅ Done | Update referral status. |
| `GET` | `/api/admin/referrals/analytics` | ✅ Done | Referral analytics. |
| `GET` | `/api/admin/referrals/credits` | ✅ Done | Credits overview. |
| `POST` | `/api/admin/referrals/credits` | ✅ Done | Issue credits. |
| `POST` | `/api/admin/referrals/credits/revoke` | ✅ Done | Revoke credits. |
| `GET` | `/api/admin/media` | ✅ Done | List media assets with search/filter. |
| `POST` | `/api/admin/media` | ✅ Done | Create media asset record. |
| `PATCH` | `/api/admin/media/[id]` | ✅ Done | Update media asset metadata. |
| `POST` | `/api/admin/generation/tests` | ✅ Done | Create test generation job. |
| `GET` | `/api/admin/generation/tests/[id]` | ✅ Done | Get generation job detail. |
| `PATCH` | `/api/admin/generation/tests/[id]` | ✅ Done | Update generation job status/output. |
| `POST` | `/api/admin/generation/tests/[id]/generate-draft` | ✅ Done | Trigger LLM test generation. |
| `POST` | `/api/admin/generation/tests/[id]/import-draft` | ✅ Done | Import generated draft. |
| `GET` | `/api/admin/question-groups` | ✅ Done | List question groups by section. |
| `POST` | `/api/admin/question-groups` | ✅ Done | Create question group. |
| `GET` | `/api/admin/question-groups/[id]` | ✅ Done | Get question group detail. |
| `PATCH` | `/api/admin/question-groups/[id]` | ✅ Done | Update question group. |
| `DELETE` | `/api/admin/question-groups/[id]` | ✅ Done | Delete question group. |
| `POST` | `/api/admin/question-groups/reorder` | ✅ Done | Reorder question groups. |
| `GET` | `/api/admin/referrals/config` | ✅ Done | Get referral config. |
| `POST` | `/api/admin/referrals/config` | ✅ Done | Create/update referral config. |
| `POST` | `/api/dev-auth/login` | ✅ Done | Dev session login. |
| `POST` | `/api/dev-auth/logout` | ✅ Done | Dev session logout. |
| `POST` | `/api/dev-auth/register` | ✅ Done | Dev session registration. |

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

- Runtime/API: Next.js route handlers.
- Auth: Supabase Auth (dev auth for local dev).
- Database: Supabase Postgres.
- ORM/migrations: Prisma.
- Media storage: Supabase Storage.
- Queue: BullMQ.
- Queue broker: Redis.
- LLM/transcription: configurable provider service layer (OpenAI/Anthropic/Gemini + deterministic fallback).
- Error tracking: Sentry (optional).
- Learner/product analytics: PostHog browser SDK (optional).

## Main Backend Modules

1. Auth and profile
2. Resource library (with bookmark/save, prerequisites, progression ordering)
3. Progress tracking and achievements
4. Spaced-repetition flashcards (SM-2 algorithm)
5. Practice attempts
6. Mock test engine (with per-section timers, question groups)
7. Reading/listening scoring
8. Writing/speaking evaluation (LLM + deterministic)
9. Score prediction
10. Referral and credits system
11. Media upload/download (with admin media management)
12. Background jobs
13. Security, audit, and compliance
14. Beta feedback collection
15. LLM-powered test generation pipeline
16. Question group management

## Build Order

1. Supabase Auth integration and session validation.
2. Prisma schema and migrations.
3. Profile APIs.
4. Resource read APIs.
5. Progress tracking APIs (with prerequisites and progression ordering).
6. Flashcard system (decks, cards, SM-2 review).
7. Practice attempt APIs.
8. Mock test attempt APIs (with question groups, per-section timers).
9. Objective scoring for reading/listening.
10. Async writing/speaking evaluation submission APIs.
11. Full-test score prediction.
12. Referral and credits system.
13. Basic admin/reviewer protection and admin CRUD.
14. Flashcard admin CRUD.
15. Media upload/download signed URL APIs + admin media management.
16. BullMQ worker handlers and deterministic provider.
17. Production LLM/transcription provider integration (OpenAI/Anthropic/Gemini).
18. Beta feedback collection APIs.
19. LLM-powered test generation pipeline.
20. Question group management APIs.

## Important Product Rules

- Do not store copyrighted Cambridge IELTS or commercial book content.
- Do not host copied book PDFs, scans, passages, questions, audio, or answer explanations.
- Store only original, licensed, public-domain-valid, or internally generated content.
- Label score predictions as unofficial estimates.
- Show full predicted overall band only after all four modules are complete.

## Technical Complexity Notes

The backend MVP is **medium-to-high complexity** because it combines authentication, content, testing, scoring, AI jobs, media storage, referral/credits, and admin review workflows.

### Highest Complexity Backend Areas

1. **Mock test state management**
   - Attempts move through draft, submitted, evaluating, completed, and failed states.
   - Section submission must not duplicate scores or expose answer keys.
   - Per-section timers require `durationMinutes` on each `TestSection`.
   - Final score prediction must be blocked until all four module scores exist.
   - Question groups organize related questions within sections.
   - `timeSpentSeconds` and `lastActiveAt` track attempt timing.

2. **Async AI evaluation**
   - Writing and Speaking evaluation run through BullMQ jobs.
   - LLM output validated against Zod schemas before saving.
   - Jobs have clear `queued`, `processing`, `succeeded`, `failed`, and `needs_review` states.
   - Auto-completes attempt when all 4 modules have scores.

3. **Speaking audio workflow**
   - Recordings use private Supabase Storage buckets.
   - Upload/download use signed URLs.
   - Transcription and pronunciation analysis are optional/async.
   - Text response remains available as fallback.

4. **Spaced repetition (SM-2)**
   - Card review logs track ease factor, interval, and next review date.
   - Profile tracks streak and longest streak.
   - Study sessions filter cards by `nextReview <= now`.
   - Cards have tags and difficulty levels.

5. **Referral and credits**
   - Referral codes with configurable rewards via `ReferralConfig` singleton.
   - Credit ledger tracks all credit transactions with typed `CreditTxType`.
   - Redemption unlocks premium content.
   - Supports `on_signup` and `on_first_purchase` reward triggers.

6. **Resource progression**
   - `ResourcePrerequisite` model enables locked content chains.
   - `ResourceProgress` tracks per-resource completion (0-100%).
   - `orderIndex` on resources enables ordered learning paths.

7. **Content safety**
   - Listening content must include source/license metadata.
   - Generated content should not auto-publish.
   - Cambridge/commercial IELTS material must not be stored.

8. **LLM test generation**
   - `TestGenerationJob` tracks blueprint → generating → validating → review → published pipeline.
   - Admin can generate drafts via LLM and import them.
   - `TestVersion` snapshots track test revisions.

### Complexity-Based Backend Priorities

#### P0 — Must Build

- Keep green `pnpm typecheck` for all backend route handlers.
- Keep BullMQ handlers for queued writing/speaking `LlmJob` records covered.
- Persist writing/speaking evaluation outputs and create/update module scores.
- Keep score prediction blocked until all required module scores exist.
- Keep answer keys out of learner APIs.
- Keep private media upload/download signed URL APIs ownership-checked.
- Keep rate limiting active on auth, submission, evaluation, and media endpoints.

#### P1 — Build If Stable

- Speaking audio upload and transcription.
- Private media signed URL flow.
- Strapi content authoring integration and basic admin review APIs.
- Dashboard/progress aggregation.
- Listening audio license metadata validation.
- Audit logs for content/review actions.
- Streak and achievement unlock logic.
- Resource prerequisite/progression UI integration.
- Beta feedback admin review workflow.

#### P2 — Defer If Timeline Is Tight

- Pronunciation scoring.
- Personalized study plan engine.
- AI tutor/chat backend.
- Human expert review marketplace.
- Payments/subscriptions.
- Full LLM test generation pipeline (currently scaffolded).
- Question group reordering UI.

### Backend Risk Mitigation

- Keep LLM provider logic behind a service abstraction.
- Store raw and parsed LLM outputs for debugging.
- Use retries with capped attempts for async jobs.
- Keep section submission idempotent where possible.
- Create explicit tests proving answer keys never appear in learner APIs.
- Use JSON fields for early evaluation outputs to avoid premature schema overdesign.
