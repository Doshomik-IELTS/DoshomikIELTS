# DOshomik IELTS Resource Page Structure

> Based on `plans.md` requirements, codebase analysis, and EdTech best practices.
> Last updated: 2026-06-16

---

## 1. Guiding Principles

| Principle | Why |
|---|---|
| **Module-first navigation** | Learners think in IELTS modules (Listening, Reading, Writing, Speaking) + Foundations |
| **Progressive difficulty** | Basic → Intermediate → Advanced within each module |
| **Free as hook, Paid as depth** | Free content shows value; paid unlocks flashcards, high-frequency sets, mentorship |
| **Track everything** | Every resource tracks progress; prerequisite chains gate advanced content |
| **Single source of truth** | `ResourceCategory` enum + labels in constants.ts drive all UI |

---

## 2. Taxonomy — Two-Level Category System

The current **8-value Prisma enum** needs to expand to cover all content types in the plan.

### Level 1: Module (top-level grouping)

| Module | Slug | Content Types |
|---|---|---|
| **Foundations** | `foundations` | Vocabulary, Grammar, Spelling, Pronunciation |
| **Listening** | `listening` | Strategy, Question types, Scenarios, Samples |
| **Reading** | `reading` | Strategy, Question types, Passages, Samples |
| **Writing** | `writing` | Task 1 (Academic), Task 1 (General), Task 2, Strategy, Samples |
| **Speaking** | `speaking` | Part 1, Part 2, Part 3, Strategy, Cue cards, Samples |
| **Exam Toolkit** | `exam-toolkit` | Band descriptors, Study plans, Exam strategy, Common topics |
| **Mock Tests** | `mock-tests` | Full tests, Short mock tests, Practice mode |

### Level 2: Category (within module)

Expand `ResourceCategory` Prisma enum from 8 → ~25 values:

```prisma
enum ResourceCategory {
  // Foundations
  basic_english
  vocabulary
  synonyms_antonyms
  collocations
  idioms_phrases
  phrasal_verbs
  word_forms
  pronunciation
  grammar
  spelling
  punctuation
  sentence_structure
  common_mistakes

  // Listening
  listening_strategy
  listening_question_types

  // Reading
  reading_strategy
  reading_question_types

  // Writing
  writing_strategy
  writing_task_1_academic
  writing_task_1_general
  writing_task_2

  // Speaking
  speaking_strategy
  speaking_part_1
  speaking_part_2
  speaking_part_3

  // General
  common_topics
  common_topics_qa
  band_descriptors
  exam_strategy
  study_plan
  video_course
}
```

> **Migration path**: Add values to Prisma enum via new migration. Update `RESOURCE_CATEGORY_LABELS` in `constants.ts` (already has 40+ entries — just match names). Update `RESOURCE_CATEGORY_OPTIONS` to include all new values.

### Module ↔ Category Mapping Table

Add to `src/lib/resources/constants.ts`:

```typescript
export const MODULE_CATEGORIES: Record<string, ResourceCategory[]> = {
  foundations: [
    "basic_english", "vocabulary", "synonyms_antonyms", "collocations",
    "idioms_phrases", "phrasal_verbs", "word_forms", "pronunciation",
    "grammar", "spelling", "punctuation", "sentence_structure", "common_mistakes",
  ],
  listening: ["listening_strategy", "listening_question_types"],
  reading: ["reading_strategy", "reading_question_types"],
  writing: ["writing_strategy", "writing_task_1_academic", "writing_task_1_general", "writing_task_2"],
  speaking: ["speaking_strategy", "speaking_part_1", "speaking_part_2", "speaking_part_3"],
  "exam-toolkit": ["common_topics", "common_topics_qa", "band_descriptors", "exam_strategy", "study_plan"],
  "mock-tests": [], // separate system, not resource-based
};
```

---

## 3. Resource Page Architecture

### Page Tree

```
/resources                          → Module overview (cards for each module)
/resources/foundations              → Foundations hub
/resources/foundations/vocabulary   → Vocabulary resources list
/resources/foundations/grammar      → Grammar resources list
/resources/listening                → Listening hub
/resources/reading                  → Reading hub
/resources/writing                  → Writing hub
/resources/speaking                 → Speaking hub
/resources/exam-toolkit             → Exam toolkit hub
/resources/[id]                     → Resource detail (existing, enhanced)
```

