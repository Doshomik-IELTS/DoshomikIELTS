# Backend API Specification

## API Conventions

Base path: `/api`

All protected learner routes require a valid Supabase session. Admin, reviewer, and evaluator routes require role checks in addition to authentication.

Recommended response envelope:

```json
{
  "data": {},
  "error": null
}
```

Error response:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

Common HTTP statuses:

- `200` success
- `201` created
- `400` validation error
- `401` unauthenticated
- `403` forbidden
- `404` not found
- `409` conflict or duplicate submission
- `429` rate limited
- `500` server error

Common application error codes:

- `VALIDATION_ERROR`
- `INVALID_STATE`
- `INVALID_DIRECTION`
- `SKIP_NOT_ALLOWED`
- `TIME_EXPIRED`
- `INSUFFICIENT_CREDITS`

## Implementation Status

> **Last updated:** 2026-05-19
> **Code Quality**: TypeScript ✅ passes, Lint ✅ passes
> **Next.js**: 16.2.6 | **Prisma**: 6.19.3 | **Zod**: 4.4.3 | **CMS**: Strapi 5

✅ = Implemented | ⚠️ = Partial | ❌ = Not implemented

---

## Content Source Of Truth

Resources, IELTS information pages, FAQs, and mock-test definitions are authored in Strapi. The Next.js app remains responsible for learner runtime state: auth, saved resources, progress, attempts, timers, answers, scoring, evaluations, credits, and reports.

Learner content APIs are Strapi-first when `STRAPI_BASE_URL` and `STRAPI_API_TOKEN` are configured. If Strapi is not configured or unavailable, the app falls back to the existing Prisma content tables for local/dev continuity.

## Auth And Profile

Supabase Auth handles register, login, logout, session refresh, and password reset. Backend APIs validate the Supabase session and use `auth.users.id` as the authenticated user ID.

### `GET /api/me` ✅

Returns the authenticated user profile and roles.

### `PATCH /api/profile` ✅

Updates learner profile fields.

Request fields:

- `name`
- `targetBand`
- `examDate`
- `nativeLanguage`
- `studyGoal`

---

## Resources

Learner APIs must only return published Strapi resources, or published Prisma fallback resources when Strapi is not configured.

### `GET /api/resources` ✅

Query filters:

- `category`
- `difficulty`
- `tag`
- `search`

Each resource includes a `saved` boolean field indicating whether the current user has bookmarked it.

### `GET /api/resources/:id` ✅

Returns one published Strapi resource with examples and practice metadata, or a published Prisma fallback resource.

### `POST /api/resources/:id/save` ✅

Saves a resource for the authenticated learner. No body required.

### `DELETE /api/resources/:id/save` ✅

Removes a saved resource bookmark.

---

## Progress And Achievements

### `GET /api/progress` ✅

Returns learning progress including:

- Overall completion percentage
- By-category breakdown
- Time spent
- Recent progress entries

### `GET /api/progress/[resourceId]` ✅

Returns resource-specific progress for the current user.

### `POST /api/progress/check-unlock` ✅

Checks whether a resource is unlocked based on prerequisites.

### `GET /api/achievements` ✅

Returns:

- Current streak and longest streak
- Earned and locked achievement badges

Falls back to default badges if the database has no achievements configured.

---

## Flashcards

### `GET /api/flashcards/decks` ✅

Returns available flashcard decks with card counts.

### `GET /api/flashcards/decks/:id` ✅

Returns deck detail including all cards with SM-2 fields (easeFactor, interval, nextReview).

### `GET /api/flashcards/decks/:id/progress` ✅

Returns study progress for a deck: total cards, due today, reviewed by user, mastery percent.

### `POST /api/flashcards/study/:deckId` ✅

Submits a card review with SM-2 quality rating (0–5).

Request fields:

- `cardId`
- `quality` (0 = Again, 2 = Hard, 4 = Good, 5 = Easy)

Response: updated card SM-2 fields. Quality >= 3 advances the card; quality < 3 resets repetitions.

---

## Practice

### `GET /api/practice` ✅

Returns available published practice items (uses published resources).

Filters:

- `type` (vocabulary, synonym, grammar, reading, listening)
- `category`
- `difficulty`

### `POST /api/practice/:id/attempt` ✅

Creates and scores a practice attempt where possible.

Request fields:

