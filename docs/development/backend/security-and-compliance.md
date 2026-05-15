# Security And Compliance

## Authentication

Use Supabase Auth as the identity provider.

Backend route handlers must:

- Validate the Supabase session.
- Resolve authenticated user ID.
- Load app profile and roles.
- Reject unauthenticated requests with `401`.

**Development Auth:** For local development, use `/api/dev-auth/login`, `/api/dev-auth/register`, and `/api/dev-auth/logout` endpoints. These are for development only and should not be exposed in production.

**Session Validation:** Implemented via `src/lib/auth/session.ts`:
- `getCurrentUser()` — returns user + profile (supports dev-auth when `NODE_ENV !== "production"`)
- `requireCurrentUser()` — throws "UNAUTHENTICATED" if no session
- Auto-creates `Profile` with `learner` role on first Supabase Auth access

## Current Implementation Status

- **Auth Handlers:** Dev auth endpoints implemented in `src/app/api/dev-auth/`
- **Session Validation:** Via `src/lib/auth/session.ts` — `getCurrentUser()`, `requireCurrentUser()`
- **Role Checks:** Via `src/lib/auth/roles.ts` — `canAccessAdminRoutes()`, `hasRole()`
- **Admin API Auth:** Via `src/lib/auth/admin-api.ts` — `requireAdminActor()`
- **Admin Layout:** `(admin)/layout.tsx` enforces role-based access (admin/reviewer/evaluator only)
- **Rate Limiting:** Fully implemented via Redis-backed rate limiter (`src/lib/rate-limit.ts`)

## Authorization

Roles:

- `learner`: access own profile, resources, attempts, scores, and media.
- `admin`: manage content, users, tests, questions, and reviews.
- `reviewer`: review generated/imported content.
- `evaluator`: review flagged writing/speaking evaluations.

**Admin access roles:** `admin`, `reviewer`, `evaluator` (defined in `ADMIN_ACCESS_ROLES`).

Admin routes require `requireAdminActor()` check which verifies the user has an admin-access role.

Rules:

- Learners can only access their own attempts and private media.
- Admin/reviewer/evaluator routes require explicit role checks.
- Answer keys must never be returned through learner test APIs.

## Rate Limiting

Rate limiting is implemented via `src/lib/rate-limit.ts` using Redis (ioredis).

### Implementation

- Uses Redis `INCR` + `TTL` atomic operations with multi/exec
- Graceful degradation: if Redis is unavailable, requests are allowed
- Returns standard 429 response with `Retry-After`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers
- IP extraction from `x-forwarded-for` or `x-real-ip` headers

### Active Rate Limiters

| Limiter | Max Requests | Window | Key Prefix | Applied To |
|---|---|---|---|---|
| `authRateLimiter` | 5 | 60s | `rl:auth` | Auth endpoints |
| `submissionRateLimiter` | 30 | 60s | `rl:submit` | Practice/mock submissions |
| `evaluationRateLimiter` | 10 | 60s | `rl:eval` | Writing/speaking evaluation |
| `mediaRateLimiter` | 20 | 60s | `rl:media` | Media signed URL creation |
| `predictionRateLimiter` | 5 | 60s | `rl:pred` | Score prediction |
| `referralRateLimiter` | 3 | 60s | `rl:refer` | Referral actions |

Stricter limits are applied to endpoints that create LLM or transcription cost.

## Media Security

- Keep Supabase Storage buckets private.
- Use short-lived signed URLs (default TTL: 900 seconds / 15 minutes).
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
- External progress labels such as "Cambridge Book 5 completed" without copied content.

## Audit Logs

Create audit logs for:

- Content create/update/publish/archive actions.
- Evaluation overrides.
- Score recalculations.
- Role changes.
- Media creation/update/deletion.
- Question group creation.

Audit records include:

- Actor (`actorProfileId`)
- Action
- Entity type
- Entity ID
- Metadata (JSON)
- Timestamp

## Score Disclaimer

All predicted scores must display this meaning:

- Practice estimate only.
- Not an official IELTS result.
- Confidence may be low, medium, or high depending on attempt completeness and data quality.
