# IELTS++ Product Plan

IELTS++ is an IELTS preparation platform with owned resources, original practice material, mock tests, profile tracking, and score prediction after a complete test attempt.

## Core Modules

- Resources: basic English, vocabulary, synonyms, basic grammar rules, reading texts, and listening practice using non-copyright material.
- Practice: focused exercises for listening, reading, writing, and speaking.
- Mock tests: full IELTS-style test flow with generated/original content.
- Evaluation: automated scoring support for reading/listening, rubric-based writing and speaking assessment, and score prediction after full-test completion.
- Account: login, logout, profile, attempt history, band trend, saved resources, and learner analytics.
- Infrastructure: owned domain, hosted application, Strapi CMS, database, media storage, backups, analytics, and admin content workflow.

## Content Policy

Do not host, reproduce, scan, or adapt Cambridge IELTS books or other copyrighted test books. They can be referenced as external study recommendations only. The platform should use:

- LLM-generated original passages and questions.
- Human-reviewed original content.
- Public domain or properly licensed listening scripts/audio.
- Internally recorded audio.
- Synthetic text-to-speech audio where licensing permits commercial hosting.

## Suggested MVP

1. User login/logout and profile.
2. Text-based resource library for basic English, words, synonyms, and grammar.
3. Reading and listening practice with original content.
4. Writing task submission with rubric feedback.
5. Speaking test flow with text or audio response upload.
6. Full mock test mode.
7. Score prediction after all four modules are completed.
8. Strapi authoring workflow for resources/tests plus app admin review/operations.

## Documentation

Start here:

- [Development documentation index](docs/README.md)
- [Development plan (baseline + checklist)](docs/development/development-plan.md)
- [Development starting phase](docs/development/development-starting-phase.md)
- [MVP development workplan](docs/development/mvp-development-workplan.md)

Core planning docs:

- [Product requirements](docs/product-requirements.md)
- [Technical architecture](docs/development/technical-architecture.md)
- [Frontend MVP plan](docs/development/frontend/README.md)
- [Backend documentation](docs/development/backend/README.md)
- [Technical complexity report](docs/development/technical-complexity-report.md)
- [Content strategy](docs/development/content/content-strategy.md)
- [Evaluation methods](docs/development/evaluation-methods.md)
- [Market research analysis](docs/market-research-analysis.md)
- [Prospective features](docs/development/content/prospective-features.md)


## Development Scaffold

The project has been scaffolded as a Next.js full-stack app aligned with the development docs.

Quick commands:

```bash
pnpm install
cp .env.example .env.local
pnpm prisma:generate
pnpm dev
```

Useful checks:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

Worker scaffold:

```bash
pnpm worker:dev
```

Strapi CMS:

```bash
pnpm strapi:dev
```

Open `http://localhost:1337/admin`, create the first Strapi administrator, then create an API token with read access to published content. Add that token to the Next.js environment as `STRAPI_API_TOKEN`. The app uses Strapi for resources and mock-test authoring when `STRAPI_BASE_URL` and `STRAPI_API_TOKEN` are configured, and falls back to Prisma content otherwise.

PostHog analytics:

Set `NEXT_PUBLIC_POSTHOG_KEY` and optionally `NEXT_PUBLIC_POSTHOG_HOST` / `NEXT_PUBLIC_POSTHOG_UI_HOST` to enable learner analytics. Analytics is disabled when the key is not configured.

Core scaffolded areas:

- `src/app` — App Router pages and API routes.
- `src/components` — shared UI, layout, and IELTS-specific components.
- `src/lib` — API helpers, Supabase clients, Prisma client, auth/session helpers, queue helpers, validators.
- `src/lib/analytics` — PostHog browser analytics helpers for learner events.
- `src/workers` — BullMQ worker scaffold.
- `prisma` — Prisma schema and seed file.
- `strapi-cms` — Strapi CMS for resources, IELTS info pages, FAQs, and mock-test content authoring.
