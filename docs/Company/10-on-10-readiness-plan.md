# DOshomik IELTS Road To 10/10

<!-- Last Updated: 2026-05-19 — Expanded with principal-engineer concerns around transactional integrity, provider fallback, content consistency, and health modeling. -->

## Purpose

This document defines what must be true before DOshomik IELTS can honestly be rated `10/10` for paid-beta readiness.

Current state after the latest cross-functional re-review: `8.5/10`.

This is not a bug list. It is a release-quality standard covering product trust, assessment integrity, testing, operations, security, and delivery discipline.

## What 10/10 Means

`10/10` does **not** mean "perfect" or "no future work". It means:

- core learner flows are reliable and covered end to end
- learner-facing scoring and feedback are trustworthy
- draft or unsafe content cannot leak to learners
- production deploys are observable, reversible, and low-drama
- security controls are enforced consistently, not selectively
- release confidence comes from automation and evidence, not manual optimism

If any of those are still dependent on tribal knowledge, manual heroics, or unverified assumptions, the product is not `10/10`.

## Current Rating

### Now: 8.5/10

What is already true:

- the original launch blockers from the cross-functional review were fixed
- `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `pnpm test:p0` pass
- speaking audio-only submissions no longer produce unsafe automated scores
- resource detail/save flows are coherent across Prisma and Strapi-backed content
- worker health checks now reflect worker reality instead of web-server presence
- CSRF coverage across mutating routes is materially stronger

What still keeps the product below `10/10`:

- the full Playwright release gate was not rerun in this pass
- paid flows and attempt creation still need stronger transactional and idempotency guarantees
- production LLM/provider failure handling still needs a fail-closed or clearly degraded learner-safe mode
- transcriptless speaking submissions are safe, but the full transcript-to-review lifecycle is not yet proven end to end
- the mock-test content model still has consistency risk between live Strapi reads and local runtime snapshots
- app health and container health are still too coupled to optional or separate subsystems
- operational readiness still has gaps in observability, alerting, and deployment discipline
- assessment quality is safer, but still needs stronger regression proof and reviewer calibration

## Non-Negotiable Exit Criteria

DOshomik IELTS cannot be called `10/10` until **all** of the following are true:

1. Full release automation passes in CI:
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm build`
   - `pnpm test:p0`
   - `pnpm test:e2e`

2. Critical learner journeys are covered end to end:
   - auth and dashboard access
   - mock test start -> answer persistence -> section submit -> report
   - writing evaluation creation -> queue -> result visibility
   - speaking recording upload -> transcript/review state -> result visibility
   - resource list -> detail -> save/unsave

3. Paid and state-changing flows are transactional and idempotent:
   - mock-test start cannot charge twice or create duplicate active attempts under concurrency
   - state is not left half-written when credits, attempts, submissions, or evaluations fail mid-flight
   - retrying browser requests or queue work cannot silently duplicate learner-visible effects

4. Learner-facing score trust is enforceable:
   - no speaking band is shown before a scorable transcript or a human-reviewed score exists
   - provider outages or misconfiguration do not silently fall back to heuristic scoring in production
   - unofficial score prediction rules remain enforced
   - manual review actions update downstream reporting correctly

5. Content publication boundaries are fail-closed:
   - Strapi drafts cannot appear in learner routes
   - unpublished imports cannot be materialized as live learner content
   - learner-visible content and attempt runtime snapshots do not drift silently apart
   - content licensing and attribution metadata are auditable

6. Production operations are release-grade:
   - liveness, readiness, and cross-service health are intentionally separated
   - health checks reflect real dependencies without making unrelated services look dead
   - failed jobs and stuck jobs are visible
   - deploy rollback is documented and tested
   - Sentry/source maps and environment validation are working in CI/CD

7. Security controls are systematic:
   - mutating routes enforce CSRF
   - admin/reviewer boundaries are tested
   - uploads enforce ownership, size, type, and purpose constraints
   - logs and analytics avoid learner-sensitive payload leakage

## Workstreams

### 1. Full Release Gate Automation

#### Goal

Make release confidence come from CI, not from a local spot check.

#### Required Work

- run the full Playwright suite and fix failures or flake
- require `lint`, `typecheck`, `build`, `test:p0`, and `test:e2e` on every merge
- add a Docker/Compose smoke test covering `app`, `worker`, `db`, `redis`, and optional `strapi`
- add a staging smoke test that verifies login, dashboard, resource detail, mock-test launch, and health endpoint behavior
- document the exact release gate in one place

#### Owners

- Primary: `QA Lead`, `DevOps/SRE`
- Supporting: `Lead Frontend`, `Lead Backend`, `CTO`

