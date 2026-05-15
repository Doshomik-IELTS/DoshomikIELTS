# Backend Data Model

> **Status:** All models implemented in Prisma schema as of 2026-05-15
> **Latest additions:** QuestionGroup, TestVersion, ResourcePrerequisite, ReferralConfig, BetaFeedback models. New fields on Resource, MockTestAttempt, MediaAsset, FlashCard, FlashCardDeck, ResourceProgress. New enums: TaskType, SpeakingPart, ProgressStatus, ReferralStatus, RedemptionStatus, CreditTxType, RewardTrigger. (2026-05-15)

## General Rules

- Use UUID primary keys.
- Use `createdAt` and `updatedAt` on major record.
- Link app users to Supabase Auth users by `authUserId`.
- Keep learner-visible content separate from answer keys.
- Store LLM responses as structured JSON for later analysis.
- Never store copied Cambridge/commercial IELTS content.

## Enums

### Core Enums

| Enum | Values |
|---|---|
| `AppRole` | `learner`, `admin`, `reviewer`, `evaluator` |
| `ContentStatus` | `draft`, `review`, `published`, `archived` |
| `Difficulty` | `basic`, `intermediate`, `advanced` |
| `ResourceCategory` | `basic_english`, `words`, `synonyms`, `grammar`, `reading_strategy`, `listening_strategy`, `writing_strategy`, `speaking_strategy` |
| `TestType` | `practice`, `short_mock`, `full_mock` |
| `IeltsModule` | `listening`, `reading`, `writing`, `speaking` |
| `AttemptStatus` | `in_progress`, `submitted`, `evaluating`, `completed`, `failed` |
| `JobStatus` | `queued`, `processing`, `succeeded`, `failed`, `needs_review` |
| `ConfidenceLevel` | `low`, `medium`, `high` |
| `GenerationStatus` | `blueprint`, `generating`, `validating`, `review`, `published`, `archived` |

### Additional Enums (added 2026-05-15)

| Enum | Values |
|---|---|
| `TaskType` | `task_1`, `task_2` |
| `SpeakingPart` | `part_1`, `part_2`, `part_3` |
| `ProgressStatus` | `not_started`, `in_progress`, `completed`, `skipped` |
| `ReferralStatus` | `active`, `suspended`, `deactivated` |
| `RedemptionStatus` | `pending`, `completed`, `cancelled` |
| `CreditTxType` | `referral_bonus`, `redemption`, `admin_grant`, `admin_revoke`, `refund`, `promo` |
| `RewardTrigger` | `on_signup`, `on_first_purchase` |

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
- `streak` — current consecutive study day streak (added 2026-05-13)
- `longestStreak` — all-time best streak (added 2026-05-13)
- `lastStudyDate` — date of last study activity (added 2026-05-13)
- `createdAt`
- `updatedAt`

### `Role`

Fields:

- `id`
- `profileId`
- `role`: `learner`, `admin`, `reviewer`, `evaluator`

### `SavedResource`

Tracks bookmarked resources for learners.

Fields:

- `id`
- `profileId`
- `resourceId`
- `createdAt`

### `Referral`

Referral program configuration per user.

Fields:

- `id`
- `referrerId` — unique, links to Profile
- `code` — unique referral code
- `status`: `active`, `suspended`, `deactivated`
- `createdAt`
- `updatedAt`

### `ReferralRedemption`

Tracks when a learner uses a referral code.

Fields:

- `id`
- `referralId`
- `refereeId` — the user who applied the code
- `referrerReward` — credits awarded to referrer
- `refereeReward` — credits awarded to referee
- `status`: `pending`, `completed`, `cancelled`
- `processedAt`
- `createdAt`

### `CreditLedger`

Tracks all credit transactions for a profile.

Fields:

- `id`
- `profileId`
- `amount` — positive for credit, negative for debit
- `type`: `referral_bonus`, `redemption`, `admin_grant`, `admin_revoke`, `refund`, `promo`
- `description`
- `refId` — links to ReferralRedemption or other source
- `createdAt`

### `ReferralConfig` (added 2026-05-15)

Singleton configuration for the referral program (id defaults to "singleton").

Fields:

- `id` — defaults to "singleton"
- `referrerReward` — default credits for referrer (default 1)
- `refereeReward` — default credits for referee (default 1)
- `minPurchaseForReward` — optional minimum purchase threshold
- `maxRedemptionsPerCode` — optional limit
- `rewardTrigger`: `on_signup` or `on_first_purchase`
- `enabled` — toggle referral program (default true)
- `updatedAt`

### `BetaFeedback` (added 2026-05-15)

User-submitted beta feedback.

Fields:

- `id`
- `profileId` — nullable (feedback from non-logged-in users)
- `email` — nullable
- `category` — `bug`, `feature`, `improvement`, `general`
- `message`
- `pageUrl` — optional
- `metadataJson` — browser metadata (userAgent, etc.)
- `status` — default "new"
- `createdAt`

Indexes on `status` and `createdAt`.

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
- `orderIndex` — for progression ordering (default 0)
- `createdById`
- `reviewedById`
- `publishedAt`
- `createdAt`
- `updatedAt`

Relations:
- `prereqs` → `ResourcePrerequisite[]` (resources this depends on)
- `dependents` → `ResourcePrerequisite[]` (resources that depend on this)

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

## Progress Tracking

### `ResourceProgress`

Tracks learner progress on individual resources.

Fields:

- `id`
- `profileId`
- `resourceId`
- `status`: `not_started`, `in_progress`, `completed`, `skipped`
- `progress` — 0-100 percentage (added 2026-05-15)
- `timeSpent` — seconds spent
- `completedAt` — timestamp when completed (added 2026-05-15)
- `updatedAt`
- `createdAt`

### `ResourcePrerequisite` (added 2026-05-15)

Defines prerequisite relationships between resources for progression locking.

Fields:

- `id`
- `resourceId` — the resource that has prerequisites
- `prerequisiteId` — the required resource to complete first
- `requiredScore` — minimum score required (if practice)
- `minProgress` — minimum progress percentage required (default 100)
- `createdAt`

Unique constraint on `(resourceId, prerequisiteId)`.

## Flashcards

### `FlashCardDeck`

Spaced-repetition flashcard deck.

Fields:

- `id`
- `title`
- `description`
- `category`: e.g. `vocabulary`, `grammar`, `listening`
- `difficulty`: `basic`, `intermediate`, `advanced`
- `status`: `draft`, `review`, `published`, `archived`
- `tags` — string array
- `createdById` — creator (nullable, deck can be system-owned)
- `publishedAt`
- `createdAt`
- `updatedAt`

### `FlashCard`

Individual flashcard within a deck.

Fields:

- `id`
- `deckId`
- `front` — question/prompt
- `back` — answer
- `examples` — string array of example sentences
- `hints` — string array of hints
- `tags` — string array (added 2026-05-15)
- `difficulty`: `basic`, `intermediate`, `advanced`
- `orderIndex`
- `repetitions` — SM-2 repetition count (0 = new)
- `interval` — SM-2 interval in days
- `easeFactor` — SM-2 ease factor (default 2.5)
- `nextReview` — next review date (null = new/due)
- `createdAt`
- `updatedAt`

### `CardReviewLog`

SM-2 review history for analytics.

Fields:

- `id`
- `cardId`
- `profileId`
- `quality` — 0–5 rating (0=Again, 2=Hard, 4=Good, 5=Easy)
- `interval` — resulting interval in days
- `easeFactor` — resulting ease factor
- `reviewedAt`

## Tests And Questions

### `Test`

Fields:

- `id`
- `title`
- `description` — optional test description
- `type`: `practice`, `short_mock`, `full_mock`
- `status`: `draft`, `review`, `published`, `archived`
- `estimatedDurationMinutes`
- `versionNumber` — current version (default 1)
- `parentTestId` — for duplicated tests, links to original
- `publishedAt`
- `createdAt`
- `updatedAt`

Relations:
- `versions` → `TestVersion[]`

### `TestSection`

Fields:

- `id`
- `testId`
- `module`: `listening`, `reading`, `writing`, `speaking`
- `partNumber`
- `title`
- `instructions`
- `durationMinutes` — per-section time limit
- `orderIndex`
- `contentJson`: reading passage, listening transcript, writing visual spec, speaking cue card
- `mediaAssetId`: audio for listening sections

Relations:
- `groups` → `QuestionGroup[]`
- `questions` → `Question[]`
- `attempts` → `AttemptAnswer[]`

### `TestVersion` (added 2026-05-15)

Tracks test revision snapshots.

Fields:

- `id`
- `testId`
- `versionNumber`
- `snapshotJson`
- `changeNote`
- `createdById`
- `createdAt`

Unique constraint on `(testId, versionNumber)`.

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

### `QuestionGroup` (added 2026-05-15)

Groups related questions within a test section (e.g., a set of T/F/NG questions sharing common instructions).

Fields:

- `id`
- `sectionId`
- `title`
- `instructions`
- `questionType`
- `orderIndex`
- `displayJson` — display configuration
- `createdAt`
- `updatedAt`

### `Question`

Fields:

- `id`
- `sectionId`
- `groupId` — optional, links to QuestionGroup
- `passageId`
- `questionType`
- `prompt`
- `optionsJson`
- `orderIndex`
- `difficulty`
- `explanation`
- `sourceSpanJson`: {startOffset, endOffset, excerpt, reference}

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
- `timeSpentSeconds` — total time spent (added 2026-05-15)
- `lastActiveAt` — for timer checks (added 2026-05-15)

### `AttemptAnswer`

Fields:

- `id`
- `attemptId` (references MockTestAttempt)
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

## Achievements

### `Achievement` (added 2026-05-13)

Defines available achievement badges.

Fields:

- `id`
- `slug` — unique identifier
- `name`
- `description`
- `icon` — emoji
- `createdAt`

### `ProfileAchievement` (added 2026-05-13)

Tracks earned achievements per profile.

Fields:

- `id`
- `profileId`
- `achievementId`
- `earnedAt`

Unique constraint on `(profileId, achievementId)`.

## Media And Jobs

### `MediaAsset`

Fields:

- `id`
- `profileId`
- `title` — human-readable name (added 2026-05-15)
- `altText` — accessibility description (added 2026-05-15)
- `transcriptText` — audio transcript text (added 2026-05-15)
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

### `TestGenerationJob`

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

### `ScoreMapping`

For configurable raw-to-band score mappings.

Fields:

- `id`
- `module`: `listening`, `reading_academic`, `reading_general_training`
- `version`
- `rawToBandJson`: `[{minRaw, maxRaw, band}]`
- `isDefault`
- `createdAt`
- `updatedAt`

### `EvaluationCalibration`

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

### `AuditLog`

Fields:

- `id`
- `actorProfileId`
- `action`
- `entityType`
- `entityId`
- `metadataJson`
- `createdAt`

### `ContentReview`

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
