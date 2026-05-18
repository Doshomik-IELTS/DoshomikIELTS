# IELTS++ Company Review Agents

<!-- Last Updated: 2026-05-19 — Added solo developer review cadence, batching guidance, and version tracking policy. -->

## Overview

This directory contains role prompts for reviewing IELTS++ from distinct company perspectives. They are meant for targeted reviews, release gates, architecture decisions, and re-reviews after fixes.

IELTS++ is a Next.js 16.x / React 19 IELTS preparation platform with Prisma, Supabase, BullMQ, Strapi CMS, PostHog, Sentry, Playwright, Tailwind CSS, and TypeScript. Reviews should account for learner trust, licensed or original content rules, score-prediction disclaimers, attempt persistence, and the separation between authored content and learner runtime state.

## Deployment Topology

The production stack runs via Docker Compose with five services:

| Service | Image / Build | Dependencies | Health Check |
|---|---|---|---|
| **app** | `Dockerfile` → `runner` stage | db, redis | `GET /api/health` |
| **worker** | `Dockerfile` → `runner-worker` stage | db, redis | BullMQ module presence |
| **db** | `postgres:16-alpine` | — | `pg_isready` |
| **redis** | `redis:7-alpine` | — | `redis-cli ping` |
| **strapi** | `strapi-cms/Dockerfile` (optional profile) | db | — |

See `docker-compose.yml` and `Dockerfile` for full configuration. The worker service processes BullMQ jobs for writing and speaking evaluations.

## Learner Profiles

Reviews should consider these primary learner personas:

| Persona | Goal | Key Constraints |
|---|---|---|
| **Self-study retaker** | Improve band score from 5.5–6.5 to 7.0+ | Limited time, needs targeted feedback, mobile-first usage |
| **First-time test taker** | Understand IELTS format and build baseline skills | Needs clear instructions, practice before mock tests, confidence building |
| **Classroom supplement user** | Support instructor-led IELTS course | Structured progress tracking, teacher-visible results, deadline-driven |

## Business Model

IELTS++ operates on a **credit-based freemium model**: learners receive free resources and practice, purchase credits for mock tests and evaluations, and can earn credits through referrals. Score predictions are gated behind completed four-module attempts and labeled as unofficial estimates.

Before running any role, read the shared [review playbook](review-playbook.md). It defines severity, evidence, validation, and handoff expectations for every agent.

## How to Use

1. Pick the narrowest review target you can name: route, file group, flow, API, release gate, or architecture decision.
2. Choose the role that owns the main risk on that target.
3. Attach the role file plus [review-brief-template.md](review-brief-template.md) when possible.
4. Ask for findings first, ordered by severity, with file or flow references.
5. Pair roles when the decision crosses boundaries such as scoring, auth, or content publication.

## Review Modes

| Mode | Use When | Expected Output |
|---|---|---|
| Launch gate | A feature is close to release. | Blockers, release risks, validation gaps, and an explicit go/no-go recommendation. |
| Targeted review | A route, file set, endpoint, or user flow needs expert feedback. | Findings with exact references, fixes, and validation steps. |
| Architecture review | The team is choosing an approach or refactoring a subsystem. | Tradeoffs, migration risk, sequencing, and a decision recommendation. |
| Audit | You need broad risk discovery within a domain. | Prioritized risk register, owners, and follow-up review recommendations. |
| Re-review | Fixes were made after a prior review. | What is resolved, what remains, and whether residual risk changed. |

## Agent Roster

