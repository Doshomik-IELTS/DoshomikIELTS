# IELTS++ Review Playbook

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

## Definition of Done for a Review

A review is complete when it has:

- Findings ordered by severity.
- No unresolved blocker hidden in the summary.
- File, route, endpoint, flow, metric, or artifact references where applicable.
- Specific fixes or decision options.
- Validation steps.
- Assumptions clearly separated from evidence.
- Open questions only where the answer changes priority or implementation.
