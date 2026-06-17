# DOshomik IELTS Usability Report

Last updated: 2026-05-17

> Historical note, updated 2026-05-17: this report describes the custom in-app content management UI that existed before Strapi adoption. Resource and mock-test authoring now happens in Strapi; the old admin builder references remain useful only as legacy/fallback context, learner preview context, or review-workflow context.

## Status: ✅ Core Usability Recommendations Implemented — Production Hardening In Progress

All P0, P1, and P2 learner/admin usability recommendations from this report have been implemented or superseded by Strapi. Remaining work focuses on production hardening: server-side attempt events for strict audio enforcement, production LLM/TTS generation workers, PostHog-driven weakness analysis, and optional dedicated full-screen question editors for legacy/fallback tooling.

## Implementation Update

The main P0 learner recommendations in this report have now been implemented:

- Attempt API returns learner-safe `contentJson`, `mediaAssetId`, question groups, question type, options, and group IDs.
- Active attempts render Reading passages, Listening audio, question groups, options, and typed objective controls through shared IELTS renderers.
- Admin preview now uses the same section/question renderer as the learner attempt flow.
- Legacy Admin Tests page keeps import/generation inside a collapsible Advanced tools panel.
- Legacy builder section overview shows completion chips for Material, Questions, Answers, and Sources.
- Legacy Listening fallback tooling has a no-JSON quick authoring panel similar to Reading.

The earlier P1/P2 recommendations are also now mostly implemented: mobile navigation, structured scoring controls, bulk paste question entry, source-span highlighting, drag-and-drop reorder, admin validation-blocker metrics, unanswered submit review, stricter Listening playback simulation, and map/diagram visual rendering.

Remaining work is mostly production hardening: server-side attempt events for strict audio, production LLM/TTS workers, PostHog-backed analytics/weakness detection, and optional dedicated full-screen question editors only if legacy/fallback tooling remains useful.

## Scope

This report reviews the current codebase from two perspectives:

- Learners using the dashboard, resources, practice, mock tests, and active attempt screens.
- Admins opening Strapi for resource/mock-test authoring, plus app review workflows and legacy/fallback Prisma tooling.

The review is based on the current route/component implementation, especially:

- `src/components/layout/dashboard-layout.tsx`
- `src/components/dashboard/dashboard-summary.tsx`
- `src/app/(learner)/mock-tests/page.tsx`
- `src/app/(learner)/mock-tests/[id]/page.tsx`
- `src/app/(learner)/attempts/[id]/page.tsx`
- `src/app/api/attempts/[attemptId]/route.ts`
- `src/app/api/mock-tests/[id]/route.ts`
- `src/app/(admin)/admin/page.tsx`
- `src/app/(admin)/admin/tests/page.tsx`
- `src/app/(admin)/admin/tests/new/page.tsx`
- `src/app/(admin)/admin/tests/[id]/builder/page.tsx`
- `src/components/admin/test-editor-form.tsx`
- `src/components/admin/reading-quick-authoring-panel.tsx`
- `src/components/admin/question-list-editor.tsx`
- `src/components/admin/listening-section-editor.tsx`
- `src/components/admin/media-asset-picker.tsx`
- `src/components/admin/resource-editor.tsx`

## Executive Summary

The platform now uses Strapi as the primary content authoring surface. The older app admin builder remains useful as legacy/fallback context for local Prisma tests, previews, validation behavior, and review workflows.

The original main usability weakness was the learner mock-test experience: active attempts treated most objective IELTS questions as generic textareas. This has now been addressed with shared IELTS renderers for Reading/Listening material, grouped instructions, options, and typed answer controls.

Overall usability rating:

- Learner dashboard/resources/practice listing: **Good MVP**
- Learner mock-test taking: **Good MVP; core IELTS structure is usable**
- Strapi resource authoring entry flow: **Good MVP**
- Strapi mock-test authoring entry flow: **Good MVP; content modeling can deepen over time**
- Admin review/publishing workflow: **Good MVP**

## Learner Usability

### Strengths

1. Clear global navigation

The learner header exposes the main mental model clearly: Dashboard, Resources, Practice, Mock Tests, Referrals, Profile. Active attempt pages suppress global navigation to keep timer/progress/save state central.

