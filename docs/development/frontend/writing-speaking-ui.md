# Writing And Speaking Frontend UI

## Implementation Status

Components implemented in `src/components/ielts/`:

- `WritingEditor` - Writing response with live word count, progress bar, auto-save
- `SpeakingRecorder` - Audio recording with playback
- `SpeakingSubmission` - Text/audio submission support
- `TestTimer` - Countdown timer with auto-submit on expiry
- `EvaluationStatusBadge` - Status display (queued/processing/succeeded/failed/needs_review)
- `ScoreBadge` - Band score display
- `IeltsSectionRenderer` - Section rendering with question groups
- `ObjectiveQuestionRenderer` - Objective question rendering (MC, T/F/NG, matching, etc.)

## Writing UI

### WritingEditor Component

Reusable component at `src/components/ielts/writing-editor.tsx`:

Props:

- `value`, `onChange` — controlled textarea state
- `disabled` — disables editing
- `taskType` — `"task1"` (150-word min) or `"task2"` (250-word min)
- `onWordCountChange?` — callback when word count updates
- `autoSaveKey?` — localStorage key for auto-save
- `autoSaveIntervalMs?` — auto-save interval (default 5000ms)

Features:

- Live word count with task-specific minimum (150/250)
- Character count
- Progress bar showing word count vs. minimum
- Warning color when approaching minimum
- Auto-save to localStorage with "Draft saved" indicator
- Draft restoration on mount

### Screen Elements

- Task type label: Task 1 or Task 2.
- Prompt/instructions.
- WritingEditor component.
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
