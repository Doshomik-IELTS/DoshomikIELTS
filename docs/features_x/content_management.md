# Content Management System (CMS) Specification

## Overview

This document defines the complete content management architecture for the IELTS++ platform. It covers content types, database models, admin dashboard workflows, and implementation patterns aligned with LMS best practices.

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

The CMS uses Prisma as the ORM with the following core models.

### 2.1 Resource Model (Static Content)

The `Resource` model handles study materials, vocabulary, grammar, and strategy content.

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

### 4.1 Dashboard Home (`/admin`)

**Components:**
- Status summary cards (drafts, in review, published, archived)
- Quick actions: "New Resource", "New Test", "View Reviews"
- Recent activity feed

### 4.2 Resource Management (`/admin/resources`)

**Features:**
- Search by title/slug
- Filter by: category, difficulty, status, date range
- Bulk actions: archive, change status
- Inline quick edit

**Table Columns:**
| Column | Sortable | Description |
|--------|----------|-------------|
| Title | Yes | Resource name |
| Category | Yes | Content type |
| Difficulty | Yes | Level |
| Status | Yes | Workflow state |
| Author | No | Creator |
| Updated | Yes | Last modification |
| Actions | - | Edit/Delete/Preview |

### 4.3 Resource Editor (`/admin/resources/[id]`)

**Form Sections:**

1. **Basic Info**
   - Title (required)
   - Slug (auto-generated, editable)
   - Category (dropdown)
   - Difficulty (dropdown)
   - Tags (multi-select)

2. **Content**
   - Body (rich text/markdown)
   - Examples editor (structured JSON)
   - Media attachments

3. **Metadata**
   - Status (workflow state)
   - Publish date (scheduled)
   - Author notes

### 4.4 Test Management (`/admin/tests`)

**Test List:**
- Test title, type, sections count, status, actions

**Test Editor:**
- Basic info (title, type, duration)
- Section builder (add/reorder/delete)
- Question builder per section

### 4.5 Question Editor

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

### 5.1 Admin APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/resources` | List resources with filters |
| POST | `/api/admin/resources` | Create new resource |
| GET | `/api/admin/resources/:id` | Get single resource |
| PATCH | `/api/admin/resources/:id` | Update resource |
| DELETE | `/api/admin/resources/:id` | Delete resource |
| POST | `/api/admin/resources/:id/publish` | Publish resource |
| GET | `/api/admin/tests` | List tests |
| POST | `/api/admin/tests` | Create test |
| GET | `/api/admin/tests/:id` | Get test with sections |
| PATCH | `/api/admin/tests/:id` | Update test |
| POST | `/api/admin/tests/:id/sections` | Add section |
| POST | `/api/admin/questions` | Create question |

### 5.2 Learner APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/resources` | List published resources |
| GET | `/api/resources/:id` | Get resource detail |
| POST | `/api/resources/:id/save` | Save to favorites |
| GET | `/api/mock-tests` | List available tests |
| GET | `/api/mock-tests/:id` | Get test details |
| POST | `/api/mock-tests/:id/start` | Start test attempt |

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

### Phase 1: Foundation (MVP)

**Goals:**
- Resource CRUD with all categories
- Basic test builder
- Status workflow

**Deliverables:**
- Admin resource list and editor
- Admin test list and editor
- Learner resource consumption
- Basic media upload

### Phase 2: Enhanced Content

**Goals:**
- Advanced question types
- Media-rich content (audio)
- Content versioning
- Audit logging

**Deliverables:**
- Complete question type support
- Audio upload for listening
- Version history
- Activity logs

### Phase 3: Premium Features

**Goals:**
- Flash card system
- Spaced repetition
- Video content
- Advanced analytics

**Deliverables:**
- Flash card builder
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
| Resource CRUD | Create, read, update, delete all resource types |
| Test Builder | Create tests with multiple sections and questions |
| Status Workflow | Content flows: draft → review → published → archived |
| Admin Dashboard | Complete management interface |
| Learner Access | Published content visible to learners |
| Media Support | Upload and display audio/images |
| Test Timer | Countdown timer with auto-submit |
| Navigation Checks | Validation before section transitions |
| Progress Tracking | Resource completion and prerequisites |

---

## 14. Related Documentation

- [Data Model Backend](../development/backend/data-model.md)
- [Admin UI Specification](../development/frontend/admin-ui.md)
- [API Specification](../development/backend/api-spec.md)
- [Content Strategy](../content-strategy.md)
- [Storage and Media](../development/backend/storage-and-media.md)
- [Mock Test UI](../development/frontend/mock-test-ui.md)
- [Evaluation & Scoring](../development/backend/evaluation-and-scoring.md)