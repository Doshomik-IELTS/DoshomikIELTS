# IELTS++ Content Management System Implementation Plan

Last updated: 2026-05-15

## Status: ✅ Core CMS Implemented — Production Hardening In Progress

The original admin test creation flow was a test-shell builder, not a complete content management system. That gap has now been closed. From `/admin/tests/new`, an admin gets a setup/template/source/review wizard, then the builder supports IELTS-style section material, Reading and Listening quick authoring boxes, question groups, answer keys, structured scoring rules, source spans, media attachment, validation, preview, review submission, publish blocking, and draft version duplication.

This document records the implemented CMS experience and the remaining hardening work for a flexible IELTS preparation platform.

## Current Codebase Baseline

Relevant implementation files:

- `src/app/(admin)/admin/tests/new/page.tsx`
- `src/components/admin/test-editor-form.tsx`
- `src/app/(admin)/admin/tests/[id]/builder/page.tsx`
- `src/components/admin/section-list-editor.tsx`
- `src/components/admin/question-list-editor.tsx`
- `src/components/admin/writing-section-editor.tsx`
- `src/components/admin/speaking-section-editor.tsx`
- `src/app/api/admin/tests/route.ts`
- `src/app/api/admin/tests/[id]/route.ts`
- `src/app/api/admin/tests/[id]/sections/route.ts`
- `src/app/api/admin/questions/route.ts`
- `prisma/schema.prisma`

Current strengths:

- Test, section, question, answer key, media asset, review, audit, and generation-job primitives already exist in Prisma.
- `/admin/tests/new` can bootstrap a full mock with Listening, Reading, Writing, and Speaking sections.
- `/admin/tests/[id]/builder` provides a rough structure editor and question editor.
- Writing and Speaking have structured `contentJson` editors.
- Admin routes are protected through `requireAdminActor`.
- Next.js 16 route handler conventions are already being used with async `params`.

Resolved in the current implementation:

- `GET /api/admin/tests/[id]` returns `contentJson`, `mediaAssetId`, and `sourceSpanJson` for builder use.
- Reading sections have a structured passage editor with paragraph splitting, word count, tags, and source-policy confirmation.
- Listening sections have a structured script editor with speakers, turns, transcript generation, audio metadata, and license confirmation.
- Objective Reading/Listening questions can store source-support metadata in `Question.sourceSpanJson`.
- Admins can run server-side CMS validation from the builder.
- `/api/admin/tests/[id]/publish` blocks publishing when validation fails.
- `/api/admin/tests/[id]/duplicate` creates an editable draft copy of an existing test.
- Writing question types now distinguish Academic Task 1, General Training Task 1, and Task 2.
- `Test.description`, `Test.versionNumber`, `Test.parentTestId`, `TestVersion`, `QuestionGroup`, `Question.groupId`, and searchable media metadata fields have been added to Prisma.
- The admin builder can create IELTS-style question groups and assign questions to them.
- The listening editor can search and attach media assets through `MediaAssetPicker`.
- The test list exposes structured JSON import and a generation-job entry point.
- Generation jobs can store reviewed JSON output, be rejected, or be imported as draft tests.
- Generation jobs can also create local deterministic draft JSON for end-to-end CMS workflow testing without external LLM credentials.
- Reading sections include a no-JSON quick authoring panel where editors paste a passage, question group, question prompts, options, answers, explanations, and source support into normal form boxes.
- Listening sections include a no-JSON quick authoring panel for transcript, audio attachment, question group, questions, options, answers, explanations, and transcript support.
- Learner attempts and admin preview share IELTS renderers for Reading/Listening material, question groups, options, and typed answer controls.
- Admin test import/generation tools are collapsed under Advanced tools, and builder section overview includes completion chips.
- Admins can open a draft/published learner-style preview from the builder.
- Published tests with learner attempts are protected from direct mutation; editors must duplicate a draft version instead.
- Publishing writes a version snapshot in `TestVersion`.
- Section, question, group, import, media, duplicate, and publish mutations write audit events.
- `/admin/tests/new` is now a setup/template/source/review wizard.
- Sections, question groups, and questions can be reordered from the builder.
- Tests submitted to `review` create `ContentReview` queue entries and review approval/rejection updates test status.
- Admin home now includes resource status counts, test status counts, review queue count, recent content updates, and tests with validation blockers.
- Learner and admin layouts include mobile navigation.
- Question authoring now includes structured scoring controls in `AnswerKey.scoringRuleJson`: mode, max words, case sensitivity, punctuation handling, number allowance, partial-credit flag, and internal notes.
- Objective answer marking reads scoring rules and accepted alternatives when saving learner answers.
- Admins can bulk paste tab-separated question rows and convert them into normal first-class `Question` records.
- Source block selection stores `reference`, `excerpt`, `startOffset`, and `endOffset` when source text is available.
- Learner Reading passages and Listening transcripts highlight stored source support.
- Learner attempts show unanswered-count warnings and a section review screen before final submission.
- Listening attempts use a stricter one-play simulation UI for attached audio.
- Map/diagram questions can render a visual when `sourceSpanJson.visualUrl` is present.
- Sections, groups, and questions support drag-and-drop reorder while keeping button controls as fallback.

