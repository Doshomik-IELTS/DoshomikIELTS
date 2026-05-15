# Basic Admin Frontend

## Purpose

The MVP includes basic admin screens to manage original content and reduce copyright/compliance risk. Admin should be useful but intentionally minimal.

## Admin Route Protection

Admin routes require:

- Authenticated Supabase session.
- Admin/reviewer/evaluator role depending on page.

Unauthorized learners must not see admin data.

## Admin Dashboard

Route: `/admin`

Show summary cards:

- Draft resources.
- Review resources.
- Published resources.
- Draft tests.
- Review queue.

Include links to:

- Resources.
- Tests.
- Reviews.
- Learner dashboard.

## Resource Admin

Routes:

- `/admin/resources`
- `/admin/resources/new`
- `/admin/resources/[id]`

List features:

- Filter by status.
- Search by title.
- Show category/difficulty.
- Show status badge.

Form fields:

- Title.
- Slug if supported.
- Category.
- Difficulty.
- Body.
- Examples.
- Tags.
- Status.

Actions:

- Save draft.
- Send to review.
- Publish.
- Archive.

Validation:

- Title required.
- Category required.
- Difficulty required.
- Body required.
- Published resources must have usable content.

## Test Admin

Routes:

- `/admin/tests`
- `/admin/tests/new`
- `/admin/tests/[id]`
- `/admin/tests/[id]/builder` - Visual test builder with section editors
- `/admin/tests/[id]/preview` - Preview test as learner would see it

Features implemented:

- List tests with status/type filters and search.
- Create test with title, type, estimated duration.
- Edit test metadata (title, type, status, duration).
- View sections and question counts.
- Delete test (if no attempts).
- Status management: draft, review, published, archived.
- **Section management** - Add sections to tests (`/admin/tests/[id]`).
- **Question management** - Create questions with answer keys.
- **Question groups** - Group related questions with shared instructions.
- **Visual test builder** - Full section-by-section editing at `/admin/tests/[id]/builder`.
- **Test preview** - Preview test at `/admin/tests/[id]/preview`.
- **Section editors** - Module-specific editors for reading, listening, writing, speaking.
- **Media asset picker** - Select listening audio from media library.
- **Test generation panel** - LLM-powered test generation UI.
- **Test import panel** - Import test from external source.
- **Advanced tools** - Duplicate, validate, publish actions.

Admin components:

- `TestEditorForm` - Test metadata create/edit
- `TestDetailEditor` - Test detail with sections view
- `TestSectionEditor` - Section management UI
- `QuestionEditor` - Question create/edit with answer key support
- `QuestionGroupEditor` - Question group create/edit with shared instructions
- `QuestionListEditor` - List of questions within a group/section
- `SectionListEditor` - Ordered list of test sections
- `ReadingSectionEditor` - Reading-specific section editor with passage
- `ListeningSectionEditor` - Listening-specific section editor with audio
- `WritingSectionEditor` - Writing-specific section editor with task config
- `SpeakingSectionEditor` - Speaking-specific section editor with part config
- `ReadingQuickAuthoringPanel` - Quick authoring for reading sections
- `ListeningQuickAuthoringPanel` - Quick authoring for listening sections
- `TestGenerationPanel` - LLM-powered test generation UI
- `TestImportPanel` - Import test from external source
- `TestAdvancedTools` - Advanced test management tools (duplicate, validate, publish)
- `MediaAssetPicker` - Select media assets for listening audio

## Flashcard Admin

Routes:

- `/admin/flashcards`
- `/admin/flashcards/[id]`

Features implemented (2026-05-13):

- Deck list with search and category filters.
- Create new deck (title, description, category, difficulty, tags).
- Delete deck with confirmation.
- Deck editor with inline card management:
  - Add new cards (front, back, examples, hints, difficulty).
  - Inline edit existing cards.
  - Delete individual cards.
  - Card ordering by orderIndex.

Admin components:

- Deck list page with create modal and delete confirmation.
- Deck editor page with card CRUD forms.

## Review Queue

Routes:

- `/admin/reviews`
- `/admin/reviews/[id]`

Features implemented:

- Lists combined content/writing/speaking review items.
- Detail page shows review content and evaluation results.
- Action controls for approve/reject/set-band.
- Passes typecheck.

## Admin Components

Implemented in `src/components/admin/`:

| Component | Purpose |
|-----------|--------|
| `AdminResourceList` | Resource list with status filters |
| `AdminTestList` | Test list with type/status filters |
| `ResourceEditor` | Resource create/edit form |
| `TestEditorForm` | Test metadata create/edit |
| `TestDetailEditor` | Test detail with sections |
| `TestSectionEditor` | Section management |
| `QuestionEditor` | Question with answer key |
| `QuestionGroupEditor` | Question group with shared instructions |
| `QuestionListEditor` | Question list within group/section |
| `SectionListEditor` | Ordered test sections |
| `ReadingSectionEditor` | Reading section with passage |
| `ListeningSectionEditor` | Listening section with audio |
| `WritingSectionEditor` | Writing section with task config |
| `SpeakingSectionEditor` | Speaking section with part config |
| `ReadingQuickAuthoringPanel` | Quick reading authoring |
| `ListeningQuickAuthoringPanel` | Quick listening authoring |
| `TestGenerationPanel` | LLM test generation |
| `TestImportPanel` | Test import |
| `TestAdvancedTools` | Duplicate/validate/publish |
| `MediaAssetPicker` | Media asset selection |

## Copyright Safety Warnings

Display warning in admin create/edit/review screens:

> Do not upload or copy Cambridge IELTS books, commercial IELTS books, scans, passages, questions, audio, or answer explanations. Use only original, licensed, public-domain-valid, or internally generated and reviewed content.

## Admin MVP Acceptance Criteria

- Admin routes are role protected.
- Resource create/edit/list works.
- Review queue can list, view, approve/reject content, flag evaluations, and set reviewed bands.
- Learner app only shows published resources/tests.
- Answer keys are managed only in admin/test setup and never displayed in learner screens.