#### Evidence Needed

- green CI runs on main and release branches
- no flaky test exceptions for critical-path suites
- a documented release checklist referencing the required commands

#### Exit Criteria

- a release candidate can be accepted or rejected by CI output alone

### 2. Transactional Integrity For Paid And Core State Flows

#### Goal

Ensure the product never charges, starts, submits, or evaluates in a half-complete or duplicate state.

#### Required Work

- make mock-test start atomic across credit redemption, referral side effects, and attempt creation
- add a database-level guard preventing duplicate active attempts for the same learner and test
- add concurrency tests for double-click, retry, and multi-tab start behavior
- review submission and evaluation flows for queue-enqueue-after-commit failure windows
- make browser retries and worker retries idempotent on all critical learner state transitions

#### Owners

- Primary: `Lead Backend`
- Supporting: `QA Lead`, `Product Manager`, `CTO`

#### Evidence Needed

- concurrency tests showing one charge and one open attempt under parallel requests
- explicit idempotency behavior documented for start, submit, and evaluation creation
- failure-injection validation proving no half-written paid flow remains after mid-flight errors

#### Exit Criteria

- no core learner flow can charge twice, create duplicate active work, or leave inconsistent paid state under retry or race conditions

### 3. Speaking Lifecycle Completeness

#### Goal

Move from "safe fallback" to a fully trustworthy speaking pipeline.

#### Required Work

- implement the actual transcription path or remove/hide learner audio mode until it exists
- automatically re-queue speaking evaluation when a transcript becomes available
- show explicit learner states:
  - `Recording received`
  - `Transcript pending`
  - `Under review`
  - `Scored`
- ensure transcriptless audio never renders a band in reports or prediction flows
- alert admins or reviewers on aged `needs_review` / `pending transcript` items
- prove manual review updates attempt completion and learner-facing reporting

#### Owners

- Primary: `Lead Backend`, `Assessment & Content Integrity Lead`
- Supporting: `Lead Frontend`, `QA Lead`, `Product Manager`

#### Evidence Needed

- passing P0 and E2E coverage for audio-only, transcript-ready, and manual-review scenarios
- screenshots or recordings of learner-facing pending states
- reviewer flow validation showing downstream report correctness

#### Exit Criteria

- every speaking submission ends in a deterministic, visible, and auditable state

### 4. Assessment Quality And Trust Governance

#### Goal

Prove that scores and feedback are not just technically delivered, but educationally defensible.

#### Required Work

- add golden fixtures for writing and speaking evaluations
- detect regression in band calculations, rubric fields, feedback shape, and disclaimer presence
- fail closed, or visibly degrade, when the configured production LLM provider is unavailable
- prevent silent production fallback from provider-backed scoring to deterministic heuristic scoring
- define reviewer calibration checks for manual overrides
- record why and when a human changed a band
- review learner-facing copy for score disclaimers, confidence framing, and review-state language

#### Owners

- Primary: `Assessment & Content Integrity Lead`
- Supporting: `Product Manager`, `Lead Backend`, `QA Lead`

#### Evidence Needed

- versioned golden test fixtures
- provider-outage tests proving learners do not receive authoritative-looking heuristic scores in production mode
- manual review audit trail fields and validation
- approved learner-facing copy for feedback and score explanations

#### Exit Criteria

- rubric-driven outputs and human overrides are both testable and reviewable

### 5. Content Governance And Publication Safety

#### Goal

Guarantee that content delivery is deliberate, licensed, and publication-safe.

#### Required Work

- add explicit tests for Strapi published vs draft behavior
- verify learner routes only expose published resources and tests
- define one coherent source-of-truth rule for learner-facing mock tests versus local runtime snapshots
- version and refresh local snapshots so published CMS changes do not silently serve stale learner attempts
- ensure already-published learner content remains available even if Strapi is temporarily unavailable
- document content import rules for Prisma materialization
- audit licensing and attribution metadata requirements for audio and authored resources
- define rollback behavior for bad content publishes

#### Owners

- Primary: `Assessment & Content Integrity Lead`, `Security Engineer`
- Supporting: `Lead Backend`, `DevOps/SRE`, `Product Manager`

#### Evidence Needed

- integration tests for published-only filtering
- a documented publication checklist
- sample audit output for licensed content metadata

#### Exit Criteria

- a draft, unlicensed, or unstable content item cannot silently become learner-visible

### 6. Operations, Observability, And Recovery

#### Goal

Make production problems fast to detect, easy to explain, and recoverable without guesswork.

#### Required Work

