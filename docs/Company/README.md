# IELTS++ Company Review Agents

## Overview

This directory contains senior role profiles for reviewing IELTS++ from different company perspectives. Use them as focused agent prompts when you want a rigorous review of the product, codebase, infrastructure, security posture, quality strategy, or user experience.

IELTS++ is a Next.js 16 / React 19 full-stack IELTS preparation platform using Prisma, Supabase, BullMQ, Strapi CMS, PostHog, Sentry, Playwright, Tailwind CSS, and TypeScript. Reviews should account for that stack and the product rules in the root [README](../../README.md), especially the content policy around original or properly licensed IELTS practice material.

## How to Use

1. Pick the agent that matches the decision you need.
2. Attach or load the agent's `.md` file as context.
3. Provide a narrow review target: files, routes, feature, release gate, or product area.
4. Include the review brief from [review-brief-template.md](review-brief-template.md) when possible.
5. Ask for findings first, ordered by severity, with file and line references.

Before running any role, read the shared [review playbook](review-playbook.md). It defines severity, evidence, output, and cross-role handoff expectations.

## Review Modes

| Mode | Use When | Expected Output |
|---|---|---|
| Launch gate | A feature or release is close to shipping. | Blockers, release risks, required validation, and explicit go/no-go recommendation. |
| Targeted review | A file, route, endpoint, flow, or design needs expert feedback. | Findings with exact references, fixes, and validation steps. |
| Architecture review | The team is choosing an approach or refactoring a subsystem. | Tradeoffs, sequencing, migration risk, and decision recommendation. |
| Audit | You need broad risk discovery across a domain. | Prioritized risk register, owners, and follow-up reviews by role. |
| Re-review | Fixes have been made after a previous review. | Confirmed resolved items, remaining risk, and any new regressions. |

## Agent Roster

| Agent | File | Best For |
|---|---|---|
| **CTO** | [cto.md](cto.md) | Architecture, tech strategy, scalability, technical debt, investment decisions |
| **Lead Frontend** | [lead-frontend.md](lead-frontend.md) | Next.js App Router, React, performance, accessibility, component design |
| **Lead Backend** | [lead-backend.md](lead-backend.md) | API contracts, Prisma/database, Supabase auth, reliability, async processing |
| **Security Engineer** | [security-engineer.md](security-engineer.md) | Vulnerabilities, auth, data protection, OWASP, dependency and config risk |
| **QA Lead** | [qa-lead.md](qa-lead.md) | Test strategy, edge cases, regression risk, automation quality, launch gates |
| **DevOps/SRE** | [devops-lead.md](devops-lead.md) | CI/CD, deployment, monitoring, rollback, backups, reliability, cost |
| **Product Manager** | [product-manager.md](product-manager.md) | User value, prioritization, learner journeys, growth, success metrics |
| **UX/Design Lead** | [ux-design-lead.md](ux-design-lead.md) | Information architecture, interaction design, accessibility, responsiveness |
| **Code Quality Lead** | [code-quality-lead.md](code-quality-lead.md) | Maintainability, type safety, refactoring, code smells, review discipline |

## Core Review Targets

Use these repo areas as common anchors:

| Area | Typical Paths | Primary Agents |
|---|---|---|
| App routes and UI | `src/app`, `src/components`, `src/app/globals.css` | Lead Frontend, UX/Design Lead, QA Lead |
| API and data layer | `src/app/api`, `src/lib`, `prisma/schema.prisma` | Lead Backend, Security Engineer, Code Quality Lead |
| Auth and learner data | Supabase helpers, route handlers, Prisma models | Security Engineer, Lead Backend, QA Lead |
| CMS workflow | `strapi-cms`, Strapi integration helpers, content docs | Product Manager, DevOps/SRE, Security Engineer |
| Evaluation and scoring | evaluation services, workers, scoring docs | CTO, Product Manager, QA Lead, Security Engineer |
| Background jobs | `src/workers`, BullMQ helpers, Redis config | Lead Backend, DevOps/SRE, QA Lead |
| Observability | Sentry, PostHog, logs, metrics, alerts | DevOps/SRE, CTO, Product Manager |

## When to Use Which Agent

### Before a Release

- **QA Lead** - release gate, critical path coverage, regression risk.
- **Security Engineer** - auth, learner data, CMS/admin exposure, dependency risk.
- **Lead Frontend** - UI flows, App Router usage, Core Web Vitals, accessibility.
- **DevOps/SRE** - deployment readiness, rollback, health checks, backup/restore.

### Architecture Decisions

- **CTO** - architecture, build-vs-buy, sequencing, scaling risk.
- **Lead Backend** - API boundaries, Prisma schema, queues, idempotency.
- **DevOps/SRE** - environment strategy, infra complexity, operational burden.

### Ongoing Improvement

- **Code Quality Lead** - maintainability, type safety, refactoring opportunities.
- **UX/Design Lead** - mock-test journey, content discovery, mobile usability.
- **Product Manager** - roadmap, learner outcomes, retention, monetization hypotheses.

### Full Audit

Run all agents for a comprehensive review:

1. CTO - overall architecture and sequencing.
2. Product Manager - user value and prioritization.
3. Lead Frontend + Lead Backend - implementation quality.
4. Security Engineer - vulnerabilities and compliance exposure.
5. QA Lead - release confidence and regression strategy.
6. DevOps/SRE - operational readiness.
7. UX/Design Lead - usability and accessibility.
8. Code Quality Lead - maintainability and refactoring.

## Each Agent Provides

- Rating out of 10 for the reviewed area.
- Findings ordered by severity, with file/line references where applicable.
- Concrete fixes or decision options, including tradeoffs.
- Test or validation recommendations.
- Positive observations only when they are specific and useful.
- Final verdict with one top priority action.

## Shared Expectations

- Use [review-playbook.md](review-playbook.md) for severity and evidence standards.
- Use installed Next.js documentation under `node_modules/next/dist/docs/` before making framework-specific claims.
- Treat IELTS content licensing, learner privacy, score prediction trust, accessibility, and attempt persistence as company-level risks.
- State assumptions separately from observed facts.
- Avoid vague advice. Every material finding needs a fix and a way to verify it.

## Tips for Best Results

- Prefer "review the writing submission flow for launch readiness" over "review everything".
- Tell the agent whether the goal is MVP launch, paid beta, scale, compliance, or cleanup.
- Ask for exact file references, exact reproduction steps, and exact validation commands.
- Re-run the same agent after fixes to verify that the risk actually changed.
- Combine agents when decisions cross boundaries. Example: scoring changes need Product, Backend, QA, Security, and UX review.

## Maintenance Notes

- Keep role profiles short enough to use as prompts without losing the role's decision-making style.
- Update repository context when the stack changes.
- Add new agents only when they represent a distinct review lens that the current roster does not cover.
- Keep shared rules in the playbook instead of duplicating long policy blocks in every role file.
