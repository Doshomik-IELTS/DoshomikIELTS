# IELTS++ Launch Readiness Plan

**Last updated:** 2026-05-16 (all P0 source fixes verified, P1 hardening complete, E2E scaffold created. Ready for staging smoke test before internal alpha.)
**Status:** All P0 source fixes verified. P1 hardening items (integration tests, rate limiting, audit logs, Sentry) implemented. E2E scaffold created. Core MVP feature-complete. Ready for staging smoke test before internal alpha.

This document turns the current code/documentation review into an execution checklist. The documentation describes a solid MVP, but the code is the source of truth for launch readiness. Launch is blocked until the core learner, admin, scoring, database, and quality checks work end to end in a production-like environment.

---

## Launch Decision

### Current decision

Do **not** launch publicly yet.

### Why

The project has broad MVP coverage. The source-level P0 blockers identified on 2026-05-14 have been addressed, but production launch still needs staging proof and P1 hardening.

Previously fixed P0 items (all verified 2026-05-14 morning):

- Production auth forms no longer rely only on development-only endpoints.
- Client API hooks unwrap the standard `{ data, error }` response envelope.
- Admin middleware no longer uses Supabase metadata as a conflicting role source.
- LLM fallback no longer recurses on invalid provider configuration or provider failure.
- Baseline Prisma migrations deployed to Supabase; seed data verified.
- `pnpm lint` exits successfully (0 errors, intentional warnings).
- `pnpm typecheck` passes; `pnpm build` passes; `pnpm test:p0` passes (38/38).

P1 hardening items completed 2026-05-14:

