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
- [ ] Standardize API route error logging with request context.
- [ ] Consolidate repeated admin auth error handling helpers.
- [x] Add dashboard/runbook notes for Strapi sync health and content rollback.
- [x] Add `EXPLAIN ANALYZE` examples for key Prisma queries before scaling.