- `answers`
- `timeSpentSeconds`

For objective questions, the backend returns correctness and explanations. Returns `scoreJson` with correct/total and `feedbackJson` with question-level results.

### `GET /api/practice/attempts` ✅

Returns learner practice history with pagination.

---

## Mock Tests

### `GET /api/mock-tests` ✅

Returns published Strapi mock tests and metadata when Strapi is configured. Falls back to published Prisma tests otherwise.

### `GET /api/mock-tests/:id` ✅

Returns test structure, sections, timing, and learner-visible questions. Answer keys are NOT included. Strapi-authored tests use stable app IDs prefixed with `strapi_`.

### `POST /api/mock-tests/:id/start` ✅

Creates a `MockTestAttempt` for the learner. For Strapi-authored tests, the app first materializes the published Strapi test into Prisma `Test`, `TestSection`, `QuestionGroup`, `Question`, and `AnswerKey` rows so the existing attempt engine has stable runtime records. Returns existing in-progress attempt if one exists.

### `POST /api/attempts/:attemptId/answers` ✅

Saves draft or final answers for a section.

Request fields:

- `sectionId`
- `answers` (keyed by questionId)
- `isDraft` (default: false)

Behavior notes:

- Objective sections store question-level answers.
- Writing and speaking sections store a section-level marker answer with the response payload.
- In `full_mock` attempts, writes to future sections are rejected.
- Timed sections are rejected with `TIME_EXPIRED` once the server-side section deadline has passed.

Auto-scores objective questions immediately and stores results.

### `POST /api/attempts/:attemptId/submit-section` ✅

Submits one section. Reading/listening are scored immediately with band calculation. Creates `ModuleScore` records.

Request field:

- `sectionId`
- `responseText` for writing sections where applicable

Behavior notes:

- Server enforces section order for `full_mock` attempts.
- Submitted sections cannot be re-submitted.
- Timed sections are checked against the server-side section deadline and return `TIME_EXPIRED` on late submission.
- Writing/speaking section responses are persisted as first-class attempt answers before evaluation or completion updates.

Response includes module, score, and completion status.

### `GET /api/attempts/:attemptId` ✅

Returns attempt status, submitted sections, module scores, evaluation statuses, and completion state.

Runtime fields include:

- `currentSectionIndex`
- `currentSectionRemainingSeconds`
- `moduleProgress`
- per-section `durationMinutes`
- per-section `savedAnswers`, including writing/speaking section responses where present

These fields are used by the learner timer and sequential full-mock flow.

### `PATCH /api/attempts/:attemptId/time` ✅

Background timer keep-alive route for in-progress attempts.

Request fields:

- `action`: `"keep-alive"`
- `timeSpent`: integer seconds for the sync interval

Behavior notes:

- Updates `timeSpentSeconds` and `lastActiveAt`
- Rejects missing, unauthenticated, or non-`in_progress` attempts

### `POST /api/attempts/:attemptId/can-proceed` ✅

Checks whether a learner can proceed to a given section based on prerequisites.

### `GET /api/attempts/:attemptId/report` ✅

Returns detailed attempt report with section-by-section breakdown, question results, and band scores.

### `POST /api/attempts/:attemptId/predict-score` ✅

Generates or refreshes a score prediction after all four modules are complete.

Response fields:

- `listeningBand`
- `readingBand`
- `writingBand`
- `speakingBand`
- `overallBand`
- `confidence` (low/medium/high)
- `label`: always "unofficial estimate"
- `disclaimer`

---

## Evaluation

### `POST /api/evaluations/writing` ✅

Creates a writing evaluation job for a writing response.

Request fields:

- `attemptId` (required)
- `sectionId` (required)
- `taskType`: `task_1` or `task_2` (required)
- `responseText` (required)

Creates `WritingEvaluation` record, a queued `LlmJob` database row, links the job to the evaluation, and enqueues a BullMQ job when `REDIS_URL` is configured.

### `POST /api/evaluations/speaking` ✅

Creates a speaking evaluation job.

Request fields:

- `attemptId` (required)
- `sectionId` (required)
- `part`: `part_1`, `part_2`, or `part_3` (required)
- `responseText` (optional)
- `mediaAssetId` (optional)

Creates `SpeakingEvaluation` record and a queued linked `LlmJob` database row if text/audio content is provided. Enqueues a BullMQ job when `REDIS_URL` is configured.