Remaining product gaps after this implementation:

- Question creation still uses one unified editor, but it now includes IELTS-specific presets, subtype guidance, structured scoring controls, bulk paste, and selectable source evidence. Dedicated full-screen editors per question type remain optional future polish.
- Media search, metadata creation, signed upload URL use, and picker attachment are implemented for Listening audio; TTS/audio generation still needs a provider worker.
- Generation-job creation/review/import and local deterministic generation are implemented; production LLM worker integration is still pending.
- Strict Listening playback is currently enforced in the browser UI. Server-side attempt events are needed before treating it as anti-cheat enforcement.

## Implementation Todo List

### Done

- [x] Add `Test.description` so builder metadata persists.
- [x] Add `Question.sourceSpanJson` create/update support for Reading and Listening source evidence.
- [x] Add Reading passage editor backed by `TestSection.contentJson`.
- [x] Add Listening script/audio metadata editor backed by `TestSection.contentJson` and `mediaAssetId`.
- [x] Add server-side validation and publish blocking.
- [x] Add validated publish route.
- [x] Add duplicate-as-draft route.
- [x] Add `QuestionGroup` model and admin group editor.
- [x] Add `TestVersion` model and publish snapshots.
- [x] Add immutability guard for published tests with attempts.
- [x] Add searchable media library endpoint and listening media picker.
- [x] Add media metadata creation endpoint.
- [x] Add signed listening-audio upload flow using the existing private media upload endpoint.
- [x] Add structured JSON import route and admin import panel.
- [x] Add generation-job route and admin generation entry panel.
- [x] Add generation output review, reject, and import-as-draft workflow.
- [x] Add local deterministic generation output for provider-free workflow testing.
- [x] Add admin learner-style preview route.
- [x] Add audit logging for test, section, question, group, import, media, duplicate, and publish mutations.
- [x] Replace `/admin/tests/new` with a wizard for mode, difficulty, tags, template, and source strategy.
- [x] Add reorder controls and APIs for sections, question groups, and questions.
- [x] Add review queue records when tests move to `review`.
- [x] Add IELTS question presets and selectable Reading/Listening source evidence in the question editor.
- [x] Add no-JSON Reading quick authoring boxes for passage, question group, questions, options, answer keys, explanations, and source support.
- [x] Add no-JSON Listening quick authoring boxes for transcript, audio, question group, questions, answer keys, explanations, and source support.
- [x] Render Reading passages, Listening audio, question groups, and typed objective controls in learner attempts.
- [x] Reuse learner IELTS renderers in admin preview.
- [x] Collapse admin test import/generation under Advanced tools.
- [x] Add builder completion chips for Material, Questions, Answers, and Sources.
- [x] Add structured per-question scoring controls.
- [x] Apply scoring rules during objective answer marking.
- [x] Add row-based bulk paste for question sets.
- [x] Store source offsets when selecting Reading/Listening source blocks.
- [x] Highlight Reading/Listening source spans for learners.
- [x] Add drag-and-drop reorder for sections, groups, and questions.
- [x] Add admin dashboard counts for validation blockers.
- [x] Add unanswered warning and section review screen before learner submission.
- [x] Add strict one-play Listening simulation UI.
- [x] Add map/diagram visual rendering from `sourceSpanJson.visualUrl`.
- [x] Update docs to show current CMS status and remaining product work.

