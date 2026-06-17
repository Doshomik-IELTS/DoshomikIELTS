# Database Management And MVP Data Model

## Purpose

This document defines how the DOshomik IELTS MVP database should be managed during development and what data model is needed to support the first release.

It complements:

- [`data-model.md`](data-model.md)
- [`api-spec.md`](api-spec.md)
- [`evaluation-and-scoring.md`](evaluation-and-scoring.md)
- [`storage-and-media.md`](storage-and-media.md)
- [`security-and-compliance.md`](security-and-compliance.md)

---

## Database Stack

MVP database stack:

- Database: Supabase Postgres.
- ORM: Prisma.
- Auth identity source: Supabase Auth.
- App user/profile data: application tables managed by Prisma.
- Media files: Supabase Storage, with metadata stored in Postgres.
- Async job metadata: Postgres `LlmJob` table plus BullMQ/Redis queue state.

Important separation:

- Supabase Auth owns login identity.
- DOshomik IELTS owns learner profile, roles, attempts, resources, scores, evaluations, media metadata, reviews, and audit logs.

---

## Database Environments

Use separate environments:

### Local

Purpose:

- Development.
- Schema iteration.
- Seed data testing.
- Local API/frontend integration.

Rules:

- Can be reset freely.
- Use seed scripts for repeatable data.
- Do not use production user data.

### Staging

Purpose:

- Pre-launch QA.
- Full end-to-end testing.
- Content review before production.

Rules:

- Should resemble production.
- Use realistic but non-sensitive data.
- Migrations should be tested here before production.

### Production

Purpose:

- Real learner data.
- Published resources/tests.
- Real attempts and evaluations.

Rules:

- Never reset casually.
- Backups required.
- Migrations must be reviewed.
- Sensitive data and recordings must remain private.

---

## Environment Variables

Required database variables:

```bash
DATABASE_URL=
DIRECT_URL=
```

