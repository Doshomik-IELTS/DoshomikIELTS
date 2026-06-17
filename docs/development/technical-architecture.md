# Technical Architecture

**Last updated:** 2026-06-17 — Frontend architecture updated: purple-indigo primary (`#6556ff`), Poppins font, `@theme inline` design tokens, auth modal flow, dark-themed landing page.

## Product Scope

DOshomik IELTS is an owned IELTS resource and mock-test platform. The platform should provide:

- Text-based learning resources for Basic English, words, synonyms, and basic grammar rules.
- Original listening resources with no copyrighted audio or copied scripts.
- Practice modules for vocabulary, grammar, reading, listening, writing, and speaking.
- Full mock tests covering listening, reading, writing, and speaking.
- LLM-assisted evaluation for writing and speaking.
- Score prediction after a learner completes a full mock test.
- Login, logout, learner profile, attempt history, and progress tracking.
- Strapi-authored resources and mock-test definitions.
- PostHog learner/product analytics when configured.

## Content And Copyright Position

The platform should host its own original resources and tests.

Do not host or copy:

- Cambridge IELTS book PDFs, scans, passages, questions, audio, or answer explanations.
- Commercial book content from any IELTS publisher.
- Copyrighted listening material unless a license explicitly allows the intended use.

Allowed use:

- Users may track external study progress, for example “Cambridge Book 5 completed,” without storing copied book content.
- Admins may create original IELTS-style content inspired by exam format, not copied from protected material.
- LLM-generated resources may be used only after originality, answer correctness, and quality review.

## Recommended Stack

Confirmed MVP stack:

| Layer | Technology |
|---|---|
| Frontend & API | Next.js App Router (TypeScript, strict mode) |
| Styling | Tailwind CSS v4 with `@theme inline` design tokens |
| UI Components | In-house primitives (CVA + `cn()`) |
| Design System | Purple-indigo primary (`#6556ff`), Poppins font, CSS variable-based tokens |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | Supabase Auth + dev-auth cookie fallback |
| Storage | Supabase Storage (signed URLs) |
| Queue | Redis + BullMQ |
| LLM Provider | Configurable service layer (OpenAI/Anthropic/Gemini) |
| CMS | Strapi Free for resource, IELTS info page, FAQ, and mock-test authoring |
| Analytics | PostHog for learner workflow and product analytics |

## Domains

Recommended domain structure:

- `doshomikielts.com` or selected primary brand domain for marketing pages.
- `app.doshomikielts.com` for the learner application.
- `admin.doshomikielts.com` for content/admin tools if separated.
- `api.doshomikielts.com` for backend API if frontend and backend are split.
- `cdn.doshomikielts.com` for static/media assets if using a CDN.

Minimum MVP can use one domain:

- `doshomikielts.com` for landing pages and app.
- `/admin` for admin tools.
- `/api` for API routes.

## Hosting

Small MVP:

- Frontend: Vercel, Netlify, Cloudflare Pages, or a VPS.
- Backend: Render, Fly.io, Railway, DigitalOcean App Platform, AWS ECS, or a VPS.
- Database: managed PostgreSQL.
- Storage: S3, Cloudflare R2, Backblaze B2, DigitalOcean Spaces, or Supabase Storage.

Production preference:

- Managed PostgreSQL with automated backups.
- Object storage behind CDN.
- Background worker for LLM evaluation, transcription, audio generation, and media processing.
- Centralized logs and error tracking.
- Separate staging and production environments.

## Storage

Store in PostgreSQL:

- Users and authentication identifiers.
- Learner profiles.
- Resource metadata.
- Text resources.
- Vocabulary, synonym, and grammar entries.
- Test definitions.
- Test sections.
- Reading passages.
- Listening transcripts.
- Questions.
- Answer keys.
- Practice attempts.
- Mock test attempts.
- Attempt answers.
- Module scores.
- Writing evaluations.
- Speaking evaluations.
- Predicted scores.
- Admin review status.
- External study tracking, such as Cambridge book progress labels without copied content.

Store in object storage:

- Original listening audio.
- Speaking recordings.
- Generated TTS audio.
- Uploaded media.
- Exported reports.
- Large generated files.

Do not store copyrighted book scans, copied test passages, copied questions, or copyrighted audio.

## Core Modules

### 1. Auth Module

Required features:

- Login.
- Logout.
- Register.
- Password reset or magic link.
- Session management.
- Role-based access control.

Roles:

- Learner.
- Admin.
- Content reviewer.
- Evaluator.

### 2. Profile Module

Profile fields:

- Name.
- Email.
- Target IELTS band.
- Exam date.
- Native language.
- Study goal.
- Saved resources.
- Latest full-test score prediction.
- Module-level performance history.

### 3. Resource Module

Resource categories:

- Basic English.
- Words.
- Synonyms.
- Basic grammar rules.
- Reading strategy.
- Listening strategy.
- Writing strategy.
- Speaking strategy.

Resource format:

- Title.
- Category.
- Difficulty: basic, intermediate, advanced.
- Body text.
- Examples.
- Practice questions.
- Explanation.
- Tags.
- Status: draft, review, published, archived.

Authoring note: new resources are authored in Strapi. App `Resource` rows are runtime/fallback/cache records for learner progress and local development continuity.

### 4. Practice Module

Practice types:

- Vocabulary quiz.
- Synonym matching.
- Grammar correction.
- Reading question set.
- Listening question set.
- Writing task response.
- Speaking cue-card response.

Practice attempts should store:

- User.
- Practice item.
- Answers.
- Objective correctness where applicable.
- Feedback.
- Time spent.
- Created date.

### 5. Mock Test Module

A full mock test includes:

- Listening: 4 sections, around 40 questions.
- Reading: 3 passages, around 40 questions.
- Writing: task 1 and task 2.
- Speaking: part 1, part 2, and part 3.

The MVP may support short mock tests for faster practice, but full score prediction should only appear after all required sections are completed.

## Evaluation Architecture

### Reading Evaluation

Reading should be scored objectively:

- Store answer keys and accepted alternatives.
- Normalize casing, whitespace, punctuation, and simple spelling variants.
- Calculate raw score.
- Convert raw score to estimated IELTS band using a configurable mapping table.
- Store per-question explanations and source-span rationale.

### Listening Evaluation

Listening should be scored objectively:

- Use original or properly licensed audio only.
- Store transcript, question set, answer key, and accepted alternatives.
- Normalize answers like reading.
- Convert raw score to estimated band using a configurable mapping table.

### Writing Evaluation

Writing should use rubric-based LLM evaluation with optional human review.

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

Recommended flow:

1. Validate word count and prompt relevance.
2. Check for copied, empty, or off-topic answers.
3. Run rubric-based LLM evaluation.
4. Return criterion-level band estimates.
5. Return strengths, weaknesses, corrected examples, and one next improvement task.
6. Flag suspicious or high-stakes attempts for human review.
7. Store structured JSON output for trend analysis.

### Speaking Evaluation

Speaking can start with text-based or audio-based evaluation.

MVP option:

- Text response or recorded answer.
- If audio is provided, transcribe it first.
- Evaluate transcript for fluency/coherence, vocabulary, grammar, and relevance.
- Pronunciation score should only be shown if audio analysis is available.

Speaking criteria:

- Fluency and coherence.
- Lexical resource.
- Grammatical range and accuracy.
- Pronunciation.

Recommended flow:

1. Show speaking question or cue card.
2. Record/upload audio or accept text response.
3. Transcribe audio if needed.
4. Evaluate response relevance.
5. Run rubric-based LLM evaluation.
6. Return band estimate, feedback, sample improved answer, and one next drill.

## LLM-Generated Content Architecture

Use LLMs for:

- Generating original practice resources.
- Generating IELTS-style reading passages and questions.
- Generating original listening scripts.
- Generating writing prompts.
- Generating speaking questions and cue cards.
- Evaluating writing and speaking responses.
- Producing learner-friendly feedback.

