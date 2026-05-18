# IELTS++ Review Playbook

<!-- Last Updated: 2026-05-19 — Added Review Retrospective section for feedback loop and system improvement. -->

Use this playbook with every company role profile in this directory. It keeps reviews consistent, evidence-based, and useful for implementation.

## Review Principles

- Findings first. Lead with bugs, risks, regressions, missing tests, trust gaps, or product issues.
- Be specific. Cite files, routes, endpoints, data models, commands, screenshots, or user flows.
- Separate evidence from inference. Say when something is reproduced, directly observed, inferred from code shape, or still unverified.
- Prioritize by user, business, and operational impact, not personal preference.
- Recommend the smallest change that meaningfully reduces the risk.
- Respect the existing architecture unless the architecture is the problem under review.
- For Next.js work, check this project's installed documentation under `node_modules/next/dist/docs/` before giving framework-specific guidance.
- Do not bury blockers in summaries. Critical and High findings must appear before general commentary.
- **Never reproduce secrets, tokens, passwords, API keys, or learner PII in review output.** Use `[REDACTED]` or describe the class of value without echoing it.

## Review Preflight

Before reviewing, the agent should:

1. Confirm the review mode: launch gate, targeted review, architecture review, audit, or re-review.
2. Inspect the actual target files, routes, docs, or tests instead of relying on repo assumptions.
3. Note missing evidence up front if logs, screenshots, metrics, or repro steps are absent.
4. Read repo docs that materially affect the target:
   - [../../README.md](../../README.md)
   - [../development/content/content-strategy.md](../development/content/content-strategy.md)
   - [../development/evaluation-methods.md](../development/evaluation-methods.md)
5. Call out whether the recommendation is for MVP launch, paid beta, scale, compliance, or cleanup.

## Severity Rubric

| Severity | Meaning | Examples |
|---|---|---|
| Critical | Blocks release, exposes sensitive data, loses learner data, breaks a core attempt/evaluation flow, or creates an exploitable production risk. | Auth bypass, answer or score loss, payment or data leak, production deploy with no rollback, draft content exposed as live content. |
| High | Likely user-visible failure, serious operational risk, significant accessibility failure, or major trust issue that should be fixed before shipping broadly. | Mock test cannot complete on mobile, missing authZ on admin route, unreliable writing retry flow, score prediction shown without all modules complete. |
| Medium | Meaningful maintainability, UX, performance, analytics, or test gap that should be scheduled soon. | Duplicated validation, weak empty states, inefficient query on a growing table, missing queue metric. |
| Low | Local polish, minor consistency issue, or improvement with limited user or business impact. | Naming cleanup, visual inconsistency, optional refactor, extra helper extraction. |

## Evidence Labels

Use these labels explicitly when helpful:

- **Observed**: directly seen in code, UI, logs, docs, or output.
- **Reproduced**: confirmed through a command, test, or manual flow.
- **Inferred**: likely based on code shape, but not executed or observed end-to-end.
- **Missing evidence**: information required to confirm priority or scope is unavailable.

Do not present inferred issues as confirmed behavior.

## Evidence Standard

Every material finding should include:

- **Where**: file path plus line number when code is involved, or route/endpoint/flow/doc when it is not.
- **Impact**: what user, operator, editor, or business outcome is affected.
- **Why now**: release blocker, paid-beta risk, scale concern, compliance issue, or cleanup candidate.
- **Evidence**: observed, reproduced, inferred, or explicitly missing.
- **Fix**: concrete implementation, decision, or test to add.
- **Validation**: command, manual flow, metric, or acceptance criterion that proves the fix.

When evidence is incomplete, say what is missing and how to obtain it.

## Repo-Specific Risk Checklist

Agents should actively check for these IELTS++ risks when relevant:

- Content licensing: no Cambridge-book reproduction, close paraphrase, unlicensed hosted audio, or missing attribution metadata.
- Evaluation trust: writing and speaking feedback must be rubric-based, qualified, and reviewable when confidence is low.
- Score prediction safety: learner-facing predictions must remain unofficial estimates and require all four modules when that rule applies.
- Attempt persistence: learners should not lose work on refresh, navigation, upload retry, or slow network transitions.
- Auth and ownership: attempts, media, reviews, credits, referrals, and admin routes need correct owner and role checks.
- Content publication boundaries: Strapi draft state, review queues, and runtime snapshots must prevent learner exposure to unstable or draft content.
- Upload safety: media metadata, signed URLs, content type, size limits, and storage permissions should be explicit.
- Queue reliability: retries, idempotency, dead-letter handling, and replay safety matter for evaluation jobs and sync work.
- Analytics and privacy: PostHog, Sentry, and logs should not leak learner writing, audio, or sensitive identifiers unnecessarily.
- Accessibility and mobile ergonomics: timed flows, audio controls, and submission states must remain usable on small screens and keyboards.
- Schema migration safety: no destructive column drops, type changes, or constraint additions without a dual-write, backfill, or rollback plan.

## Framework Reference Guide

When reviewing Next.js behavior, consult these installed documentation paths instead of relying on training data:

| Topic | Documentation Path |
|---|---|
| App Router | `node_modules/next/dist/docs/app.md` |
| Route Handlers | `node_modules/next/dist/docs/app/api-reference/file-conventions/route.md` |
| Server Actions | `node_modules/next/dist/docs/app/api-reference/functions/server-actions.md` |
| Data Fetching | `node_modules/next/dist/docs/app/building-your-application/data-fetching/fetching.md` |
| Caching | `node_modules/next/dist/docs/app/building-your-application/caching.md` |
| Middleware | `node_modules/next/dist/docs/app/api-reference/edge/middleware.md` |
| Deployment | `node_modules/next/dist/docs/app/building-your-application/deploying.md` |
| API Reference | `node_modules/next/dist/docs/api-reference.md` |

