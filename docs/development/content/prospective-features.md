# IELTS++ Prospective Features To Include

Research date: May 2026

Last updated: 2026-05-16

## Implementation Status Summary

- **Flashcards**: ✅ Fully implemented — admin deck/card CRUD, learner study flow, progress tracking API, spaced repetition scheduling
- **Referrals**: ✅ Fully implemented — referral code generation, credit tracking, admin analytics, apply/revoke flows
- **Achievements**: ✅ Implemented — achievements panel component, API route for fetching achievements
- **Progress Tracking**: ✅ Implemented — progress API with resource tracking, unlock checks, flashcard deck progress
- **Feedback**: ✅ Implemented — beta feedback component and API route for user feedback submission
- **Changelog**: ✅ Implemented — changelog page displaying platform updates

## Purpose

This document lists prospective features IELTS++ should include based on market research of similar IELTS preparation apps and platforms.

Features are grouped by priority:

- MVP required features
- MVP differentiators
- Post-MVP growth features
- Premium/future monetization features

---

## MVP Required Features

These features are necessary for IELTS++ to be competitive in the current IELTS prep market.

Implementation status summary:

- Account/profile, resource library, admin resources, basic practice, mock-test start/attempt flow, learner-safe attempt APIs, Reading/Listening renderers, objective scoring, writing/speaking evaluation scaffolding, score prediction, and admin review workflow are implemented at MVP level.
- The content CMS now supports test creation wizard, Reading/Listening quick authoring without JSON, question groups, structured scoring rules, source support, source highlighting, media attachment, validation blockers, preview, review, publish, version snapshots, duplicate-as-draft, mobile navigation, and bulk question paste.
- Remaining major prospective work: production LLM/TTS generation workers, server-side strict audio events, weakness recommendations, richer analytics, full study plans, and premium/community features.

### 1. Account And Profile

Required features:

- Register.
- Login.
- Logout.
- Password reset or magic link.
- Learner profile.
- Target IELTS band.
- Exam date.
- Native language.
- Study goal.
- Attempt history.
- Saved resources.
- Latest score prediction.

Why needed:

- Nearly all serious platforms track learner progress and personalize preparation.

---

### 2. Resource Library

Required categories:

- Basic English.
- Vocabulary / words.
- Synonyms.
- Basic grammar rules.
- Reading strategy.
- Listening strategy.
- Writing strategy.
- Speaking strategy.

Resource features:

- Difficulty level.
- Tags.
- Examples.
- Practice questions.
- Explanation.
- Save/unsave.
- Related practice links.

Why needed:

- IELTS++ should compete not only as a mock test app but also as a learning platform.

---

### 3. Practice Engine

Required practice modes:

- Vocabulary quiz.
- Synonym matching.
- Grammar correction.
- Reading question set.
- Listening question set.
- Writing task response.
- Speaking cue-card response.

Required behavior:

- Store attempts.
- Show correctness for objective questions.
- Show explanations.
- Track time spent.
- Show practice history.

Why needed:

- Practice bridges the gap between resources and full mock tests.

---

### 4. Full Mock Test

Required sections:

- Listening.
- Reading.
- Writing Task 1.
- Writing Task 2.
- Speaking Part 1.
- Speaking Part 2.
- Speaking Part 3.

Required behavior:

- Start attempt.
- Save draft answers.
- Submit sections.
- Track section status.
- Time sections where applicable.
- Show final result only after completion.
- Warn about unanswered questions before section submit.
- Show a section review screen before final submission.
- In strict Listening simulation, allow one audio play in the learner UI.

Why needed:

- Full mock tests are a standard expectation across competitor platforms.

Status:

- Implemented at MVP level for structured attempts, section submit, timers, draft saves, Reading/Listening material, question groups, typed objective controls, unanswered review, and strict Listening simulation UI.
- Server-side strict audio event enforcement remains future hardening.

---

### 5. Reading Auto-Scoring

Required features:

- Objective answer key.
- Accepted answer variants.
- Answer normalization.
- Raw score.
- Estimated band score.
- Explanation per question.
- Source span or rationale.
- Source-span highlighting in the learner passage where offsets or excerpts are stored.

Supported question types:

- Multiple choice.
- Matching headings.
- True/False/Not Given.
- Yes/No/Not Given.
- Sentence completion.
- Summary completion.
- Short answer.

Why needed:

- Reading scoring is expected to be instant and accurate.

Status:

- Implemented for objective marking with accepted alternatives, structured scoring rules, source support, and learner highlighting.

---

### 6. Listening Auto-Scoring

Required features:

- Original or licensed audio only.
- Transcript.
- Answer key.
- Accepted spelling variants.
- Raw score.
- Estimated band score.
- Explanation per question.
- Audio controls.
- Strict one-play simulation for mock-test mode.

