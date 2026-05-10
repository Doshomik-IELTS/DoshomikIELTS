# Backend Data Model

> **Status:** All models implemented in Prisma schema as of 2026-05-10
> **Latest additions:** TestGenerationJob, ScoreMapping, EvaluationCalibration (2026-05-10)

## General Rules

- Use UUID primary keys.
- Use `createdAt` and `updatedAt` on major records.
- Link app users to Supabase Auth users by `authUserId`.
- Keep learner-visible content separate from answer keys.
- Store LLM responses as structured JSON for later analysis.
- Never store copied Cambridge/commercial IELTS content.

## Identity And Profile

### `Profile`

Stores app-specific learner data.

Fields:

- `id`
- `authUserId`
- `email`
- `name`
- `targetBand`
- `examDate`
- `nativeLanguage`
- `studyGoal`
- `createdAt`
- `updatedAt`

### `Role`

Fields:

- `id`
- `profileId`
- `role`: `learner`, `admin`, `reviewer`, `evaluator`

### `SavedResource` (added 2026-05-10)

Tracks bookmarked resources for learners.

Fields:

- `id`
- `profileId`
- `resourceId`
- `createdAt`

## Resource Library

### `Resource`

Fields:

- `id`
- `title`
- `slug`
- `category`: `basic_english`, `words`, `synonyms`, `grammar`, `reading_strategy`, `listening_strategy`, `writing_strategy`, `speaking_strategy`
- `difficulty`: `basic`, `intermediate`, `advanced`
- `body`
- `examplesJson`
- `tags`
- `status`: `draft`, `review`, `published`, `archived`
- `createdById`
- `reviewedById`
- `publishedAt`
- `createdAt`
- `updatedAt`

### `ResourceVersion`

Tracks revisions.

Fields:

- `id`
- `resourceId`
- `versionNumber`
- `snapshotJson`
- `changeNote`
- `createdById`
- `createdAt`

### `VocabularyEntry`

Fields:

- `id`
- `word`
- `level`
- `topic`
- `definition`
- `exampleSentence`
- `collocations`
- `resourceId`

### `SynonymGroup`

Fields:

- `id`
- `baseWord`
- `meaning`
- `synonymsJson`
- `registerNotes`
- `misuseExamples`
- `resourceId`

### `GrammarRule`

Fields:

- `id`
- `title`
- `ruleText`
- `examplesJson`
- `commonErrorsJson`
- `drillsJson`
- `resourceId`

## Tests And Questions

### `Test`

Fields:

- `id`
- `title`
- `type`: `practice`, `short_mock`, `full_mock`
- `status`: `draft`, `review`, `published`, `archived`
- `estimatedDurationMinutes`
- `createdById`
- `reviewedById`
- `publishedAt`
- `createdAt`
- `updatedAt`

### `TestSection`

Fields:

- `id`
- `testId`
- `module`: `listening`, `reading`, `writing`, `speaking`
- `partNumber`
- `title`
- `instructions`
- `durationMinutes`
- `orderIndex`
- `contentJson`: reading passage, listening transcript, writing visual spec, speaking cue card (added 2026-05-10)
- `mediaAssetId`: audio for listening sections (added 2026-05-10)

### `Passage`

Fields:

- `id`
- `sectionId`
- `title`
- `body`
- `sourceType`: `original`, `licensed`, `public_domain`
- `licenseMetadataJson`

### `ListeningScript`

Fields:

- `id`
- `sectionId`
- `transcript`
- `speakerAccent`
- `durationSeconds`
- `mediaAssetId`
- `sourceType`: `original`, `licensed`, `public_domain`, `tts_generated`, `in_house_recorded`
- `licenseMetadataJson`

### `Question`

Fields:

- `id`
- `sectionId`
- `passageId`
- `questionType`
- `prompt`
- `optionsJson`
- `orderIndex`
- `difficulty`
- `explanation`
- `sourceSpanJson`: {startOffset, endOffset, excerpt, reference} (added 2026-05-10, replaced sourceSpan)

### `AnswerKey`

Fields:

- `id`
- `questionId`
- `canonicalAnswer`
- `acceptedAnswersJson`
- `scoringRuleJson`
- `explanation`

## Attempts And Answers

### `PracticeAttempt`

Fields:

- `id`
- `profileId`
- `resourceId`
- `practiceType`
- `answersJson`
- `scoreJson`
- `feedbackJson`
- `timeSpentSeconds`
- `createdAt`

