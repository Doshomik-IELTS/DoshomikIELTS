# DOshomik IELTS — Product Context

> Full architecture reference in `AGENTS.md`. This file is a quick-entry summary.

## Identity
IELTS prep platform for Bangladesh learners. Owned content, mock tests, LLM-powered writing/speaking evaluation, progress tracking, SM-2 flashcards.

## Stack
Next.js 16.2 · React 19 · TypeScript 5 · Tailwind v4 · Prisma 6 · PostgreSQL (Supabase) · Supabase Auth · Strapi CMS 5 · BullMQ (Redis) · Sentry · PostHog

## Route Groups
| Group | Auth Gate | Key Pages |
|---|---|---|
| `(public)` | None | Landing page, Changelog |
| `(auth)` | Redirect if logged in | Login, Register, ResetPassword (standalone fallback; primary flow is modal) |
| `(learner)` | `requireCurrentUser()` | dashboard, resources, practice, mock-tests, attempts, flashcards, profile, progress, referrals |
| `(admin)` | `ADMIN_ACCESS_ROLES` gated | CRUD for resources, tests, flashcards, reviews, feedback |

## API Style
All endpoints return `{ data: T, error: null } | { data: null, error: ApiError }`.
Parse query → auth → business logic → `ok(result)`.

## Data Model (40+ Prisma models)
- **Profile → Role[]** — user identity + `AppRole` (learner/admin/reviewer/evaluator)
- **Test → TestSection[] → QuestionGroup[] → Question[] → AnswerKey** — mock test structure
- **MockTestAttempt → AttemptAnswer[] → ModuleScore[] → ScorePrediction** — attempt lifecycle
- **WritingEvaluation / SpeakingEvaluation → LlmJob** — async LLM evaluation
- **FlashCardDeck → FlashCard[] → CardReviewLog[]** — SM-2 spaced repetition
- **Resource → ResourceProgress / SavedResource / ResourcePrerequisite** — learning content
- **Referral → ReferralRedemption + CreditLedger** — referral program

## Key Architectural Rules
1. **No copyrighted IELTS content** — all content must be original
2. **Answer keys hidden** from learner-facing API
3. **Scores labelled "unofficial practice estimates"** with disclaimers
4. **Full mock attempts:** sequential sections only (no skip/back)
5. **Draft answers:** `answerJson.isDraft: true` flag
6. **Evaluation:** LLM (OpenAI/Anthropic/Gemini) → deterministic fallback
7. **Strapi:** local Prisma fallback when Strapi unreachable
8. **Rate limits:** 6 named limiters (auth, submission, evaluation, media, prediction, referral)
9. **Circuit breakers:** 5 external services (3 failures → 30s half-open)
10. **CSRF:** origin/referer check on mutating methods

## Quality Gates
```bash
pnpm typecheck   # tsc --noEmit — zero tolerance
pnpm lint        # ESLint + TypeScript rules
pnpm test:p0     # 38 tests must pass
pnpm build       # Production build
```

## Environment Must-Know
- `DATABASE_URL` + `DIRECT_URL` + Supabase vars always required
- Dev auth via `DEV_LEARNER_*` / `DEV_ADMIN_*` env vars (cookie-based)
- LLM provider selected by `LLM_PROVIDER` (openai/anthropic/gemini)
- Workers need `REDIS_URL` for BullMQ
- `NEXT_PUBLIC_APP_URL` for CSP/callback URLs

## UI Conventions
- `cn()` from `@/lib/utils` for class merging (clsx + twMerge)
- CVA for component variants — see `src/components/ui/*.tsx`
- lucide-react icons
- Poppins + Geist Mono fonts (purple-indigo `#6556ff` primary)
- Tailwind v4 `@theme inline` tokens in `globals.css`

## Violations to Flag Immediately
- `as any`, `@ts-ignore`, `@ts-expect-error`
- Empty catch blocks
- Cambridge/copyrighted content references
- Returning answer keys to learners
- Removing score disclaimers
- Skipping P0 tests or deleting failing tests

