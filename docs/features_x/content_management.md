# Content Management System (CMS) Specification

## Overview

This document defines the complete content management architecture for the IELTS++ platform. IELTS++ uses Strapi Free (self-hosted, open-source) as the authoring CMS for resources, mock tests, IELTS information pages, FAQs, and related learning content. The Next.js application remains responsible for learner runtime behavior: authentication, access control, attempts, timers, scoring, progress tracking, saved resources, and reports.

The goal is to avoid maintaining a fragile custom admin CMS for content authoring while keeping exam delivery and learner state inside the application database.

---

## 0. CMS Architecture Decision

### 0.1 Source of Truth

| Domain | Source of Truth | Notes |
|--------|-----------------|-------|
| Resources/articles | Strapi | Lessons, strategies, vocabulary, grammar, IELTS info pages |
| Mock test definitions | Strapi | Tests, sections, passages, questions, answer keys, explanations |
| Media used by content | Strapi media library or configured object storage | Audio, images, PDFs, visual prompts |
| Users and roles | Next.js app database | Supabase/auth profile and app roles |
| Attempts and answers | Next.js app database | Learner submissions must remain app-owned |
| Timers and navigation state | Next.js app database | Runtime test behavior, not CMS content |
| Scoring/evaluation reports | Next.js app database | AI evaluation, reviewer decisions, generated reports |
| Progress and saved items | Next.js app database | Per-learner state |

### 0.2 Integration Pattern

Strapi is used for **content authoring**, not for learner runtime state.

Recommended flow:

1. Admin creates or edits content in Strapi.
2. Strapi manages draft/review/publish state for content.
3. The Next.js app reads only published content through Strapi APIs.
4. When a learner starts a mock test, the app stores an immutable snapshot of the published test content with the attempt or test version reference.
5. Attempts, answers, timer state, score prediction, review, progress, and reports are stored in Prisma/Postgres.

This prevents content edits in Strapi from changing an already-started or already-submitted learner attempt.

### 0.3 What Custom Admin Screens Should Remain

The custom `/admin/resources` and `/admin/tests` authoring screens have been reduced to Strapi entry panels. Admin users author resources and mock tests in Strapi. Legacy custom routes and APIs may remain only for fallback/local Prisma content, operational previews, and older tooling.

App admin screens should remain for:

- Review queues for submitted writing/speaking evaluations
- Attempt/report inspection
- Referral/credit management
- User support and operational dashboards
- Content sync health and import status, if a sync layer is used

---

## 1. Content Categories

The system organizes content into distinct categories, each serving specific learning purposes.

### 1.1 IELTS Information (Non-Learning Content)

| Category | Description | Content Type |
|----------|-------------|--------------|
| **Fees** | Test fee information, payment deadlines | Static pages |
| **Centers** | Test center locations, availability | Location data + maps |
| **Preparation** | General preparation guides | Articles |
| **Others** | Miscellaneous IELTS info | Articles |
| **FAQ** | Frequently asked questions | Q&A format |
| **Referral** | Referral program terms | Program details |

### 1.2 Learning Content - Free Tier

| Category | Components |
|----------|------------|
| **Vocab Builder** | Word lists, definitions, usage examples |
| **Basic Grammar** | Topic-wise study materials, grammar exercises |
| **Spelling** | Common spelling patterns, practice lists |
| **Common Topics** | Visible topics for speaking/writing |

### 1.3 Learning Content - Paid Tier

| Category | Components |
|----------|------------|
| **Vocab Builder** | Flash cards with spaced repetition |
| **Basic Grammar** | Flash cards, mentorship access |
| **Mock Tests** | 5 free + 5-6 additional paid tests |
| **Video Courses** | Supplementary video content |
| **Common Topics Q&A** | Question + answer pairs (unique) |
| **Academic IELTS** | Specialized academic module |

### 1.4 IELTS Module Content

Each module (Listening, Reading, Writing, Speaking) contains:

| Component | Description |
|-----------|-------------|
| **Question Ideas** | Strategy guidance, question types |
| **Sample Questions** | Practice questions with explanations |
| **Scenarios** | Real-world test scenarios |

---

## 2. Database Models

Prisma models are still required, but their responsibility changes. Strapi owns editable content. Prisma owns learner-facing runtime records, content snapshots/version references, progress, attempts, scoring, and audit data.

