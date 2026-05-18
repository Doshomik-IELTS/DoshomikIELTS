# IELTS++ Review Playbook

Use this playbook with every company role profile in this directory. It keeps reviews consistent, evidence-based, and useful for implementation.

## Review Principles

- Findings first. Lead with bugs, risks, regressions, missing tests, or product gaps.
- Be specific. Cite files, routes, endpoints, data models, commands, screenshots, or user flows.
- Separate evidence from inference. Say when a conclusion is inferred from code shape rather than observed behavior.
- Prioritize by user and business impact, not personal preference.
- Recommend the smallest change that meaningfully reduces the risk.
- Respect the existing architecture unless the architecture is the problem being reviewed.
- For Next.js work, check this project's installed documentation under `node_modules/next/dist/docs/` before giving framework-specific guidance.
- Do not bury blockers in summaries. Critical and High findings must appear before general commentary.

## Severity Rubric

| Severity | Meaning | Examples |
|---|---|---|
| Critical | Blocks release, exposes sensitive data, loses user data, breaks core learner flow, or creates exploitable production risk. | Auth bypass, score loss, payment/data leak, production deploy cannot roll back. |
| High | Likely user-visible failure, serious operational risk, major accessibility failure, or hard-to-recover product issue. | Mock test cannot complete on mobile, missing rate limit on auth, flaky launch gate. |
| Medium | Meaningful maintainability, UX, performance, or test gap that should be scheduled soon. | Duplicated validation, missing empty state, inefficient query on growing table. |
| Low | Local polish, minor consistency issue, or improvement with limited user/business impact. | Naming cleanup, minor spacing inconsistency, optional refactor. |

## Evidence Standard

Every finding should include:

- **Where**: file path plus line number when code is involved; route, endpoint, or user flow otherwise.
- **Impact**: what user, operator, or business outcome is affected.
- **Why now**: release blocker, launch gate, scale concern, compliance concern, or cleanup.
- **Fix**: concrete implementation, decision, or test to add.
- **Validation**: command, manual flow, metric, or acceptance criterion that proves the fix.

When evidence is incomplete, say what is missing and how to obtain it. Do not present guesses as confirmed failures.

## IELTS++ Context Checklist

Reviewers should check whether the target touches:

- IELTS content licensing: no Cambridge book reproduction, scans, close paraphrases, or unlicensed hosted audio.
- Learner data: profiles, attempt history, band trends, writing/speaking submissions, audio uploads.
- Evaluation fairness: scoring explanations, rubric mapping, prediction confidence, and human-review fallback.
- Full-test integrity: timing, section completion, answer persistence, refresh/resume behavior, and score calculation.
- CMS workflow: Strapi draft/publish state, admin permissions, content review, media licensing metadata.
- Observability: PostHog events for product decisions and Sentry/logging for failures.
- Background work: BullMQ retries, idempotency, dead-letter handling, and Redis availability.
- Accessibility: keyboard operation, screen reader semantics, contrast, focus management, and mobile touch targets.

## Suggested Validation Commands

Use relevant commands when a review includes implementation verification:

```bash
pnpm typecheck
pnpm lint
pnpm test:p0
pnpm build
pnpm test:e2e
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
   - Where: [File:line, endpoint, route, or flow]
   - Impact: [User/business/operational impact]
   - Evidence: [Observed fact or clearly labeled inference]
   - Fix: [Specific change]
   - Validation: [Command, test, metric, or manual check]

### Open Questions
- [Question only if it changes priority or implementation]

### What Is Working
- [Specific positive observation]

### Final Verdict
[One paragraph with the top priority]
```

## Cross-Role Handoffs

- Product gaps that require UI changes should be handed to UX and Frontend.
- UX issues with engineering constraints should be handed to Frontend or Backend.
- Security issues involving data modeling or auth enforcement should be handed to Backend and QA.
- Reliability issues with product impact should be handed to Product and QA.
- Code quality issues that affect release confidence should include QA validation.

## Definition of Done for a Review

A review is complete when it has:

- Findings ordered by severity.
- No unresolved blocker hidden in the summary.
- File/line, endpoint, route, user flow, metric, or artifact references where applicable.
- Specific fixes or decision options.
- Validation steps.
- Clear open questions only where the answer changes priority or implementation.
