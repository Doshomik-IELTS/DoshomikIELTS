# Writing And Speaking Frontend UI

## Implementation Status

Components implemented in `src/components/ielts/`:

- `SpeakingRecorder` - Audio recording with playback
- `SpeakingSubmission` - Text/audio submission support
- `EvaluationStatusBadge` - Status display (queued/processing/succeeded/failed/needs_review)
- `ScoreBadge` - Band score display

## Writing UI

### Screen Elements

- Task type label: Task 1 or Task 2.
- Prompt/instructions.
- Textarea.
- Live word count.
- Save draft button.
- Submit button.
- Evaluation status.
- Feedback panel.

### Validation

- Response cannot be empty.
- Show word count warning if too short.
- Preserve text on failed submission.

### Feedback Panel

Show:

- Estimated band.
- Criteria scores.
- Strengths.
- Weaknesses.
- Examples from response if available.
- Improved examples.
- Next improvement task.
- Unofficial estimate disclaimer.

Task criteria:

- Task Achievement or Task Response.
- Coherence and Cohesion.
- Lexical Resource.
- Grammatical Range and Accuracy.

## Speaking UI

### Text Response Path

Must support:

- Prompt display.
- Textarea response.
- Submit.
- Evaluation status.
- Feedback panel.

This is the required fallback if audio recording fails or is unsupported.

### Audio Response Path

Support where browser/device allows:

- Start recording.
- Stop recording.
- Recording timer.
- Playback before submit.
- Re-record.
- Upload progress.
- Submit for evaluation.

### Upload Path

Also support file upload if direct recording is unavailable.

Allowed formats should match backend validation:

- `audio/webm`
- `audio/mpeg`
- `audio/mp4`
- `audio/wav`

## Speaking Feedback Panel

Show:

- Estimated band.
- Fluency/coherence feedback.
- Lexical resource feedback.
- Grammar feedback.
- Pronunciation feedback only if backend provides it.
- Transcript if available.
- Strengths.
- Main issues.
- Suggested next drill.

If pronunciation is unavailable, show:

> Pronunciation was not scored for this attempt because reliable audio analysis was not available.

## Evaluation Status UI

Statuses:

- Draft.
- Submitted.
- Queued.
- Processing.
- Completed.
- Failed.
- Needs review.

UX rules:

- Do not show blank waiting pages.
- Show clear status messages.
- Poll while queued/processing.
- Stop polling on final states.
- Allow user to return later.

## Media Upload Flow

1. User records/selects audio.
2. Frontend requests signed upload URL.
3. Frontend uploads file directly to Supabase Storage.
4. Frontend submits evaluation request with `mediaAssetId`.
5. Frontend polls evaluation/job status.

## Accessibility Requirements

- Recording controls must be keyboard usable.
- Buttons must have clear labels.
- Timer/status should be visible in text.
- Upload errors must be screen-reader accessible.
- Feedback criteria should use headings/lists for readability.

## MVP Simplification

If audio recording becomes too risky for launch:

- Keep speaking text response evaluation.
- Allow audio file upload as P1.
- Defer in-browser recording polish.
- Do not block full MVP on advanced pronunciation scoring.