If the app reads directly from Strapi for public resources, some content tables may become cache/snapshot tables rather than the authoring source of truth.

---

## 2A. Strapi Content Types

### 2A.1 Resource

Used for lessons, vocabulary, grammar, spelling, strategies, and IELTS preparation content.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| title | string | Yes | Display title |
| slug | UID | Yes | Public route identifier |
| category | enumeration | Yes | Mirrors `ResourceCategory` |
| difficulty | enumeration | Yes | basic/intermediate/advanced |
| body | rich text / markdown | Yes | Main lesson content |
| summary | text | No | Short card/listing summary |
| module | enumeration | No | general/listening/reading/writing/speaking |
| accessTier | enumeration | Yes | free/paid/internal |
| estimatedStudyMinutes | integer | No | Learner planning metadata |
| examples | component repeatable | No | Structured label/text examples |
| tags / tagItems | JSON or repeatable Tag component | No | Topic and discovery tags; `tagItems` is easier for editors |
| orderIndex | integer | No | Progression ordering |
| prerequisites | relation to Resource | No | Unlock rules |
| media | media relation | No | Images/audio/PDFs |
| sourceAttribution | text | No | Original/licensed/public-domain source notes |
| editorNotes | text | No | Internal notes for reviewers |
| reviewChecklist | JSON | No | Optional originality/license/answer-check metadata |

Publication state is handled by Strapi draft/publish. The app must only expose published resources to learners.

### 2A.2 Mock Test

Top-level IELTS test definition.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| title | string | Yes | Test name |
| slug | UID | Yes | Stable identifier |
| description | text/rich text | No | Learner-facing summary |
| type | enumeration | Yes | practice/short_mock/full_mock |
| estimatedDurationMinutes | integer | No | Total test timer |
| sections | relation/component repeatable | Yes | Ordered test sections |
| versionLabel | string | No | Human-friendly version |
| accessTier | enumeration | Yes | free/paid/internal |
| tags | repeatable Tag component | No | Topic/module discovery |
| sourceAttribution | text | No | Original/licensed/public-domain source notes |
| editorNotes | text | No | Internal notes for reviewers |
| reviewChecklist | JSON | No | Optional originality/license/answer-check metadata |

Published mock tests are consumed by the app for listing and starting attempts.

### 2A.3 Mock Test Section

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| test | relation | Yes | Parent mock test |
| module | enumeration | Yes | listening/reading/writing/speaking |
| partNumber | integer | No | IELTS part number |
| title | string | Yes | Section title |
| instructions | rich text | No | Learner instructions |
| durationMinutes | integer | No | Section timer |
| orderIndex | integer | Yes | Display/order control |
| content | component/JSON | No | Passage, transcript, cue card, visual prompt |
| passageText | rich text | No | Editor-friendly Reading material field |
| transcript | rich text | No | Editor-friendly Listening transcript field |
| writingPrompt | rich text | No | Editor-friendly Writing prompt field |
| speakingPrompt | rich text | No | Editor-friendly Speaking prompt/cue-card field |
| media | media relation | No | Listening audio or prompt image |
| sourceAttribution | text | No | Source/license note for section material |
| questionGroups | relation/component repeatable | No | Ordered groups |
| questions | relation/component repeatable | Yes | Ordered questions |

### 2A.4 Question Group

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| section | relation | Yes | Parent section |
| title | string | No | Group label |
| instructions | rich text | No | Group-specific instructions |
| questionType | enumeration/string | Yes | Shared type for grouped questions |
| orderIndex | integer | Yes | Group ordering |
| displayConfig | JSON | No | Tables, matching layouts, shared options |
| sharedOptions | repeatable Option component | No | Editor-friendly matching/choice option list |

### 2A.5 Question

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| section | relation | Yes | Parent section |
| group | relation | No | Optional question group |
| questionType | enumeration/string | Yes | MCQ, fill blank, matching, T/F/NG, short answer |
| prompt | rich text/text | Yes | Question prompt |
| options | component repeatable / JSON | No | Multiple choice/matching options |
| orderIndex | integer | Yes | Question ordering |
| difficulty | enumeration | Yes | basic/intermediate/advanced |
| answerKey | component/JSON | Yes | Correct answer data |
| explanation | rich text | No | Learner explanation |
| sourceSpan | JSON | No | Passage offsets or attribution |
| sourceAttribution | text | No | Human-readable source/support note |
| media | media relation | No | Question-level image/audio/file |