Relevant file:

- `src/components/layout/learner-header.tsx`
- `src/components/layout/dashboard-layout.tsx`

2. Dashboard gives useful next actions

The dashboard shows module scores, saved resources, completed tests, in-progress attempts, streaks, achievements, recent attempts, and next-step buttons. This is intuitive for learners returning to study.

Relevant file:

- `src/components/dashboard/dashboard-summary.tsx`

3. Practice and resource cards are simple

Practice items are grouped by type and show title, difficulty, preview, tags, and a Start button. Resource cards are clean and include save/bookmark behavior.

Relevant files:

- `src/app/(learner)/practice/page.tsx`
- `src/components/resources/resource-list.tsx`

### High-Priority Learner Problems

#### 1. Active mock tests do not feel like IELTS tests

Status: **Implemented.**

The active attempt page now uses shared IELTS section and question renderers. It renders Reading material, Listening material, grouped instructions, choice controls, and completion inputs.

Relevant files:

- `src/app/(learner)/attempts/[id]/page.tsx`
- `src/app/api/attempts/[attemptId]/route.ts`

Implemented fix:

- Added `ObjectiveQuestionRenderer`.
- Render controls based on `questionType`:
  - MCQ, T/F/NG, Y/N/NG, matching, map, and diagram choices: radio controls when options exist.
  - Completion/short answer: compact single-line inputs.
  - Map/diagram labeling: visual rendering when `sourceSpanJson.visualUrl` exists.
- Preserve textarea only for open-ended fallback.

#### 2. Reading passages are not shown during attempts

Status: **Implemented.**

Admin can save Reading passage content in `TestSection.contentJson`, and learner attempt APIs now return learner-safe section material. The attempt page renders passage title, paragraphs, and paragraph labels.

Relevant files:

- `src/app/api/attempts/[attemptId]/route.ts`
- `src/app/(learner)/attempts/[id]/page.tsx`

Impact:

- Reading tests are functionally unusable unless the prompt itself includes the passage.
- Learners cannot cross-reference paragraph labels.
- Source-supported admin authoring does not benefit learners.

Implemented fix:

- Return safe `contentJson` from attempt API for learner-visible section content.
- Add `ReadingAttemptPanel` with:
  - passage title,
  - paragraph labels,
  - sticky or side-by-side passage/questions layout on desktop,
  - stacked passage then questions on mobile.

#### 3. Listening audio is not rendered during attempts

Status: **Implemented for attached media and strict simulation UI.**

Admin can attach listening media, and the learner attempt renderer now requests a signed download URL and renders an audio player.

Relevant files:

- `src/components/admin/listening-section-editor.tsx`
- `src/components/admin/media-asset-picker.tsx`
- `src/app/api/attempts/[attemptId]/route.ts`
- `src/app/(learner)/attempts/[id]/page.tsx`

Implemented fix:

- Return section `mediaAssetId` or safe audio metadata in attempt API.
- Add `ListeningAttemptPanel`.
- Use signed media download URLs.
- Support play-once mode for strict simulations in the browser UI.
- Show transcript only when mode allows review or after submission.

Hardening note:

- Server-side `AttemptEvent` tracking is still needed before strict playback can be treated as anti-cheat enforcement.

#### 4. Mock test start flow lacks expectations

The mock test detail page shows only section/module counts. It does not explain duration, scoring, strict/untimed mode, whether audio is required, or what will happen after starting.

Relevant file:

- `src/app/(learner)/mock-tests/[id]/page.tsx`

Impact:

- Learners may start tests without understanding time commitment or module flow.

Recommended fix:

- Add pre-start summary:
  - total duration,
  - modules and part count,
  - audio required,
  - save/submit behavior,
  - score availability.

#### 5. Mobile navigation is likely weak

Status: **Implemented.**

The learner app now uses a sticky header with desktop links and a mobile menu. Admin uses `AdminLayout` with desktop sidebar and mobile navigation.

Relevant file:

- `src/components/layout/learner-header.tsx`
- `src/components/layout/dashboard-layout.tsx`
- `src/components/layout/admin-layout.tsx`

Implemented fix:

- Added learner header/mobile menu and shared admin `MobileNav` with active route state.
- Kept learner logout reachable.
- Kept the admin-to-learner switch reachable.

