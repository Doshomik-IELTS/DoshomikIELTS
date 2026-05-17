# Backend Testing Plan

## Current Implementation Status

**TypeScript, Lint, Build:** ✅ All passing
**P0 Tests:** ✅ 12/12 passing

### Implemented API Routes

| Route | Status |
|-------|--------|
| `/api/me` (session) | ✅ Implemented |
| `/api/profile` | ✅ Implemented |
| `/api/resources` | ✅ Implemented |
| `/api/resources/[id]` | ✅ Implemented |
| `/api/resources/[id]/save` | ✅ Implemented |
| `/api/practice` | ✅ Implemented |
| `/api/practice/[id]/attempt` | ✅ Implemented |
| `/api/practice/attempts` | ✅ Implemented |
| `/api/mock-tests` | ✅ Implemented |
| `/api/mock-tests/[id]` | ✅ Implemented |
| `/api/mock-tests/[id]/start` | ✅ Implemented |
| `/api/attempts/[attemptId]/answers` | ✅ Implemented |
| `/api/attempts/[attemptId]/submit-section` | ✅ Implemented |
| `/api/attempts/[attemptId]/report` | ✅ Implemented |
| `/api/attempts/[attemptId]/predict-score` | ✅ Implemented |
| `/api/evaluations/writing` | ✅ Implemented |
| `/api/evaluations/speaking` | ✅ Implemented |
| `/api/evaluations/[id]` | ✅ Implemented |
| `/api/media/upload-url` | ✅ Implemented |
| `/api/media/[assetId]/download-url` | ✅ Implemented |
| `/api/admin/*` | ✅ Implemented |

## Auth And Profile

Test cases:

- Unauthenticated protected route returns `401`.
- Authenticated user can read own profile.
- Authenticated user can update allowed profile fields.
- User cannot read or update another user profile.
- Role-protected route rejects learner without admin/reviewer/evaluator role.

**Current Status:** API implemented, P0 contract tests needed.

## Resources

Test cases:

- Published resources are visible to learners.
- Draft/review/archived resources are hidden from learner APIs.
- Resource filters work by category, difficulty, tag, and search.
- Saved resource endpoint toggles saved state.

**Current Status:** API implemented, contract tests needed.

## Practice

Test cases:

- Learner can create practice attempt.
- Objective answers are normalized before scoring.
- Accepted alternatives are scored correctly.
- Feedback and time spent are stored.
- Subjective practice creates evaluation job when applicable.

**Current Status:** API implemented, contract tests needed.

## Mock Tests

Test cases:

- Learner resource/test APIs read published Strapi content when `STRAPI_BASE_URL` and `STRAPI_API_TOKEN` are configured.
- Learner resource/test APIs fall back to published Prisma content when Strapi is not configured.
- Learner can start published mock test.
- Starting a Strapi-authored mock test materializes stable Prisma runtime rows before creating the attempt.
- Answer keys are not returned in learner test payload. ✅ **P0 Verified**
- Learner can save draft answers. ✅ **P0 Verified**
- Learner can submit a section.
- Reading/listening sections are scored immediately.
- Writing/speaking sections create async jobs.
- Learner cannot submit answers to another learner's attempt.

**Current Status:** Answer key exclusion verified in P0 tests.

## Evaluation

Test cases:

- Writing evaluation job is created with valid response. ✅ **P0 Verified**
- Empty writing response is rejected.
- Speaking text response creates speaking evaluation job. ✅ **P0 Verified**
- Speaking audio response requires valid media asset.
- Evaluation status transitions are stored.
- Failed provider call marks job failed or retried according to retry rules.
- `needs_review` state is stored when evaluator flags are triggered. ✅ **P0 Verified**

**Current Status:** Evaluation schema and provider tested in P0.

## Score Prediction

Test cases:

- Full score prediction is blocked before all four modules are complete. ✅ **P0 Verified**
- Prediction is created after listening, reading, writing, and speaking bands exist.
- Overall band is rounded to nearest 0.5.
- Confidence is returned.
- Disclaimer is returned. ✅ **P0 Verified**

**Current Status:** Score gating verified in P0 tests.

## Media

Test cases:

- Signed upload URL rejects unsupported content type.
- Signed upload URL rejects oversized speaking recording.
- Signed download URL requires ownership or proper role. ✅ **P0 Verified**
- Private media URL is short-lived.
- Media asset metadata is stored.

**Current Status:** Ownership checks verified in P0 tests.

## Security And Compliance

Test cases:

- Learner cannot access admin APIs.
- Learner cannot access another learner's media. ✅ **P0 Verified**
- Rate-limited endpoints return `429` after threshold.
- Answer keys are excluded from learner-facing APIs. ✅ **P0 Verified**
- Copyright metadata is required for licensed/public-domain listening audio.
- External study records store labels only, not copied content.

## Background Jobs

Test cases:

- Writing evaluation creates a durable queued job record and/or BullMQ job.
- Speaking evaluation creates a durable queued job record and/or BullMQ job.
- Speaking transcription job is created when audio is submitted after media endpoints exist.
- Successful worker result updates evaluation and module score.
- Failed job records error JSON.
- Retry count is capped.
- Score prediction job runs only when all required module scores exist.

**Current Status:** Worker scaffold exists, integration tests needed.

## Current P0 Verification

- ✅ `pnpm typecheck` passes
- ✅ `pnpm lint` passes (0 warnings)
- ✅ `pnpm build` passes
- ✅ 12 P0 tests passing

### Verified P0 Tests

1. Writing evaluation returns rubric bands and feedback ✅
2. Short speaking responses are flagged for human review ✅
3. Schema validates LLM output structure ✅
4. Schema rejects invalid band scores ✅
5. Schema rejects negative band scores ✅
6. Writing response has all four criteria ✅
7. Speaking response has all four criteria ✅
8. Provider metadata is included in result ✅
9. Learner mock test route does not select answer keys ✅
10. Score prediction route requires all four module scores ✅
11. Attempt answer route preserves draft state separately from submitted answers ✅
12. Private media signed URL routes exist and enforce ownership checks ✅

### Gaps To Fill (Priority Order)

1. Admin API authorization tests
2. Resource filter contract tests
3. Practice answer validation tests
4. Mock test section submission tests
5. Evaluation job creation tests
6. Rate limiting tests (manual or automated)
