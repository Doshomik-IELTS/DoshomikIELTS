# DOshomik IELTS MVP Remaining Tasks

**Last updated:** 2026-05-17

## Status: ✅ Core MVP Complete — Production Hardening Phase

All P0 and P1 items from the original MVP plan have been implemented. The platform is feature-complete for its MVP scope. Remaining work focuses on production readiness and polish.

---

## Production Hardening Tasks

### P0 — Required Before Public Launch

| # | Task | Status | Notes |
|---|------|--------|-------|
| P0.1 | Staging environment verification | ⏳ Pending | Verify all P0 fixes against real Supabase/Redis/LLM services |
| P0.2 | Production LLM provider integration | ✅ Done | OpenAI/Anthropic/Gemini implemented; deterministic fallback active |
| P0.3 | Database migrations deployed | ✅ Done | `pnpm db:deploy` passes; migrations committed |
| P0.4 | Baseline checks green | ✅ Done | `pnpm typecheck`, `pnpm lint`, `pnpm test:p0` (38/38), `pnpm build` all pass |

### P1 — Required Before Closed Beta

| # | Task | Status | Notes |
|---|------|--------|-------|
| P1.1 | Integration tests (database-backed) | 🔄 Scaffolded | `tests/integration/` directory created; staging smoke test needed |
| P1.2 | E2E test stabilization | 🔄 Scaffolded | 11 Playwright spec files created; staging verification needed |
| P1.3 | Rate limiting | ✅ Done | 6 limiters applied to all sensitive endpoints |
| P1.4 | Audit logs | ✅ Done | All admin write operations logged |
| P1.5 | Sentry error tracking | ✅ Done | Client + server instrumentation configured |
| P1.6 | PostHog learner analytics | ✅ Done | Browser SDK, learner identity bridge, and core workflow events configured behind env vars |
| P1.7 | Storage buckets | ✅ Done | speaking-recordings, listening-audio, generated-audio, reports |
| P1.8 | BullMQ worker | ✅ Done | 6 workers running on port 3002 |
| P1.9 | Content/media compliance review | ✅ Done | Seed data reviewed; private buckets configured |

### P2 — Polish / Deferred

| # | Task | Status | Notes |
|---|------|--------|-------|
| P2.1 | Weakness detection | 📅 Deferred | Phase 4 — analytics-driven recommendations |
| P2.2 | Timed/untimed toggle | 📅 Deferred | Phase 4 — mock test mode selection |
| P2.3 | Reading notes | 📅 Deferred | Phase 4 — passage annotation |
| P2.4 | Calibration dashboard | 📅 Deferred | Phase 4 — AI vs reviewer score comparison |
| P2.5 | Advanced score trajectory analytics | 📅 Deferred | Phase 4 — trend charts on top of baseline PostHog learner events |
| P2.6 | Transcription provider | 📅 Deferred | Optional — for speaking pronunciation analysis |
| P2.7 | Server-side strict audio events | 📅 Deferred | Anti-cheat enforcement for Listening one-play |
| P2.8 | Production TTS generation | 📅 Deferred | For listening audio generation |
| P2.9 | Human review marketplace | 📅 Deferred | Post-MVP |

---

## Quick Commands

```bash
# Verify everything passes
pnpm typecheck
pnpm lint
pnpm test:p0
pnpm build

# Start development
pnpm dev
pnpm worker:dev

# Deploy migrations
pnpm db:deploy
```

---

## Definition of MVP Complete

DOshomik IELTS MVP is considered complete when:
- ✅ All learner-facing features implemented and functional
- ✅ All admin content workflows implemented
- ✅ Automated checks pass (typecheck, lint, test:p0, build)
- ✅ Database migrations deploy cleanly
- ✅ Production LLM provider integrated
- ⏳ Staging environment verified with real services
- ⏳ E2E smoke tests pass against staging
