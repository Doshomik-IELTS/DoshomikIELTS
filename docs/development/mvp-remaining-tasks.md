# IELTS++ MVP Remaining Tasks

**Last updated:** 2026-05-10

## P0 - Must Complete Before Launch

| # | Task | Status | Notes |
|---|------|--------|-------|
| P0.1 | Speaking audio UI integration | ✅ DONE | Components: speaking-recorder.tsx, speaking-submission.tsx |
| P0.2 | Full attempt report | ✅ DONE | API + UI: /api/attempts/[id]/report, /attempts/[id]/report |
| P0.3 | Answer normalization checks | ✅ DONE | Implemented in submit-section route |
| P0.4 | Database migration | ✅ READY | Run `pnpm prisma migrate dev` after DB setup |

## P1 - Should Complete Before Launch

| # | Task | Status | Notes |
|---|------|--------|-------|
| P1.1 | Admin test sections editor | ✅ DONE | Sections CRUD API + component |
| P1.2 | Admin questions editor | ✅ DONE | Questions CRUD API + component |
| P1.3 | E2E test stabilization | 🔄 IMPROVED | Increased timeout, reuse server option |
| P1.4 | Security tests | ⏳ Pending | Plan exists in testing-plans/ |

## P2 - Can Defer to Post-Launch

| # | Task | Status | Notes |
|---|------|--------|-------|
| P2.1 | Admin TestGenerationJob UI | 📅 Deferred | Phase 3 |
| P2.2 | Mock test timed/untimed toggle | 📅 Deferred | Phase 4 |
| P2.3 | Highlighting in reading | 📅 Deferred | Phase 4 |
| P2.4 | Listening one-play mode | 📅 Deferred | Phase 4 |
| P2.5 | Weakness detection | 📅 Deferred | Phase 4 |
| P2.6 | Calibration dashboard | 📅 Deferred | Phase 4 |
| P2.7 | Score trajectory analytics | 📅 Deferred | Phase 4 |
| P2.8 | Transcription provider | 📅 Deferred | Optional |
| P2.9 | Human review marketplace | 📅 Deferred | Post-MVP |

## Environment Setup Required

```bash
# .env.local - For production LLM evaluation
LLM_PROVIDER=openai
LLM_API_KEY=sk-...
LLM_MODEL_WRITING=gpt-4o
LLM_MODEL_SPEAKING=gpt-4o-mini

# For database migration (after setting DIRECT_URL)
pnpm prisma migrate dev --name add_mock_test_models
```

## Quick Commands

```bash
# Verify everything passes
pnpm typecheck
pnpm lint
pnpm test:p0

# Start development
pnpm dev
pnpm worker:dev
```

## Files Needing Attention

| Area | File | Issue |
|------|------|-------|
| Schema | prisma/schema.prisma | Migration pending |
| Admin UI | src/components/admin/test-detail-editor.tsx | Read-only sections |
| Speaking | src/components/ | Audio UI needed |