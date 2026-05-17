# Basic Admin Frontend

## Purpose

The MVP includes basic admin screens for operations, reviews, and links into Strapi. Resource and mock-test authoring now happens in Strapi Admin, not in the custom Next.js admin editor.

## Admin Route Protection

Admin routes require:

- Authenticated Supabase session.
- Admin/reviewer/evaluator role depending on page.

Unauthorized learners must not see admin data.

## Admin Dashboard

Route: `/admin`

Show summary cards:

- Operational stats.
- Pending review/evaluation counts.
- Content sync/fallback health where available.
- Review queue.

Include links to:

- Strapi Resources.
- Strapi Mock Tests.
- Reviews.
- Learner dashboard.

Current admin shell:

- `src/app/(admin)/layout.tsx` applies `AdminLayout` once for all admin pages.
- Desktop admin pages keep a sidebar because admin workflows are operational and repeated.
- Resource/test nav labels explicitly say Strapi so editors do not confuse these routes with the old in-app CMS.

## Resource Admin

Routes:

- `/admin/resources`
- `/admin/resources/new`
- `/admin/resources/[id]`

Current behavior:

- These routes render a Strapi authoring panel.
- Editors create, edit, publish, and unpublish resources in Strapi.
- The learner app reads published Strapi resources when `STRAPI_BASE_URL` and `STRAPI_API_TOKEN` are configured.
- Legacy custom resource APIs/components remain for fallback/local compatibility, but are not the primary authoring UI.

## Test Admin

Routes:

- `/admin/tests`
- `/admin/tests/new`
- `/admin/tests/[id]`
- `/admin/tests/[id]/builder` - Legacy custom builder route; not the primary authoring UI
- `/admin/tests/[id]/preview` - Legacy preview route for Prisma/fallback tests

Current behavior:

- `/admin/tests`, `/admin/tests/new`, and `/admin/tests/[id]` render a Strapi authoring panel.
- Editors create mock tests, sections, question groups, questions, answer keys, explanations, and media in Strapi.
- Learner APIs read published Strapi tests when configured.
- Starting a Strapi-authored test materializes it into Prisma runtime rows for attempts/scoring.
- Legacy custom builder/import/preview components may remain for fallback/local Prisma tests, but are not the primary authoring UI.

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
| `StrapiAuthoringPanel` | Opens Strapi collections for resource/mock-test authoring |
| `AdminResourceList` | Legacy/fallback resource list |
| `AdminTestList` | Legacy/fallback test list |
| `ResourceEditor` | Legacy/fallback resource editor |
| `TestEditorForm`, `TestDetailEditor`, `TestSectionEditor` | Legacy/fallback test metadata and section editors |
| `QuestionEditor`, `QuestionGroupEditor`, `QuestionListEditor` | Legacy/fallback question authoring |
| `SectionListEditor`, module section editors, quick authoring panels | Legacy/fallback custom test builder |
| `TestGenerationPanel`, `TestImportPanel`, `TestAdvancedTools`, `MediaAssetPicker` | Legacy/fallback tooling |

## Copyright Safety Warnings

Display warning in admin create/edit/review screens:

> Do not upload or copy Cambridge IELTS books, commercial IELTS books, scans, passages, questions, audio, or answer explanations. Use only original, licensed, public-domain-valid, or internally generated and reviewed content.

## Admin MVP Acceptance Criteria

- Admin routes are role protected.
- Resource and mock-test authoring links open Strapi Admin.
- App admin routes remain role protected.
- Review queue can list, view, approve/reject content, flag evaluations, and set reviewed bands.
- Learner app only shows published resources/tests.
- Answer keys are managed in Strapi or fallback admin tooling and never displayed in learner screens.
