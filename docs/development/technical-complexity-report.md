# IELTS++ Technical Complexity Report

## Current Implementation Status (2026-05-16)

All P0 items have been completed. The platform is feature-complete for MVP scope:

- ✅ Production LLM provider (OpenAI/Anthropic/Gemini) implemented with Zod schema validation
- ✅ P0 integration tests passing (38/38 tests)
- ✅ Speaking audio upload API with signed URLs + UI components
- ✅ Full attempt report endpoint and UI
- ✅ Admin test management with full CMS (wizard, builder, preview, validation, publish)
- ✅ Answer key protection enforced in all learner APIs
- ✅ Score prediction blocked until all modules complete
- ✅ Writing/speaking evaluation workers persist outputs
- ✅ Private media storage with signed URLs
- ✅ Flashcard system with SM-2 spaced repetition
- ✅ Referral and credits system
- ✅ Progress tracking with streaks and achievements
- ✅ Rate limiting on all sensitive endpoints
- ✅ Audit logging for all admin write operations
- ✅ Sentry error tracking configured
- ✅ BullMQ worker with 6 queue processors
- ✅ Drag-and-drop reordering for sections, groups, and questions
- ✅ Source-span highlighting for Reading/Listening
- ✅ Strict Listening one-play simulation UI
- ✅ Bulk question paste for admin authoring
- ✅ Mobile navigation for learner and admin shells
- ✅ Beta feedback collection
- ✅ Changelog page

See [`development/README.md`](README.md) for full implementation status.

---

## Summary

The projected IELTS++ MVP is a **medium-to-high complexity full-stack product** because it combines conventional SaaS features with exam simulation, AI evaluation, audio/media workflows, scoring logic, content governance, and learner analytics.

The highest complexity areas are:

1. Full mock test state management across four IELTS modules.
2. Async Writing/Speaking evaluation using LLM and transcription jobs.
3. Speaking audio recording, upload, storage, transcription, and feedback.
4. Score prediction and progress analytics that depend on complete and reliable module results.
5. Copyright-safe content generation, review, and publishing workflow.
6. Basic admin tools for resources/tests/reviews.

The MVP is still feasible in an 8-week solo-development plan if the scope is controlled, content volume remains small, and advanced features are deferred.

---

## Complexity Rating By Area

| Area | Complexity | Reason |
|---|---:|---|
| Auth, profile, roles | Medium | Supabase reduces effort, but role-based route protection must be consistent. |
| Resource library | Medium | CRUD/content status is straightforward, but resource structure and filtering need care. |
| Practice engine | Medium-High | Multiple question types, answer normalization, scoring, and feedback rendering. |
| Reading scoring | Medium | Objective scoring, accepted variants, explanations, and band mapping. |
| Listening scoring | Medium-High | Adds audio playback, transcript metadata, licensing, and answer variants. |
| Mock test engine | High | Multi-section attempt state, drafts, submission, timing, scoring, and completion rules. |
| Writing evaluation | High | LLM rubric scoring, structured JSON, validation, retries, and trust/disclaimer issues. |
| Speaking evaluation | Very High | Recording/upload, transcription, optional pronunciation analysis, feedback, and browser/device issues. |
| Score prediction | Medium | Formula is simple, but dependency on all module scores and confidence logic matters. |
| Progress dashboard | Medium | Aggregates attempts, scores, saved resources, and evaluation statuses. |
| Admin content workflow | Medium-High | Publishing safety, answer keys, review statuses, audit logs, and basic CRUD. |
| Storage/media | High | Signed URLs, private recordings, file validation, duration, and bucket permissions. |
| Background jobs | High | Queue reliability, retries, failed states, polling, and provider errors. |
| Deployment | Medium-High | Next.js app plus worker plus Redis plus Supabase configuration. |

---

## Backend Complexity Analysis

### 1. Data Model Complexity

The backend requires several related domains:

- Profiles and roles.
- Resources and resource versions.
- Vocabulary/synonym/grammar entries.
- Tests, sections, passages, listening scripts, questions, and answer keys.
- Practice and mock attempts.
- Attempt answers and module scores.
- Writing and Speaking evaluations.
- Media assets.
- LLM jobs.
- Content reviews and audit logs.

