# DOshomik IELTS Evaluation Methods

## Purpose

This document defines how DOshomik IELTS evaluates practice and mock test work across Reading, Listening, Writing, Speaking, and full score prediction.

It is aligned with:

- Backend scoring/evaluation docs: [`backend/evaluation-and-scoring.md`](backend/evaluation-and-scoring.md)
- Backend jobs docs: [`backend/background-jobs.md`](backend/background-jobs.md)
- Frontend evaluation UI docs: [`frontend/writing-speaking-ui.md`](frontend/writing-speaking-ui.md)
- Frontend mock test UI docs: [`frontend/mock-test-ui.md`](frontend/mock-test-ui.md)
- Frontend API/state docs: [`frontend/state-and-api-integration.md`](frontend/state-and-api-integration.md)

---

## Core Evaluation Principles

- Reading and Listening are scored objectively.
- Writing and Speaking are estimated using rubric-based LLM evaluation with optional human review later.
- Speaking pronunciation is shown only when reliable audio analysis is available.
- Full overall predicted band is shown only after all four modules are complete.
- All predicted bands are unofficial estimates, not official IELTS results.
- Learner-facing APIs and screens must never expose answer keys.

---

## Shared Answer Normalization

Use normalization before comparing objective answers:

- Trim leading/trailing whitespace.
- Collapse repeated spaces.
- Lowercase when case is not meaningful.
- Ignore insignificant punctuation when appropriate.
- Compare against canonical answer and accepted alternatives.
- Support configured spelling variants.

Backend responsibility:

- Implement normalization and scoring.
- Store raw answers, correctness, raw score, and estimated band.

Frontend responsibility:

- Render answer inputs clearly.
- Submit learner answers without trying to score locally.
- Display correctness/explanations returned by backend.

---

## Reading Evaluation

Reading can be scored objectively.

### Backend Method

1. Load learner submitted answers.
2. Load answer keys and accepted alternatives.
3. Normalize answers.
4. Score raw correct answers.
5. Convert raw score to estimated band using configurable mapping.
6. Store `ModuleScore`.
7. Return learner-safe result with explanations, not hidden answer-key internals.

### Supported Question Types

- Multiple choice.
- Matching headings.
- True/False/Not Given.
- Yes/No/Not Given.
- Sentence completion.
- Summary completion.
- Short answer.

### Generated Content Requirements

Each Reading item should include:

- Correct answer.
- Accepted alternatives where useful.
- Explanation.
- Source span or rationale.
- Difficulty.

### Frontend Display

Reading UI should show:

- Passage.
- Questions.
- Learner answer inputs.
- Result after submission.
- Correct/incorrect state.
- Explanation.

Frontend reference:

- [`frontend/mock-test-ui.md`](frontend/mock-test-ui.md)

---

## Listening Evaluation

Listening can also be scored objectively.

### Backend Method

1. Confirm audio has safe source/license metadata.
2. Load transcript, questions, and answer keys.
3. Normalize answers.
4. Allow configured spelling variants.
5. Score raw correct answers.
6. Convert raw score to estimated band using configurable mapping.
7. Store `ModuleScore`.

### Audio Sources Allowed

- In-house recorded audio.
- Synthetic speech with commercial-use permission.
- Licensed audio where planned use is allowed.
- Public-domain audio only when license is verified.

### Metadata Required

- Audio source.
- License.
- Attribution where needed.
- Speaker/accent.
- Duration.
- Transcript.
- Review status.

### Frontend Display

Listening UI should show:

- Audio player.
- Playback instructions.
- Questions.
- Answer inputs.
- Result after submission.
- Explanation.

Frontend requirements:

- Audio controls must be keyboard accessible.
- Mobile UI must keep answer fields readable.

Frontend reference:

- [`frontend/accessibility-responsive.md`](frontend/accessibility-responsive.md)

---

## Writing Evaluation

Writing is evaluated using IELTS-style rubrics and async LLM jobs.

### Task 1 Criteria

- Task achievement.
- Coherence and cohesion.
- Lexical resource.
- Grammatical range and accuracy.

### Task 2 Criteria

- Task response.
- Coherence and cohesion.
- Lexical resource.
- Grammatical range and accuracy.

### Backend Flow

1. Validate task type.
2. Validate non-empty response.
3. Calculate word count.
4. Check minimum word count warning/validation.
5. Check prompt relevance.
6. Create `LlmJob` with type `writing_evaluation`.
7. Worker runs rubric-based LLM evaluation.
8. Validate structured JSON output.
9. Store criteria bands, overall band, feedback, examples, and next improvement task.
10. Mark job as `succeeded`, `failed`, or `needs_review`.

### Recommended LLM Output

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

### Production LLM Provider

The system supports two evaluation modes:

1. **Deterministic local provider** - Used when `LLM_PROVIDER` and `LLM_API_KEY` are not set. Suitable for MVP development and testing.
2. **Production LLM provider** - When environment variables are configured, the system uses OpenAI or Anthropic models with Zod schema validation.