### Layout: `/resources` (Module Overview)

```
┌─────────────────────────────────────────────────┐
│  Resources                                       │
│  ────────────────────────────────────────────    │
│                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ 📘       │ │ 🎧       │ │ 📖       │         │
│  │Foundations│ │Listening │ │ Reading  │         │
│  │ 12 items  │ │ 8 items  │ │ 10 items │         │
│  │ ████░░ 60%│ │ ██░░ 30% │ │ ░░░░ 0%  │         │
│  └──────────┘ └──────────┘ └──────────┘         │
│                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ ✍️       │ │ 🗣️       │ │ 🛠️       │         │
│  │ Writing  │ │ Speaking │ │Exam Toolkit│        │
│  │ 15 items │ │ 12 items │ │ 6 items   │         │
│  │ ░░░░ 0%  │ │ ░░░░ 0%  │ │ ░░░░ 0%  │         │
│  └──────────┘ └──────────┘ └──────────┘         │
│                                                   │
│  🔍 Search all resources...                      │
└─────────────────────────────────────────────────┘
```

**Key features:**
- Module cards with icon, name, item count, progress bar
- Progress based on `ResourceProgress` aggregation
- Click card → module hub page
- Search bar at bottom searches across all modules via existing `/api/resources?search=`

### Layout: Module Hub (e.g. `/resources/foundations`)

```
┌─────────────────────────────────────────────────┐
│  ← Resources  /  Foundations                     │
│                                                   │
│  Foundations                    ████░░░░ 60%     │
│  Build your English foundation                  │
│  ────────────────────────────────────────────    │
│                                                   │
│  [Vocabulary] [Grammar] [Spelling] [All]         │
│                                                   │
│  ┌──────────── ─────── ───────────────┐          │
│  │ 📝 100 Essential IELTS Words   ★   │          │
│  │ Vocabulary · Basic ·              │          │
│  │ ████████████░░░░ 80%              │          │
│  ├───────────────────────────────────┤          │
│  │ 📝 Linking Words & Phrases    ★   │          │
│  │ Vocabulary · Intermediate ·  🔒   │          │
│  │ Not started                       │          │
│  ├───────────────────────────────────┤          │
│  │ 📝 Present Simple vs Continuous   │          │
│  │ Grammar · Basic ·              ★  │          │
│  │ ████████████████████ 100% ✅     │          │
│  └───────────────────────────────────┘          │
│                                                   │
│  🔽 Show more...                                  │
└─────────────────────────────────────────────────┘
```

**Key features:**
- Breadcrumb: Resources > Foundations
- Module-level progress bar
- Sub-category tabs (filter by category)
- Resource cards with: title, category badge, difficulty badge, progress bar, save/bookmark icon, free/paid badge
- Click card → resource detail page
- Progress bar per resource (using `ResourceProgress`)
- ✅ indicator for completed resources

### Layout: Resource Detail (`/resources/[id]`) — Enhanced

Keep existing `ResourceDetail` component but add:

```
┌─────────────────────────────────────────────────┐
│  ← Foundations  /  Vocabulary                    │
│                                                   │
│  100 Essential IELTS Words            [Save] [🔗]│
│  Vocabulary · Basic · Free                       │
│  ████████████░░░░ 80%                            │
│                                                   │
│  ┌─── Previous: Basic English ───┐               │
│  └───────────────────────────────┘               │
│                                                   │
│  ┌───────────────────────────────────────────┐   │
│  │  (existing body, vocabulary items, etc.)  │   │
│  └───────────────────────────────────────────┘   │
│                                                   │
│  ┌─── Next: Synonyms & Antonyms ─────────┐       │
│  └───────────────────────────────────────┘       │
│                                                   │
│  ┌── Related ────────────────────────────┐       │
│  │ • Word Families (Vocabulary)          │       │
│  │ • Collocations (Vocabulary)           │       │
│  └───────────────────────────────────────┘       │
└─────────────────────────────────────────────────┘
```