### Remaining

- [ ] Split the unified question editor into separate dedicated screens for completion, matching, headings, map/diagram labeling, MCQ, Writing Task 1/2, and Speaking parts only if content operations outgrow the current structured editor.
- [ ] Add TTS/audio generation integration for Listening media.
- [ ] Add production LLM worker that fills `TestGenerationJob.outputJson`; local deterministic generation and review/import screens are implemented.
- [ ] Add server-side `AttemptEvent` tracking for strict Listening playback and richer analytics.

## Target Admin Experience

The CMS should help an admin build test content the way an IELTS content editor thinks, not the way the database is shaped.

### Primary Navigation

Admin content navigation should expose:

- Resources: lessons, grammar, vocabulary, strategy pages, and learner articles.
- Practice items: reusable small drills and question banks.
- Mock tests: full or short IELTS-style tests assembled from sections and items.
- Media library: listening audio, generated audio, transcripts, images, charts, and license metadata.
- Review queue: content awaiting approval, validation issues, and flagged writing/speaking evaluations.

### Test Creation Flow

Replace the current two-step "metadata then modules" flow with a wizard:

1. Test setup
   - Title.
   - Internal description.
   - Test type: practice, short mock, full mock.
   - IELTS version: Academic now; General Training later.
   - Mode: timed, untimed, diagnostic, strict simulation.
   - Difficulty target: basic, intermediate, advanced.
   - Tags/topic family.

2. Structure template
   - Full Academic mock: Listening 4 parts, Reading 3 passages, Writing 2 tasks, Speaking 3 parts.
   - Module-only test: choose one module with official-like parts.
   - Short diagnostic: choose a curated reduced template.
   - Custom: advanced users can add/reorder sections manually.

3. Content source
   - Start blank.
   - Duplicate existing test as draft.
   - Import structured JSON.
   - Generate draft with LLM, then validate and review.

4. Build content
   - Module-specific editors for each section.
   - A persistent completeness panel showing missing content, answer keys, media, explanations, and review status.

5. Preview and validate
   - Preview as learner.
   - Run CMS validation.
   - Submit for review or publish if role allows.

### Builder Layout

Use a three-pane builder for tests:

- Left: test outline with modules, sections, status chips, counts, and validation warnings.
- Center: active section editor with module-specific forms.
- Right: validation, metadata, preview controls, and publishing checklist.

Avoid forcing admins to jump between generic cards. The active section should display the content object they are actually authoring: passage, transcript, prompt, cue card, question group, answer key, and explanation.

## Content Data Contracts

Keep Prisma models stable where possible, but standardize the shape of `TestSection.contentJson`, `Question.optionsJson`, `Question.sourceSpanJson`, and `AnswerKey.scoringRuleJson`.

### Reading Section Content

Store in `TestSection.contentJson`:

```json
{
  "kind": "reading_passage",
  "ieltsVersion": "academic",
  "passageTitle": "The Future of Urban Farming",
  "passageText": "Full original passage text...",
  "paragraphs": [
    { "label": "A", "text": "Paragraph text..." }
  ],
  "wordCount": 860,
  "topicTags": ["environment", "cities"],
  "sourcePolicy": {
    "sourceType": "original",
    "authorNote": "Written in-house",
    "copyrightChecked": true
  }
}
```

Required editor fields:

- Passage title.
- Passage text or paragraph blocks.
- Paragraph labels A, B, C for matching-heading and matching-information tasks.
- Word count, calculated automatically but editable only through text changes.
- Topic tags.
- Copyright/source checklist.

Reading question requirements:

- Group questions into IELTS-style blocks, for example "Questions 1-5: Matching headings".
- Support source spans for every objective item.
- Store source spans in `Question.sourceSpanJson` with paragraph label, offsets when available, and excerpt.
- Require answer explanations before publishing.

