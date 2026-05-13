# IELTS++ Backend Documentation

## Overview

The IELTS++ backend powers an owned IELTS resource and mock-test platform. It supports learner accounts, profiles, text resources, practice attempts, full mock tests, spaced-repetition flashcards, referral/credits system, objective scoring, LLM-assisted writing/speaking evaluation, score prediction, media storage, and admin review workflows.

## Code Quality Status

- **TypeScript**: ✅ `pnpm typecheck` passes
- **Lint**: ⚠️ 0 errors, 30 warnings (pre-existing unused imports - non-blocking)
- **API Implementation**: 63 route files with 86 HTTP endpoints implemented

## Implementation status (HTTP APIs)

**Implemented** in `src/app/api/`:

| Method | Path | Status | Notes |
|--------|------|--------|--------|
| `GET` | `/api/health` | ✅ Done | Health check. |
| `GET` | `/api/me` | ✅ Done | Current profile + roles. |
| `PATCH` | `/api/profile` | ✅ Done | Validates body with Zod. |
| `GET` | `/api/resources` | ✅ Done | Published resources with filters + `saved` field. |
| `GET` | `/api/resources/[id]` | ✅ Done | Single resource. |
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
| `GET` | `/api/mock-tests` | ✅ Done | List published tests. |
| `GET` | `/api/mock-tests/[id]` | ✅ Done | Test structure (no answer keys). |
| `POST` | `/api/mock-tests/[id]/start` | ✅ Done | Start mock test attempt. |
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
| `POST` | `/api/media/upload-url` | ✅ Done | Signed upload URL for speaking audio. |
| `GET` | `/api/media/[assetId]/download-url` | ✅ Done | Signed download URL. |
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
| `POST` | `/api/admin/tests/[id]/sections` | ✅ Done | Create test section. |
| `GET` | `/api/admin/tests/[id]/sections` | ✅ Done | List test sections. |
| `GET` | `/api/admin/reviews` | ✅ Done | Combined content/writing/speaking review queue. |
| `GET` | `/api/admin/reviews/[id]` | ✅ Done | Review detail. |
| `PATCH` | `/api/admin/reviews/[id]` | ✅ Done | Review actions for content and evaluation review. |
| `POST` | `/api/admin/questions` | ✅ Done | Create question with answer key. |
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
- LLM/transcription: configurable provider service layer (OpenAI/Anthropic + deterministic fallback).

## Main Backend Modules

1. Auth and profile
2. Resource library (with bookmark/save)
3. Progress tracking and achievements
4. Spaced-repetition flashcards (SM-2 algorithm)
5. Practice attempts
6. Mock test engine (with per-section timers)
7. Reading/listening scoring
8. Writing/speaking evaluation (LLM + deterministic)
9. Score prediction
10. Referral and credits system
11. Media upload/download
12. Background jobs
13. Security, audit, and compliance

## Build Order

1. Supabase Auth integration and session validation.
2. Prisma schema and migrations.
3. Profile APIs.
4. Resource read APIs.
5. Progress tracking APIs.
6. Flashcard system (decks, cards, SM-2 review).
7. Practice attempt APIs.
8. Mock test attempt APIs.
9. Objective scoring for reading/listening.
10. Async writing/speaking evaluation submission APIs.
11. Full-test score prediction.
12. Referral and credits system.
13. Basic admin/reviewer protection and admin CRUD.
14. Flashcard admin CRUD.
15. Media upload/download signed URL APIs.
16. BullMQ worker handlers and deterministic provider.
17. Production LLM/transcription provider integration.

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

2. **Async AI evaluation**
   - Writing and Speaking evaluation should run through BullMQ jobs.
   - LLM output must be validated before saving.
   - Jobs need clear `queued`, `processing`, `succeeded`, `failed`, and `needs_review` states.

3. **Speaking audio workflow**
   - Recordings must use private Supabase Storage buckets.
   - Upload/download must use signed URLs.
   - Transcription and pronunciation analysis are optional/async.
   - Text response should remain available as a fallback.

4. **Spaced repetition (SM-2)**
   - Card review logs track ease factor, interval, and next review date.
   - Profile tracks streak and longest streak.
   - Study sessions filter cards by `nextReview <= now`.

5. **Referral and credits**
   - Referral codes with configurable rewards.
   - Credit ledger tracks all credit transactions.
   - Redemption unlocks premium content.

6. **Content safety**
   - Listening content must include source/license metadata.
   - Generated content should not auto-publish.
   - Cambridge/commercial IELTS material must not be stored.

### Complexity-Based Backend Priorities

#### P0 — Must Build

- Keep green `pnpm typecheck` for all backend route handlers.
- Keep BullMQ handlers for queued writing/speaking `LlmJob` records covered.
- Persist writing/speaking evaluation outputs and create/update module scores.
- Keep score prediction blocked until all required module scores exist.
- Keep answer keys out of learner APIs.
- Keep private media upload/download signed URL APIs ownership-checked.

#### P1 — Build If Stable

- Speaking audio upload and transcription.
- Private media signed URL flow.
- Basic admin resource/review APIs.
- Dashboard/progress aggregation.
- Listening audio license metadata validation.
- Audit logs for content/review actions.
- Streak and achievement unlock logic.

#### P2 — Defer If Timeline Is Tight

- Pronunciation scoring.
- Personalized study plan engine.
- AI tutor/chat backend.
- Human expert review marketplace.
- Payments/subscriptions.

### Backend Risk Mitigation

- Keep LLM provider logic behind a service abstraction.
- Store raw and parsed LLM outputs for debugging.
- Use retries with capped attempts for async jobs.
- Keep section submission idempotent where possible.
- Create explicit tests proving answer keys never appear in learner APIs.
- Use JSON fields for early evaluation outputs to avoid premature schema overdesign.