**Enhancements:**
- Prev/Next navigation within the same module (ordered by `orderIndex`)
- "Related resources" section (same category, different difficulty)
- Progress bar with "Mark complete" button
- Free/paid badge

---

## 4. Free vs Paid Content Model

### Strategy: Badge + Gate

No separate "premium" table. Use a new field on `Resource`:

```prisma
model Resource {
  // ... existing fields
  isPremium    Boolean  @default(false)
  // or use tier: ResourceTier @default(free)
}
```

**Learner-facing behavior:**

| Access Level | Free Resources | Paid Resources |
|---|---|---|
| Not logged in | Can browse titles + descriptions | Can browse titles + descriptions |
| Logged in (free tier) | Full access | See "Upgrade to access" overlay |
| Logged in (paid tier) | Full access | Full access |

**Paid content types (from plan):**
- Vocabulary: High-frequency word sets, 24-set flashcard deck (25 cards/set)
- Spelling: Flashcards for confusing words
- Grammar: Flashcards for rules
- Extra mock tests (beyond 5 free)
- Video course
- Common topics Q&A (paid tier)

### Implementation: `Credit` System

The existing `CreditLedger` model already supports credit-based gating. Alternative: simple boolean `isPremium` + role check (`profile.tier === "premium"`). Use `isPremium` for v1 — simpler, no extra DB complexity.

Add to Prisma:
```prisma
model Profile {
  // ... existing fields
  tier     String  @default("free") // "free" | "premium"
}
```

---

## 5. Progression & Prerequisites

### Current Infrastructure (EXISTS — needs wiring)

| Tool | Status |
|---|---|
| `Resource.orderIndex` | In schema, unused in learner queries |
| `Resource.difficulty` (basic/intermediate/advanced) | In schema, filterable via API but no UI |
| `ResourcePrerequisite` | In schema, `POST /api/progress/check-unlock` exists |
| `ResourceProgress` | In schema, PATCH endpoint exists |

### Progression Design

**Per-module learning path:**

```
Module: Vocabulary
  Level: Basic
    1. 100 Essential IELTS Words          ← orderIndex: 1
    2. Common Word Families               ← orderIndex: 2  (requires #1)
    3. Prefixes & Suffixes                ← orderIndex: 3  (requires #2)
  Level: Intermediate
    4. Collocations for IELTS             ← orderIndex: 4  (requires #3 + difficulty: basic done)
    5. Phrasal Verbs for Academic English ← orderIndex: 5  (requires #4)
  Level: Advanced
    6. High-Frequency Academic Words 🔒   ← orderIndex: 6  (requires #5 + premium)
```

**Prerequisite chaining:**
```
Resource #2's prereqs → [{ resourceId: #2, prerequisiteId: #1, minProgress: 100 }]
Resource #3's prereqs → [{ resourceId: #3, prerequisiteId: #2, minProgress: 100 }]
```

**Progression bar increments:**
- Module progress = `completed resources in module / total resources in module × 100`
- Fetched from `GET /api/progress` (already returns per-category breakdown)

---

## 6. Vocab Module — Detailed Structure (Current Focus)

Per `plans.md` vocab builder requirements:

### Free Section

```
┌───────────────────────────────────────────────┐
│  Vocabulary Builder                            │
│  ─────────────────────────────────────────     │
│                                                 │
│  FREE                                           │
│  ┌─────────────────────────────────────────┐   │
│  │ Word of the Day                          │   │
│  │ Today: "Pivotal" — Meaning, Synonym,     │   │
│  │ Antonym, Part of Speech, Example         │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Category: [All] [Words] [Synonyms] [Phrases]  │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 📝 100 Essential IELTS Words            │   │
│  │ Vocabulary · Basic                      │   │
│  │ ████████████░░░░ 80%                    │   │
│  ├─────────────────────────────────────────┤   │
│  │ 📝 Linking Words & Common Phrases       │   │
│  │ Independent & Dependent clauses         │   │
│  │ Vocabulary · Intermediate               │   │
│  │ Not started                             │   │
│  └─────────────────────────────────────────┘   │
└───────────────────────────────────────────────┘
```