### Listening Section Content

Store in `TestSection.contentJson`:

```json
{
  "kind": "listening_script",
  "partType": "conversation",
  "setting": "A student asking about a local sports centre",
  "speakers": [
    { "id": "speaker_1", "name": "Receptionist", "accent": "British" },
    { "id": "speaker_2", "name": "Student", "accent": "International" }
  ],
  "turns": [
    { "speakerId": "speaker_1", "text": "Good morning. How can I help you?" }
  ],
  "transcript": "Flattened transcript for review and scoring support.",
  "audio": {
    "mediaAssetId": "uuid",
    "durationSeconds": 420,
    "playOnceInStrictMode": true
  },
  "sourcePolicy": {
    "sourceType": "original",
    "voiceSource": "tts",
    "licenseChecked": true
  }
}
```

Required editor fields:

- Part type: conversation, monologue, academic discussion, lecture.
- Setting/context.
- Speaker list with accent metadata.
- Script as speaker turns.
- Audio attachment from media library or TTS generation job.
- Duration and playback policy.
- License/source metadata.

Listening question requirements:

- Support completion, matching, map/diagram labeling, multiple choice, and short answer.
- Store word-limit rules in `AnswerKey.scoringRuleJson`.
- Require transcript-aligned answer support before publishing.

### Writing Section Content

The current `WritingSectionEditor` is a useful start. Expand its `contentJson` contract:

```json
{
  "kind": "writing_task",
  "taskType": "task_1_academic",
  "prompt": "The chart below shows...",
  "visual": {
    "type": "bar_chart",
    "data": [],
    "imageMediaAssetId": null,
    "altText": "Bar chart comparing..."
  },
  "instructions": "Summarise the information by selecting and reporting the main features...",
  "minWords": 150,
  "recommendedMinutes": 20,
  "sampleAnswer": "",
  "rubricFocus": ["task_achievement", "coherence", "lexical_resource", "grammar"],
  "sourcePolicy": {
    "sourceType": "original",
    "copyrightChecked": true
  }
}
```

Required improvements:

- Separate Task 1 Academic, Task 1 General Training, and Task 2 values. The current question type options duplicate `writing_task_2`.
- Add visual data or image support for Academic Task 1.
- Add prompt-type taxonomy for Task 2: opinion, discussion, advantage/disadvantage, problem/solution, two-part.
- Keep sample answers admin-only unless deliberately exposed.

### Speaking Section Content

The current `SpeakingSectionEditor` is also a useful start. Standardize the contract:

```json
{
  "kind": "speaking_set",
  "topicFamily": "books and reading",
  "parts": [
    {
      "part": "part_1",
      "questions": ["Do you enjoy reading?"],
      "prepTimeSeconds": 0,
      "responseTimeSeconds": 60
    },
    {
      "part": "part_2",
      "cueCard": "Describe a book you recently read.",
      "bulletPoints": ["what it was about", "why you read it", "how you felt"],
      "prepTimeSeconds": 60,
      "responseTimeSeconds": 120
    },
    {
      "part": "part_3",
      "questions": ["How has technology changed reading habits?"],
      "followUpQuestions": ["Why do some people still prefer printed books?"],
      "prepTimeSeconds": 0,
      "responseTimeSeconds": 180
    }
  ],
  "sourcePolicy": {
    "sourceType": "original",
    "copyrightChecked": true
  }
}
```

Required improvements:

- Represent one speaking set as Parts 1-3, not unrelated cue cards.
- Make Part 2 cue-card fields explicit.
- Add examiner notes and allowed follow-up behavior.
- Add learner recording requirements per mode.

### Question Data

Keep using `Question` and `AnswerKey`, but make the admin UI type-aware.

Common fields:

- Number range or order index.
- Question type.
- Prompt/instruction.
- Difficulty.
- Skill tags.
- Explanation.
- Answer key.
- Accepted alternatives.
- Scoring rule.
- Source span for Reading/Listening.

Recommended `scoringRuleJson`:

```json
{
  "mode": "normalized",
  "caseSensitive": false,
  "ignorePunctuation": true,
  "allowNumber": true,
  "maxWords": 3,
  "partialCredit": false,
  "note": "No more than three words."
}
```

Recommended `sourceSpanJson`:

```json
{
  "source": "reading_passage",
  "paragraphLabel": "B",
  "startOffset": 120,
  "endOffset": 196,
  "excerpt": "The answer-supporting sentence...",
  "reference": "Paragraph B",
  "rationale": "This sentence states the same idea as option C."
}
```

## Module-Specific Editors

Implemented or planned components:

- `ReadingSectionEditor` - implemented.
- `ListeningSectionEditor` - implemented.
- `ListeningAudioEditor` - implemented through listening editor, signed upload flow, media metadata endpoint, and `MediaAssetPicker`.
- `WritingTaskEditor` expanded from `WritingSectionEditor`
- `SpeakingSetEditor` expanded from `SpeakingSectionEditor`
- `QuestionGroupEditor`
- `AnswerKeyEditor`
- `SourceSpanPicker` - implemented as selectable source blocks with reference, excerpt, and offset storage. Free text-range selection remains future polish.
- `ContentValidationPanel` - implemented in the admin test builder.
- `LearnerPreviewPanel`
- `MediaAssetPicker`

### ReadingPassageEditor

Capabilities:

- Paste full passage and split into paragraphs.
- Auto-label paragraphs.
- Show word count and target range.
- Create question groups linked to selected passage text.
- Let editors highlight source text and attach it to a question.
- Quick authoring path: paste passage and enter question rows in normal boxes, then save all content without preparing structured JSON manually.

### ListeningScriptEditor

Capabilities:

- Add speaker turns.
- Convert turns into transcript preview.
- Mark answer-supporting transcript spans.
- Attach or generate audio.
- Track accent and speaker metadata.

### QuestionGroupEditor

Admins should create groups such as:

- Questions 1-6: Complete the notes below. Write no more than two words and/or a number.
- Questions 7-10: Choose the correct letter, A, B, or C.
- Questions 14-18: The reading passage has six paragraphs, A-F. Which paragraph contains the following information?

The group owns the shared instruction and display style. Individual `Question` rows own answer keys and explanations.

The schema now has a `QuestionGroup` model and `Question.groupId`, so group metadata no longer needs to be embedded in `Question.optionsJson`.

Implemented model:

```prisma
model QuestionGroup {
  id          String   @id @default(uuid())
  sectionId   String
  title       String
  instructions String
  questionType String
  orderIndex  Int
  displayJson Json?

  section   TestSection @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  questions Question[]
}
```

If adding this model, add `groupId String?` to `Question`.

## Validation And Publishing Rules

Publishing should be blocked until validation passes.

### Test-Level Validation

Full Academic mock:

- Listening has 4 parts and 40 objective questions.
- Reading has 3 passages and 40 objective questions.
- Writing has Task 1 and Task 2.
- Speaking has Parts 1, 2, and 3.
- Total estimated duration is present.
- Every learner-visible section has instructions.
- All content has source/copyright metadata.

Short mock:

- Every selected module has at least one section.
- Each objective section has answer keys.
- Timing and scoring mode are explicitly set.

### Section-Level Validation

Reading:

- Passage text exists.
- Word count is within configured target for the section.
- Every question has an answer key.
- Every objective answer has source-span support.
- T/F/NG and Y/N/NG items have defensible explanations.

Listening:

- Script/transcript exists.
- Audio is attached or section is marked text-only for draft practice.
- Media asset has license metadata.
- Duration is present.
- Every objective answer is supported by transcript.

Writing:

- Task type is present.
- Prompt is present.
- Min words and recommended time match task type.
- Task 1 Academic has visual data, image, or explicit visual spec.

Speaking:

- Part-specific questions are present.
- Part 2 includes cue card and bullet points.
- Prep and response timing are present.

### Validation Storage

Use `ContentReview` for human workflow and add a validation result object in `TestGenerationJob.validationJson` for generated content. For manually authored content, either add a `ContentValidationRun` model or store the latest validation summary in a new `Test.validationJson` field.