Answer keys live in Strapi for authoring, but the app must snapshot them when starting/scoring attempts. Editors can use either structured JSON for complex cases or the easy fields inside the Answer Key component:

| Answer Key Field | Purpose |
|------------------|---------|
| canonicalAnswer | Main correct answer |
| acceptedAnswersText | One accepted answer per line; easier than JSON for editors |
| acceptedAnswers | Optional advanced JSON accepted-answer structure |
| scoringRuleType | exact/case_insensitive/contains/regex/manual_rubric |
| points | Objective question points |
| scoringRule | Optional advanced JSON scoring rule |
| explanation | Internal/learner-facing answer explanation |

### 2A.6 IELTS Information Page and FAQ

| Content Type | Purpose |
|--------------|---------|
| IELTS Info Page | Fees, centers, preparation guides, referral terms, general IELTS pages |
| FAQ Item | Question/answer content with category, order, and publish status |

These are read directly by public/learner pages and do not need Prisma persistence unless caching is required.

### 2A.7 Editor-Friendly Strapi Coverage

The current Strapi setup is intended to let non-technical editors manage the content types IELTS++ needs without touching the legacy app builder:

| Need | Strapi Type / Fields |
|------|----------------------|
| Basic English, vocabulary, synonyms, grammar, spelling | Resource |
| Reading/listening/writing/speaking strategy articles | Resource |
| Common topics and common-topic Q&A | Resource |
| IELTS fees, centers, preparation, requirements, referral terms | IELTS Info Page |
| FAQs | FAQ Item |
| Free/paid/internal mock tests | Mock Test |
| Listening, Reading, Writing, Speaking sections | Mock Test Section |
| Reading passages, Listening transcripts, Writing prompts, Speaking cue cards | Mock Test Section editor-friendly text fields |
| MCQ, fill blank, matching, T/F/NG, short answer, writing task, speaking prompt | Question |
| Grouped IELTS question sets | Question Group |
| Answer keys, accepted alternatives, scoring rule, explanations | Answer Key component |
| Images/audio/PDFs/visual prompts | Strapi media fields |
| Tags, access tier, source/license notes, review notes | Resource/Mock Test metadata |

Strapi should remain the authoring surface for these items. Prisma should remain responsible for learner-specific progress, saved resources, attempts, answers, scoring, reports, referrals, credits, audit logs, and operational state.

---

## 2B. Prisma Runtime Models

### 2.1 Resource Model (Static Content)

The `Resource` model can be retained as a cache/snapshot table for published Strapi resources, or removed from the authoring path after Strapi integration. If retained, add an external reference field such as `strapiDocumentId` or `strapiId`.

```prisma
model Resource {
  id          String           @id @default(uuid())
  title       String
  slug        String           @unique
  category    ResourceCategory
  difficulty  Difficulty      @default(basic)
  body        String
  examplesJson Json?
  tags        String[]         @default([])
  status      ContentStatus    @default(draft)
  createdById String?
  publishedAt DateTime?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
}
```

**Categories (enum):**
- `basic_english` - Foundational lessons
- `words` - Vocabulary lists
- `synonyms` - Synonym/antonym training
- `grammar` - Grammar rules and examples
- `reading_strategy` - Reading skills
- `listening_strategy` - Listening skills
- `writing_strategy` - Writing skills
- `speaking_strategy` - Speaking skills

**Status Workflow:** `draft` → `review` → `published` → `archived`

### 2.2 Test Model (Exam Content)

```prisma
model Test {
  id        String        @id @default(uuid())
  title     String
  type      TestType      @default(short_mock)
  status    ContentStatus @default(draft)
  estimatedDurationMinutes Int?
  publishedAt DateTime?
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  sections TestSection[]
}
```

**Test Types:**
- `practice` - Unlimited practice questions
- `short_mock` - 30-60 minute tests
- `full_mock` - Full 2.5 hour IELTS simulation

### 2.3 TestSection and Question Models