Primary risk:

- Overbuilding the schema before workflows are proven.

Recommended mitigation:

- Build schema in phases.
- Keep flexible JSON fields for early MVP feedback and evaluation outputs.
- Avoid complex admin versioning beyond basic `ResourceVersion` snapshots in MVP.

### 2. Mock Test State Complexity

Mock tests require careful state transitions:

- Not started.
- In progress.
- Section draft saved.
- Section submitted.
- Objective section scored.
- Subjective section evaluating.
- All sections completed.
- Score predicted.

Primary risks:

- Duplicate submissions.
- Lost draft answers.
- Showing final score too early.
- Exposing answer keys.

Recommended mitigation:

- Use clear section status fields.
- Make section submission idempotent where possible.
- Hide answer keys from all learner-facing responses.
- Block score prediction unless all module scores exist.

### 3. AI Evaluation Complexity

Writing and Speaking evaluation are high-risk because they involve:

- Provider latency.
- Inconsistent model outputs.
- JSON parsing failures.
- Uncertain score accuracy.
- User trust issues.
- Cost control.

Primary risks:

- Evaluation jobs fail or return malformed data.
- Learners over-trust unofficial scores.
- Synchronous AI calls create poor UX.

Recommended mitigation:

- Use async BullMQ jobs.
- Store raw provider output and parsed output.
- Validate LLM JSON before saving final evaluation.
- Show confidence and unofficial-score disclaimer.
- Add `failed` and `needs_review` statuses.

### 4. Speaking Audio Complexity

Speaking is the most complex MVP module.

Technical challenges:

- Browser recording support varies.
- Audio file formats vary.
- Uploads may fail.
- Transcription may be inaccurate.
- Pronunciation analysis may not be available.
- Private recordings need secure storage.

Recommended mitigation:

- Support text response as fallback.
- Use signed upload URLs.
- Keep recordings private.
- Validate content type and size.
- Show pronunciation as unavailable unless backend provides reliable analysis.
- Avoid promising official Speaking accuracy.

### 5. Content Safety Complexity

IELTS++ must avoid copyrighted Cambridge/commercial content.

Primary risks:

- Admin accidentally uploads copied text/audio.
- LLM generates content too similar to known sources.
- Listening audio lacks license metadata.

Recommended mitigation:

- Require source/license metadata for listening content.
- Add admin copyright warnings.
- Keep content review status.
- Do not publish generated content automatically.
- Store external book progress only as labels/notes.

---

## Frontend Complexity Analysis

### 1. Test-Taking UI Complexity

The frontend must support long, stateful workflows:

- Timed sections.
- Draft answers.
- Question navigation.
- Audio playback.
- Reading passage layout.
- Writing word count.
- Speaking recording/upload.
- Evaluation polling.

Primary risks:

- Learners lose answers on navigation.
- Mobile layout becomes unusable for tests.
- Different question types become hard to maintain.

Recommended mitigation:

- Use a shared question renderer.
- Store active draft answers locally during attempts.
- Add navigation warning for unsaved changes.
- Optimize mock tests for desktop/tablet.
- Keep mobile support strongest for resources and short practice.

### 2. Async Evaluation UX Complexity

Writing and Speaking feedback is not instant if jobs are async.

Required UI states:

- Draft.
- Submitted.
- Queued.
- Processing.
- Completed.
- Failed.
- Needs review.

Primary risks:

- Learners think submission failed.
- Polling is too aggressive.
- Failed evaluations block the whole attempt.

Recommended mitigation:

- Show clear status badges and progress messages.
- Use polling with sensible intervals.
- Let learners leave and return to the attempt/status page.
- Show partial score progress while waiting.

### 3. Admin UI Complexity

Basic admin is useful but can expand quickly.

Primary risks:

- Admin CRUD consumes time needed for learner MVP.
- Test creation UI becomes complex due to question types and answer keys.

Recommended mitigation:

- Keep admin minimal in MVP.
- Prioritize resource create/edit/publish.
- For test creation, allow simple forms or seed files if UI becomes too large.
- Make answer-key management admin-only.

### 4. Responsive Complexity

IELTS mock tests are naturally desktop-heavy.