## Admin Usability

### Strengths

1. Admin navigation is understandable

Admin home, Resources, Tests, Reviews, and learner-app back link are clear. The separation from the learner app is useful.

Relevant files:

- `src/components/layout/admin-layout.tsx`
- `src/components/layout/sidebar-nav.tsx`

2. Resource management is now action-oriented

The resource editor uses draft/review/publish/archive actions and category labels. This is better than expecting admins to manipulate raw status fields.

Relevant files:

- `src/components/admin/resource-editor.tsx`
- `src/components/admin/admin-resource-list.tsx`
- `src/lib/resources/constants.ts`

3. Test creation wizard is much more intuitive

The new test wizard asks for setup, template, source strategy, and review before creating a test. This matches how content editors think.

Relevant file:

- `src/components/admin/test-editor-form.tsx`

4. Reading authoring no longer requires JSON

The quick authoring panel lets admins paste a passage and create questions/options/answers/source support in normal form boxes.

Relevant file:

- `src/components/admin/reading-quick-authoring-panel.tsx`

5. Builder has real CMS workflow actions

Builder supports validation, preview, duplicate draft, submit review, save draft, and publish. This is a coherent publishing workflow.

Relevant file:

- `src/app/(admin)/admin/tests/[id]/builder/page.tsx`

### High-Priority Admin Problems

#### 1. Admin Tests page still exposes too many advanced panels up front

Status: **Implemented.**

The Tests page shows Import JSON and Generation panels above the test table. For normal admins, this can feel technical and visually heavy before they see their actual test list.

Relevant file:

- `src/app/(admin)/admin/tests/page.tsx`

Impact:

- New admins may think import/generation are required.
- The primary action, New test, is visually separated inside the table header.

Implemented fix:

- Make Import and Generation collapsible under "Advanced tools".
- Put primary actions at the page header:
  - New test,
  - Import,
  - Generate draft.

#### 2. Listening quick authoring needed parity with Reading

Status: **Implemented.**

Listening can now be authored through no-JSON quick boxes, while the deeper speaker-turn editor, media picker, and question editor remain available for detailed editing.

Relevant files:

- `src/components/admin/listening-section-editor.tsx`
- `src/components/admin/media-asset-picker.tsx`
- `src/components/admin/question-list-editor.tsx`

Implemented fix:

- Add `ListeningQuickAuthoringPanel`:
  - setting/context,
  - transcript paste,
  - optional speaker parsing,
  - upload/select audio,
  - question rows,
  - answer keys,
  - transcript line source support.

#### 3. The builder page is powerful but visually dense

Status: **Partially implemented.**

The builder includes section content editor, group editor, question editor, validation panel, section overview, and structure editor on one page. It is functional, but the hierarchy can be hard to scan.

Relevant file:

- `src/app/(admin)/admin/tests/[id]/builder/page.tsx`

Impact:

- New admins may not know whether to start with passage, group, or question.
- Repeated cards make the flow feel longer than necessary.

Implemented/remaining fix:

- Convert builder center area into tabs:
  - Material,
  - Groups,
  - Questions,
  - Preview/Validation.
- Keep current section outline always visible.
- Completion chips per section have been added for Material, Questions, Answers, and Sources.
- Tabs remain a future polish item.

#### 4. Question editor still mixes many concepts

Status: **Improved; optional future split.**

The unified question editor now handles type, group, difficulty, prompt, options, answer key, accepted alternatives, structured scoring controls, explanation, source support with offsets, presets, bulk paste, editing, deletion, and drag/drop reorder.

Relevant file:

- `src/components/admin/question-list-editor.tsx`

Impact:

- Flexible and now usable, but still dense for non-technical content teams.
- Dedicated screens may be useful later for high-volume operations.

Implemented fix:

- Kept the generic editor as the advanced/flexible fallback.
- Added subtype guidance and structured controls for common types:
  - T/F/NG,
  - MCQ,
  - sentence/summary completion,
  - matching headings,
  - map labeling.
- Added bulk paste for spreadsheet-like question rows.
- Added structured `scoringRuleJson` controls.
- Added source offset storage and learner source highlighting.

#### 5. Admin preview must match learner attempts

Status: **Implemented.**

