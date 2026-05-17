# Backend Setup And Environment

## Required Services

V1 requires:

- Next.js app runtime (Next.js 16.2.6).
- Supabase project.
- Supabase Auth enabled.
- Supabase Postgres database.
- Supabase Storage buckets.
- Redis instance.
- Strapi CMS service for resources, IELTS info pages, FAQs, and mock-test authoring.
- LLM provider account/key (OpenAI, Anthropic, or Gemini).
- Optional transcription provider account/key.
- Optional Sentry project (error tracking).
- Optional PostHog project (learner/product analytics).

## Environment Variables

Recommended variables:

```bash
# App
NEXT_PUBLIC_APP_URL=
NODE_ENV=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=

# Database
DATABASE_URL=
DIRECT_URL=

# Redis / Queue
REDIS_URL=

# LLM Provider (set to "openai", "anthropic", or "gemini" for production)
LLM_PROVIDER=
LLM_API_KEY=
LLM_MODEL_WRITING=
LLM_MODEL_SPEAKING=
LLM_MODEL_CONTENT_VALIDATION=

# Optional: Custom API base URLs (for proxy or alternative endpoints)
OPENAI_BASE_URL=
ANTHROPIC_BASE_URL=

# Transcription (optional, for speaking audio transcription)
TRANSCRIPTION_PROVIDER=
TRANSCRIPTION_API_KEY=
TRANSCRIPTION_MODEL=

# Storage limits
MAX_SPEAKING_AUDIO_MB=25
MAX_SPEAKING_AUDIO_SECONDS=300
SIGNED_URL_TTL_SECONDS=900

# Strapi CMS
STRAPI_BASE_URL=http://localhost:1337
STRAPI_ADMIN_URL=http://localhost:1337/admin
STRAPI_API_TOKEN=

# Sentry (optional - error tracking, not required for beta)
# NEXT_PUBLIC_SENTRY_DSN=
# SENTRY_AUTH_TOKEN=
# SENTRY_ORG=
# SENTRY_PROJECT=

# PostHog (optional - learner/product analytics)
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_POSTHOG_UI_HOST=https://us.posthog.com
```

**Note:** When `LLM_PROVIDER` and `LLM_API_KEY` are set, the system uses the production LLM provider (OpenAI, Anthropic, or Gemini). When not set, it falls back to the deterministic local provider for development/testing.

## Local Development Setup

1. Install dependencies (`pnpm install`).
2. Create Supabase project or local Supabase environment.
3. Configure `.env.local` with required variables (see `.env.example`).
4. Generate Prisma client (`pnpm prisma:generate`).
5. Run Prisma migration (`pnpm db:migrate`).
6. Seed app runtime data if needed (`pnpm db:seed`). Content authoring now happens in Strapi.
7. Start Strapi (`pnpm strapi:dev`), open `http://localhost:1337/admin`, create the first admin, and create a read API token.
8. Add the Strapi token to `.env.local` as `STRAPI_API_TOKEN`.
9. Create Supabase Storage buckets (listening-audio, speaking-recordings, generated-audio, reports).
10. Start Redis (required for BullMQ queue).
11. Start Next.js dev server (`pnpm dev`).
12. Start BullMQ worker process in separate terminal (`pnpm worker:dev`).

## Prisma Workflow

Recommended commands:

```bash
pnpm prisma:generate    # Generate Prisma client
pnpm db:migrate         # Run development migration (prisma migrate dev)
pnpm db:seed            # Seed data (tsx prisma/seed.ts)
pnpm db:deploy          # Deploy migrations to staging/production (prisma migrate deploy)
```

Production migration should use:

```bash
pnpm db:deploy
# or directly:
npx prisma migrate deploy
```

## Available Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | TypeScript type checking (tsc --noEmit) |
| `pnpm prisma:generate` | Generate Prisma client |
| `pnpm db:migrate` | Run development migration |
| `pnpm db:deploy` | Deploy migrations to production |
| `pnpm db:seed` | Seed database |
| `pnpm worker:dev` | Start BullMQ worker |
| `pnpm strapi:dev` | Start Strapi CMS in development mode |
| `pnpm strapi:build` | Build Strapi CMS admin |
| `pnpm strapi:start` | Start built Strapi CMS |
| `pnpm test:p0` | Run P0 integration tests |
| `pnpm test:e2e` | Run Playwright E2E tests |
| `pnpm test:e2e:ui` | Run Playwright E2E with UI |

## Storage Bucket Setup

Create private buckets:

- `listening-audio`
- `speaking-recordings`
- `generated-audio`
- `reports`

Backend should create signed URLs through Supabase service role credentials. Do not expose service role credentials to the browser.

## Worker Deployment

Deploy route handlers and workers separately if the hosting platform requires it.

Worker must have access to:

- Database URL
- Redis URL
- Supabase service role key
- LLM provider key
- Transcription provider key if used

## Deployment Notes

Minimum production setup:

- Managed Supabase project.
- Hosted Next.js app.
- Hosted Redis.
- Separate worker process.
- Environment variable management.
- Error tracking/logging (Sentry recommended).
- Learner/product analytics (PostHog recommended).
- Database backups.

Recommended environments:

- `local`
- `staging`
- `production`
