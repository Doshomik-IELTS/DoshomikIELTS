# Mock Test Implementation Plan

Last updated: 2026-05-16

## Status: ✅ Core Mock Test Systems Implemented — Production Hardening In Progress

All major mock test features are implemented: three test modes, full mock structure for all four IELTS modules, LLM generation pipeline scaffolding, evaluation pipeline with worker support, data model with scoring mappings, UX requirements for all module types, and release phases 1-3 largely complete. Phase 4 (full mock polish) is partially implemented with remaining work on weakness detection, timed/untimed toggle, reading notes, calibration dashboard, and production LLM/TTS workers.

## Research Baseline

Official IELTS format and scoring:

- IELTS Academic has four sections: Listening, Reading, Writing, and Speaking.
- Listening has four parts, 40 questions, and each correct answer earns one mark.
- Academic Reading has three sections, 40 questions, and each correct answer earns one mark.
- Academic Writing has two tasks in 60 minutes. Task 1 is at least 150 words; Task 2 is at least 250 words and contributes twice as much as Task 1 to the Writing score.
- Speaking is a recorded 11-14 minute interview with three parts.
- Overall band is the average of Listening, Reading, Writing, and Speaking, rounded to the nearest half band.
- Writing criteria: task achievement/response, coherence and cohesion, lexical resource, grammatical range and accuracy.
- Speaking criteria: fluency and coherence, lexical resource, grammatical range and accuracy, pronunciation.

Competitor/product patterns observed:

- British Council IELTS Ready Premium provides many mock tests, timed/untimed modes, model answers, reading/listening question feedback, AI feedback, and targeted recommendations.
- Modern AI IELTS prep products usually expose module practice plus full mocks, instant AI writing/speaking feedback, automatic reading/listening scoring, progress analytics, weakness detection, and score trajectory.
- Speaking practice products increasingly simulate an examiner, ask follow-ups, record audio, transcribe, and score fluency/pronunciation separately.
- Reading/listening products commonly include highlighting, timers, playback controls, auto-marking, question explanations, and post-test analysis.

Source links:

- IELTS Academic test format: https://ielts.org/organisations/ielts-for-organisations/test-types/ielts-academic-test/academic-test-format-in-detail
- IELTS scoring in detail: https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail
- British Council IELTS Ready Premium: https://www.britishcouncil.ug/exam/ielts/prepare/ielts-ready-premium/what-to-expect
- British Council IELTS Ready Premium launch/features: https://www.britishcouncil.de/en/new-platform-%E2%80%9Cielts-ready-premium%E2%80%9D-provides-british-council-ielts-test-takers-advanced-test-prep
- OnMock product pattern reference: https://www.onmock.com/

## Product Principle

IELTS++ should not claim official scoring. Every predicted score must be labeled:

> Unofficial estimate. Official IELTS results may differ.

The product should simulate IELTS structure, timing, scoring logic, and feedback style while using original or licensed content only. LLM-created tests are allowed only after validation and review.

For the admin CMS implementation details, including the current `/admin/tests/new` gaps, module-specific editor contracts, validation gates, and publish workflow, see [`content-management-system-implementation-plan.md`](content-management-system-implementation-plan.md).

## Test Modes

Implement three levels:

| Mode | Purpose | Timing | Score |
|---|---|---|---|
| Module practice | Focused skill drills by section/question type | Optional | Module-only |
| Short mock | Fast mixed-module diagnostic | Timed or untimed | Estimated module/overall confidence low |
| Full mock | Realistic IELTS simulation | Timed by module | Overall estimate after all four module scores exist |

## Full Mock Structure

### Listening

Target full mock:

- 4 parts.
- 10 questions per part.
- 40 questions total.
- Original or licensed audio only.
- Audio is played once in strict mode.
- Timed mode: approximately 30 minutes plus transfer/review behavior depending on chosen simulation mode.

Question types to support:

- Multiple choice.
- Matching.
- Plan/map/diagram labeling.
- Form/note/table/flow chart/summary completion.
- Sentence completion.
- Short answer.

Scoring:

- 1 raw mark per correct answer.
- Normalize casing, whitespace, punctuation, simple number formats, and accepted variants.
- Enforce word limits per question.
- Convert raw score to band through configurable mapping.

LLM role:

- Generate original scripts, speaker roles, accents metadata, questions, answer keys, explanations, distractors, and transcript.
- Validate audio script originality and question-answer alignment.
- Generate TTS script, not copyrighted audio.
- Optionally generate post-test explanations and weakness tags.

Do not use LLM as the primary scorer for objective listening answers.

### Reading

Target full mock:

- 3 sections.
- 40 questions total.
- Academic reading text length target: 2150-2750 words total across sections.
- 60 minutes including answer transfer.
- Original passages only.