### `MockTestAttempt`

Fields:

- `id`
- `profileId`
- `testId`
- `status`: `in_progress`, `submitted`, `evaluating`, `completed`, `failed`
- `startedAt`
- `submittedAt`
- `completedAt`

### `AttemptAnswer`

Fields:

- `id`
- `attemptId`
- `sectionId`
- `questionId`
- `answerText`
- `answerJson`
- `isCorrect`
- `score`
- `submittedAt`

### `ModuleScore`

Fields:

- `id`
- `attemptId`
- `module`
- `rawScore`
- `maxRawScore`
- `estimatedBand`
- `criteriaJson`
- `feedbackJson`
- `confidence`

### `ScorePrediction`

Fields:

- `id`
- `attemptId`
- `listeningBand`
- `readingBand`
- `writingBand`
- `speakingBand`
- `overallBand`
- `confidence`: `low`, `medium`, `high`
- `calculationJson`
- `disclaimer`
- `createdAt`

## Evaluation

### `WritingEvaluation`

Fields:

- `id`
- `profileId`
- `attemptId`
- `sectionId`
- `taskType`: `task_1`, `task_2`
- `responseText`
- `wordCount`
- `criteriaBandsJson`
- `overallBand`
- `feedbackJson`
- `llmJobId`
- `status`
- `needsHumanReview`
- `createdAt`
- `updatedAt`

### `SpeakingEvaluation`

Fields:

- `id`
- `profileId`
- `attemptId`
- `sectionId`
- `part`: `part_1`, `part_2`, `part_3`
- `responseText`
- `mediaAssetId`
- `transcript`
- `criteriaBandsJson`
- `overallBand`
- `feedbackJson`
- `pronunciationAvailable`
- `llmJobId`
- `status`
- `needsHumanReview`
- `createdAt`
- `updatedAt`

## Media And Jobs

### `MediaAsset`

Fields:

- `id`
- `profileId`
- `bucket`
- `path`
- `purpose`
- `contentType`
- `sizeBytes`
- `durationSeconds`
- `licenseMetadataJson`
- `createdAt`

### `LlmJob`

Fields:

- `id`
- `type`: `writing_evaluation`, `speaking_transcription`, `speaking_evaluation`, `score_prediction`, `content_validation`
- `status`: `queued`, `processing`, `succeeded`, `failed`, `needs_review`
- `provider`
- `model`
- `promptVersion`
- `inputJson`
- `outputJson`
- `errorJson`
- `attemptCount`
- `createdAt`
- `updatedAt`

### `ExternalStudyRecord`

Tracks external book/resource progress without copied content.

Fields:

- `id`
- `profileId`
- `sourceLabel`
- `progressLabel`
- `notes`
- `createdAt`

### `TestGenerationJob` (added 2026-05-10)

For LLM-powered test generation pipeline.

Fields:

- `id`
- `module`: `listening`, `reading`, `writing`, `speaking`
- `testType`
- `status`: `blueprint`, `generating`, `validating`, `review`, `published`, `archived`
- `provider`
- `model`
- `promptVersion`
- `blueprintJson`
- `outputJson`
- `validationJson`
- `errorJson`
- `createdById`
- `reviewedById`
- `createdAt`
- `updatedAt`

### `ScoreMapping` (added 2026-05-10)

For configurable raw-to-band score mappings.

Fields:

- `id`
- `module`: `listening`, `reading_academic`, `reading_general_training`
- `version`
- `rawToBandJson`: `[{minRaw, maxRaw, band}]`
- `isDefault`
- `createdAt`
- `updatedAt`

### `EvaluationCalibration` (added 2026-05-10)

For tracking LLM evaluation accuracy vs human bands.

Fields:

- `id`
- `provider`
- `model`
- `promptVersion`
- `calibrationSetId`
- `averageDeviation`
- `sampleSize`
- `createdAt`
- `updatedAt`

### `AuditLog`

Fields:

- `id`
- `actorProfileId`
- `action`
- `entityType`
- `entityId`
- `metadataJson`
- `createdAt`

### `ContentReview` (added 2026-05-10)

For content review workflow.

Fields:

- `id`
- `contentType`
- `contentId`
- `status`: `draft`, `review`, `published`, `archived`
- `reviewerId`
- `notes`
- `createdAt`
- `updatedAt`
