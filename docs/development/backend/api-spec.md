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

## Implementation Status

> **Last updated:** 2026-05-10

✅ = Implemented | ⚠️ = Partial | ❌ = Not implemented

---

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

### `GET /api/profile/progress` ⚠️

Returns latest module scores, full score prediction, saved resources, and attempt summary. Partially implemented via `/api/dashboard`.

### `GET /api/profile/attempts` ⚠️

Returns paginated practice and mock test attempt history. Practice history at `/api/practice/attempts`; mock test history via `/api/attempts/:id`.

---

## Resources

Learner APIs must only return resources with status `published`.

### `GET /api/resources` ✅

Query filters:

- `category`
- `difficulty`
- `tag`
- `search`
- `page`
- `limit`

### `GET /api/resources/:id` ✅

Returns one published resource with examples and practice metadata.

### `POST /api/resources/:id/save` ✅

Saves or unsaves a resource for the authenticated learner.

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

Returns published mock tests and metadata.

### `GET /api/mock-tests/:id` ✅

Returns test structure, sections, timing, and learner-visible questions. Answer keys are NOT included.

### `POST /api/mock-tests/:id/start` ✅

Creates a `MockTestAttempt` for the learner. Returns existing in-progress attempt if one exists.

### `POST /api/attempts/:attemptId/answers` ✅

Saves draft or final answers for a section.

Request fields:

- `sectionId`
- `answers` (keyed by questionId)
- `isDraft` (default: false)

Auto-scores objective questions immediately and stores results.

### `POST /api/attempts/:attemptId/submit-section` ✅

Submits one section. Reading/listening are scored immediately with band calculation. Creates `ModuleScore` records.

Request field:

- `sectionId`

Response includes module, score, and completion status.

### `GET /api/attempts/:attemptId` ✅

Returns attempt status, submitted sections, module scores, evaluation statuses, and completion state. Includes `moduleProgress` array showing completion per module.

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

All admin resource endpoints are implemented:

- `GET /api/admin/resources` ✅ — List with filters
- `POST /api/admin/resources` ✅ — Create
- `GET /api/admin/resources/[id]` ✅ — Get single
- `PATCH /api/admin/resources/[id]` ✅ — Update
- `DELETE /api/admin/resources/[id]` ✅ — Delete
- `GET /api/admin/stats` ✅ — Dashboard counts

### Tests

- `GET /api/admin/tests` ✅ — List
- `POST /api/admin/tests` ✅ — Create test metadata
- `GET /api/admin/tests/[id]` ✅ — Get test with sections/questions
- `PATCH /api/admin/tests/[id]` ✅ — Update test and nested sections/questions
- `DELETE /api/admin/tests/[id]` ✅ — Delete

### Reviews

- `GET /api/admin/reviews` ✅ — Combined content, writing, and speaking review queue.
- `GET /api/admin/reviews/[id]` ✅ — Review detail.
- `PATCH /api/admin/reviews/[id]` ✅ — Review actions.

### Admin Test Sections & Questions

- `POST /api/admin/tests/[id]/sections` ✅ — Create test section.
- `POST /api/admin/questions` ✅ — Create question with optional answer key.
- `GET /api/admin/questions/[id]` ✅ — Get question details.
- `PATCH /api/admin/questions/[id]` ✅ — Update question.
- `DELETE /api/admin/questions/[id]` ✅ — Delete question.

### Attempts

- `GET /api/attempts/[id]/report` ✅ — Get attempt report with scores and feedback.

---

## Dashboard

### `GET /api/dashboard` ✅

Returns learner dashboard with:

- Profile summary
- Latest scores by module
- Recent attempts
- Saved resources count
- Recommended next steps