Question types to support:

- Multiple choice.
- True/False/Not Given.
- Yes/No/Not Given.
- Matching information.
- Matching headings.
- Matching features.
- Matching sentence endings.
- Sentence completion.
- Summary/note/table/flow-chart completion.
- Diagram label completion.
- Short-answer questions.

Scoring:

- 1 raw mark per correct answer.
- Accepted alternatives where needed.
- Strict handling of T/F/NG and Y/N/NG labels.
- Word-limit enforcement.
- Raw-to-band mapping by test type: Academic first; General Training later.

LLM role:

- Generate original passages, questions, answer keys, explanations, and source-span rationales.
- Run self-checks: answer exists in passage, distractors are plausible, T/F/NG labels are defensible.
- Generate difficulty and skill tags.

Do not use LLM as the primary scorer for objective reading answers.

### Writing

Target full mock:

- 60 minutes.
- Task 1: at least 150 words.
- Task 2: at least 250 words.
- Task 2 weighted twice as much as Task 1.

Task types:

- Academic Task 1: line graph, bar chart, pie chart, table, map, process, mixed charts.
- Task 2: opinion, discussion, advantage/disadvantage, problem/solution, two-part question.

Scoring:

- Task 1 criteria:
  - Task achievement.
  - Coherence and cohesion.
  - Lexical resource.
  - Grammatical range and accuracy.
- Task 2 criteria:
  - Task response.
  - Coherence and cohesion.
  - Lexical resource.
  - Grammatical range and accuracy.
- Task score = average of four criteria, rounded to nearest half band.
- Writing module score = weighted average: `(Task1 + Task2 * 2) / 3`, rounded to nearest half band.

LLM role:

- Generate original prompts and visual data specs.
- Evaluate responses using structured rubric JSON.
- Return criterion bands, evidence snippets, short feedback, corrected examples, and one next task.
- Flag low confidence, plagiarism-like text, off-topic answers, memorized essays, impossible chart descriptions, or unsafe content for human review.

Required guardrails:

- Use multiple prompts internally: evaluator, verifier, and calibration pass.
- Store raw LLM output and parsed result.
- Never silently publish a score if schema validation fails.

### Speaking

Target full mock:

- 3 parts.
- 11-14 minutes in strict mode.
- Audio recorded.
- Text fallback allowed for MVP, but audio is required for pronunciation confidence.

Part structure:

- Part 1: introduction/interview, familiar topics, 4-5 minutes.
- Part 2: cue card, 1 minute prep, 1-2 minute long turn.
- Part 3: follow-up discussion, abstract/deeper questions, 4-5 minutes.

Scoring:

- Fluency and coherence.
- Lexical resource.
- Grammatical range and accuracy.
- Pronunciation.
- Speaking score = average of four criteria, rounded to nearest half band.
- Pronunciation is low-confidence if there is no audio.

LLM role:

- Generate topic set, Part 2 cue card, and Part 3 follow-up questions.
- Simulate examiner flow, including adaptive follow-ups for Part 3.
- Transcribe audio through transcription provider.
- Evaluate transcript plus audio-derived features.

Audio-derived features:

- Duration.
- Words per minute.
- Long pauses.
- Repetition markers.
- Pronunciation confidence if provider supports it.

## LLM Test Generation Pipeline

Use a multi-stage generation pipeline, not one-shot generation.

1. **Blueprint generation**
   - Input: target module, level, test type, question type distribution, topics to avoid/reuse.
   - Output: JSON blueprint with sections, timing, skills, difficulty, and uniqueness constraints.

2. **Content generation**
   - Listening: script/transcript, speaker metadata, question set, answer keys.
   - Reading: passage, question set, answer keys, source spans.
   - Writing: prompt, visual spec if Task 1, model answer outline.
   - Speaking: examiner script, cue card, follow-ups.

3. **Validation pass**
   - Verify schema.
   - Verify answer keys are present.
   - Verify objective answers are recoverable from passage/transcript.
   - Verify no copyrighted/public-source text was copied.
   - Verify difficulty and word counts.

4. **Human/content review**
   - All generated tests start as `draft` or `review`.
   - Admin/reviewer approves to `published`.

5. **Versioning**
   - Store generated content snapshots.
   - Preserve published test immutability for attempts already started.

## LLM Evaluation Pipeline

Writing/speaking evaluation should be async:

1. Learner submits response.
2. API creates evaluation record and `LlmJob`.
3. BullMQ worker processes job.
4. Provider returns structured JSON.
5. Server validates JSON schema and band ranges.
6. Server stores:
   - criterion bands
   - overall band
   - feedback
   - confidence
   - human-review flags
   - raw/parsed output
7. Module score is created or updated.
8. Full score prediction becomes available only when all four module scores exist.