Recommended Supabase variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
```

Recommended Strapi variables for content reads:

```bash
STRAPI_BASE_URL=
STRAPI_ADMIN_URL=
STRAPI_API_TOKEN=
```

Rules:

- `DATABASE_URL` is used by Prisma Client.
- `DIRECT_URL` is used by Prisma migrations when needed.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be exposed to the browser.
- `.env.local` must not be committed.
- `.env.example` should contain variable names only, not real secrets.

---

## Prisma Workflow

### Generate Client

```bash
pnpm prisma:generate
```

Run after:

- Changing `prisma/schema.prisma`.
- Installing dependencies.
- Pulling schema changes.

### Development Migration

```bash
pnpm db:migrate
```

Use during local development to create a new migration.

### Production/Staging Migration

```bash
pnpm db:deploy
```

Use for applying existing migrations to staging/production.

### Seed Data

```bash
pnpm db:seed
```

Seed scripts should create:

- Initial published resources.
- Basic vocabulary/grammar content.
- Short mock test data.
- Safe original practice questions.

Do not seed copyrighted Cambridge/commercial IELTS content.

---

## Migration Management Rules

### During Development

- Keep migrations small and understandable.
- Prefer additive changes early in MVP.
- Avoid destructive changes once staging has real test data.
- Update docs when schema changes affect API/frontend behavior.

### Before Production

- Review migration SQL.
- Test migration on staging.
- Confirm rollback or recovery plan.
- Confirm backups exist.

### Destructive Changes

Avoid destructive changes such as:

- Dropping columns with data.
- Renaming columns without migration strategy.
- Deleting enum values.
- Changing primary keys.
- Deleting attempt/evaluation records.

If destructive changes are required:

1. Back up data.
2. Add replacement fields first.
3. Migrate data.
4. Update application code.
5. Remove old fields later.

---

## MVP Data Domains

The MVP database is organized into these domains:

1. Identity and roles.
2. Resources and content (including saved/bookmarked resources, prerequisites, progression ordering).
3. Tests, sections, question groups, questions, and answer keys.
4. Practice attempts.
5. Mock test attempts.
6. Module scores and score prediction.
7. Writing and Speaking evaluations.
8. Media metadata (with title, altText, transcriptText fields).
9. Async jobs (LLM jobs).
10. Review and audit logs.
11. Content review workflow.
12. External study records.
13. Test generation jobs (LLM-powered test creation pipeline).
14. Score mappings and evaluation calibration.
15. Flashcards and spaced-repetition review logs.
16. Achievements and profile achievements.
17. Referral program (codes, redemptions, config singleton, credit ledger).
18. Beta feedback collection.
19. Resource progress tracking with prerequisite unlocking.

---

## Identity And Role Model

### `Profile`

Purpose:

- Stores app-specific learner/admin profile information.
- Links to Supabase Auth user.

Key fields:

- `id`
- `authUserId`
- `email`
- `name`
- `targetBand`
- `examDate`
- `nativeLanguage`
- `studyGoal`
- `createdAt`
- `updatedAt`

Development notes:

- Create profile on first authenticated API access if missing.
- Keep `authUserId` unique.
- Email should mirror Supabase Auth email.

### `Role`

Purpose:

- Controls access to admin/reviewer/evaluator features.

Roles:

- `learner`
- `admin`
- `reviewer`
- `evaluator`

Rules:

- Every profile should have at least `learner` role.
- Admin routes require role checks.
- Learner data must be scoped to the current profile.

---

## Resource And Content Model

Strapi is the authoring source of truth for resources and mock-test definitions. Prisma keeps runtime/fallback/cache records so learner progress, saved resources, attempts, scoring, and reports remain app-owned.

### `Resource`

Purpose:

- Stores text-based learning resources when using local fallback data, or cached/snapshotted published Strapi resources.

Categories:

- `basic_english`
- `words`
- `synonyms`
- `grammar`
- `reading_strategy`
- `listening_strategy`
- `writing_strategy`
- `speaking_strategy`

Key fields:

- `title`
- `slug`
- `category`
- `difficulty`
- `body`
- `examplesJson`
- `tags`
- `status` (`draft`, `review`, `published`, `archived`)
- `orderIndex` — for progression ordering
- `createdById`
- `publishedAt`

Rules:

- Learner APIs return only published Strapi resources, or published Prisma fallback resources when Strapi is not configured.
- Draft/review/archived authoring state belongs in Strapi for new content.
- Resource content must be original or properly licensed.

### `ResourceVersion`

Purpose:

- Tracks resource revision snapshots.

Use in MVP:

- Store snapshots for significant edits.
- Useful for audit/review but can stay simple.

---

## Tests, Sections, Questions, And Answer Keys

Strapi owns new mock-test authoring. Prisma test tables remain the runtime representation used by the attempt engine. Starting a Strapi-authored test materializes its published content into Prisma using stable `strapi_` IDs.

### `Test`

Purpose:

- Represents practice sets, short mocks, or full mocks.

Types:

- `practice`
- `short_mock`
- `full_mock`

Rules:

- Learner APIs return published Strapi tests when Strapi is configured, with Prisma published tests as fallback.
- Full score prediction should require complete four-module attempt.

### `TestSection`

Purpose:

- Represents a section/part of a test.

Modules:

- `listening`
- `reading`
- `writing`
- `speaking`

Examples:

- Listening Section 1.
- Reading Passage 1.
- Writing Task 1.
- Speaking Part 2.

### `Question`

Purpose:

- Stores learner-visible questions/prompts.
- Can belong to a `QuestionGroup` for related question sets.

Question types:

- Multiple choice.
- Matching headings.
- True/False/Not Given.
- Yes/No/Not Given.
- Sentence completion.
- Summary completion.
- Short answer.
- Writing prompt.
- Speaking prompt.

Rules:

- Questions are learner-visible.
- Do not store answer-key-only data in the learner question payload.
- Questions can optionally belong to a `QuestionGroup` for shared instructions.

### `QuestionGroup` (added 2026-05-15)

Purpose:

- Groups related questions within a test section (e.g., a set of T/F/NG questions sharing common instructions).
- Contains shared title, instructions, and display configuration.

### `AnswerKey`

Purpose:

- Stores objective correct answers and scoring metadata.

Rules:

- Answer keys are admin/backend-only.
- Never expose answer keys in learner APIs or frontend state.
- Support accepted alternatives and scoring rules through JSON fields.

---

## Practice Attempt Model

### `PracticeAttempt`

Purpose:

- Stores learner attempts for focused practice.

Practice types:

- Vocabulary quiz.
- Synonym matching.
- Grammar correction.
- Reading question set.
- Listening question set.
- Writing task response.
- Speaking cue-card response.

Key fields:

- `profileId`
- `resourceId`
- `practiceType`
- `answersJson`
- `scoreJson`
- `feedbackJson`
- `timeSpentSeconds`
- `createdAt`

Rules:

- Objective practice can be scored immediately.
- Writing/Speaking practice may create async evaluation jobs.

---

## Mock Test Attempt Model

### `MockTestAttempt`

Purpose:

- Tracks one learner's attempt at a mock test.

Statuses:

- `in_progress`
- `submitted`
- `evaluating`
- `completed`
- `failed`

Rules:

- A learner can access only their own attempts.
- Final score prediction is blocked until all four module scores exist.
- Attempt state must handle objective and async evaluation sections.

### `AttemptAnswer`

Purpose:

- Stores learner answers per section/question.

Rules:

- Store draft/final answer data as needed.
- Preserve raw learner response for review and feedback.
- Objective answers can store `isCorrect` and score.

---

## Score Model

### `ModuleScore`

Purpose:

- Stores score for one IELTS module within an attempt.

Modules:

- Listening.
- Reading.
- Writing.
- Speaking.

Fields:

- Raw score where objective.
- Max raw score where objective.
- Estimated band.
- Criteria JSON for Writing/Speaking.
- Feedback JSON.
- Confidence.

Rules:

- Listening and Reading are scored objectively.
- Writing and Speaking come from evaluation output.

### `ScorePrediction`

Purpose:

- Stores final unofficial overall prediction.

Rules:

- Requires all four module bands.
- Average four module bands.
- Round to nearest 0.5.
- Store confidence and disclaimer.
- Always label as unofficial estimate.

---

## Evaluation Model

For MVP, evaluation data can be stored through:

- `ModuleScore.criteriaJson`
- `ModuleScore.feedbackJson`
- `LlmJob.outputJson`

If more detail is needed, add dedicated tables later:

- `WritingEvaluation`
- `SpeakingEvaluation`

Recommended MVP approach:

- Start with `LlmJob` and `ModuleScore` JSON outputs.
- Add dedicated evaluation tables when evaluation history needs more structure.

Evaluation data should include:

- Criterion scores.
- Overall estimated band.
- Strengths.
- Weaknesses.
- Improved examples.
- Next improvement task.
- Needs-review flag.

---

## Media Metadata Model

### `MediaAsset`

Purpose:

- Stores metadata for files in Supabase Storage.

Media types:

- Listening audio.
- Speaking recordings.
- Generated audio.
- Reports.

Rules:

- Files live in Supabase Storage.
- Metadata lives in Postgres.
- Buckets should be private.
- Use signed URLs for upload/download.
- Learner recordings are private.

Required metadata:

- Bucket.
- Path.
- Purpose.
- Content type.
- Size.
- Duration where applicable.
- License metadata where applicable.

---

## Async Job Model

### `LlmJob`

Purpose:

- Tracks LLM/transcription/content-validation job state.

Job types:

- `writing_evaluation`
- `speaking_transcription`
- `speaking_evaluation`
- `score_prediction`
- `content_validation`
- `media_processing`

Statuses:

- `queued`
- `processing`
- `succeeded`
- `failed`
- `needs_review`

Rules:

- Store input JSON.
- Store raw/parsed output JSON.
- Store error JSON.
- Track attempt count.
- Keep provider/model/prompt version for debugging.

---

## Review And Audit Model

### `AuditLog`

Purpose:

- Records important administrative or sensitive actions.

Examples:

- Resource published.
- Test archived.
- Evaluation overridden.
- Role changed.
- Media deleted.

### Future `ContentReview`

Can be added when review workflow becomes more advanced.

For MVP:

- Content status fields plus audit logs are enough.

---

## Test Versioning

### `TestVersion` (added 2026-05-15)

Purpose:

- Tracks test revision snapshots for audit and rollback.
- Created when tests are published or significantly updated.

---

## Resource Progression

### `ResourcePrerequisite` (added 2026-05-15)

Purpose:

- Defines prerequisite relationships between resources.
- Enables locked content that unlocks after completing other resources.
- Supports `requiredScore` and `minProgress` thresholds.

---

## Referral Configuration

### `ReferralConfig` (added 2026-05-15)

Purpose:

- Singleton configuration for the referral program.
- Controls reward amounts, triggers (`on_signup` / `on_first_purchase`), and program enablement.

---

## Beta Feedback

### `BetaFeedback` (added 2026-05-15)

Purpose:

- Collects user feedback during beta period.
- Categories: bug, feature, improvement, general.
- Admin/reviewer can view all feedback entries.

---

## Data Access Rules

### Learner Access

Learners can access:

- Their own profile.
- Published resources/tests.
- Their own attempts.
- Their own scores/evaluations.
- Their own media through signed URLs.

Learners cannot access:

- Other users' data.
- Draft/review/archived content.
- Answer keys.
- Admin-only metadata.

### Admin/Reviewer Access

Admins/reviewers can access:

- Content by status.
- Review data.
- Answer keys.
- Audit logs where permitted.

Rules:

- Role checks required.
- Audit sensitive changes.

---

## Indexing Recommendations

Add indexes as data grows.

Recommended MVP indexes:

- `Profile.authUserId` unique.
- `Profile.email` unique.
- `Resource.slug` unique.
- Resource `status`, `category`, `difficulty` for filtering.
- `Test.status`, `Test.type` for published test queries.
- `MockTestAttempt.profileId` for learner history.
- `AttemptAnswer.attemptId` for attempt loading.
- `ModuleScore.attemptId` for score summary.
- `LlmJob.status` for worker/admin queries.
- `MediaAsset.profileId` for ownership lookup.

Prisma `@unique`, relation indexes, and future `@@index` directives should be added as query patterns become clear.

---

## Backup And Retention

### Backups

Production should have:

- Automated Supabase Postgres backups.
- Backup verification process.
- Migration rollback/recovery plan.

### Retention

Recommended MVP retention:

- Keep learner attempts and scores indefinitely unless user deletion is requested.
- Keep LLM job outputs for debugging during MVP.
- Keep private recordings while needed for feedback/history.
- Add deletion/export policy before public launch if required.

---

## Development Data Seeding

Seed safe starter data:

- Basic English lessons.
- Vocabulary entries.
- Synonym groups.
- Grammar resources.
- Reading practice.
- Listening practice metadata.
- One short mock test.

Seed data must:

- Be original.
- Include answer keys where applicable.
- Include explanations.
- Include difficulty.
- Avoid copyrighted IELTS book content.

---

## MVP Database Build Order

Recommended implementation order:

1. Profiles and roles.
2. Resources and resource versions.
3. Practice attempts.
4. Tests, sections, questions, and answer keys.
5. Mock test attempts and attempt answers.
6. Module scores.
7. Score predictions.
8. Media assets.
9. LLM jobs.
10. Audit logs.
11. More advanced review/evaluation tables if needed.

---

## Current Scaffold Notes

The current scaffold already includes:

- `prisma/schema.prisma`
- `prisma/seed.ts`
- Profile/Role models.
- Resource/ResourceVersion models.
- Test/Section/Question/AnswerKey models.
- PracticeAttempt and MockTestAttempt models.
- AttemptAnswer, ModuleScore, ScorePrediction models.
- MediaAsset model.
- LlmJob model.
- AuditLog model.

Run:

```bash
pnpm prisma:generate
pnpm db:migrate
pnpm db:seed
```

before connecting the frontend to real database-backed pages.