- Each vocab resource shows: word term, meaning, synonym, antonym, part of speech, example sentence
- "Linking words" = standalone resource with categorized phrases (addition, contrast, cause/effect, etc.)

### Paid Section

```
┌───────────────────────────────────────────────┐
│  PREMIUM 🔒                                    │
│                                                 │
│  ┌──────────────┐ ┌──────────────┐            │
│  │ 📇           │ │ 📇           │            │
│  │ Flashcard    │ │ Flashcard    │            │
│  │ Set 1/24     │ │ Set 2/24     │            │
│  │ Basic Vocab  │ │ Family & Home│            │
│  │ 25 cards     │ │ 25 cards     │            │
│  │ ⭐ ⭐ ⭐        │ │ ⭐⭐          │            │
│  │ UPGRADE      │ │ UPGRADE      │            │
│  └──────────────┘ └──────────────┘            │
│                                                 │
│  🔒 Level-wise material:                       │
│  Basic (max) → Intermediate → Advanced         │
│  250 → 600 words total                         │
└───────────────────────────────────────────────┘
```

- Flashcard sets map to `FlashCardDeck` + `FlashCard` models (already exist with SM-2)
- Level-wise progression: Basic (250 words) → unlock Intermediate (400) → unlock Advanced (600)
- Premium gating via `isPremium` flag on FlashCardDeck

---

## 7. Implementation Roadmap

### Phase 1: Taxonomy Expansion (Prisma migration)
- [ ] Add new `ResourceCategory` enum values to `schema.prisma`
- [ ] Run `prisma migrate dev`
- [ ] Update `RESOURCE_CATEGORY_LABELS` in `constants.ts`
- [ ] Add `MODULE_CATEGORIES` mapping
- [ ] Add `isPremium` field to Resource model
- [ ] Add `tier` field to Profile model

### Phase 2: Module Hub Pages
- [ ] Create `src/app/(learner)/resources/[module]/page.tsx` (module hub)
- [ ] Rebuild `ResourceList` as module-aware, filterable by category tabs
- [ ] Add module progress aggregation to `GET /api/progress`
- [ ] Wire `orderIndex` into resource queries for progression sorting

### Phase 3: Progression Wiring
- [ ] Add prev/next navigation within module to `ResourceDetail`
- [ ] Display prerequisite status on resource cards
- [ ] Add "Mark complete" to detail page → triggers `PATCH /api/progress`
- [ ] Compute and display per-module progress bars

### Phase 4: Free/Paid Gating
- [ ] Add `isPremium` check middleware to resource detail API
- [ ] Create upgrade CTA component for premium resources
- [ ] Overlay/popup: "This is a premium resource. Upgrade to access."

### Phase 5: Vocab Module (current sprint)
- [ ] Create vocab-specific resource template with structured `examplesJson`
- [ ] Build "Word of the Day" component (random published vocab resource)
- [ ] Organize linking words & phrases as standalone resource
- [ ] Wire FlashCard decks to premium vocab sets

---

## 8. Data Flow Summary

```
Learner visits /resources
  → GET /api/progress (overall + per-module stats)
  → Module cards rendered with progress bars
  → Click module → /resources/foundations

Foundations hub
  → GET /api/progress?category=foundations
  → GET /api/resources?categoryIn=[vocabulary,grammar,...]
  → Sub-category tabs filter by category
  → Resource cards with progress bars + save buttons

Resource detail
  → GET /api/resources/[id]
  → GET /api/progress/[resourceId] (existing)
  → GET /api/resources?module=same&orderIndex=adjacent (prev/next)
  → PATCH /api/progress/[resourceId] on "Mark complete"
```

---

## 9. Reference: Best Practices from Research

| Source | Pattern Adopted |
|---|---|
| **British Council** | Module-first navigation (skills → sub-topics) |
| **Duolingo** | Progress bars per module, prerequisite gating, bite-sized lessons |
| **Khan Academy** | Mastery-based progression, unit → lesson hierarchy |
| **IELTS Liz** | Free value content with paid deep-dive model |
| **IELTS Advantage** | Difficulty-tiered learning paths (basic → advanced) |
| **Cambridge English** | Exam strategy separated from skill practice |