Why needed:

- Listening is a standard mock/practice module and is easy to score objectively.

Status:

- Implemented for attached media, signed playback URL, transcript support, structured scoring rules, source support, and strict one-play browser UI.

---

### 7. Writing AI Evaluation

Required features:

- Task 1 and Task 2 support.
- Word count.
- Prompt relevance check.
- Rubric-based scoring.
- Criteria-level feedback.
- Estimated band.
- Strengths.
- Weaknesses.
- Corrected/improved examples.
- One prioritized improvement task.
- Async evaluation status.

Task 1 criteria:

- Task achievement.
- Coherence and cohesion.
- Lexical resource.
- Grammatical range and accuracy.

Task 2 criteria:

- Task response.
- Coherence and cohesion.
- Lexical resource.
- Grammatical range and accuracy.

Why needed:

- AI Writing scoring is now common among IELTS prep competitors.

---

### 8. Speaking AI Evaluation

Required features:

- Speaking Part 1, Part 2, and Part 3.
- Text response option.
- Audio recording/upload option.
- Transcription if audio is submitted.
- Fluency/coherence feedback.
- Lexical resource feedback.
- Grammar feedback.
- Pronunciation feedback only when audio analysis is available.
- Band estimate.
- Suggested next speaking drill.

Why needed:

- AI Speaking examiner is now a major competitive feature.

---

### 9. Score Prediction

Required features:

- Module bands:
  - Listening.
  - Reading.
  - Writing.
  - Speaking.
- Overall predicted band.
- Nearest 0.5 rounding.
- Confidence label:
  - Low.
  - Medium.
  - High.
- Unofficial estimate disclaimer.
- Block full score prediction until all four modules are complete.

Why needed:

- Competitors commonly show band estimates and progress dashboards.

---

### 10. Progress Dashboard

Required widgets:

- Latest predicted score.
- Module score cards.
- Attempt history.
- Practice history.
- Saved resources.
- Weak modules.
- Continue practice CTA.
- Start mock test CTA.

Why needed:

- Progress tracking is a standard feature and supports learner retention.

---

### 11. Basic Admin And Review Workflow

Required admin features:

- Resource list by status.
- Create/edit resource.
- Publish/archive resource.
- Test list.
- Create/edit basic test metadata.
- Review queue.
- Approve/reject content.
- Copyright safety warning.
- Test creation wizard.
- Reading/Listening quick authoring boxes.
- Question groups.
- Structured scoring controls.
- Bulk question paste.
- Source support and source highlighting.
- Validation blocker dashboard.
- Learner-style preview.
- Duplicate published tests as draft versions.

Why needed:

- IELTS++ depends on original content and should not publish generated content without review.

Status:

- Implemented at MVP level for resources and tests. Production generation workers and deeper per-question-type full-screen editors remain future enhancements.

---

## MVP Differentiator Features

These should be included early if possible because they help IELTS++ stand apart.

### 1. Basic-English-To-IELTS Pathway

Feature idea:

- A guided learning path from Basic English to IELTS practice.

Includes:

- Sentence structure lessons.
- Parts of speech.
- Tense basics.
- Articles/prepositions.
- Common Bangla-speaker or South Asian learner mistakes.
- Vocabulary foundations.
- Synonym and paraphrasing practice.
- Basic grammar drills.

Why important:

- Many competitors focus on mocks, but weaker learners need foundations first.

---

### 2. Weak-Area Recommendations

Feature idea:

- After practice or mock tests, recommend specific resources and drills.

Examples:

- Low grammar score → recommend subject-verb agreement lesson.
- Low lexical resource → recommend topic vocabulary and synonym groups.
- Low reading matching headings → recommend matching heading strategy.
- Low speaking fluency → recommend timed Part 2 drill.

Why important:

- Converts mock test feedback into a learning loop.

---

### 3. Transparent AI Feedback

Feature idea:

- Make AI scoring explainable and trustworthy.

Include:

- Criteria-level band scores.
- Confidence level.
- Examples from learner answer.
- Improved examples.
- What reduced the score.
- One next action.
- Clear disclaimer.

Why important:

- Many users distrust AI scores. Transparency can improve trust.

---

### 4. Original Content Badge / License Metadata

Feature idea:

- Show safe-content metadata internally and optionally publicly.

Include:

- Original platform-created.
- In-house recorded.
- TTS generated with allowed use.
- Licensed audio.
- Public-domain verified.

Why important:

- Avoids Cambridge/commercial copyright risk and builds trust.

---

### 5. Computer-Based Test Interface

Feature idea:

- Build IELTS computer-style practice interface.

Include:

- Timer.
- Question navigation.
- Highlighting for reading.
- Notes.
- Audio player for listening.
- Word count for writing.
- Section status.
- Source highlighting for Reading/Listening.
- Review-before-submit behavior.
- Mobile navigation.

Why important:

- Competitors emphasize real exam simulation and interface familiarity.

Status:

- Implemented at core MVP level. Reading notes, server-side strict audio events, and richer map/diagram interaction remain future polish.

---

## Post-MVP Growth Features

These can be added after the first MVP is stable.

### 1. Personalized Study Plan

Features:

- Target band-based plan.
- Exam date countdown.
- Weekly goals.
- Daily tasks.
- Adaptive weak-area tasks.
- Completion tracking.

---

### 2. AI Tutor / Chat Assistant

Features:

- Ask questions about lessons.
- Explain wrong answers.
- Suggest paraphrases.
- Generate extra practice.
- Explain grammar mistakes.
- Support multiple languages for explanations if needed.

---

### 3. Spaced Repetition Vocabulary

Features:

- Flashcards.
- Review scheduling.
- Known/learning/mastered states.
- Topic vocabulary decks.
- Synonym/paraphrase decks.
- Collocation practice.

---

### 4. Daily Practice

Features:

- Daily vocabulary question.
- Daily grammar correction.
- Daily writing prompt.
- Daily speaking prompt.
- Streaks.
- Reminders.

---

### 5. More Advanced Analytics

Features:

- Score trend chart.
- Module trend chart.
- Question-type weakness analysis.
- Time-spent analytics.
- Accuracy by topic.
- Practice consistency.

---

### 6. General Training Support

Features:

- Academic/General switch.
- General Training Reading.
- General Training Writing Task 1 letters.
- Separate band/report views.

---

### 7. Mobile App

Features:

- Native or PWA experience.
- Daily practice notifications.
- Audio recording.
- Offline resource reading.
- Flashcard review.

---

### 8. Handwritten Essay Upload / OCR

Features:

- Upload photo of handwritten writing.
- OCR extraction.
- Edit extracted text before submit.
- AI writing evaluation.

Inspired by:

- IELTS Pulse handwritten essay upload and scoring.

---

### 9. Community / Peer Practice

Features:

- Speaking partner matching.
- Peer feedback.
- Discussion groups.
- Shared speaking topics.
- Moderation/reporting.

---

## Premium / Monetization Features

These features can support paid plans later.

### 1. Human Expert Review

Features:

- Paid writing correction.
- Paid speaking review.
- Expert comments.
- Band estimate by human reviewer.
- Turnaround time selection.

Market validation:

- E2, IELTS Advantage, IELTS Online Tests, and official-style products monetize expert feedback.

---

### 2. One-On-One Mock Speaking

Features:

- Book live mock speaking session.
- Examiner/tutor feedback.
- Recording and report.
- Improvement plan.

---

### 3. Premium Mock Test Packs

Features:

- Full mock test bundles.
- Advanced reports.
- More attempts.
- Higher content volume.
- Academic and General packs.

---

### 4. Band Booster Plan

Features:

- 4-week or 8-week guided plan.
- Weekly mock test.
- AI feedback.
- Human review credits.
- Progress report.

---

### 5. Coaching Center / Teacher Dashboard

Features:

- Teacher account.
- Student list.
- Assign resources/tests.
- Review student attempts.
- Track class progress.
- Export reports.

---

## Feature Priority Recommendation

### Build First

1. Auth/profile.
2. Resource library.
3. Practice engine.
4. Reading/listening scoring.
5. Writing/speaking AI evaluation.
6. Full mock test.
7. Score prediction.
8. Progress dashboard.
9. Basic admin review.

### Build Next

1. Weak-area recommendations.
2. Personalized study plan.
3. Computer-based test interface improvements.
4. Spaced repetition vocabulary.
5. AI tutor/chat assistant.

### Build Later

1. Human expert review.
2. One-on-one speaking mocks.
3. Mobile app.
4. Teacher/coaching dashboard.
5. Subscription/payment system.

---

## Features To Avoid In MVP

Avoid these until the core product is stable:

- Payment/subscription.
- Live teacher marketplace.
- Large community features.
- Native mobile app.
- Complex gamification.
- Overclaiming official score accuracy.
- Hosting Cambridge or commercial IELTS book content.

---

## Non-Negotiable Product Rules

- Do not store copied Cambridge IELTS content.
- Do not store commercial IELTS book scans, passages, questions, audio, or explanations.
- Use only original, licensed, public-domain-valid, or internally generated content.
- Mark AI score predictions as unofficial estimates.
- Do not show final overall score before all four modules are complete.
- Keep answer keys hidden from learner-facing test APIs/screens.