Recommended model:

```prisma
model ContentValidationRun {
  id          String   @id @default(uuid())
  entityType  String
  entityId    String
  status      String
  issuesJson  Json
  createdById String?
  createdAt   DateTime @default(now())
}
```

## Backend Implementation Plan

Follow Next.js 16 App Router route handler conventions from `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`: route handlers live under `app`, use Web `Request`/`Response`, and dynamic route `params` are async in this codebase.

### Phase 1: Fix Existing Builder Contract

- Return `contentJson` and `mediaAssetId` from `GET /api/admin/tests/[id]`. **Implemented.**
- Fix Writing question type constants so Task 1 General Training is not stored as `writing_task_2`. **Implemented.**
- Add source-span support to admin question create/update flows. **Implemented.**
- Add Zod validators for standardized `contentJson` per module. **Partially implemented through server-side publish validation.**
- Add audit events for section and question create/update/delete. **Implemented.**
- Add `description String?` to `Test`, or remove description editing from the builder. **Implemented.**

### Phase 2: Reading And Listening Material Editors

- Build `ReadingPassageEditor`. **Implemented as `ReadingSectionEditor`.**
- Build `ListeningScriptEditor`. **Implemented as `ListeningSectionEditor`.**
- Build `MediaAssetPicker` for listening audio. **Implemented.**
- Extend admin section API validation to accept the standardized JSON contracts. **Partially implemented by publish validation.**
- Add media upload or attach flow using the storage plan in [`storage-and-media.md`](../backend/storage-and-media.md). **Implemented for Listening audio using signed upload URLs, searchable metadata, and attachment. Image/admin visual upload remains a future extension.**

### Phase 3: Question Groups And IELTS-Specific Forms

- Add `QuestionGroup` or MVP group metadata. **Implemented with `QuestionGroup` and `Question.groupId`.**
- Replace generic question creation with forms per question type. **Partially implemented; the editor exposes type-specific option/answer/source fields.**
- Add answer-key normalization options. **Implemented through structured `scoringRuleJson` controls and objective marking support.**
- Add source-span picker for Reading and Listening. **Implemented as selectable Reading paragraph / Listening transcript source blocks plus editable reference/excerpt/offset fields, with learner highlighting.**
- Add drag/reorder for groups and questions. **Implemented with drag-and-drop, fallback buttons, and reorder APIs.**

### Phase 4: Validation, Preview, And Review Workflow

- Add validation service: `validateTestForPublish(testId)`. **Implemented.**
- Add `/api/admin/tests/[id]/validate`. **Implemented.**
- Add `/api/admin/tests/[id]/publish` that validates before publishing. **Implemented.**
- Add learner preview route or preview mode for draft tests. **Implemented at `/admin/tests/[id]/preview`.**
- Add review queue entries for tests moved to `review`. **Implemented with `ContentReview` records and test status updates on approve/reject.**

### Phase 5: Generation And Import

- Add structured JSON import matching the contracts in this document. **Implemented at `/api/admin/tests/import`.**
- Use `TestGenerationJob` for LLM-generated drafts. **Implemented as job creation/status/output API plus import-as-draft; worker remains pending.**
- Require generated tests to pass validation and human review before publish. **Implemented through reviewed JSON import to draft plus normal publish validation; provider worker remains pending.**
- Add duplicate-test-as-draft to speed content production. **Implemented with `/api/admin/tests/[id]/duplicate`.**

### Phase 6: Versioning And Immutability

- Do not mutate published content that has attempts. **Implemented for test metadata, sections, question groups, and questions.**
- Add test version snapshots before publish and on major edits. **Implemented before publish. Major edit snapshots remain a future enhancement.**
- Editing a published test with attempts should create a new draft version. **Implemented as explicit Duplicate Draft action.**

## API Surface