- configure Sentry auth token and source-map upload in CI
- split web liveness/readiness from whole-system dependency health
- ensure optional services such as Strapi do not make the web app container unhealthy by default
- define alerts for:
  - health endpoint degradation
  - worker down
  - Redis unavailable
  - queue backlog growth
  - failed job spikes
  - aged review/transcript backlog
- add alerts for stuck queued evaluations and failed enqueue paths
- document queue replay and dead-letter handling
- prove backup and restore for database-critical learner data
- run one rollback and one recovery drill

#### Owners

- Primary: `DevOps/SRE`
- Supporting: `CTO`, `Lead Backend`

#### Evidence Needed

- alert definitions or dashboards
- runbook references for incident response and rollback
- restore test evidence from non-production data

#### Exit Criteria

- the team can detect, triage, and reverse a bad release without improvisation

### 7. Security And Privacy Hardening

#### Goal

Ensure security posture is enforced by design and verified by tests.

#### Required Work

- add explicit automated tests for CSRF enforcement on representative mutating routes
- verify admin/reviewer/learner boundaries on sensitive endpoints
- audit upload and download routes for ownership, token scope, and content restrictions
- review logs, Sentry payloads, and analytics events for learner writing/audio leakage
- run dependency and config hygiene checks in CI

#### Owners

- Primary: `Security Engineer`
- Supporting: `Lead Backend`, `QA Lead`, `DevOps/SRE`

#### Evidence Needed

- security contract tests
- sanitized observability payload examples
- CI output from dependency/config validation

#### Exit Criteria

- a release does not rely on manual memory for basic safety controls

### 8. Frontend Quality, Accessibility, And Mobile Confidence

#### Goal

Ensure the learner experience is resilient on real devices and in high-friction states.

#### Required Work

- run mobile-focused checks for timed sections, audio controls, and submission states
- verify keyboard and screen-reader basics on auth, resources, practice, and attempts
- cover loading, empty, pending-review, and retry states visibly and consistently
- reduce brittle selectors in E2E tests where needed

#### Owners

- Primary: `Lead Frontend`, `UX/Design Lead`
- Supporting: `QA Lead`, `Product Manager`

#### Evidence Needed

- Playwright coverage for mobile-critical paths
- manual accessibility spot checks or automated accessibility assertions
- screenshots for empty/error/pending states

#### Exit Criteria

- the product remains understandable and operable under real learner conditions

### 9. Release Process And Decision Discipline

#### Goal

Make the `10/10` rating a controlled decision, not a vibe.

#### Required Work

- define a single launch-gate template for release approval
- require explicit sign-off from:
  - `QA Lead`
  - `Lead Backend`
  - `Lead Frontend`
  - `Security Engineer`
  - `DevOps/SRE`
  - `Assessment & Content Integrity Lead`
  - `Product Manager`
  - `CTO`
- capture open risks, accepted debt, and rollback owner before release
- store evidence links with each release candidate

#### Owners

- Primary: `CTO`, `Product Manager`
- Supporting: all leads

#### Evidence Needed

- completed launch-gate brief
- linked CI runs, screenshots, logs, and any approved risk acceptances

#### Exit Criteria

- a release decision can be audited after the fact with evidence

## Recommended Implementation Order

Do the work in this order:

1. `Full Release Gate Automation`
2. `Transactional Integrity For Paid And Core State Flows`
3. `Assessment Quality And Trust Governance`
4. `Speaking Lifecycle Completeness`
5. `Operations, Observability, And Recovery`
6. `Content Governance And Publication Safety`
7. `Security And Privacy Hardening`
8. `Frontend Quality, Accessibility, And Mobile Confidence`
9. `Release Process And Decision Discipline`

Reason:

- the first four items most directly affect whether the current product is safe to charge for and safe to trust
- operations and content work convert "working most of the time" into a stable release posture
- the final items make the rating durable instead of temporary

## Rating Ladder

Use this ladder to avoid inflating the score:

### 9.0/10

- full Playwright release gate passes
- paid start and submission flows are transactionally safe under retry and concurrency
- major critical-path E2E coverage exists
- no known learner-facing blocker remains

### 9.5/10

- provider degradation is fail-closed or explicitly learner-safe
- speaking transcript/review lifecycle is complete
- observability and rollback are operationally real
- assessment regression coverage is in place

### 10/10

- all non-negotiable exit criteria are satisfied
- release evidence is captured in CI and docs
- the product can be shipped without relying on manual heroics

## Definition Of Done

This document is complete only when every workstream above is either:

- done with evidence attached, or
- explicitly deferred with owner, reason, and score impact recorded

Until then, `10/10` should be treated as a target state, not a claim.