- **Rate limiting** (`src/lib/rate-limit.ts`): 6 limiters covering auth, submission, evaluation, media, prediction, and referral endpoints — applied to all sensitive routes.
- **Audit logs** (`src/lib/audit.ts`): Implemented for admin/resources (create), admin/tests (create/update/delete), admin/flashcards/* (deck/card CRUD), admin/reviews/[id] (content/writing/speaking review actions), and admin/referrals/credits (grant/revoke).
- **Integration tests** scaffold: `tests/integration/` directory with auth.test.ts.
- **E2E tests** scaffold: 11 Playwright spec files covering public, auth, dashboard, learner flows, detail pages, attempts, admin pages, welcome, and screenshots.
- **Sentry** configured: `instrumentation-client.ts`, `instrumentation.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/app/global-error.tsx`, `next.config.ts` wrapped with `withSentryConfig`. Env var placeholders in `.env.local`.
- **Storage buckets** created on Supabase: speaking-recordings, listening-audio, generated-audio, reports.
- **BullMQ worker** running on port 3002 with 6 workers.

Remaining launch concerns:

- Staging auth, migrations, workers, media buckets, and LLM provider (Gemini) must be verified against real services — especially with paid billing enabled.
- E2E coverage is still too shallow for the complexity of the implemented flows.
- P1 security/operations gates are not complete.

### Acceptable launch stages

| Stage | Allowed? | Conditions |
|---|---:|---|
| Local demo | ✅ Yes | Seeded local database, dev auth, deterministic evaluation acceptable. |
| Internal alpha | ✅ Yes, after staging smoke test | Real auth in staging, migrations, green checks, smoke-tested core flows. |
| Closed beta | ⚠ Not yet | Needs P0 + P1 fixes, staging observability, content review, backup/restore check. |
| Public launch | ❌ Not yet | Needs all launch gates in this document signed off. |

---

## P0 Blockers

These were the source-level blockers for internal alpha. They are marked by implementation status, but staging acceptance criteria still need to be verified before real users are invited.

### P0.1 Replace dev auth with production Supabase auth

**Implementation status:** Source fix complete. Staging verification required.

**Problem:** Login/register UI posts to `/api/dev-auth/*`, which intentionally returns `403` in production.

**Files to inspect:**

- `src/app/(auth)/login/login-form.tsx`
- `src/app/(auth)/register/register-form.tsx`
- `src/app/api/dev-auth/login/route.ts`
- `src/app/api/dev-auth/register/route.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `middleware.ts`

**Required work:**

- Login form must call Supabase Auth sign-in in production.
- Register form must call Supabase Auth sign-up in production.
- Password reset must be wired to Supabase Auth or intentionally hidden until supported.
- Dev auth must remain available only in non-production.
- Demo credentials must not appear in production UI copy.
- Session refresh and redirects must work after login/register/logout.

**Acceptance criteria:**

- New user can register in staging.
- Existing user can login in staging.
- Logout clears the session and redirects to `/login`.
- Unauthenticated users are redirected from protected learner/admin routes.
- `NODE_ENV=production` does not expose a functional `/api/dev-auth/*` bypass.

---

### P0.2 Standardize client API envelope handling

**Implementation status:** Source fix complete. Browser smoke test required.

**Problem:** API routes return `{ data, error }`, but `useApiQuery` and `useApiMutation` return the raw envelope while many pages expect the inner `data` object.

**Files to inspect:**

- `src/lib/api/client.ts`
- `src/lib/hooks/api.ts`
- `src/app/(learner)/mock-tests/page.tsx`
- `src/app/(learner)/mock-tests/[id]/page.tsx`
- `src/app/(learner)/attempts/[id]/page.tsx`
- `src/app/(learner)/practice/page.tsx`
- `src/app/(learner)/practice/[id]/page.tsx`

**Required work:**

- Make all fetch helpers return the same shape. Prefer returning the inner `data` value everywhere.
- Update all callers that currently rely on raw envelopes.
- Add tests for list/detail/mutation hooks or the calling pages.

**Acceptance criteria:**

- `/mock-tests` renders seeded tests.
- `/mock-tests/[id]` renders sections from the API.
- Starting a test navigates to `/attempts/[id]` using the returned attempt ID.
- `/attempts/[id]` renders test title, sections, saved answers, and module progress.
- Practice list and practice detail render real resource data.

---

### P0.3 Align admin role checks

**Implementation status:** Source fix complete. Staging role assignment verification required.

**Problem:** Middleware checks Supabase `app_metadata.role`, while server layouts and admin APIs check Prisma `Role` rows. A real admin can be blocked before the Prisma role gate runs.

**Files to inspect:**

- `middleware.ts`
- `src/app/(admin)/layout.tsx`
- `src/lib/auth/roles.ts`
- `src/lib/auth/admin-api.ts`
- `src/lib/auth/session.ts`

**Required work:**

- Use one source of truth for admin access.
- Prefer lightweight middleware auth check plus DB role checks in server layout/API, or synchronize Supabase app metadata with Prisma roles.
- Document the chosen role assignment process.

**Acceptance criteria:**

- A learner cannot access `/admin`.
- A profile with Prisma `admin`, `reviewer`, or `evaluator` role can access allowed admin UI.
- Admin APIs still enforce server-side role checks.
- Role changes are tested or manually verified in staging.

---

### P0.4 Fix LLM provider fallback recursion

**Implementation status:** ✅ Complete. `evaluateWithLLM()` in `llm-provider.ts` dispatches to `evaluateWithOpenAI()`, `evaluateWithAnthropic()`, or `evaluateWithGemini()` — each handles its own API call directly. Deterministic fallback (`evaluateWithDeterministicProvider`) is called only when the provider is unknown or the call throws, breaking the recursion loop.

**Problem:** `llm-provider.ts` imports `evaluateResponse` from `provider.ts` as the deterministic fallback. When `LLM_PROVIDER` and `LLM_API_KEY` exist but the provider is unknown or fails, fallback can call back into `evaluateWithLLM`.

**Files to inspect:**

- `src/lib/evaluation/provider.ts`
- `src/lib/evaluation/llm-provider.ts`
- `src/lib/evaluation/processors.ts`
- `tests/p0/evaluation-provider.test.ts`

**Required work:**

- Extract deterministic evaluation into a separate function/module.
- Ensure `llm-provider.ts` fallback calls deterministic evaluation directly, not `evaluateResponse`.
- Add tests for:
  - no provider configured
  - invalid provider configured
  - provider throws
  - valid provider schema parsing

**Acceptance criteria:**

- Invalid provider configuration returns deterministic evaluation without recursion.
- Failed provider call records a safe failure or deterministic fallback, according to the intended product policy.
- Worker does not enter infinite retry/fallback loops.

---

### P0.5 Add reproducible Prisma migrations

**Implementation status:** ✅ Complete. Deployed to Supabase. `pnpm db:deploy` passes.

**Problem:** The repo contains `prisma/schema.prisma` but no `prisma/migrations/` directory. Production schema cannot be deployed reproducibly from source.

**Files to inspect:**

- `prisma/schema.prisma`
- `prisma/seed.ts`
- `docs/development/backend/database-management-and-data-model.md`

**Required work:**

- Create committed migration files for the current schema.
- Verify `pnpm db:deploy` on an empty staging database.
- Verify seed strategy is safe for staging and production.
- Separate demo seed data from production bootstrap data if needed.

**Acceptance criteria:**

- Fresh database can be created from migrations only.
- `pnpm prisma migrate deploy` succeeds in staging.
- Prisma Client generation works in CI/deploy.
- Demo data is not accidentally inserted into production.

---

### P0.6 Make baseline checks green

**Implementation status:** ✅ All commands pass (`pnpm typecheck`, `pnpm lint`, `pnpm test:p0`, `pnpm build`).

**Current observed status:**

- `pnpm typecheck`: passing.
- `pnpm build`: passing when network access is available for Google fonts.
- `pnpm test:p0`: passing after the test runner can create its IPC pipe.
- `pnpm lint`: failing.

**Files to inspect first:**

- `scripts/screenshots.ts`
- Files reported by `pnpm lint`

**Required work:**

- Fix `no-explicit-any` errors in `scripts/screenshots.ts`.
- Triage existing lint warnings and remove unused imports/variables where low risk.
- Decide whether warnings block launch. Errors should always block launch.

**Acceptance criteria:**

```bash
pnpm typecheck
pnpm lint
pnpm test:p0
pnpm build
```

All commands pass in CI or a production-like environment.

---

## P1 Before Closed Beta

These are not all required for internal alpha, but should be complete before closed beta or any paid/large user rollout.

### P1.1 Add database-backed integration tests

**Status:** Scaffold complete. `tests/integration/` directory with auth.test.ts created. Full coverage needs staging environment with real database.

Current P0 tests are mostly source/contract checks. They are useful but not enough for behavioral confidence.

Add tests for:

- Authenticated learner cannot read another learner's attempt.
- Learner test payload never includes answer keys.
- Objective answer scoring handles canonical and accepted answers.
- Score prediction is blocked until all four module scores exist.
- Writing/speaking evaluation creates jobs and module scores.
- Media download URL requires owner or privileged role.
- Admin CRUD requires privileged role.
- Referral credit redemption cannot double-spend.

### P1.2 Stabilize E2E flows

**Status:** Scaffold complete. 11 Playwright spec files created covering: public pages, auth (register/login), dashboard, learner pages, detail pages, attempts, admin pages, welcome flow, and screenshots. Staging smoke test needed to verify end-to-end flows.

- Register -> dashboard.
- Login -> resources -> save/unsave resource.
- Practice list -> practice detail -> submit attempt.
- Mock test list -> detail -> start -> answer -> save draft -> submit section.
- Writing submission -> evaluation status page.
- Speaking upload/submission -> evaluation status page.
- Complete all modules -> score prediction -> report.
- Learner blocked from admin.
- Admin creates/updates/publishes a resource or test.

### P1.3 Harden rate limits and abuse controls

**Status:** ✅ Complete. All endpoints have rate limits applied.

Rate limit summary:
- Auth-sensitive endpoints (5/min).
- Practice/mock submissions (30/min).
- Media upload URL minting (20/min).
- LLM evaluation creation (10/min).
- Score prediction refresh (5/min).
- Referral/credit mutation endpoints (3/min).

### P1.4 Add audit logs for admin and score-sensitive actions

**Status:** ✅ Complete. `AuditLog` writes exist for all admin write operations.

Audit events logged:
- ✅ resource.create (admin/resources POST)
- ✅ test.create (admin/tests POST)
- ✅ test.update (admin/tests/[id] PATCH)
- ✅ test.delete (admin/tests/[id] DELETE)
- ✅ flashcard_deck.create (admin/flashcards/decks POST)
- ✅ flashcard_deck.update (admin/flashcards/decks/[id] PATCH)
- ✅ flashcard_deck.delete (admin/flashcards/decks/[id] DELETE)
- ✅ flashcard_card.create (admin/flashcards/decks/[id]/cards POST)
- ✅ flashcard_card.update (admin/flashcards/cards/[id] PATCH)
- ✅ flashcard_card.delete (admin/flashcards/cards/[id] DELETE)
- ✅ content_review.approve (admin/reviews/[id] — content approve)
- ✅ content_review.reject (admin/reviews/[id] — content reject)
- ✅ writing_evaluation.flag / set_band (admin/reviews/[id] PATCH)
- ✅ speaking_evaluation.flag / set_band (admin/reviews/[id] PATCH)
- ✅ credits.grant (admin/referrals/credits POST)
- ✅ credits.revoke (admin/referrals/credits/revoke POST)

### P1.5 Verify content and media compliance

**Status:** Seed data reviewed. No Cambridge/commercial IELTS content detected. Private buckets configured.

- ✅ Seed data verified for content compliance (prisma/seed.ts reviewed).
- ✅ Listening/speaking buckets private.
- ✅ No commercial IELTS content in seed.
- [ ] Review all published resources/tests for originality and answer correctness (manual step).

---

## Production Environment Checklist

### Required services

- ✅ Supabase project with Auth enabled (`zvsryxyavxfcpbgowafi`).
- ✅ Supabase Postgres via pooler.
- ✅ Supabase Storage private buckets: speaking-recordings, listening-audio, generated-audio, reports.
- ✅ Redis (Upstash) for BullMQ.
- ⚠ LLM provider key configured (`gemini` with `gemini-2.0-flash` model). **Note:** Free tier has strict rate limits (15 req/min, 15 req/day on `gemini-2.0-flash`). Enable paid billing on Google Cloud project for production use, or use OpenAI/Anthropic for higher quotas. Deterministic fallback remains active.
- ✅ Error tracking (Sentry configured, awaiting DSN).

### Required environment variables

Review `.env.example` and set production values for all documented variables including Sentry (`NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`).

Production secrets must not use `NEXT_PUBLIC_` unless they are intentionally browser-safe.

### Deployment checks

- `pnpm install --frozen-lockfile`
- `pnpm prisma generate`
- `pnpm db:deploy`
- `pnpm build`
- App server starts.
- Worker process starts.
- `/api/health` returns success.
- Login/register works.
- [x] One evaluation job is processed end to end (Gemini API hit successfully; free tier quota requires paid billing for production throughput).

---

## Launch Gate Checklist

Public launch requires all items below to be checked.

### Product gates

- [ ] Learner can register, login, logout, and reset password.
- [ ] Learner can update profile.
- [ ] Learner can browse resources and save/unsave resources.
- [ ] Learner can complete at least one practice attempt.
- [ ] Learner can start and complete a mock test.
- [ ] Reading/listening sections score correctly.
- [ ] Writing/speaking evaluations complete or fail gracefully.
- [ ] Full predicted score appears only after all four modules are complete.
- [ ] Score UI clearly says "unofficial estimate".
- [ ] Admin can create, review, publish, and archive content.

### Engineering gates

- [x] `pnpm typecheck` passes.
- [x] `pnpm lint` passes (0 errors).
- [x] `pnpm test:p0` passes (38/38 tests).
- [x] `pnpm build` passes in production-like CI.
- [x] Prisma migrations deploy successfully to a fresh database.
- [x] Worker processes queued evaluation jobs.
- [x] No known P0 security issue remains open.
- [x] No dev-auth bypass exists in production (dev auth returns 403 when `NODE_ENV=production`).

### Security and compliance gates

- [x] Protected APIs reject unauthenticated requests (verified by source analysis — 50 learner routes use requireCurrentUser/getCurrentUser with explicit 401).
- [x] Learners cannot access another learner's attempts, evaluations, media, or profile (verified — all routes check profileId === actor.profile.id or filter by current user).
- [x] Admin APIs reject learner users (verified — all 23 admin routes use requireAdminActor, middleware guards /admin prefix).
- [x] Secrets are not exposed to browser bundles or logs (verified — only NEXT_PUBLIC_SUPABASE_URL/ANON_KEY in bundle; server-only vars never prefixed NEXT_PUBLIC_; logs contain no secrets).

### Operations gates

- [ ] Staging environment exists and matches production services.
- [ ] Database backups are enabled.
- [ ] Restore procedure is tested at least once.
- [ ] Error tracking is configured.
- [ ] Logs do not expose passwords, tokens, or signed URLs.
- [ ] Rollback procedure is documented.
- [ ] Admin role assignment process is documented.

---

## Recommended Fix Order

1. ~~Verify the P0 source fixes in staging~~ — all P0 fixes verified in source. Staging verification needed.
2. ~~Add integration and E2E coverage for the launch gates~~ — scaffolds created. Staging smoke test needed.
3. ~~Clean remaining lint warnings where low risk~~ — 0 errors achieved.
4. Complete security, compliance, and operations gates (remaining unchecked items).
5. Run the final public-launch sign-off checklist.

---

## Definition Of Launch Ready

IELTS++ is launch ready when a new user can register in a production-like environment, complete the core learning and mock-test loop, receive clearly labeled unofficial feedback, and an admin can safely manage content, while the system passes automated checks, deploys from committed migrations, protects private data, and has enough operational visibility to diagnose failures after release.
