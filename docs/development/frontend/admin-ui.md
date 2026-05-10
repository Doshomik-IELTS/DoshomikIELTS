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

Features implemented:

- List tests with status/type filters and search.
- Create test with title, type, estimated duration.
- Edit test metadata (title, type, status, duration).
- View sections and question counts.
- Delete test (if no attempts).
- Status management: draft, review, published, archived.
- **Section management** - Add sections to tests (`/admin/tests/[id]`).
- **Question management** - Create questions with answer keys.

Admin components:

- `TestEditorForm` - Test metadata create/edit
- `TestDetailEditor` - Test detail with sections view
- `TestSectionEditor` - Section management UI
- `QuestionEditor` - Question create/edit with answer key support

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

## Copyright Safety Warnings

Display warning in admin create/edit/review screens:

> Do not upload or copy Cambridge IELTS books, commercial IELTS books, scans, passages, questions, audio, or answer explanations. Use only original, licensed, public-domain-valid, or internally generated and reviewed content.

## Admin MVP Acceptance Criteria

- Admin routes are role protected.
- Resource create/edit/list works.
- Review queue can list, view, approve/reject content, flag evaluations, and set reviewed bands.
- Learner app only shows published resources/tests.
- Answer keys are managed only in admin/test setup and never displayed in learner screens.
