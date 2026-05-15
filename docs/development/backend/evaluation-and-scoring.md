# Evaluation And Scoring

## Principles

- Reading and listening are scored objectively.
- Writing and speaking are estimated using rubric-based LLM evaluation with optional human review.
- Full overall band prediction appears only after all four modules are complete.
- All bands are unofficial estimates.

## Current Implementation Status

- **Reading/Listening Scoring:** Fully implemented in submission flow (`/api/attempts/[id]/submit-section`)
- **Writing Evaluation:** Implemented - `/api/evaluations/writing` creates `WritingEvaluation` + `LlmJob`
- **Speaking Evaluation:** Implemented - `/api/evaluations/speaking` creates `SpeakingEvaluation` + `LlmJob`
- **Score Prediction:** Implemented - `/api/attempts/[id]/predict-score` when all 4 modules complete
- **Production LLM:** Implemented - supports OpenAI, Anthropic, and Gemini with Zod validation
- **EvaluationCalibration:** Model added for tracking LLM accuracy vs human scores
- **ScoreMapping:** Model added for configurable raw-to-band score mappings
- **Auto-completion:** Worker auto-completes `MockTestAttempt` when all 4 module scores exist

## Answer Normalization

Apply normalization before comparing objective answers:

- Trim whitespace.
- Collapse repeated spaces.
- Lowercase when case is not meaningful.
- Remove insignificant punctuation when appropriate.
- Compare against canonical answer and accepted alternatives.
- Support spelling variants where explicitly configured.

## Reading Scoring

Flow:

1. Load submitted reading answers.
2. Load answer keys and accepted alternatives.
3. Normalize learner answers.
4. Calculate raw correct count.
5. Convert raw score to estimated band using a configurable mapping table.
6. Store `ModuleScore` with feedback and raw details.

Supported question types:

- Multiple choice
- Matching headings
- True/False/Not Given
- Yes/No/Not Given
- Sentence completion
- Summary completion
- Short answer

Each generated reading question should include:

- Correct answer
- Accepted alternatives
- Explanation
- Source span or rationale
- Difficulty

## Listening Scoring

Flow:

1. Confirm audio is original, licensed, public-domain-valid, generated, or in-house recorded.
2. Load transcript and answer keys.
3. Normalize answers.
4. Score objective answers.
5. Convert raw score to estimated band using configurable mapping.
6. Store `ModuleScore`.

Listening content must include:

- Transcript
- Audio source/license metadata
- Speaker/accent metadata
- Duration
- Answer key
- Explanation

## Writing Evaluation

Writing tasks are evaluated against IELTS-style rubrics. The system supports two evaluation modes:

1. **Deterministic local provider** - Uses algorithmic scoring based on response length, lexical variety, and basic grammar signals. Suitable for MVP development and testing.
2. **Production LLM provider** - Uses OpenAI or Anthropic models with IELTS rubric prompts for higher quality evaluation.

The system automatically selects the provider based on environment variables:
- If `LLM_PROVIDER` and `LLM_API_KEY` are set, uses production provider
- Otherwise, falls back to deterministic local provider

Task 1 criteria:

- Task achievement
- Coherence and cohesion
- Lexical resource
- Grammatical range and accuracy

Task 2 criteria:

- Task response
- Coherence and cohesion
- Lexical resource
- Grammatical range and accuracy

Flow:

1. Validate task type, word count, and non-empty response.
2. Check prompt relevance and obvious copied/off-topic content.
3. Create `LlmJob` with type `writing_evaluation`.
4. Worker runs rubric prompt through configured LLM provider.
5. Store criterion bands, overall estimated band, feedback, examples, and next improvement task.
6. Mark evaluation `succeeded`, `failed`, or `needs_review`.

Recommended LLM output shape:

```json
{
  "criteriaBands": {
    "taskAchievementOrResponse": 6.0,
    "coherenceAndCohesion": 6.0,
    "lexicalResource": 6.5,
    "grammaticalRangeAndAccuracy": 6.0
  },
  "overallBand": 6.0,
  "strengths": [],
  "weaknesses": [],
  "examplesFromResponse": [],
  "improvedExamples": [],
  "nextImprovementTask": "",
  "needsHumanReview": false
}
```

## Speaking Evaluation

Speaking criteria:

- Fluency and coherence
- Lexical resource
- Grammatical range and accuracy
- Pronunciation (if audio analysis available)

The system supports text response and audio response. Audio responses are evaluated using transcripts; pronunciation scoring requires audio analysis capability.

## Production LLM Provider

The production LLM provider (`src/lib/evaluation/llm-provider.ts`) supports:

### OpenAI
- Models: configurable via `LLM_MODEL_WRITING` / `LLM_MODEL_SPEAKING`
- Environment: `LLM_PROVIDER=openai`, `LLM_API_KEY`, `OPENAI_BASE_URL` (optional)
- Output format: JSON with Zod schema validation

### Anthropic
- Models: configurable via `LLM_MODEL_WRITING` / `LLM_MODEL_SPEAKING`
- Environment: `LLM_PROVIDER=anthropic`, `LLM_API_KEY`, `ANTHROPIC_BASE_URL` (optional)
- Output format: JSON with Zod schema validation

### Gemini (added 2026-05-15)
- Models: configurable via `LLM_MODEL_WRITING` / `LLM_MODEL_SPEAKING`
- Environment: `LLM_PROVIDER=gemini`, `LLM_API_KEY`
- Output format: JSON with Zod schema validation

### Schema Validation

All LLM responses are validated against the evaluation schema (`src/lib/evaluation/schemas.ts`) using Zod:

```typescript
{
  overallBand: number (1-9)
  criteriaBands: Record<string, number>
  feedback: {
    summary: string
    strengths: string[]
    improvements: string[]
    nextTask: string
  }
  needsHumanReview: boolean
}
```

### Evaluation Provider Selection

The system uses `src/lib/evaluation/provider.ts` which selects between:
- **Deterministic provider** — algorithmic scoring based on response length, lexical variety, and basic grammar signals (fallback when no LLM configured)
- **Production LLM provider** — OpenAI, Anthropic, or Gemini based on `LLM_PROVIDER` env var

Text-only flow:

1. Save response text.
2. Queue LLM speaking evaluation.
3. Evaluate fluency/coherence, vocabulary, grammar, and relevance.
4. Do not score pronunciation.

Audio flow:

1. Upload recording to Supabase Storage.
2. Create media asset.
3. Queue transcription job.
4. Queue speaking evaluation using transcript.
5. Add pronunciation score only if audio analysis is available.

Recommended feedback:

- Estimated band
- Criterion-level scores
- Strengths
- Main problems
- Improved sample answer
- One next speaking drill

## Score Prediction

Requirements:

- Listening module completed.
- Reading module completed.
- Writing evaluation completed.
- Speaking evaluation completed.

Formula for MVP:

1. Use module bands directly.
2. Average listening, reading, writing, and speaking bands.
3. Round to nearest 0.5.
4. Assign confidence.

Confidence rules:

- `low`: short mock, first full attempt, missing speaking audio, or missing pronunciation analysis.
- `medium`: one complete full mock with all sections.
- `high`: multiple complete mocks with consistent scores and human-reviewed writing/speaking samples.

Prediction response must include disclaimer:

> This is an unofficial IELTS band estimate for practice only. It is not an official IELTS result.