Additional behavior:

- At least one of `responseText` or `mediaAssetId` is required.
- The backend validates that the section is the learner's active speaking section for `full_mock` attempts.
- Late submissions are rejected with `TIME_EXPIRED`.
- A successful request also persists the section response marker on the attempt so attempt completion state stays consistent.

### `GET /api/evaluations/:id` ✅

Returns evaluation status and result.

Response includes:

- `type` (writing/speaking)
- `status` (queued/processing/succeeded/failed/needs_review)
- `overallBand`
- `criteriaBands`
- `feedback`
- `needsHumanReview`

---

## Referrals And Credits

### `GET /api/referrals/me` ✅

Returns learner's referral stats: referral code, usage count, credit earned.

### `POST /api/referrals/apply` ✅

Applies a referral code to the current user's account.

### `GET /api/referrals/generate` ✅

Generates a new referral code for the learner.

### `GET /api/referrals/me/redemptions` ✅

Returns learner's redeemed referral codes.

### `GET /api/referrals/me/credits` ✅

Returns learner's credit balance.

### `GET /api/credits` ✅

Returns credit summary for the current user.

### `GET /api/credits/ledger` ✅

Returns credit transaction history (credit/debit entries with descriptions).

---

## Media

### `POST /api/media/upload-url` ✅

Creates a private Supabase signed upload URL and `MediaAsset` row.

Supported purposes:

- `speaking_recording`: learner-owned audio upload.
- `listening_audio`: admin/reviewer upload with required license metadata.

### `GET /api/media/:assetId/download-url` ✅

Creates a short-lived signed download URL after owner/admin/reviewer/evaluator access checks.

---

## Admin APIs

### Resources

- Strapi Admin is the authoring UI for resources.
- `/admin/resources`, `/admin/resources/new`, and `/admin/resources/[id]` now render Strapi entry panels instead of the custom resource editor.
- Legacy `/api/admin/resources*` routes still exist for fallback/local data and older tooling, but they are no longer the primary authoring contract.
- `GET /api/admin/stats` ✅ — Dashboard counts

### Tests

- Strapi Admin is the authoring UI for mock-test definitions, sections, question groups, questions, answer keys, explanations, and media.
- `/admin/tests`, `/admin/tests/new`, and `/admin/tests/[id]` now render Strapi entry panels instead of the custom test editor.
- Legacy `/api/admin/tests*`, question, and question-group routes still exist for fallback/local data, generation/import tooling, and operational compatibility, but they are no longer the primary authoring contract.

### Questions

- `POST /api/admin/questions` ✅ — Create question with optional answer key and source span
- `GET /api/admin/questions/[id]` ✅ — Get question details
- `PATCH /api/admin/questions/[id]` ✅ — Update question
- `DELETE /api/admin/questions/[id]` ✅ — Delete question
- `POST /api/admin/questions/reorder` ✅ — Reorder questions within a section

### Flashcards

- `GET /api/admin/flashcards/decks` ✅ — List decks with card counts
- `POST /api/admin/flashcards/decks` ✅ — Create deck
- `GET /api/admin/flashcards/decks/[id]` ✅ — Get deck with cards
- `PATCH /api/admin/flashcards/decks/[id]` ✅ — Update deck
- `DELETE /api/admin/flashcards/decks/[id]` ✅ — Delete deck
- `POST /api/admin/flashcards/decks/[id]/cards` ✅ — Add card to deck
- `PATCH /api/admin/flashcards/cards/[id]` ✅ — Update card
- `DELETE /api/admin/flashcards/cards/[id]` ✅ — Delete card

### Reviews

- `GET /api/admin/reviews` ✅ — Combined content, writing, and speaking review queue.
- `GET /api/admin/reviews/[id]` ✅ — Review detail.
- `PATCH /api/admin/reviews/[id]` ✅ — Review actions.

### Referrals