Confidence rules:

- Low: first attempt, text-only speaking, short response, schema repaired, or generated content not human-reviewed.
- Medium: complete response, valid schema, no flags.
- High: multiple consistent attempts and/or human-reviewed samples. Avoid high confidence in MVP unless explicitly reviewed.

## Data Model Status

The schema now includes the core mock-test CMS and scoring primitives. Remaining model work is mostly hardening and analytics.

Implemented:

- `TestGenerationJob` model:
  - module, testType, status (blueprint/generating/validating/review/published)
  - provider, model, promptVersion
  - blueprintJson, outputJson, validationJson, errorJson
  - createdById, reviewedById, timestamps

- `Question.sourceSpanJson`:
  - JSON support for `{startOffset, endOffset, excerpt, reference, visualUrl?, visualAlt?}`.

- `TestSection.mediaAssetId`:
  - For listening section audio

- `TestSection.contentJson`:
  - Reading passage, listening transcript metadata, writing visual spec, speaking cue card

- `QuestionGroup` and `Question.groupId`:
  - IELTS-style grouped instructions and question blocks.

- `TestVersion`, `Test.versionNumber`, and `Test.parentTestId`:
  - Publish snapshots and duplicate-as-draft workflow.

- `ScoreMapping`:
  - Versioned raw-to-band mapping configuration.

- `EvaluationCalibration` model:
  - provider, model, promptVersion
  - calibrationSetId
  - averageDeviation
  - sampleSize

Future optional additions:

- `AttemptEvent` model (optional for MVP):
  - attemptId, eventType (autosave/section_opened/audio_started/etc)
  - metadataJson
  - Needed for server-side strict Listening playback enforcement and richer analytics.

## UX Requirements

### Shared mock test shell

- Section timer.
- Autosave indicator.
- Question navigation.
- Submitted/locked state.
- Confirm before leaving with unsaved answers.
- Review screen before final submission.
- Unanswered-count warning before section submission.
- No answer keys in client payload.
- Accessibility: keyboard navigation and visible focus.

### Listening UI

- Audio player with one-play strict mode.
- Optional practice mode with replay.
- Section question panel.
- Notes field optional.
- Playback state persisted.

Current status:

- Strict one-play behavior is implemented in the browser UI for attached Listening audio.
- Server-side `AttemptEvent` tracking is still required before using strict mode as anti-cheat enforcement.

### Reading UI

- Split passage/questions layout on desktop.
- Highlighting and notes.
- Question navigation.
- Mobile fallback: tabs between passage/questions.

Current status:

- Reading passages render side-by-side with questions on wide screens.
- Source spans are highlighted from stored offsets or excerpt fallback.
- Notes and passage/question mobile tabs remain future polish.

### Writing UI

- Task tabs.
- Word count.
- Timer.
- Prompt always visible.
- Autosave.
- Warning for under-word-count.

### Speaking UI

- Examiner-style flow.
- Recording controls.
- Part 2 prep timer.
- Upload progress.
- Transcript review only after submission, not during strict mock.

## Practice Modules Needed Before/Alongside Full Mocks

### Listening practice

- Dictation.
- Form completion.
- Map/diagram labeling.
- Multiple choice.
- Matching.
- Section-by-section mini tests.
- Accent exposure drills.

### Reading practice

- T/F/NG drills.
- Y/N/NG drills.
- Matching headings.
- Matching information.
- Sentence completion.
- Summary completion.
- Time-boxed passage practice.

### Writing practice

- Task 1 chart description.
- Task 1 process/map.
- Task 2 essay planner.
- Thesis and topic sentence drills.
- Coherence/cohesion rewrite drills.
- Lexical upgrade drills.
- Grammar correction drills.

### Speaking practice

- Part 1 quick answers.
- Part 2 cue-card long turn.
- Part 3 follow-up reasoning.
- Fluency drills.
- Pronunciation/read-aloud diagnostics.
- Vocabulary expansion for common IELTS topics.

## API Implementation Plan

### Admin/generation APIs

- `POST /api/admin/tests/generate`
  - Creates test generation job.
  - Accepts module/full mock, difficulty, topic constraints, test type, timed mode.

- `GET /api/admin/tests/generation-jobs/[id]`
  - Returns generation/validation/review status.

- `POST /api/admin/tests/[id]/publish`
  - Requires admin/reviewer role.
  - Blocks publish if validation failed.

### Learner APIs

Existing APIs should be extended rather than replaced:

- `GET /api/mock-tests`
- `GET /api/mock-tests/[id]`
- `POST /api/mock-tests/[id]/start`
- `GET /api/attempts/[attemptId]`
- `POST /api/attempts/[attemptId]/answers`
- `POST /api/attempts/[attemptId]/submit-section`
- `POST /api/evaluations/writing`
- `POST /api/evaluations/speaking`
- `GET /api/evaluations/[id]`
- `POST /api/attempts/[attemptId]/predict-score`