| Agent | File | Best For |
|---|---|---|
| **CTO** | [cto.md](cto.md) | Architecture, sequencing, scaling risk, cost, technical investment decisions |
| **Lead Frontend** | [lead-frontend.md](lead-frontend.md) | App Router, React, rendering behavior, accessibility, learner-facing resilience |
| **Lead Backend** | [lead-backend.md](lead-backend.md) | API contracts, Prisma, authZ, jobs, data integrity, runtime snapshots |
| **Security Engineer** | [security-engineer.md](security-engineer.md) | Exploitability, privacy, uploads, auth, admin exposure, abuse resistance |
| **QA Lead** | [qa-lead.md](qa-lead.md) | Launch gates, critical path coverage, flakiness, regression and edge-case design |
| **DevOps/SRE** | [devops-lead.md](devops-lead.md) | CI/CD, rollback, observability, backups, worker and Strapi operations |
| **Product Manager** | [product-manager.md](product-manager.md) | Learner value, activation, retention, prioritization, monetization, metrics |
| **UX/Design Lead** | [ux-design-lead.md](ux-design-lead.md) | Information architecture, timed-test ergonomics, feedback clarity, mobile usability |
| **Code Quality Lead** | [code-quality-lead.md](code-quality-lead.md) | Maintainability, type safety, coupling, refactoring discipline, review rigor |
| **Assessment & Content Integrity Lead** | [assessment-content-lead.md](assessment-content-lead.md) | Content provenance, IELTS-style assessment quality, rubric trust, editorial workflow |

## Quick Agent Selection

| If the main question is... | Start With | Usually Pair With |
|---|---|---|
| Can we ship this learner flow safely? | QA Lead | Lead Frontend, Security Engineer, DevOps/SRE |
| Is this route, form, or page built correctly? | Lead Frontend | UX/Design Lead, QA Lead |
| Is this endpoint, schema, or worker safe and reliable? | Lead Backend | Security Engineer, QA Lead |
| Can this be exploited or leak learner data? | Security Engineer | Lead Backend, QA Lead |
| Is this scoring, feedback, or content pipeline trustworthy? | Assessment & Content Integrity Lead | Product Manager, Lead Backend, QA Lead |
| Are we making the right product tradeoff? | Product Manager | CTO, UX/Design Lead |
| Will this infra or deployment hold up operationally? | DevOps/SRE | CTO, Lead Backend |
| Is this refactor or code shape going to slow the team down? | Code Quality Lead | CTO, Lead Frontend or Lead Backend |

## Common Review Bundles

| Scenario | Recommended Roles |
|---|---|
| Auth or profile release | Security Engineer, Lead Backend, QA Lead, Lead Frontend |
| Mock-test or scoring change | Assessment & Content Integrity Lead, Lead Backend, QA Lead, Product Manager |
| Content publication or Strapi workflow change | Assessment & Content Integrity Lead, Security Engineer, DevOps/SRE, Product Manager |
| Learner dashboard or new study flow | Product Manager, UX/Design Lead, Lead Frontend, QA Lead |
| Reliability hardening | DevOps/SRE, CTO, Lead Backend |
| Large refactor | Code Quality Lead, CTO, affected platform lead |

## Core Review Targets

Use these repo areas as common anchors when defining the target:

| Area | Typical Paths / Docs | Primary Agents |
|---|---|---|
| Learner and admin routes | `src/app`, `src/components`, `src/app/globals.css` | Lead Frontend, UX/Design Lead, QA Lead |
| APIs, jobs, data access | `src/app/api`, `src/lib`, `src/workers`, `prisma/schema.prisma` | Lead Backend, Security Engineer, Code Quality Lead |
| Auth and learner data | `src/lib/auth`, Supabase helpers, profile and attempt routes | Security Engineer, Lead Backend, QA Lead |
| Evaluation and score prediction | `src/lib/evaluation`, evaluation routes, [../development/evaluation-methods.md](../development/evaluation-methods.md) | Assessment & Content Integrity Lead, Lead Backend, QA Lead, Product Manager |
| Content authoring and publication | `strapi-cms`, `src/lib/strapi`, [../development/content/content-strategy.md](../development/content/content-strategy.md) | Assessment & Content Integrity Lead, Product Manager, Security Engineer |
| Background processing | `src/workers`, queue helpers, evaluation processors | Lead Backend, DevOps/SRE, QA Lead |
| Observability and analytics | Sentry setup, PostHog helpers, health checks, operational docs | DevOps/SRE, CTO, Product Manager |