```prisma
model TestSection {
  id              String      @id @default(uuid())
  testId          String
  module          IeltsModule
  partNumber      Int?
  title           String
  instructions    String?
  durationMinutes Int?
  orderIndex      Int
  contentJson     Json?       // passage, transcript, visual spec, cue card
  mediaAssetId    String?     // audio for listening

  test      Test       @relation(...)
  questions Question[]
}

model Question {
  id          String     @id @default(uuid())
  sectionId   String
  questionType String
  prompt      String
  optionsJson Json?
  orderIndex  Int
  difficulty  Difficulty @default(basic)
  explanation String?
  sourceSpanJson Json?   // source attribution

  section    TestSection @relation(...)
  answerKey  AnswerKey?
}
```

### 2.4 Media Assets

```prisma
model MediaAsset {
  id              String   @id @default(uuid())
  profileId       String?
  bucket          String
  path            String
  purpose         String
  contentType     String
  sizeBytes       Int?
  durationSeconds Int?
  licenseMetadataJson Json?
  createdAt       DateTime @default(now())
}
```

---

## 3. Content Type Specifications

### 3.1 Vocabulary Content

| Field | Type | Description |
|-------|------|-------------|
| word | string | Target word |
| pronunciation | string | IPA or phonetic |
| definition | string | Clear meaning |
| examples | array | Usage sentences |
| synonyms | array | Related words |
| antonyms | array | Opposites |
| difficulty | enum | basic/intermediate/advanced |

**Free vs Paid:**
- **Free:** Word lists, basic definitions
- **Paid:** Flash cards with audio, quizzes, progress tracking

### 3.2 Grammar Content

| Field | Type | Description |
|-------|------|-------------|
| topic | string | Grammar topic name |
| explanation | markdown | Rule explanation |
| examples | array | Example sentences |
| exercises | array | Practice problems |
| difficulty | enum | basic/intermediate/advanced |

### 3.3 Listening/Reading Passages

| Field | Type | Description |
|-------|------|-------------|
| title | string | Passage title |
| body | text | Full passage content |
| source | string | Source attribution |
| wordCount | int | For level estimation |
| mediaUrl | string | Audio file (listening) |

### 3.4 Writing Topics

| Field | Type | Description |
|-------|------|-------------|
| taskType | enum | task_1 (letter/report) or task_2 (essay) |
| question | text | Full question prompt |
| bandDescriptors | json | Score criteria |
| sampleAnswer | text | Example response |
| tips | array | Strategy guidance |

### 3.5 Speaking Cue Cards

| Field | Type | Description |
|-------|------|-------------|
| part | enum | part_1, part_2, part_3 |
| topic | string | Main topic |
| bulletPoints | array | Key points to cover |
| preparationTime | int | Seconds |
| responseDuration | int | Seconds |
| sampleResponse | text | Example answer |

---

## 4. Admin Dashboard Specification

Authoring for resources and mock tests happens in Strapi Admin. The Next.js admin dashboard should not duplicate Strapi's content editor. It should provide operational views and links into Strapi where needed.

### 4.1 Dashboard Home (`/admin`)

**Components:**
- Operational status cards: attempts, evaluations, pending reviews, sync failures
- Quick actions: "Open Strapi Resources", "Open Strapi Mock Tests", "View Reviews"
- Recent app activity feed

### 4.2 Resource Management (`/admin/resources`)

This screen should be replaced with either:

1. A redirect/link to the Strapi Resource collection, or
2. A read-only app view showing published/synced resources and their learner usage metrics.

Editing, draft workflow, publishing, media attachment, and bulk content changes should happen in Strapi.

**Optional read-only features:**
- Search by title/slug
- Filter by category, difficulty, publish status, date range
- View learner engagement/progress metrics
- Show Strapi sync status

**Table Columns:**
| Column | Sortable | Description |
|--------|----------|-------------|
| Title | Yes | Resource name |
| Category | Yes | Content type |
| Difficulty | Yes | Level |
| Status | Yes | Strapi publish/sync state |
| Updated | Yes | Last synced or published time |
| Usage | Yes | Saves/completions, if available |
| Actions | - | View in app / Open in Strapi |

### 4.3 Resource Editor (`/admin/resources/[id]`)

Resource editing is handled by Strapi. This route should redirect to Strapi or show a read-only preview with learner analytics.

### 4.4 Test Management (`/admin/tests`)

Mock test authoring is handled by Strapi. The app admin test screens should be reduced to:

- Published/synced test list
- Attempt counts and learner usage
- Start/preview as learner
- Sync validation result
- Open in Strapi action
- Operational controls that are not content authoring

### 4.5 Question Editor

Question authoring is handled by Strapi through `Question`, `Question Group`, and `Mock Test Section` content types.

**Supported Types:**
- Multiple choice (single answer)
- Multiple choice (multiple answers)
- Fill in the blank
- Match the following
- True/False/Not Given
- Yes/No/Not Given
- Short answer

**Fields per Question:**
- Question prompt
- Options (for MCQ)
- Correct answer(s)
- Explanation
- Difficulty
- Source attribution

---

## 5. API Endpoints

The app does not use full custom authoring APIs as the primary contract for resources and mock tests after the Strapi migration. Strapi provides the authoring API and admin UI. Next.js APIs expose learner-safe published content, runtime operations, and legacy/fallback compatibility where needed.

### 5.1 Admin APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/resources` | Optional read-only list of synced/published Strapi resources |
| GET | `/api/admin/resources/:id` | Optional read-only resource preview/usage metrics |
| POST | `/api/admin/content-sync/resources` | Optional manual sync from Strapi |
| GET | `/api/admin/tests` | Optional read-only list of synced/published Strapi tests |
| GET | `/api/admin/tests/:id` | Optional read-only test preview/validation result |
| POST | `/api/admin/content-sync/tests` | Optional manual sync from Strapi |
| GET | `/api/admin/content-sync/status` | Sync health and recent failures |

### 5.2 Learner APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/resources` | List published Strapi resources, directly or from cache |
| GET | `/api/resources/:id` | Get published Strapi resource detail, directly or from cache |
| POST | `/api/resources/:id/save` | Save to favorites |
| GET | `/api/mock-tests` | List published Strapi mock tests, directly or from cache |
| GET | `/api/mock-tests/:id` | Get published mock test details for preview |
| POST | `/api/mock-tests/:id/start` | Snapshot published content and start app-owned attempt |

### 5.3 Strapi Integration APIs

| Integration | Purpose |
|-------------|---------|
| Strapi REST or GraphQL API | Fetch published resources, mock tests, sections, questions, and media metadata |
| Strapi webhooks | Trigger app cache invalidation or content sync on publish/unpublish |
| App-side sync job | Optional: copy published Strapi content into Prisma cache/snapshot tables |
| App-side validation | Ensure published mock tests have valid sections, questions, answer keys, timers, and supported question types |

---

## 6. Time Management for Mock Tests

### 6.1 Test-Level Timing

Each test has an `estimatedDurationMinutes` field set by admin:

| Test Type | Default Duration |
|-----------|-----------------|
| `practice` | Unlimited / No timer |
| `short_mock` | 30-60 minutes |
| `full_mock` | 2 hours 40 minutes (160 min) |

**Test Timer Behavior:**
- Timer starts when learner clicks "Start Test"
- Timer runs continuously across all sections
- Visual countdown displayed in header
- Audio section (Listening) has its own embedded audio player timing
- Warning alerts at 15 min, 5 min, 1 min remaining
- Auto-submit when timer expires

### 6.2 Section-Level Timing

Each test section has its own `durationMinutes`:

| Module | Section | Default Time |
|--------|---------|--------------|
| Listening | Part 1-4 | 30 minutes total |
| Reading | Passage 1-3 | 60 minutes total |
| Writing | Task 1 | 20 minutes |
| Writing | Task 2 | 40 minutes |
| Speaking | Part 1 | 4-5 minutes |
| Speaking | Part 2 | 1 minute prep + 1-2 min response |
| Speaking | Part 3 | 4-5 minutes |

**Section Timer Behavior:**
- Some tests use cumulative time (Reading 60min for all 3 passages)
- Others use per-section time (Writing Task 1 = 20min, Task 2 = 40min)
- Admin configures section timing in test builder
- Section transitions may enforce time limits or allow back-navigation

### 6.3 Timer Implementation

```prisma
model Test {
  id                      String  @id @default(uuid())
  title                   String
  type                    TestType
  estimatedDurationMinutes Int?   // Total test time (optional)
  // ...
}

model TestSection {
  id              String  @id @default(uuid())
  testId          String
  module          IeltsModule
  durationMinutes Int?   // Section-specific time limit
  // ...
}
```

