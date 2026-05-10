# Testing plans

This folder is the home for **all testing and QA plans** for IELTS++—manual checklists, automated coverage intent, accessibility/responsive passes, and (as you add them) E2E, performance, security, and load plans.

> **Implementation Note:** Backend APIs for practice, mock tests, evaluations, media, admin tests, and admin reviews now exist. `npm run typecheck`, `npm run lint`, and `npm run test:p0` are the baseline checks before expanding database-backed E2E coverage.

## Current documents

| Document | Scope |
|----------|--------|
| [`frontend-testing-plan.md`](frontend-testing-plan.md) | Frontend: component/integration/E2E intent, P0 automated scenarios, manual a11y and responsive checks, regression risks. |
| [`backend-testing-plan.md`](backend-testing-plan.md) | Backend: auth, resources, practice, mock tests, evaluation, scoring, media, security, background jobs. |
| [`security-and-compliance-testing-plan.md`](security-and-compliance-testing-plan.md) | Security & compliance: authN/authZ, IDOR, rate limits, media/signing, content rules, audit logs, score disclaimers, leakage, jobs, periodic config/deps. |

## Add new plans here

Examples of documents you might add later (stubs optional):

- **E2E / Playwright** — smoke vs full suite, env matrix, data setup. *(Implementation: `tests/` or project `e2e/` as applicable.)*
- **Performance / load** — critical paths, thresholds, tooling.
- **Content / evaluation quality** — human review rubrics, golden outputs (if separate from product docs).

Keep deep product or architecture discussion in `docs/development/`; this folder should stay **test-focused and checklist-oriented**.
