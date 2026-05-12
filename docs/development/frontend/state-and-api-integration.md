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
- `GET /api/dashboard` - Dashboard stats and progress + streak
- `GET /api/progress` - Learning progress with by-category breakdown
- `GET /api/progress/[resourceId]` - Resource-specific progress
- `POST /api/progress/check-unlock` - Check resource unlock conditions
- `GET /api/achievements` - Streak, badges, and achievements
- `GET /api/resources` - List published resources with filters
- `GET /api/resources/:id` - Resource detail
- `POST /api/resources/:id/save` - Bookmark resource
- `DELETE /api/resources/:id/save` - Remove bookmark
- `GET /api/flashcards/decks` - List flashcard decks
- `GET /api/flashcards/decks/:id` - Deck detail with cards
- `GET /api/flashcards/decks/:id/progress` - Deck study progress
- `POST /api/flashcards/study/:deckId` - SM-2 card review submission
- `GET /api/practice` - List practice items
- `POST /api/practice/:id/attempt` - Submit practice attempt
- `GET /api/practice/attempts` - Practice history
- `GET /api/mock-tests` - List published tests
- `GET /api/mock-tests/:id` - Test detail (no answer keys)
- `POST /api/mock-tests/:id/start` - Start new attempt
- `GET /api/attempts/:attemptId` - Attempt status and progress (includes `durationMinutes` per section)
- `POST /api/attempts/:attemptId/answers` - Save draft answers
- `POST /api/attempts/:attemptId/submit-section` - Submit section for scoring
- `GET /api/attempts/:attemptId/can-proceed` - Check section eligibility
- `GET /api/attempts/:attemptId/report` - Detailed attempt report
- `POST /api/attempts/:attemptId/predict-score` - Get score prediction
- `GET /api/evaluations/:id` - Evaluation status and result
- `POST /api/evaluations/writing` - Submit writing for evaluation
- `POST /api/evaluations/speaking` - Submit speaking for evaluation
- `GET /api/referrals/me` - Learner's referral stats
- `POST /api/referrals/apply` - Apply referral code
- `GET /api/referrals/generate` - Generate referral code
- `GET /api/referrals/me/redemptions` - Redeemed referral codes
- `GET /api/referrals/me/credits` - Credit balance
- `GET /api/credits` - Credit summary
- `GET /api/credits/ledger` - Credit transaction history
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
- `GET /api/admin/tests/[id]/sections` - List test sections

**Questions:**
- `POST /api/admin/questions` - Create question with answer key
- `GET /api/admin/questions/[id]` - Get question details
- `PATCH /api/admin/questions/[id]` - Update question
- `DELETE /api/admin/questions/[id]` - Delete question

**Flashcards:**
- `GET /api/admin/flashcards/decks` - List decks with card counts
- `POST /api/admin/flashcards/decks` - Create deck
- `GET /api/admin/flashcards/decks/[id]` - Get deck with cards
- `PATCH /api/admin/flashcards/decks/[id]` - Update deck
- `DELETE /api/admin/flashcards/decks/[id]` - Delete deck
- `POST /api/admin/flashcards/decks/[id]/cards` - Add card to deck
- `PATCH /api/admin/flashcards/cards/[id]` - Update card
- `DELETE /api/admin/flashcards/cards/[id]` - Delete card

**Reviews:**
- `GET /api/admin/reviews` - List review queue
- `GET /api/admin/reviews/[id]` - Get review detail
- `PATCH /api/admin/reviews/[id]` - Take review action

**Referrals:**
- `GET /api/admin/referrals` - Referral program analytics
- `POST /api/admin/referrals` - Create/update referral config
- `GET /api/admin/referrals/[code]/status` - Referral status
- `PATCH /api/admin/referrals/[code]/status` - Update status
- `GET /api/admin/referrals/analytics` - Analytics
- `GET /api/admin/referrals/credits` - Credits overview
- `POST /api/admin/referrals/credits` - Issue credits
- `POST /api/admin/referrals/credits/revoke` - Revoke credits

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