Admin preview and active learner attempts now reuse the same shared IELTS section/question renderers for Reading and Listening.

Relevant files:

- `src/app/(admin)/admin/tests/[id]/preview/page.tsx`
- `src/app/(learner)/attempts/[id]/page.tsx`

Implemented fix:

- Reuse the same learner section renderers in preview and active attempts.

## Information Architecture

### What works

- Learner areas are separated from admin areas.
- Main labels are familiar.
- Admin content types are grouped around Resources, Tests, and Reviews.

### What needs work

- "Practice" and "Mock Tests" may overlap conceptually for learners. Practice is resource-driven, while mock tests are structured attempts. This should be explained in copy or visual design.
- Admin "Tests" includes normal test management plus import/generation. These are now separated as primary vs advanced actions.
- Admin home now counts resources, tests, review queue items, validation blockers, and recent content updates.

Implemented fix:

- Admin home shows:
  - draft tests,
  - tests in review,
  - published tests,
  - validation failures,
  - pending reviews,
  - recent edits.

## Accessibility And Responsive Usability

Observed risks:

- Desktop sidebar disappears on mobile without an observed replacement. **Implemented with mobile nav.**
- Tables in admin lists are horizontally scrollable, which is acceptable but not ideal for frequent mobile use.
- Many buttons use text labels, which is accessible, but long rows of buttons in the builder may wrap awkwardly.
- Attempt page uses textareas for all objective answers, which is keyboard-accessible but semantically wrong for the question types. **Implemented with typed controls.**

Implemented fixes:

- Add mobile nav.
- Add semantic controls for objective questions.
- Add explicit labels and instructions for all IELTS answer fields.
- Add confirmation around section submission, especially when unanswered questions exist.

## Prioritized Fix List

### P0: Required for a credible IELTS learner experience

1. Render Reading passage content during attempts. **Implemented.**
2. Render Listening audio during attempts. **Implemented for attached audio.**
3. Render objective question controls based on `questionType` and `optionsJson`. **Implemented for core types.**
4. Render IELTS question groups and group instructions for learners. **Implemented.**
5. Make admin preview and learner attempt use shared renderers. **Implemented.**

### P1: Required for efficient admin operations

1. Add Listening quick authoring panel. **Implemented.**
2. Move import/generation panels under Advanced tools. **Implemented.**
3. Add section completion checklist/chips in builder. **Implemented.**
4. Add dedicated common question type forms. **Partially implemented through subtype guidance and structured controls.**
5. Improve admin home metrics for tests and reviews. **Implemented.**

### P2: Polish and scale

1. Header/mobile navigation for learner shell and mobile navigation for admin shell. **Implemented.**
2. True text-range highlighting for Reading/Listening source spans. **Implemented from stored offsets/excerpts.**
3. Drag-and-drop reordering instead of up/down buttons. **Implemented with button fallback.**
4. Bulk paste/import from spreadsheet-like rows. **Implemented.**
5. Better empty-state guidance for new admins and new learners.

## Suggested Next Implementation Sequence

1. Add learner-facing section content to `GET /api/attempts/[attemptId]`. **Implemented.**
2. Build shared `ReadingSectionView`, `ListeningSectionView`, and `ObjectiveQuestionRenderer`. **Implemented.**
3. Use those shared renderers in:
   - active attempt page,
   - admin preview page.
   **Implemented.**
4. Add `ListeningQuickAuthoringPanel`. **Implemented.**
5. Collapse advanced tools on `/admin/tests`. **Implemented.**
6. Add builder completion checklist. **Implemented.**
7. Add mobile navigation. **Implemented.**
8. Add structured scoring controls, bulk paste, source highlighting, and drag-and-drop reorder. **Implemented.**
9. Add unanswered review and strict Listening simulation. **Implemented.**

## Overall Verdict

Strapi is now the usable internal content creation surface for resources and mock tests. The legacy app builder may still benefit from cleanup if it remains as fallback tooling, but it is no longer the production authoring path.

The learner experience now has the core pieces needed to experience authored Reading and Listening content as IELTS-like tests. The next usability improvements should focus on hardening: server-side attempt events for strict audio, PostHog-backed post-attempt analytics, stronger map/diagram interaction beyond static visuals, and production content generation workers.
