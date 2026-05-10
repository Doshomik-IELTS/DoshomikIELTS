# Frontend Screens And User Flows

## Primary Learner Journey

1. Visitor lands on homepage.
2. Visitor registers or logs in.
3. Learner completes profile.
4. Learner studies resources.
5. Learner completes focused practice.
6. Learner starts mock test.
7. Learner submits Listening and Reading sections.
8. Learner submits Writing and Speaking responses.
9. Learner waits for async evaluation.
10. Learner views final score prediction after all modules complete.
11. Learner returns to dashboard for next actions.

## Public Landing Page

Sections:

- Hero with value proposition.
- Feature highlights:
  - Basic English foundation.
  - Practice modules.
  - Full mock tests.
  - Writing/Speaking feedback.
  - Score prediction.
- Copyright-safe original content message.
- CTA to register.

## Auth Screens

### Register

Fields:

- Email.
- Password or magic-link flow depending on Supabase configuration.

### Login

Fields:

- Email.
- Password or magic-link flow.

### Reset Password

Fields:

- Email.

Auth states:

- Loading.
- Invalid credentials.
- Email sent.
- Session expired.
- Redirecting.

## Dashboard Screen

Widgets:

- Welcome/profile summary.
- Target band and exam date.
- Latest predicted score.
- Module score cards.
- Recent attempts.
- Saved resources.
- Continue practice CTA.
- Start mock test CTA.

Empty states:

- No score yet.
- No attempts yet.
- No saved resources yet.

## Profile Screen

Fields:

- Name.
- Email readonly if auth-managed.
- Target band.
- Exam date.
- Native language.
- Study goal.

Behavior:

- Inline validation.
- Save button loading state.
- Success toast.
- Error state.

## Resource Flow

### Resource List

Features:

- Search.
- Category filter.
- Difficulty filter.
- Tag display.
- Save/unsave action.
- Empty state when no results.

### Resource Detail

Sections:

- Title.
- Category/difficulty/tags.
- Body content.
- Examples.
- Practice questions or related practice CTA.
- Save/unsave button.

## Practice Flow

### Practice List

Filters:

- Type.
- Category.
- Difficulty.

### Practice Attempt

Question rendering:

- Multiple choice.
- Short answer.
- Matching.
- Grammar correction.
- Reading passage with questions.
- Listening audio with questions.
- Writing prompt.
- Speaking cue card.

### Practice Result

Show:

- Score.
- Correct/incorrect answers.
- Explanations.
- Time spent.
- Retry/next CTA.

For writing/speaking practice:

- Show evaluation pending/processing/completed/failed.

## Mock Test Flow

### Mock Test List

Show:

- Test title.
- Type: short mock or full mock.
- Modules included.
- Estimated duration.
- Start/continue CTA.

### Mock Test Overview

Show:

- Test instructions.
- Section list.
- Timing.
- Score prediction requirement.
- Start test CTA.

### Active Attempt

Show:

- Section navigation.
- Section instructions.
- Questions/prompts.
- Draft save state.
- Submit section CTA.
- Status per section.

### Attempt Status

Show:

- Submitted sections.
- Scored sections.
- Evaluating sections.
- Missing sections.
- Final score availability.

### Attempt Report (`/attempts/[id]/report`)

Show:

- Detailed breakdown by section.
- Question-level results for objective sections.
- Evaluation feedback for writing/speaking.
- Band scores per module.
- Overall predicted band with disclaimer.

### Score Page (`/attempts/[id]/score`)

Show:

- Listening band.
- Reading band.
- Writing band.
- Speaking band.
- Overall predicted band.
- Confidence (low/medium/high).
- Disclaimer.
- Link to detailed report (`/attempts/[id]/report`).

## Admin Flow

### Admin Dashboard

Show:

- Draft resources count.
- Review resources count.
- Published resources count.
- Draft tests count.
- Review queue count.

### Resource Admin

Actions:

- Create resource.
- Edit resource.
- Set status.
- Publish/archive.

### Test Admin

Actions:

- Create test metadata.
- Create sections.
- Add prompts/questions.
- Manage status.

### Review Queue

Actions:

- View item.
- Approve/publish.
- Reject/archive with note.

Admin warning:

- Do not upload/copy Cambridge IELTS or commercial book content.
