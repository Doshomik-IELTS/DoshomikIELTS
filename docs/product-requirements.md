# Product Requirements

**Last updated:** 2026-06-17 — Design system finalized: indigo/purple primary (`#6556ff`), Poppins font, `@theme inline` CSS variable tokens in Tailwind v4.

## Goal

Build an owned IELTS resource and mock-test platform where learners can study basic English foundations, practice all four IELTS modules, complete full mock tests, and receive an estimated band score.

## Users

- Learner: studies resources, practices modules, takes mock tests, views score history.
- Admin/content reviewer: creates, reviews, publishes, and retires resources and test material in Strapi; manages app operations and reviews in the IELTS++ admin area.
- Evaluator: reviews flagged writing/speaking responses when human review is needed.

## Resource Library

Resource categories:

- Basic English: sentence structure, parts of speech, common errors, everyday usage.
- Words: vocabulary lists by level, topic, collocation, phrase, and sample sentence.
- Synonyms: meaning groups, IELTS writing alternatives, register warnings, misuse examples.
- Basic grammar rules: tense, articles, prepositions, subject-verb agreement, clauses, conditionals, punctuation.
- Reading resources: original short passages, question types, strategy notes.
- Listening resources: original scripts and audio only.

Resource format:

- Title
- Category
- Difficulty: basic, intermediate, advanced
- Text body
- Examples
- Practice questions
- Explanation
- Tags
- Status: draft, review, published, archived

Authoring source:

- Resources, IELTS info pages, FAQs, and mock-test definitions are authored in Strapi Free.
- The app owns learner progress, saved resources, attempts, timers, scoring, and reports.

## Practice

Practice modes:

- Vocabulary quiz
- Synonym matching
- Grammar correction
- Reading question set
- Listening question set
- Writing task response
- Speaking cue-card response

Each practice attempt should store:

- User
- Practice item
- Answers
- Correctness where objective
- Feedback
- Time spent
- Created date

## Mock Test

Full mock test sections:

- Listening: 4 sections, around 40 questions.
- Reading: 3 passages, around 40 questions.
- Writing: task 1 and task 2.
- Speaking: part 1, part 2, and part 3.

The MVP can use shorter tests for faster practice, but full-score prediction should only appear after all required sections are completed.

## Account And Profile

Required account features:

- Login
- Logout
- Profile
- Password reset or magic link
- Attempt history
- Latest predicted score
- Module-specific band estimates
- Saved resources

Profile fields:

- Name
- Email
- Target band
- Exam date
- Native language
- Study goal

## Score Prediction

Only show a full predicted overall band after a complete test attempt. Before completion, show module-level progress and partial feedback, not a full final score.

Overall score should combine:

- Listening band
- Reading band
- Writing band estimate
- Speaking band estimate

IELTS overall band is normally rounded to the nearest half band. The application should label predictions clearly as estimates, not official scores.

## Design System (Implemented 2026-06)

The platform uses a customized design system built on Tailwind CSS v4 with `@theme inline` tokens:

| Token | Value | Usage |
|---|---|---|
| `--primary` | `#6556ff` | Primary actions, links, active states |
| `--primary-soft` | `#f0eeff` | Soft primary backgrounds |
| `--primary-hover` | `#4a3df0` | Button/action hover states |
| `--secondary` | `#1a21bc` | Secondary accent |
| `--surface` | `#ffffff` | Card/surface backgrounds |
| `--surface-muted` | `#f6faff` | Muted backgrounds |
| `--success` | `#43c639` | Success states |
| `--danger` | `#dc2626` | Error/destructive states |
| `--warning` | `#d97706` | Warning states |
| `--font-sans` | Poppins | Primary UI typeface |

Components use CVA (`class-variance-authority`) for variants with `cn()` for class merging. Primitives include: Button (rounded-full, 5 variants), Card (5 variants), Badge (7 variants), Input, Textarea, Label, Skeleton, State (loading/empty/error), PageHeader, Breadcrumbs, ContentPanel.

## Non-Goals For MVP

- Hosting copyrighted Cambridge book content.
- Guaranteeing official IELTS scores.
- Live human examiner marketplace.
- Payment/subscription system unless business launch requires it.
