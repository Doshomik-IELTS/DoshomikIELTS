# Frontend Screens And User Flows

## Primary Learner Journey

1. Visitor lands on homepage.
2. Visitor registers or logs in.
3. Learner sees welcome/onboarding page (`/welcome`).
4. Learner completes profile.
5. Learner studies resources.
6. Learner completes focused practice.
7. Learner starts mock test.
8. Learner submits Listening and Reading sections.
9. Learner submits Writing and Speaking responses.
10. Learner waits for async evaluation.
11. Learner views final score prediction after all modules complete.
12. Learner returns to dashboard for next actions.

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

## Changelog Page

Route: `/changelog`

Sections:

- Product update history.
- Version/release entries with dates.
- Feature additions, improvements, and fixes.
- Reverse chronological order.

## Welcome Page

Route: `/welcome`

Purpose:

- Onboarding screen for new users.
- Quick introduction to platform features.
- CTA to complete profile or start learning.

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
- Streak badge (flame icon + current/longest streak).
- Achievement badges panel (earned/locked badges grid).
- Learning progress bar (overall completion percentage).
- Recent attempts.
- Saved resources.
- Continue practice CTA.
- Start mock test CTA.

Empty states:

- No score yet.
- No attempts yet.
- No saved resources yet.
- Streak at 0 (grayscale flame).

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
- Save/unsave action (icon bookmark button).
- Empty state when no results.

### Resource Detail

Sections:

- Title.
- Category/difficulty/tags.
- Body content.
- Examples.
- Practice questions or related practice CTA.
- Save/unsave button.

## Flashcard Flow

### Flashcard Deck List (`/flashcards`)

Features:

- Category filter tabs.
- Deck cards showing title, description, card count, difficulty.
- "Study Now" CTA to enter study session.
- Suspense boundary for useSearchParams compatibility.

### Flashcard Deck Detail (`/flashcards/[id]`)

Sections:

- Deck title and description.
- Card count and mastery progress.
- "Study Now" CTA.
- Card preview list.

### Study Session (`/flashcards/[id]/study`)

SM-2 spaced repetition session:

- Flip card UI (click to reveal answer).
- Quality rating buttons: Again (0), Hard (2), Good (4), Easy (5).
- Progress bar showing cards reviewed.
- Session complete screen with stats.
- "Study More" to continue with remaining cards.

### Admin Flashcards (`/admin/flashcards`)

- Deck list with search/filters.
- Create new deck modal.
- Delete deck with confirmation.
- "Edit" links to deck editor.

### Admin Deck Editor (`/admin/flashcards/[id]`)

- Deck metadata (title, description, category, difficulty, tags).
- Card list with inline edit.
- Add card form (front, back, examples, hints).
- Edit/delete individual cards inline.

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

## Evaluation Detail Flow

Route: `/evaluations/[id]`

Show:

- Evaluation type (writing/speaking).
- Status badge (queued/processing/succeeded/failed/needs_review).
- Polling indicator while queued/processing.
- For succeeded: criteria bands, overall band, feedback, strengths, weaknesses.
- For failed: error message and retry option.
- For needs_review: human review pending message.
- Unofficial estimate disclaimer.

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
