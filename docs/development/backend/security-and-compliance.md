# Security And Compliance

## Authentication

Use Supabase Auth as the identity provider.

Backend route handlers must:

- Validate the Supabase session.
- Resolve authenticated user ID.
- Load app profile and roles.
- Reject unauthenticated requests with `401`.

**Development Auth:** For local development, use `/api/dev-auth/login`, `/api/dev-auth/register`, and `/api/dev-auth/logout` endpoints. These are for development only and should not be exposed in production.

## Current Implementation Status

- **Auth Handlers:** Dev auth endpoints implemented in `src/app/api/dev-auth/`
- **Session Validation:** Via `src/lib/auth/session.ts` - `validateAuth()` function
- **Role Checks:** Via `src/lib/auth/roles.ts` - `requireAdminActor()`, `requireReviewerActor()`, etc.
- **Middleware:** `middleware.ts` handles auth redirects for protected routes
- **Admin Layout:** `(admin)/layout.tsx` enforces role-based access (admin/reviewer/evaluator only)
- **Rate Limiting:** Via route handler validation (not external provider)

## Authorization

Roles:

- `learner`: access own profile, resources, attempts, scores, and media.
- `admin`: manage content, users, tests, questions, and reviews.
- `reviewer`: review generated/imported content.
- `evaluator`: review flagged writing/speaking evaluations.

Admin routes require `requireAdminActor()` check which verifies the user has the admin role.

Rules:

- Learners can only access their own attempts and private media.
- Admin/reviewer/evaluator routes require explicit role checks.
- Answer keys must never be returned through learner test APIs.

## Rate Limiting

Apply rate limits to:

- Auth-sensitive endpoints.
- Practice and mock submission endpoints.
- Media signed URL creation.
- LLM evaluation creation.
- Score prediction refresh.
- Bookmark save/unsave (moderate limits to prevent abuse).

Use stricter limits for endpoints that create LLM or transcription cost.

## Media Security

- Keep Supabase Storage buckets private.
- Use short-lived signed URLs.
- Validate file type, size, and duration.
- Do not expose permanent public links for learner recordings.
- Delete abandoned temporary uploads when possible.

## Content Compliance

Forbidden content storage:

- Cambridge IELTS PDFs, scans, audio, questions, passages, and answer explanations.
- Other commercial IELTS book content.
- Copyrighted audio without explicit compatible license.

Allowed storage:

- Original platform-created resources.
- Human-reviewed LLM-generated original material.
- In-house recorded audio.
- Commercial-use TTS from original scripts.
- Licensed/public-domain audio with stored license metadata.
- External progress labels such as “Cambridge Book 5 completed” without copied content.

## Audit Logs

Create audit logs for:

- Content create/update/publish/archive actions.
- Evaluation overrides.
- Score recalculations.
- Role changes.
- Media deletion.

Audit records should include:

- Actor
- Action
- Entity type
- Entity ID
- Metadata
- Timestamp

## Score Disclaimer

All predicted scores must display this meaning:

- Practice estimate only.
- Not an official IELTS result.
- Confidence may be low, medium, or high depending on attempt completeness and data quality.