If a path does not exist in the installed version, note the version gap and recommend checking the official Next.js docs for the current release.

## Review Quality Gate

Before delivering a review, verify:

- Every Critical and High finding has a file, route, endpoint, or flow reference.
- No finding uses only "should" or "consider" without a concrete action and validation step.
- Assumptions are explicitly labeled and separated from observed facts.
- The Output Contract structure is followed unless the role file specifies otherwise.
- No secrets, tokens, or PII appear in the output.

If any of these fail, revise before delivering.

## Suggested Validation Commands

Use relevant commands when a review includes implementation verification:

```bash
pnpm typecheck
pnpm lint
pnpm test:p0
pnpm build
pnpm test:e2e
pnpm worker:dev
pnpm strapi:dev
```

If a command cannot be run, state why and recommend the next best validation path.

## Output Contract

Use this structure unless a role file gives a more specific format:

```md
## [Role] Review: [Target]

### Rating: X/10
[Short assessment]

### Findings
1. [Title] - Severity: [Critical/High/Medium/Low]
   - Where: [File:line, endpoint, route, flow, or doc]
   - Impact: [User/business/operational impact]
   - Why now: [Release, beta, scale, compliance, cleanup]
   - Evidence: [Observed/Reproduced/Inferred/Missing evidence]
   - Fix: [Specific change]
   - Validation: [Command, test, metric, or manual check]

### Assumptions
- [Only list assumptions that could change priority or implementation]

### Open Questions
- [Only include questions that change the decision]

### What Is Working
- [Specific positive observation]

### Final Verdict
[One paragraph with the top priority and overall release posture]
```

## Cross-Role Handoffs

- Product gaps that require UI changes should be handed to UX and Frontend.
- UX issues with engineering constraints should be handed to Frontend or Backend.
- Security issues involving data modeling or auth enforcement should be handed to Backend and QA.
- Reliability issues with learner or editor impact should be handed to Product, QA, and DevOps/SRE.
- Content, rubric, scoring, or disclaimer issues should be handed to Assessment & Content Integrity, Product, Backend, and QA as needed.
- Code quality issues that affect release confidence should include QA validation.

## Conflict Resolution

When two roles produce contradictory findings or recommendations:

1. **Technical disputes** (e.g., Security demands fail-closed rate limiting, Product argues it blocks legitimate users): The CTO role is the final arbiter. Evaluate whether the technical risk outweighs the user friction, and choose the smallest change that addresses both concerns.
2. **User-value disputes** (e.g., Product wants a feature, UX argues it increases cognitive load): The Product Manager role is the final arbiter, but must explicitly justify why the user value outweighs the usability cost.
3. **Severity disagreements** (e.g., one role marks Critical, another marks Medium): Default to the higher severity until evidence proves otherwise. The role that assigned the lower severity must provide concrete evidence why the risk is bounded.
4. **Implementation disputes** (e.g., Backend wants a schema change, Code Quality argues it introduces coupling): The CTO role decides, with preference for the smallest change that reduces risk without adding architectural debt.

Document the resolution in the review output under a "Conflict Resolution" section, naming the roles involved, the disagreement, and the final decision with reasoning.

## Definition of Done for a Review

A review is complete when it has:

- Findings ordered by severity.
- No unresolved blocker hidden in the summary.
- File, route, endpoint, flow, metric, or artifact references where applicable.
- Specific fixes or decision options.
- Validation steps.
- Assumptions clearly separated from evidence.
- Open questions only where the answer changes priority or implementation.

## Review Retrospective

After each review cycle (especially launch gates), track review quality to improve the system:

### Retrospective Questions

1. **Did this review catch a real issue?** — If yes, was it Critical, High, Medium, or Low? If no, was the review empty because the code was clean, or because the review missed something?
2. **Was the fix validated?** — Did the recommended fix actually resolve the issue? Was the validation step sufficient?
3. **Did it slow delivery?** — How long did the review take? Was the time spent proportional to the risk?
4. **Were there false positives?** — Did the review flag issues that turned out to be non-issues? This indicates the role needs tighter constraints.
5. **Were there false negatives?** — Did an issue slip through that this role should have caught? This indicates the role needs expanded coverage.

### Retrospective Tracking

After each review, append a brief note to a shared log (e.g., `.sisyphus/review-retrospectives.md`):

```md
## Review Retrospective — [Date]

- **Role**: [e.g., Security Engineer]
- **Target**: [e.g., src/app/api/attempts]
- **Findings**: [N Critical, N High, N Medium, N Low]
- **Real issues caught**: [N] — [brief description]
- **False positives**: [N] — [brief description]
- **False negatives**: [N] — [brief description, if discovered post-review]
- **Review duration**: [approximate time]
- **Delivery impact**: [blocked for X hours / no delay / delayed by Y]
- **Role file update needed**: [yes/no — what should change in the role definition]
```

### System Improvement

Use retrospective data to:

- **Tighten role constraints** if false positives are frequent (the role is too aggressive).
- **Expand role coverage** if false negatives occur (the role missed something it should have caught).
- **Merge or split roles** if retrospective patterns show consistent overlap or gaps.
- **Adjust review cadence** if reviews consistently slow delivery without catching issues.