**Frontend Requirements:**
- Countdown timer component with pause capability (optional)
- Time warning modal at thresholds
- Auto-save before time expires
- Time extension option (if allowed by settings)

### 6.4 Admin Timer Configuration

In test editor, admin can:
- Set total test duration
- Set per-section durations
- Enable/disable timer for practice tests
- Allow time borrowing between sections (optional)
- Configure auto-submit behavior

---

## 7. Navigation and Section Transitions

### 7.1 Section Navigation Rules

The system enforces navigation rules based on test type:

| Test Type | Navigation Behavior |
|-----------|---------------------|
| `practice` | Free navigation - can jump between questions |
| `short_mock` | Linear or section-locked based on config |
| `full_mock` | Strict linear progression per IELTS rules |

### 7.2 Navigation Checks

**Before Moving to Next Section:**

| Check | Action |
|-------|--------|
| All questions answered? | Warning modal if unanswered |
| Time remaining? | Show remaining time, warn if low |
| Answers saved? | Auto-save before navigation |
| Audio completed? | Ensure listening audio finished |
| Speaking recorded? | Confirm recording uploaded |

**Code Logic Example:**
```typescript
function canProceedToSection(attemptId: string, nextSectionId: string) {
  // 1. Check current section completion
  const currentSection = getCurrentSection(attemptId);
  if (!currentSection.completed) {
    return { allowed: false, reason: 'section_incomplete' };
  }
  
  // 2. Check time limit
  if (currentSection.timeSpent > currentSection.durationLimit) {
    return { allowed: false, reason: 'time_expired' };
  }
  
  // 3. Check answers saved
  const hasUnsavedAnswers = checkUnsavedChanges(attemptId);
  if (hasUnsavedAnswers) {
    return { allowed: true, action: 'auto_save' };
  }
  
  return { allowed: true };
}
```

### 7.3 Speaking Section Navigation

Speaking has unique flow:

| Part | Navigation |
|------|------------|
| Part 1 | Direct questions - no preparation |
| Part 2 | Show cue card → 1 min prep → Record response |
| Part 3 | Discussion questions based on Part 2 topic |

**Recording Requirements:**
- Microphone permission required
- Max recording duration enforced
- Preview before submit option
- Re-record option (if configured)

### 7.4 Back Navigation Restrictions

| Scenario | Allow Back? |
|----------|-------------|
| Reading → Listening | No (already completed) |
| Within Reading | Configurable (yes for practice, no for full mock) |
| Writing Task 1 → Task 2 | No (Task 1 locked after submit) |
| Speaking Part 2 → Part 1 | No (sequential) |

---

## 8. Course Resource Progression

### 8.1 Progression Model

Resources follow a progression path that learners advance through:

```
Vocabulary → Grammar → Strategies → Practice → Mock Tests
```

**Prerequisite System:**
- Certain resources unlock after completing others
- Track completion status per resource
- Suggest next resource based on progress

### 8.2 Progress Tracking

```prisma
model ResourceProgress {
  id          String   @id @default(uuid())
  profileId   String
  resourceId  String
  status      ProgressStatus @default(not_started)  // not_started, in_progress, completed
  progress    Float    @default(0)  // 0-100 percentage
  timeSpent   Int      @default(0)  // seconds
  completedAt DateTime?
  createdAt   DateTime @default(now())
  
  @@unique([profileId, resourceId])
}

enum ProgressStatus {
  not_started
  in_progress
  completed
  skipped
}
```

### 8.3 Progression Rules

| Feature | Description |
|---------|-------------|
| **Sequential Unlocking** | Complete resource A to unlock resource B |
| **Category Completion** | Complete 80% of category to unlock next category |
| **Score-Based Unlocking** | Achieve target score in practice to unlock mock tests |
| **Time-Based Progression** | Minimum time spent before completion counts |
| **Manual Skip** | Allow skipping with acknowledgement |

### 8.4 Dashboard Progress Display

**Learner Dashboard Shows:**
- Overall progress percentage
- Current category being studied
- Time spent this week
- Streak (consecutive days)
- Recommended next action
- Badges/achievements earned

### 8.5 Admin Progress Configuration

Admin can configure:
- Prerequisites per resource
- Minimum completion percentage
- Required time spent
- Score thresholds
- Unlock conditions