Add:

- `POST /api/attempts/[attemptId]/submit-test`
- `GET /api/attempts/[attemptId]/report`
- `GET /api/attempts/[attemptId]/weaknesses`

## Scoring Implementation Details

### Objective scoring

Normalize:

- lowercase
- trim whitespace
- collapse repeated spaces
- strip harmless punctuation where allowed
- normalize numbers and ordinals
- compare accepted answers
- enforce word limits

Store per answer:

- user answer
- normalized answer
- correctness
- matched accepted answer
- explanation/source span

### Raw-to-band mapping

Use versioned mapping tables:

- `listening_academic_v1`
- `reading_academic_v1`
- `reading_general_training_v1`

**REQUIRED**: Add `ScoreMapping` model to schema for admin-configurable raw-to-band mappings.

Mappings must be configurable because IELTS says precise marks can vary by test version.

### Overall score

Compute:

```text
overall = roundToNearestHalf((listening + reading + writing + speaking) / 4)
```

Use IELTS rounding behavior: `.25` rounds up to next half, `.75` rounds up to next whole.

## Release Phases

### Phase 1: Accurate objective modules

- ✅ Complete reading/listening question renderers - Shared IELTS renderer implemented
- ✅ Add answer normalization and word-limit validation - Implemented when saving objective answers
- ✅ Add source-span explanations - `Question.sourceSpanJson` added and rendered as highlights
- ✅ Add raw-to-band mapping - ScoreMapping model implemented
- ✅ Add tests proving answer keys never leak - P0 integration tests pass

### Phase 2: Writing/speaking evaluation quality

- ✅ Worker scaffolded with LlmJob - Implemented in src/workers/
- ✅ Production LLM provider - Implemented with OpenAI/Anthropic support
- ✅ JSON schema validation - Zod schemas in src/lib/evaluation/schemas.ts
- ✅ Rubric-specific prompts - Writing and speaking prompts defined
- ✅ EvaluationCalibration model - Added to schema
- ⏳ Add speaking transcription integration - Optional, deferred

### Phase 3: LLM test generation

- ✅ Add TestGenerationJob model
- ✅ Add admin generation jobs API
- ✅ Add local deterministic draft generation for workflow testing
- ✅ Add reviewed output import-as-draft flow
- ✅ Add content review workflow
- ✅ Add generated/imported test validation through normal publish gate
- ⏳ Add production LLM worker that fills `TestGenerationJob.outputJson`
- ⏳ Add external provider prompt/version execution and retry handling

### Phase 4: Full mock polish

- **PARTIALLY IMPLEMENTED**
- Timed/untimed modes
- Final review screen - ✅ Section-level review before submit implemented
- Full attempt report - ✅ Done (API and UI implemented)
- Weakness detection
- Recommended practice queue
- Analytics and score trajectory
- Strict Listening one-play simulation - ✅ Browser UI implemented; server event hardening pending
- Source-span highlighting - ✅ Implemented for Reading/Listening renderer
- Drag-and-drop admin ordering - ✅ Implemented for sections, groups, and questions

## Immediate P0/P1 Tasks

### P0

- ✅ Add `contentJson`/media support - Added to TestSection schema
- ✅ Build complete question renderers - Core APIs exist
- ✅ Admin test management UI - Complete (list/create/edit/delete)
- ✅ Production LLM provider interface and schema validation - Implemented (OpenAI/Anthropic)
- ✅ P0 integration tests - 12 tests passing
- ✅ Add full attempt report - /api/attempts/[id]/report implemented
- ✅ Speaking audio UI integration - Components: speaking-recorder.tsx, speaking-submission.tsx
- ✅ Add source-highlighted learner Reading/Listening rendering
- ✅ Add unanswered review before section submission
- ✅ Add strict Listening simulation UI

### P1

- ✅ Admin test list/create/edit UI - Complete
- ✅ Admin test sections/questions editor - Sections CRUD + Question CRUD implemented
- ✅ Admin TestGenerationJob UI - Job creation/review/import panels implemented
- ✅ Structured scoring controls and bulk question paste
- ✅ Admin validation-blocker dashboard counts
- ✅ Mobile learner/admin navigation
- ⏳ Weakness detection - Deferred to Phase 4
- ⏳ Timed/untimed toggle - Deferred to Phase 4
- ✅ Highlighting in reading/listening - Implemented from stored source spans
- ⏳ Notes in reading - Deferred to Phase 4
- ✅ Listening strict one-play mode - Implemented in browser UI; server hardening pending
- ⏳ Calibration dashboard comparing AI vs reviewer scores - Deferred to Phase 4