Recommended additions:

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/admin/tests/[id]/validate` | Run readiness validation. |
| `POST` | `/api/admin/tests/[id]/publish` | Validate and publish atomically. |
| `POST` | `/api/admin/tests/[id]/duplicate` | Create editable draft copy. |
| `POST` | `/api/admin/tests/import` | Import structured JSON draft. |
| `GET` | `/api/admin/media` | Search media library. |
| `POST` | `/api/admin/media` | Create/upload media asset metadata. |
| `PATCH` | `/api/admin/media/[id]` | Update media title, alt text, transcript, duration, or license metadata. |
| `GET` | `/api/admin/question-groups?sectionId=...` | List IELTS-style question groups for a section. |
| `POST` | `/api/admin/question-groups` | Create IELTS-style question group. |
| `PATCH` | `/api/admin/question-groups/[id]` | Update IELTS-style question group. |
| `DELETE` | `/api/admin/question-groups/[id]` | Delete IELTS-style question group. |
| `PATCH` | `/api/admin/tests/[id]/sections/reorder` | Reorder test sections. |
| `PATCH` | `/api/admin/question-groups/reorder` | Reorder question groups. |
| `PATCH` | `/api/admin/questions/reorder` | Reorder questions. |
| `POST` | `/api/admin/generation/tests` | Start LLM generation job. |
| `GET` | `/api/admin/generation/tests/[id]` | Read generation/validation status. |
| `PATCH` | `/api/admin/generation/tests/[id]` | Store reviewed generation output or update generation status. |
| `POST` | `/api/admin/generation/tests/[id]/generate-draft` | Create local deterministic importable draft JSON for workflow testing. |
| `POST` | `/api/admin/generation/tests/[id]/import-draft` | Convert reviewed generation output into an editable draft test. |
| `GET` | `/admin/tests/[id]/preview` | Admin-only learner-style draft preview. |

Keep existing routes for compatibility, but avoid putting publish logic in a generic `PATCH` status update.

## Data Model Status

Implemented additions:

```prisma
model Test {
  id        String        @id @default(uuid())
  title     String
  description String?
  type      TestType      @default(short_mock)
  status    ContentStatus @default(draft)
  estimatedDurationMinutes Int?
  versionNumber Int       @default(1)
  parentTestId String?
  publishedAt DateTime?
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
}
```

Also implemented:

- `QuestionGroup`.
- `TestVersion` snapshot model.
- `Question.groupId`.
- `Question.sourceSpanJson`.
- `TestSection.contentJson`.
- `TestSection.mediaAssetId`.
- `MediaAsset.title`, `MediaAsset.altText`, and `MediaAsset.transcriptText`.
- `ScoreMapping`.
- `TestGenerationJob`.

Future optional additions:

- `ContentValidationRun` if validation history needs persistence beyond immediate publish checks.
- `AttemptEvent` for server-side Listening playback events, autosave events, section-opened analytics, and strict-mode hardening.

## Implementation Notes For This Repo

- Use `apiFetch` and React Query for builder mutations, consistent with the current admin builder.
- Keep admin-only validation server-side. Client validation is useful for UX but cannot be trusted.
- Prefer route handlers for admin APIs because the current app already uses that pattern.
- Every admin mutation must call `requireAdminActor`.
- Every publish path must write `AuditLog`.
- Use Zod schemas near API boundaries and shared TypeScript types for `contentJson`.
- Treat `contentJson` as a typed contract, not an unstructured dumping ground.
- Treat `AnswerKey.scoringRuleJson` as the scoring contract for objective questions, not a free-text note.
- Treat `Question.sourceSpanJson` as both human evidence and machine-renderable source support.
- Keep copyrighted IELTS material out of the system. Store source policy fields and require confirmation before publish.

## Definition Of Done

The CMS is acceptable when an admin can:

- Create a full IELTS Academic mock from a template.
- Add Reading passages with paragraph labels and source-supported questions.
- Add Listening scripts, speaker metadata, audio, transcript, license metadata, and source-supported questions.
- Add Writing Task 1/Task 2 prompts with visual specs and word limits.
- Add Speaking Parts 1-3 as one coherent speaking set.
- Preview the test exactly as a learner will see it.
- See completeness and validation warnings without opening every section manually.
- Submit content for review.
- Publish only after validation passes.
- Duplicate or version published content without breaking existing attempts.