---

## 9. Implementation Phases

### Phase 1: Strapi Foundation

**Goals:**
- Stand up Strapi Free as the authoring CMS
- Define content types for resources, mock tests, sections, groups, questions, FAQs, and info pages
- Configure editor/admin roles in Strapi
- Configure media storage and publish workflow

**Deliverables:**
- Strapi project/service
- Resource and mock-test content schemas
- Draft/publish workflow in Strapi
- Media library setup
- Seed/import scripts for existing Prisma content, if needed

### Phase 2: App Integration

**Goals:**
- Read published Strapi content in the Next.js app
- Keep custom authoring screens reduced to Strapi links, entry panels, or read-only operational views
- Validate mock-test content before learners can start attempts
- Snapshot test content when attempts start

**Deliverables:**
- Strapi API client
- Published resource list/detail integration
- Published mock-test list/detail integration
- Attempt-start snapshot logic
- Webhook or manual sync endpoint
- Admin sync/validation status view

### Phase 3: Runtime and Premium Features

**Goals:**
- Flash card system
- Spaced repetition
- Video content
- PostHog-backed learner/product analytics and advanced app analytics

**Deliverables:**
- Flash card content authored in Strapi or synced from Strapi
- Video hosting integration
- Progress tracking
- Content performance metrics

---

## 11. Best Practices

### 11.1 Content Organization

1. **Hierarchical Structure**
   ```
   IELTS++ Content
   ├── Information (fees, centers, FAQ)
   ├── Vocabulary (words, synonyms, antonyms)
   ├── Grammar (topics, rules, exercises)
   ├── Strategies (reading, listening, writing, speaking)
   └── Tests (practice, mock exams)
   ```

2. **Tagging System**
   - Topic tags for cross-referencing
   - Difficulty tags for filtering
   - Module tags for categorization

3. **Version Control**
   - Auto-save drafts
   - Version history on publish
   - Rollback capability

### 11.2 Content Quality

1. **Review Workflow**
   - Content review queue
   - Role-based approval
   - Quality scoring

2. **Source Attribution**
   - Track content origins
   - License management for media
   - Copyright compliance

### 11.3 User Experience

1. **Admin Efficiency**
   - Quick duplicate functionality
   - Bulk operations
   - Search with filters

2. **Learner Discovery**
   - Related content suggestions
   - Progress-based recommendations
   - Bookmark/save functionality

---

## 12. Technical Considerations

### 12.1 Performance

- Pagination for large content lists
- Caching for published content
- Lazy loading for media

### 12.2 Security

- Role-based access control (admin/reviewer/evaluator/learner)
- Input validation on all forms
- XSS protection in content rendering

### 12.3 Scalability

- Content moderation queue
- Batch import/export
- Template system for bulk creation

---

## 13. Acceptance Criteria

| Feature | Criteria |
|---------|----------|
| Strapi Resource Authoring | Editors can create, edit, publish, and unpublish all resource types in Strapi |
| Strapi Mock Test Authoring | Editors can create mock tests with ordered sections, groups, questions, answer keys, explanations, timers, and media in Strapi |
| Status Workflow | Content uses Strapi draft/publish and app-side validation before learner exposure |
| App Admin Dashboard | App admin focuses on operations, previews, sync status, attempts, reviews, and analytics instead of duplicating Strapi editing |
| Learner Access | Only published and valid Strapi content is visible to learners |
| Media Support | Strapi media assets render correctly in resource pages and mock tests |
| Attempt Snapshot | Starting a mock test stores a stable content snapshot or version reference for that attempt |
| Test Timer | Countdown timer with auto-submit remains app-owned |
| Navigation Checks | Validation before section transitions remains app-owned |
| Progress Tracking | Resource completion and prerequisites remain app-owned while referencing Strapi content IDs |

---

## 14. Related Documentation

- [Data Model Backend](../development/backend/data-model.md)
- [Admin UI Specification](../development/frontend/admin-ui.md)
- [API Specification](../development/backend/api-spec.md)
- [Content Strategy](../content-strategy.md)
- [Storage and Media](../development/backend/storage-and-media.md)
- [Mock Test UI](../development/frontend/mock-test-ui.md)
- [Evaluation & Scoring](../development/backend/evaluation-and-scoring.md)