Production provider implementation (`src/lib/evaluation/llm-provider.ts`):
- **OpenAI**: Uses `gpt-4o` for writing, `gpt-4o-mini` for speaking
- **Anthropic**: Uses `claude-sonnet-4-20250514` for writing, `claude-haiku-3-20240307` for speaking
- All responses validated against evaluation schema using Zod
- Automatic fallback to deterministic provider on errors

See [`backend/evaluation-and-scoring.md`](backend/evaluation-and-scoring.md) for configuration details.

### Frontend Flow

Writing UI should provide:

- Prompt display.
- Task type label.
- Textarea.
- Live word count.
- Save draft.
- Submit button.
- Evaluation status polling.
- Feedback panel.

Feedback panel should show:

- Estimated band.
- Criterion scores.
- Strengths.
- Weaknesses.
- Improved examples.
- Next improvement task.
- Unofficial estimate disclaimer.

Frontend reference:

- [`frontend/writing-speaking-ui.md`](frontend/writing-speaking-ui.md)

---

## Speaking Evaluation

Speaking is evaluated using IELTS-style criteria. MVP supports text response and optional audio response.

### Criteria

- Fluency and coherence.
- Lexical resource.
- Grammatical range and accuracy.
- Pronunciation.

### Text Response Flow

1. Learner submits typed response.
2. Backend queues `speaking_evaluation` job.
3. LLM evaluates relevance, fluency/coherence, vocabulary, and grammar.
4. Pronunciation is marked unavailable.
5. Feedback is stored and returned.

### Audio Response Flow

1. Learner records or uploads audio.
2. Frontend requests signed upload URL.
3. Audio uploads to private Supabase Storage.
4. Backend creates `MediaAsset`.
5. Backend queues transcription job.
6. Backend queues speaking evaluation from transcript.
7. Pronunciation score is included only if reliable audio analysis is available.

### Frontend Flow

Speaking UI should provide:

- Speaking Part 1/2/3 prompt display.
- Text response fallback.
- Audio recording/upload option.
- Recording timer.
- Playback before submit.
- Upload progress.
- Evaluation status polling.
- Feedback panel.

Feedback panel should show:

- Estimated band.
- Criteria scores.
- Transcript if available.
- Pronunciation unavailable notice when pronunciation is not scored.
- Strengths/issues.
- Suggested next speaking drill.

Frontend reference:

- [`frontend/writing-speaking-ui.md`](frontend/writing-speaking-ui.md)

---

## Async Evaluation Statuses

Use shared statuses across backend and frontend:

- `queued`
- `processing`
- `succeeded`
- `failed`
- `needs_review`

Backend responsibility:

- Persist job status.
- Retry transient failures with capped attempts.
- Store error JSON for failures.
- Store raw and parsed LLM outputs.

Frontend responsibility:

- Poll while queued/processing.
- Stop polling on final states.
- Show clear messages for failed/needs-review states.
- Let users leave and return later.

References:

- [`backend/background-jobs.md`](backend/background-jobs.md)
- [`frontend/state-and-api-integration.md`](frontend/state-and-api-integration.md)

---

## Full Score Prediction

Prediction inputs:

- Listening estimated band.
- Reading estimated band.
- Writing estimated band.
- Speaking estimated band.
- Completion time.
- Attempt consistency.
- Historical user performance if available.

### MVP Formula

1. Confirm all four module bands exist.
2. Average the four module bands.
3. Round to nearest 0.5 band.
4. Assign confidence: `low`, `medium`, or `high`.
5. Store `ScorePrediction`.
6. Return disclaimer.

### Confidence Rules

- Low: short mock, first full attempt, missing speaking audio, or missing pronunciation analysis.
- Medium: one complete full mock with all required sections.
- High: multiple complete mocks with consistent scores and human-reviewed Writing/Speaking samples.

### Frontend Display Rules

- Do not show final predicted overall band before all four modules are complete.
- Show incomplete/evaluating modules instead.
- Always show unofficial-score disclaimer near predicted score.
- Provide links to module feedback.

Frontend reference:

- [`frontend/mock-test-ui.md`](frontend/mock-test-ui.md)

---

## Evaluation Testing Requirements

### Backend Tests

- Reading answer normalization and accepted variants.
- Listening answer normalization and spelling variants.
- Writing evaluation job creation.
- Speaking text evaluation job creation.
- Speaking audio evaluation job creation with media asset.
- Failed job status and retry behavior.
- Score prediction blocked before all modules complete.
- Score prediction created after all module bands exist.
- Answer keys absent from learner APIs.

### Frontend Tests

- Reading/listening result display.
- Writing word count and validation.
- Writing evaluation polling.
- Speaking text fallback.
- Speaking audio upload status where available.
- Failed/needs-review status display.
- Final score hidden until complete.
- Disclaimer visible on score pages.

References:

- [`../testing-plans/backend-testing-plan.md`](../testing-plans/backend-testing-plan.md)
- [`../testing-plans/frontend-testing-plan.md`](../testing-plans/frontend-testing-plan.md)
