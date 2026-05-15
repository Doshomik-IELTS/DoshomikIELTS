# Background Jobs

## Queue Stack

Use BullMQ with Redis (via `ioredis`).

Jobs should be used for long-running, expensive, or failure-prone work so learner submissions return quickly.

## Current Implementation Status

- Queue names are defined in `src/lib/queue/names.ts`.
- Redis connection is defined in `src/lib/queue/connection.ts` and requires `REDIS_URL`.
- `src/workers/index.ts` starts BullMQ workers for all 6 queue names.
- Writing/speaking evaluation endpoints create queued linked `LlmJob` rows in Postgres and enqueue BullMQ jobs when `REDIS_URL` is configured.
- Writing/speaking worker handlers process jobs through `src/lib/evaluation/processors.ts`.
- `src/lib/evaluation/provider.ts` selects between deterministic local provider (for MVP/testing) and production LLM provider (OpenAI/Anthropic/Gemini) based on environment configuration.
- Worker auto-completes `MockTestAttempt` when all 4 module scores are present.

**Defined queue names (6 total):**

| Queue Name | Status |
|---|---|
| `writing-evaluation` | ✅ Worker implemented |
| `speaking-transcription` | ⚠️ Queue defined, worker not implemented |
| `speaking-evaluation` | ✅ Worker implemented |
| `score-prediction` | ⚠️ Queue defined, worker not implemented |
| `content-validation` | ⚠️ Queue defined, worker not implemented |
| `media-processing` | ⚠️ Queue defined, worker not implemented |

**Current worker capabilities (2 of 6 queues):**
- Writing evaluation (Task 1 and Task 2) — processes `LlmJob` via `processLlmJob()`
- Speaking evaluation (with text or transcript) — processes `LlmJob` via `processLlmJob()`
- Auto-completion of mock test attempts when all modules are scored

**Note:** The worker (`src/workers/index.ts`) only processes `writing-evaluation` and `speaking-evaluation` queues. The other 4 queues (`speaking-transcription`, `score-prediction`, `content-validation`, `media-processing`) are defined but their handlers are not yet implemented in the worker.

## Provider Selection

The system supports two evaluation providers:

### Deterministic Provider (Default/Fallback)
- Location: `src/lib/evaluation/provider.ts`
- Uses algorithmic scoring based on response length, lexical variety, and basic grammar signals
- Suitable for MVP development and testing
- No external API keys required
- Activated when `LLM_PROVIDER` and `LLM_API_KEY` are not set

### Production LLM Provider
- Location: `src/lib/evaluation/llm-provider.ts`
- Supports OpenAI, Anthropic, and Gemini models
- Requires `LLM_PROVIDER` and `LLM_API_KEY` environment variables
- Uses Zod schema validation for output (`src/lib/evaluation/schemas.ts`)
- Activated when both `LLM_PROVIDER` and `LLM_API_KEY` are set

**Enqueue Configuration:**
```typescript
// src/lib/queue/enqueue.ts
// Exponential backoff: 3 attempts, 5s initial delay
{ attempts: 3, backoff: { type: "exponential", delay: 5000 } }
```

## Evaluation Calibration

The system tracks LLM evaluation accuracy via the `EvaluationCalibration` model:

- Stores provider, model, prompt version, average deviation from human scores, and sample size
- Enables tracking of evaluation quality over time

## Job Statuses

Standard statuses:

- `queued`
- `processing`
- `succeeded`
- `failed`
- `needs_review`

## Queues

### `writing-evaluation`

Evaluates writing Task 1 and Task 2 responses.

Responsibilities:

- Validate input snapshot.
- Call LLM provider.
- Parse structured JSON output.
- Store `WritingEvaluation` and `ModuleScore`.
- Flag human review when needed.

### `speaking-transcription`

Transcribes uploaded speaking recordings.

Responsibilities:

- Load recording by signed/internal access.
- Call transcription provider.
- Store transcript.
- Trigger speaking evaluation job.

### `speaking-evaluation`

Evaluates text or transcribed speaking responses.

Responsibilities:

- Evaluate relevance, fluency/coherence, vocabulary, and grammar.
- Add pronunciation only if supported by audio analysis.
- Store `SpeakingEvaluation` and `ModuleScore`.

### `score-prediction`

Generates full overall score estimate.

Responsibilities:

- Confirm all four module bands exist.
- Average and round bands.
- Assign confidence.
- Store `ScorePrediction`.

### `content-validation`

Validates generated or imported content.

Responsibilities:

- Check required fields.
- Check answer keys exist.
- Check explanations exist.
- Flag originality/license concerns for human review.

### `media-processing`

Processes audio and generated files.

Responsibilities:

- Validate metadata.
- Extract duration.
- Normalize/transcode if needed.
- Mark media ready.

## Retry Rules

Current implementation (from `src/lib/queue/enqueue.ts`):

- **Max attempts:** 3
- **Backoff strategy:** Exponential
- **Initial delay:** 5000ms (5 seconds)
- Retry transient provider/network failures.
- Cap retries to prevent runaway cost.
- Mark permanent validation problems as `failed`.
- Mark suspicious or ambiguous evaluation results as `needs_review`.

## Failure Handling

Learner-facing behavior:

- Show evaluation as pending while queued/processing.
- Show retryable failure message if provider fails.
- Do not produce full score prediction while required evaluations are missing.

Admin/reviewer behavior:

- Failed jobs should be searchable.
- `needs_review` jobs should expose input, output, and reason for review.

### Auto-Completion

When both writing and speaking evaluations complete successfully, the worker checks if all 4 module scores exist. If so, it automatically:
1. Sets `MockTestAttempt.status` to `completed`
2. Sets `MockTestAttempt.completedAt` to current timestamp

## LLM Provider Layer

The worker must call a provider abstraction, not hardcoded provider logic inside route handlers.

Store on each `LlmJob`:

- Provider
- Model
- Prompt version
- Input JSON
- Output JSON
- Error JSON
- Attempt count
- Latency/cost metadata if available
