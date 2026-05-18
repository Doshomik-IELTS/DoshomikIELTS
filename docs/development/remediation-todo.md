# Reliability, Quality, and Operations Remediation TODO

## High Priority
- [x] Use trusted authenticated actor IDs, not client-provided headers, for authenticated API rate limiting.
- [x] Apply shared query validation to all paginated/filterable API routes.
- [x] Apply shared JSON body validation to mutation routes that currently cast request bodies.
- [x] Add timeout/circuit-breaker protection to LLM provider calls.
- [x] Reuse BullMQ queue connections instead of opening a Redis connection per enqueue.
- [x] Add worker structured logging and job lifecycle error handling.
- [x] Expand `/api/health` to cover database, Redis, Strapi, and Supabase configuration.
- [x] Add container healthcheck for the Next.js app.
- [x] Add CI checks for typecheck, lint, P0 tests, build, and Prisma migrations.
- [x] Reduce Sentry PII/session replay exposure.
- [x] Validate Strapi response shapes before mapping CMS data into app DTOs.
- [x] Add Prisma indexes for core published-content, admin-listing, and learner-progress queries.

## Medium Priority
- [ ] Replace source-regex contract tests with behavior-level API tests where practical.
- [x] Validate required server environment variables centrally.
- [x] Add backup/restore runbook and restore drill checklist.
- [x] Add queue and LLM failure-mode contract tests.
- [x] Add route contract tests for invalid pagination and invalid JSON body protections.

## Low Priority
- [x] Standardize API route error logging with request context.
- [x] Consolidate repeated admin auth error handling helpers.
- [x] Add dashboard/runbook notes for Strapi sync health and content rollback.
- [x] Add `EXPLAIN ANALYZE` examples for key Prisma queries before scaling.

## Mock-Test Integrity Follow-up
- [x] Hide listening transcripts during active learner attempts.
- [x] Restore timed sections from server-side attempt state instead of resetting on refresh.
- [x] Add the missing `/api/attempts/:attemptId/time` sync route.
- [x] Persist writing and speaking section responses as first-class attempt answers.
- [x] Enforce full-mock section order in the learner UI.
- [x] Enforce full-mock section order on write/submit/evaluation APIs.
- [x] Reject late section submissions with a `TIME_EXPIRED` API error.
- [x] Fix speaking part detection to distinguish `part_1`, `part_2`, and `part_3`.
- [x] Add recorder MIME-type detection with a typed-response fallback.
- [x] Surface mock-test credit balance and start-flow error states in the learner UI.
- [x] Replace weak launch-gate smoke checks with deterministic seeded-route Playwright specs.

## Current Remaining Work
- [ ] Continue replacing the remaining source-regex contract tests with behavior-level tests where the setup cost is justified.
- [ ] Run the updated Playwright launch-gate specs in a normal local/CI browser environment and record the results.
