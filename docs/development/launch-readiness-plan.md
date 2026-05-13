# IELTS++ Launch Readiness Plan

**Last updated:** 2026-05-14  
**Status:** P0 code blockers addressed in source. Not public-launch ready until staging verification, P1 hardening, and launch gates are signed off.

This document turns the current code/documentation review into an execution checklist. The documentation describes a solid MVP, but the code is the source of truth for launch readiness. Launch is blocked until the core learner, admin, scoring, database, and quality checks work end to end in a production-like environment.

---

## Launch Decision

### Current decision

Do **not** launch publicly yet.

### Why

The project has broad MVP coverage. The source-level P0 blockers identified on 2026-05-14 have been addressed, but production launch still needs staging proof and P1 hardening.

Previously fixed P0 items:

- Production auth forms no longer rely only on development-only endpoints.
- Client API hooks unwrap the standard `{ data, error }` response envelope.
- Admin middleware no longer uses Supabase metadata as a conflicting role source.
- LLM fallback no longer recurses on invalid provider configuration or provider failure.
- A baseline Prisma migration exists.
- `pnpm lint` exits successfully.

Remaining launch concerns:

- Staging auth, migrations, workers, media buckets, and LLM provider must be verified against real services.
- E2E coverage is still too shallow for the complexity of the implemented flows.
- P1 security/operations gates are not complete.

### Acceptable launch stages

| Stage | Allowed? | Conditions |
|---|---:|---|
| Local demo | Yes | Seeded local database, dev auth, deterministic evaluation acceptable. |
| Internal alpha | Yes, after staging smoke test | Real auth in staging, migrations, green checks, smoke-tested core flows. |
| Closed beta | Not yet | Needs P0 + P1 fixes, staging observability, content review, backup/restore check. |
| Public launch | Not yet | Needs all launch gates in this document signed off. |

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

**Implementation status:** Source fix complete and covered by P0 tests.

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

**Implementation status:** Baseline migration added. `migrate deploy` still needs to be run against an empty staging database.

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

**Implementation status:** Commands pass by exit code. Existing lint warnings remain and should be cleaned before closed beta.

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

Add Playwright flows against a seeded staging-like database:

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

Implement or explicitly defer with risk acceptance:

- Auth-sensitive endpoints.
- Practice/mock submissions.
- Media upload URL minting.
- LLM evaluation creation.
- Score prediction refresh.
- Referral/credit mutation endpoints.

### P1.4 Add audit logs for admin and score-sensitive actions

The schema includes `AuditLog`, but launch-sensitive actions should actually write audit rows.

Audit at minimum:

- Resource/test publish/archive.
- Admin create/update/delete.
- Evaluation review/action.
- Score recalculation.
- Credit grant/revoke.
- Media delete if implemented.

### P1.5 Verify content and media compliance

Before beta:

- Confirm no Cambridge/commercial IELTS content is seeded or published.
- Require license metadata for listening uploads.
- Keep listening buckets and speaking recording buckets private.
- Review all published resources/tests for originality and answer correctness.

---

## Production Environment Checklist

### Required services

- Supabase project with Auth enabled.
- Supabase Postgres or compatible PostgreSQL database.
- Supabase Storage private buckets:
  - `speaking-recordings`
  - `listening-audio`
- Redis instance for BullMQ.
- LLM provider key if production AI scoring is enabled.
- Error tracking service, preferably Sentry or equivalent.

### Required environment variables

Review `.env.example` and set production values for:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `DIRECT_URL`
- `REDIS_URL`
- `LLM_PROVIDER`
- `LLM_API_KEY`
- `LLM_MODEL_WRITING`
- `LLM_MODEL_SPEAKING`
- `MAX_SPEAKING_AUDIO_MB`
- `MAX_SPEAKING_AUDIO_SECONDS`
- `SIGNED_URL_TTL_SECONDS`

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
- One evaluation job is processed end to end.

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

- [ ] `pnpm typecheck` passes.
- [ ] `pnpm lint` passes.
- [ ] `pnpm test:p0` passes.
- [ ] `pnpm build` passes in production-like CI.
- [ ] Prisma migrations deploy successfully to a fresh database.
- [ ] Worker processes queued evaluation jobs.
- [ ] No known P0 security issue remains open.
- [ ] No dev-auth bypass exists in production.

### Security and compliance gates

- [ ] Protected APIs reject unauthenticated requests.
- [ ] Learners cannot access another learner's attempts, evaluations, media, or profile.
- [ ] Admin APIs reject learner users.
- [ ] Learner-facing test APIs do not return answer keys.
- [ ] Private media uses signed URLs only.
- [ ] Rate limits exist or risk acceptance is documented.
- [ ] Production buckets are private.
- [ ] Published content is original, licensed, or public-domain-valid.
- [ ] Secrets are not exposed to browser bundles or logs.

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

1. Verify the P0 source fixes in staging: auth, API pages, admin access, evaluation fallback, and migration deploy.
2. Add integration and E2E coverage for the launch gates.
3. Clean remaining lint warnings where low risk.
4. Complete security, compliance, and operations gates.
5. Run the final public-launch sign-off checklist.

---

## Definition Of Launch Ready

IELTS++ is launch ready when a new user can register in a production-like environment, complete the core learning and mock-test loop, receive clearly labeled unofficial feedback, and an admin can safely manage content, while the system passes automated checks, deploys from committed migrations, protects private data, and has enough operational visibility to diagnose failures after release.