## What Every Agent Should Return

- A rating out of 10 for the area reviewed.
- Findings ordered by severity.
- File, route, endpoint, flow, or document references for each material finding.
- A concrete fix or decision option for each finding.
- A validation path for each proposed fix.
- Assumptions called out separately from observed facts.
- A final verdict with the single highest-priority next action.

## Shared Expectations

- Use [review-playbook.md](review-playbook.md) for severity and evidence standards.
- Check installed Next.js documentation under `node_modules/next/dist/docs/` before making framework-specific claims.
- Treat content licensing, learner privacy, evaluation trust, score-prediction disclaimers, accessibility, and attempt persistence as company-level risks.
- Avoid vague advice. Every material finding needs a fix and a way to verify it.
- Keep praise specific and secondary. Findings come first.

## Solo Developer Review Cadence

When you are the only developer, running all 10 roles on every change is impractical. Use this cadence to batch reviews by change type:

### By Change Type

| Change | Run These Roles | When |
|---|---|---|
| **New API route or endpoint** | Security Engineer + Lead Backend + QA Lead | Before merge |
| **New learner-facing page or route** | Lead Frontend + UX/Design Lead + QA Lead | Before merge |
| **Schema migration or Prisma change** | Lead Backend + CTO + DevOps/SRE | Before running migration |
| **Auth or session change** | Security Engineer + Lead Backend + QA Lead | Before merge |
| **Evaluation or scoring change** | Assessment & Content Integrity + Lead Backend + QA Lead + Product Manager | Before merge |
| **Strapi or content workflow change** | Assessment & Content Integrity + Security Engineer + DevOps/SRE | Before merge |
| **Worker or queue change** | Lead Backend + DevOps/SRE + QA Lead | Before merge |
| **Refactor or cleanup** | Code Quality Lead + CTO | Before merge |
| **Release candidate / launch gate** | All roles (run in parallel batches) | 48 hours before launch |

### Batch Execution Strategy

For solo developers, run roles in parallel batches to minimize context switching:

1. **API batch** (Security + Backend + QA): Run together on any backend change. Security checks auth and exploit paths; Backend checks contracts and data integrity; QA checks critical path coverage.
2. **UI batch** (Frontend + UX + QA): Run together on any frontend change. Frontend checks implementation correctness; UX checks usability and cognitive load; QA checks flow resilience.
3. **Infrastructure batch** (DevOps + CTO + Backend): Run together on any deployment, worker, or dependency change. DevOps checks deployability; CTO checks architecture fit; Backend checks reliability.
4. **Content batch** (Assessment + Product + Security): Run together on any content, rubric, or scoring change. Assessment checks provenance and quality; Product checks learner value; Security checks exposure risk.

### Review Frequency

| Frequency | Action |
|---|---|
| **Every PR** | Run the relevant batch (API, UI, Infrastructure, or Content) |
| **Weekly** | Run Code Quality Lead on the week's changes |
| **Before release** | Run all roles as a launch gate |
| **After incident** | Run DevOps/SRE + CTO + affected platform lead |

## Examples

- "Review `src/app/api/attempts/[attemptId]/predict-score/route.ts` for learner-trust and release readiness."
- "Run an architecture review on the Strapi-to-Prisma mock-test snapshot flow."
- "Do a re-review of the writing evaluation pipeline after the retry and review-queue fixes."

## Maintenance Notes

- Keep shared review rules in the playbook instead of duplicating them in each role file.
- Update repository context when the stack, route groups, or content workflow changes.
- Add new agents only when they introduce a genuinely distinct review lens.
- Remove or merge roles if they start overlapping so much that agent choice becomes noisy.
