# IELTS++ Engineering Team — Agent Review System

## Overview
This directory contains agent profiles representing veteran-level engineering roles at a software company. Each agent has 15-20 years of experience in their domain and provides structured, actionable reviews of your codebase.

## How to Use

1. **Pick the right agent** for what you want reviewed (see matrix below)
2. **Drag the agent's `.md` file** into your chat or load it as context
3. **Ask the agent to review** a specific file, component, or the entire codebase
4. **Get structured feedback** with severity ratings, specific fixes, and prioritized recommendations

## Agent Roster

| Agent | File | Best For |
|---|---|---|
| **CTO** | `cto.md` | Architecture, tech strategy, scalability, tech debt assessment |
| **Lead Frontend** | `lead-frontend.md` | React/Next.js, performance, accessibility, component design |
| **Lead Backend** | `lead-backend.md` | API design, database, security, reliability, async processing |
| **Security Engineer** | `security-engineer.md` | Vulnerabilities, auth, data protection, OWASP, injection |
| **QA Lead** | `qa-lead.md` | Test coverage, edge cases, regression, automation quality |
| **DevOps/SRE** | `devops-lead.md` | CI/CD, infrastructure, monitoring, deployment, reliability |
| **Product Manager** | `product-manager.md` | User value, feature prioritization, user journeys, growth |
| **UX/Design Lead** | `ux-design-lead.md` | Visual design, interaction flows, accessibility, responsiveness |
| **Code Quality Lead** | `code-quality-lead.md` | Code smells, anti-patterns, maintainability, type safety |

## When to Use Which Agent

### Before a Release
- **QA Lead** — "Review our test coverage for the new feature"
- **Security Engineer** — "Audit our auth flow for vulnerabilities"
- **Lead Frontend** — "Review the new UI components"

### Architecture Decisions
- **CTO** — "Review our database schema and API architecture"
- **Lead Backend** — "Review our API endpoints and data layer"
- **DevOps/SRE** — "Review our deployment setup"

### Ongoing Improvement
- **Code Quality Lead** — "Review this file for code smells"
- **UX/Design Lead** — "Review the user flow for mock tests"
- **Product Manager** — "Review our feature set and prioritization"

### Full Audit
Run all agents in parallel for a comprehensive review:
1. CTO → overall architecture
2. Lead Frontend + Lead Backend → code quality
3. Security Engineer → vulnerabilities
4. QA Lead → test coverage
5. DevOps/SRE → infrastructure
6. Product Manager → user value
7. UX/Design Lead → user experience
8. Code Quality Lead → maintainability

## Each Agent Provides
- **Rating** out of 10 for the area reviewed
- **Critical issues** with specific file references and fixes
- **Prioritized recommendations** (Critical → High → Medium → Low)
- **Positive observations** (what's working well)
- **Final verdict** with top priority action item

## Tips for Best Results
- Be specific about what you want reviewed ("review the auth flow" not "review everything")
- Provide context about your goals ("we're preparing for launch" or "we're scaling to 10k users")
- Ask follow-up questions on any recommendation you don't understand
- Run the same agent periodically to track improvement over time