Do not publish generated content automatically. Generated content lifecycle:

1. Draft generation.
2. Automated validation.
3. Similarity/originality check where possible.
4. Answer-key verification.
5. Human review.
6. Published.
7. Archived or revised.

The LLM service should store:

- Prompt version.
- Model/provider used.
- Generated output.
- Validation status.
- Reviewer decision.
- Cost and latency metadata if available.

## Score Prediction

Only show a full predicted overall IELTS band after a complete full mock test.

Inputs:

- Listening estimated band.
- Reading estimated band.
- Writing estimated band.
- Speaking estimated band.
- Completion time.
- Attempt consistency.
- Historical user performance if available.

Initial MVP formula:

1. Calculate module band estimates.
2. Average the four module bands.
3. Round to the nearest 0.5 band.
4. Show confidence: low, medium, or high.

Confidence examples:

- Low: short mock, missing speaking audio, missing pronunciation analysis, or first attempt.
- Medium: one complete full mock test.
- High: multiple complete mocks with consistent scores and human-reviewed writing/speaking samples.

Predicted scores must be labelled as estimates, not official IELTS results.

## Data Model Sketch

Core tables:

- `users`
- `sessions`
- `profiles`
- `roles`
- `resources`
- `resource_versions`
- `vocabulary_entries`
- `synonym_groups`
- `grammar_rules`
- `tests`
- `test_sections`
- `passages`
- `listening_scripts`
- `questions`
- `answer_keys`
- `practice_attempts`
- `mock_test_attempts`
- `attempt_answers`
- `module_scores`
- `score_predictions`
- `writing_evaluations`
- `speaking_evaluations`
- `media_assets`
- `external_study_records`
- `llm_jobs`
- `content_reviews`
- `audit_logs`

## Background Jobs

Use background jobs for:

- Writing evaluation.
- Speaking transcription.
- Speaking evaluation.
- Pronunciation analysis if supported.
- Audio generation from original scripts.
- Score prediction.
- LLM-generated content validation.
- Similarity/originality checks.
- Report generation.
- Cleanup of expired temporary media.

## API Areas

Suggested API groups:

- `/auth/*` for login, logout, password reset, and session management.
- `/profile/*` for learner profile and preferences.
- `/resources/*` for resource browsing and saved resources.
- `/practice/*` for practice attempts.
- `/mock-tests/*` for mock test definitions and attempts.
- `/evaluations/*` for writing/speaking evaluation status and results.
- `/scores/*` for module scores and full-test prediction.
- `/media/*` for signed upload/download URLs.
- `/admin/*` for app operations, Strapi entry panels, and review workflows.
- Strapi Content API for published resources, IELTS pages, FAQs, and mock-test definitions.

## Security

Minimum requirements:

- HTTPS everywhere.
- Secure password hashing if using first-party auth.
- Role-based admin access.
- Signed URLs for private audio and speaking recordings.
- Rate limits for login, test submission, and LLM evaluation.
- Audit trail for admin content changes.
- Backup and restore process.
- Do not expose private media URLs publicly.
- Validate uploaded file type, size, and duration.
- Protect LLM endpoints from abuse with quotas and rate limits.

## Admin Workflow

Content lifecycle:

1. Draft.
2. AI-assisted quality check.
3. Human review.
4. Published.
5. Archived.

Each generated test item should be reviewed for:

- Originality.
- Answer correctness.
- IELTS style.
- Difficulty.
- Bias or inappropriate content.
- Audio license safety.
- Clear explanations.

## MVP Build Order

Recommended implementation order:

1. Auth, logout, profile, and role management.
2. Text resource library for Basic English, words, synonyms, and grammar.
3. Objective practice engine for vocabulary and grammar.
4. Reading practice and reading mock test scoring.
5. Listening scripts, original audio storage, and listening scoring.
6. Writing task submission and LLM evaluation.
7. Speaking questions, recording/upload, transcription, and LLM evaluation.
8. Full mock test flow.
9. Score prediction after completed full test.
10. Admin content review workflow.
11. Analytics, quality control, and reporting.
