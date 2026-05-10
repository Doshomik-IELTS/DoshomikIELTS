# Frontend State And API Integration

## API Client

Use the shared frontend API client for backend route handlers.

Current repo note:

- `src/lib/api/client.ts` exports `apiFetch<T>()` and returns the unwrapped `data` from the standard API envelope.
- `src/lib/hooks/api.ts` exports `useApiQuery` and `useApiMutation`, but it currently uses raw `fetch` directly.
- Do not import `@/lib/api` unless a barrel file is added; current code with that import fails typecheck.

Responsibilities:

- Attach auth/session where needed.
- Parse standard response envelope.
- Normalize errors.
- Support typed request/response helpers.
- Trigger toast/error UI where appropriate.

Backend response envelope:

```json
{
  "data": {},
  "error": null
}
```

Error envelope:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": {}
  }
}
```

## Data Fetching Strategy

Recommended defaults:

- Server render public and mostly static pages where practical.
- Use client-side fetching for authenticated dashboards and highly interactive flows.
- Use TanStack Query or equivalent for:
  - Resource lists.
  - Practice lists.
  - Attempts.
  - Evaluation polling.
  - Mutations.

## API Integration Checklist

Required learner integrations:

- `GET /api/me` - Current user profile and roles
- `PATCH /api/profile` - Update learner profile
- `GET /api/dashboard` - Dashboard stats and progress
- `GET /api/resources` - List published resources with filters
- `GET /api/resources/:id` - Resource detail
- `POST /api/resources/:id/save` - Bookmark/unbookmark resource
- `GET /api/practice` - List practice items
- `POST /api/practice/:id/attempt` - Submit practice attempt
- `GET /api/practice/attempts` - Practice history
- `GET /api/mock-tests` - List published tests
- `GET /api/mock-tests/:id` - Test detail (no answer keys)
- `POST /api/mock-tests/:id/start` - Start new attempt
- `POST /api/attempts/:attemptId/answers` - Save draft answers
- `POST /api/attempts/:attemptId/submit-section` - Submit section for scoring
- `GET /api/attempts/:attemptId` - Attempt status and progress
- `GET /api/attempts/:attemptId/report` - Detailed attempt report
- `POST /api/attempts/:attemptId/predict-score` - Get score prediction
- `GET /api/evaluations/:id` - Evaluation status and result
- `POST /api/evaluations/writing` - Submit writing for evaluation
- `POST /api/evaluations/speaking` - Submit speaking for evaluation
- `POST /api/media/upload-url` - Get signed upload URL
- `GET /api/media/:assetId/download-url` - Get signed download URL
- `GET /api/health` - Health check

Admin integrations:

**Resources:**
- `GET /api/admin/resources` - List resources with filters
- `POST /api/admin/resources` - Create resource
- `GET /api/admin/resources/[id]` - Get resource
- `PATCH /api/admin/resources/[id]` - Update resource
- `DELETE /api/admin/resources/[id]` - Delete resource

**Tests:**
- `GET /api/admin/tests` - List tests
- `POST /api/admin/tests` - Create test
- `GET /api/admin/tests/[id]` - Get test with sections/questions
- `PATCH /api/admin/tests/[id]` - Update test
- `DELETE /api/admin/tests/[id]` - Delete test
- `POST /api/admin/tests/[id]/sections` - Create section
- `POST /api/admin/questions` - Create question with answer key

**Reviews:**
- `GET /api/admin/reviews` - List review queue
- `GET /api/admin/reviews/[id]` - Get review detail
- `PATCH /api/admin/reviews/[id]` - Take review action

**Stats:**
- `GET /api/admin/stats` - Dashboard counts

## State Types

### Server State

Fetched and cached:

- Current user/profile.
- Progress summary.
- Resources.
- Practice list.
- Mock test list.
- Attempts.
- Evaluations.
- Score predictions.

### Form State

Use form state for:

- Profile form.
- Login/register forms.
- Admin resource/test forms.
- Writing response.
- Speaking text response.

### Local Attempt State

Use local/component state for:

- Active answers before submission.
- Current section navigation.
- Unsaved changes.
- Audio recording state.
- Upload progress.

Optionally use local storage for draft recovery during active attempts.

## Evaluation Polling

Use polling for async evaluation jobs in MVP.

Statuses:

- `queued`
- `processing`
- `succeeded`
- `failed`
- `needs_review`

Recommended behavior:

- Poll every few seconds while queued/processing.
- Stop polling on succeeded/failed/needs_review.
- Let user leave page and return later.
- Show last updated time if helpful.

## Mutation UX Rules

For mutations:

- Disable submit button while pending.
- Show optimistic UI only for safe actions such as save/unsave resource.
- Show toast on success.
- Show inline errors for form validation.
- Preserve user input on submission error.

## Sensitive Data Rules

Do not store these in frontend state:

- Answer keys.
- Admin-only scoring rules in learner screens.
- Supabase service role key.
- Private permanent media URLs.

Use signed URLs only for uploads/downloads.