Primary risks:

- Full mock test UX is poor on phone.
- Audio controls and long passages become difficult on small screens.

Recommended mitigation:

- Build responsive web, but declare desktop/tablet as preferred for full mock tests.
- Keep mobile optimized for resources, vocabulary, grammar, and short practice.
- Add mobile warnings for full mock tests if necessary.

---

## Complexity Impact On 8-Week MVP Plan

### Feasible Within 8 Weeks

- Auth/profile.
- Resource library.
- Basic practice engine.
- Reading/listening objective scoring.
- One short mock test.
- Writing AI evaluation.
- Speaking text response evaluation.
- Basic audio upload.
- Score prediction after full completion.
- Basic dashboard.
- Basic admin resource/review screens.

### Risky Within 8 Weeks

- Robust browser recording across all devices.
- High-quality pronunciation analysis.
- Full admin test builder.
- Large content library.
- Advanced weak-area recommendations.
- Personalized study plan.
- AI tutor/chat assistant.
- Global ranking or community features.
- Human expert review workflow.

### Recommended MVP Scope Control

For the first launch:

- Build **one short mock test** and optionally one full mock if time allows.
- Support **Speaking text response + audio upload**, but keep pronunciation optional.
- Keep admin screens basic.
- Use seeded content for complex test/question setup if admin test builder is delayed.
- Keep score prediction formula simple and transparent.
- Prefer reliability over large test volume.

---

## Risk Register

| Risk | Severity | Mitigation |
|---|---:|---|
| AI scoring is inaccurate or inconsistent | High | Show criteria, confidence, examples, and unofficial disclaimer. |
| Speaking recording fails on some devices | High | Provide text response and upload fallback. |
| LLM jobs fail or timeout | High | Async queue, retries, failed status, polling UI. |
| Answer keys leak to frontend | High | Separate learner payloads from admin payloads; test this explicitly. |
| Mock test state bugs | High | Clear status model and idempotent submissions. |
| Copyrighted content is uploaded | High | Admin warnings, metadata, review workflow, no auto-publish. |
| Admin test builder takes too long | Medium-High | Seed tests manually for MVP; build minimal admin first. |
| 8-week solo timeline slips | Medium-High | Cut advanced features; prioritize learner journey. |
| Mobile full-test UX is poor | Medium | Desktop/tablet optimized mock tests; mobile for resources/practice. |
| Cost from AI evaluations grows | Medium | Rate limits, quotas, async jobs, logs, provider abstraction. |

---

## Recommended Complexity-Based Priorities

### P0 — Must Not Slip (Status: Mostly Complete ✅)

- ✅ Green typecheck/build before release - `pnpm typecheck`, `pnpm lint` passing
- ✅ Answer-key protection in every learner API and client state - Verified in API routes
- ✅ Objective practice and reading/listening scoring stay deterministic - Implemented in submit-section
- ✅ Mock attempt state, section submission, and score prediction guards stay correct - Implemented
- ✅ Writing/speaking evaluation worker path persists real outputs - Workers persist to ModuleScore
- ✅ Private media storage and signed URLs - `/api/media/upload-url`, `/api/media/[id]/download-url`
- ✅ Admin review list/detail/action code type-safe - Passing typecheck

### P1 — Important But Can Be Simplified

- Speaking audio recording/upload.
- Basic admin resource/review screens.
- Listening audio metadata.
- Dashboard score history.
- Evaluation polling UI.
- Short mock test seed.

### P2 — Defer If Timeline Is Tight

- Full admin test builder.
- Pronunciation scoring.
- Personalized study plan.
- AI tutor/chat.
- Spaced repetition vocabulary.
- Mobile app.
- Human expert review marketplace.
- Global leaderboard.

---

## Final Recommendation

The MVP should focus on one complete, reliable learner journey:

1. Register/login.
2. Set profile and target band.
3. Study foundational resources.
4. Complete objective practice.
5. Take a short/full mock test.
6. Receive reading/listening scores.
7. Submit writing/speaking responses.
8. Receive transparent AI feedback.
9. Get an unofficial score prediction only after all modules are complete.

This path is technically achievable and market-relevant while controlling the highest-risk complexity areas.