- `GET /api/admin/referrals` ✅ — Referral program analytics
- `POST /api/admin/referrals` ✅ — Create/update referral program config
- `GET /api/admin/referrals/[code]` ✅ — Get referral detail
- `GET /api/admin/referrals/[code]/status` ✅ — Referral status
- `PATCH /api/admin/referrals/[code]/status` ✅ — Update referral status
- `GET /api/admin/referrals/analytics` ✅ — Referral analytics
- `GET /api/admin/referrals/credits` ✅ — Credits overview
- `POST /api/admin/referrals/credits` ✅ — Issue credits
- `POST /api/admin/referrals/credits/revoke` ✅ — Revoke credits
- `GET /api/admin/referrals/config` ✅ — Get referral config (singleton)
- `POST /api/admin/referrals/config` ✅ — Create/update referral config

---

## Beta Feedback

### `POST /api/feedback` ✅

Submit beta feedback. Available to any authenticated user (learner or admin).

Request fields:
- `category` (required): `bug`, `feature`, `improvement`, `general`
- `message` (required): minimum 10 characters
- `email` (optional): overrides user's profile email
- `pageUrl` (optional): current page URL

Response includes feedback `id` and `success` flag.

### `GET /api/feedback` ✅

List beta feedback entries. **Admin/reviewer only.**

Returns up to 100 most recent feedback entries, ordered by `createdAt` descending.

---

## Admin Media Management

### `GET /api/admin/media` ✅

List media assets with search and filter. **Admin only.**

Query params:
- `search`: searches title, path, transcriptText
- `purpose`: filter by purpose
- `limit`: max results (default 20, max 100)

### `POST /api/admin/media` ✅

Create a media asset record. **Admin only.**

Request fields:
- `bucket` (required)
- `path` (required)
- `purpose` (required)
- `contentType` (required)
- `title` (optional)
- `altText` (optional)
- `transcriptText` (optional)
- `sizeBytes` (optional)
- `durationSeconds` (optional)
- `licenseMetadataJson` (optional)

### `PATCH /api/admin/media/[id]` ✅

Update media asset metadata. **Admin only.**

Updatable fields: `title`, `altText`, `transcriptText`, `durationSeconds`, `licenseMetadataJson`.

---

## Test Generation (LLM-Powered)

### `POST /api/admin/generation/tests` ✅

Create a new test generation job. **Admin only.**

Request fields:
- `module` (required): `listening`, `reading`, `writing`, `speaking`
- `testType` (optional, default `short_mock`): `practice`, `short_mock`, `full_mock`
- `blueprintJson` (optional): generation blueprint/spec

### `GET /api/admin/generation/tests/[id]` ✅

Get generation job detail. **Admin only.**

### `PATCH /api/admin/generation/tests/[id]` ✅

Update generation job status/output. **Admin only.**

Updatable fields: `status`, `outputJson`, `validationJson`, `errorJson`.

### `POST /api/admin/generation/tests/[id]/generate-draft` ✅

Trigger LLM-based test generation for a job. **Admin only.**

### `POST /api/admin/generation/tests/[id]/import-draft` ✅

Import a generated draft into the test system. **Admin only.**

---

## Question Groups

Question groups organize related questions within a test section (e.g., a set of T/F/NG questions sharing a common instruction).

### `GET /api/admin/question-groups` ✅

List question groups for a section. **Admin only.**

Query param: `sectionId` (required).

### `POST /api/admin/question-groups` ✅

Create a question group. **Admin only.**

Request fields:
- `sectionId` (required)
- `title` (required)
- `instructions` (required)
- `questionType` (required)
- `orderIndex` (optional)
- `displayJson` (optional)

### `GET /api/admin/question-groups/[id]` ✅

Get question group detail. **Admin only.**

### `PATCH /api/admin/question-groups/[id]` ✅

Update question group. **Admin only.**

### `DELETE /api/admin/question-groups/[id]` ✅

Delete question group. **Admin only.**

### `POST /api/admin/question-groups/reorder` ✅

Reorder question groups within a section. **Admin only.**

---

## Referral Config

### `GET /api/admin/referrals/config` ✅

Get the singleton referral configuration. **Admin only.**

### `POST /api/admin/referrals/config` ✅

Create or update referral configuration. **Admin only.**

Fields: `referrerReward`, `refereeReward`, `minPurchaseForReward`, `maxRedemptionsPerCode`, `rewardTrigger` (`on_signup` or `on_first_purchase`), `enabled`.

---

## Dashboard

### `GET /api/dashboard` ✅

Returns learner dashboard with:

- Profile summary
- Streak and longest streak
- Latest scores by module
- Recent attempts
- Saved resources count
- Recommended next steps
