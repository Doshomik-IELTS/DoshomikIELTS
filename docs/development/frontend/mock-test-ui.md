# Mock Test Frontend UI

## Purpose

The mock test UI is one of the highest-complexity frontend areas. It must support a realistic IELTS-style flow without exposing answer keys or losing learner answers.

## Mock Test Pages

### `/mock-tests`

Show:

- Published mock tests.
- Test type: short mock or full mock.
- Estimated duration.
- Modules included.
- Start or continue CTA.

### `/mock-tests/[id]`

Show:

- Test overview.
- Section list.
- Timing/instructions.
- Score prediction requirement.
- Start attempt CTA.

### `/attempts/[id]`

Main active attempt page.

Show:

- Section navigation.
- Current section status.
- Instructions.
- Questions/prompts.
- Draft save state.
- Submit section CTA.

### `/attempts/[id]/score`

Shows score only if all required modules are complete.

If complete:

- Listening/Reading/Writing/Speaking bands.
- Overall predicted band.
- Confidence level.
- Disclaimer.
- Link to detailed report.

If incomplete:

- Show progress.
- Show missing/evaluating sections.
- Do not show overall predicted band.

### `/attempts/[id]/report`

Detailed attempt report showing:

- Section-by-section breakdown.
- Question-level results for objective questions.
- Evaluation feedback for writing/speaking.
- Module scores with criteria details.

## Section UI Requirements

### Listening

- Audio player.
- Playback instructions.
- Question list.
- Answer inputs.
- Submit section.

Accessibility:

- Audio controls keyboard accessible.
- Clear labels for answers.

### Reading

- Passage display.
- Question list.
- Answer inputs.
- Desktop/tablet layout can use passage left + questions right.
- Mobile layout should stack passage and questions.

Optional post-MVP:

- Highlighting.
- Notes.

### Writing

- Prompt display.
- Task 1/Task 2 label.
- Textarea.
- Live word count.
- Draft save.
- Submit.

### Speaking

- Prompt/cue card display.
- Part label.
- Text response fallback.
- Audio recording/upload where supported.
- Submit.

## Question Renderer

Create a shared `QuestionRenderer` that supports:

- Multiple choice.
- Matching.
- True/False/Not Given.
- Yes/No/Not Given.
- Sentence completion.
- Summary completion.
- Short answer.
- Grammar correction.
- Writing prompt.
- Speaking prompt.

The renderer should receive learner-visible question data only. It must never require answer keys.

## Draft Safety

Use layered safety:

- Keep answer state in React/component state.
- Save drafts to backend where available.
- Optionally mirror unsent answers to local storage.
- Warn before navigation when unsaved changes exist.

## Submission Rules

Before submitting:

- Validate required fields where applicable.
- Confirm section submission if it locks answers.
- Disable button while submitting.
- Preserve answers if submission fails.

After submitting:

- Mark section as submitted.
- Lock answer editing for submitted section unless backend allows retake.
- Show objective result for Reading/Listening when returned.
- Show evaluation pending for Writing/Speaking.

## Score Gating

The frontend must not show final predicted overall band until backend confirms all required modules are complete.

Incomplete attempt page should show:

- Completed modules.
- Missing modules.
- Evaluating modules.
- CTA to continue.

## Risk Mitigation

- Keep first MVP mock test UI simple.
- Defer highlighting/notes if timeline is tight.
- Build one reusable question renderer early.
- Test answer persistence heavily.
- Add explicit tests that answer keys are absent from learner data.
