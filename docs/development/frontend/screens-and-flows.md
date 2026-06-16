# Frontend Screens And User Flows

**Last updated:** 2026-06-17 — Landing page redesigned with single-scroll dark section layout, auth moved to modal flow.

## Primary Learner Journey

1. Visitor lands on homepage (dark-themed single-scroll landing page).
2. Visitor registers or logs in via **auth modal** (no separate auth pages).
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

The landing page is a **dark-themed single-scroll page** using `(public)` route group with `PublicHeader`. Sections:

### Hero
- Full-viewport hero with headline, subheadline, and primary CTA buttons
- Floating mockup/illustration (e.g. dashboard preview image)
- Gradient overlay on dark background

### Courses / Modules
- Grid of course cards (Basic English, Practice, Mock Tests, etc.)
- Each card has icon, title, description, and link
- Hover lift effect with shadow

### Mentor / Instructor
- Instructor profile with image, credentials, and bio
- Teaching philosophy and approach section

### Testimonials
- Social proof cards with learner quotes
- Avatar, name, score improvement, and testimonial text
- Subtle card shadows and hover state

### Newsletter / CTA
- Email signup form with call-to-action
- Final conversion prompt before auth

### Footer
- Product links, legal links, social links
- Copyright notice

### Changelog Page

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

Auth is handled via a **modal dialog** that overlays the current page. The modal supports three views:

### Login

Fields:
- Email.
- Password.

### Register

Fields:
- Email.
- Password.

### Reset Password

Fields:
- Email.

Auth states:
- Loading (spinner).
- Invalid credentials (inline error).
- Email sent (success message).
- Session expired (prompt to re-login).
- Redirecting.

**Note:** Standalone `/login`, `/register`, and `/reset-password` pages still exist as fallback routes but the primary login flow uses the auth modal. The modal can be triggered from the Public Header CTA or from any page that detects an unauthenticated session.

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
- Operational stats.
- Strapi resource/mock-test entry points.
- Content sync/fallback health when available.
- Review queue count.

### Resource Admin

Actions:
- Open Strapi Resource collection.
- Preview/verify learner resource behavior when Strapi is configured.
- Use legacy Prisma resource tools only for fallback/local content.

### Test Admin

Actions:
- Open Strapi Mock Test collection.
- Author sections, question groups, questions, answer keys, explanations, and media in Strapi.
- Use legacy Prisma test tools only for fallback/local tests.

### Review Queue

Actions:
- View item.
- Approve/publish.
- Reject/archive with note.

Admin warning:
- Do not upload/copy Cambridge IELTS or commercial book content.