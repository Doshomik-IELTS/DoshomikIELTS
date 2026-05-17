# Minimal Aesthetic Improvement Plan

_Date: 2026-05-10_

> Historical note, updated 2026-05-17: resource and mock-test authoring has moved to Strapi. Any recommendations below about `/admin/resources` or `/admin/tests` now apply only to the lightweight Strapi entry panels, legacy fallback screens, review workflows, or shared layout polish. Learner desktop navigation now uses `LearnerHeader`; admin layout is centralized in `src/app/(admin)/layout.tsx`.

## Goal

Make the authenticated learner and admin pages feel as polished as the landing page: minimal, calm, readable, and consistent, without adding visual noise or over-gamification. The target aesthetic is an educational SaaS interface with restrained color, generous spacing, clear hierarchy, and strong content readability.

## Review Summary

Reviewed representative frontend files in:

- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/components/ui/*`
- `src/components/layout/*`
- learner routes under `src/app/(learner)/`
- admin routes under `src/app/(admin)/admin/`
- dashboard, resources, profile, IELTS, and admin components under `src/components/`

The landing page already has a clearer visual direction. Inner pages are functional, but they look more like implementation scaffolds than a finished minimal product because spacing, containers, state panels, table styling, page headers, and component variants are inconsistent.

## Current Aesthetic Issues

### 1. Layout shells were inconsistent — implemented/superseded

- `DashboardLayout` now uses `LearnerHeader` instead of a desktop learner sidebar.
- Active attempt pages suppress global learner navigation for focus.
- `src/app/(admin)/layout.tsx` now applies `AdminLayout` once for all admin pages.
- Several older notes below remain useful as historical polish context.

### 2. Missing shared page composition primitives

Most inner pages manually assemble title, description, actions, cards, and states. This causes visual drift.

Needed shared primitives:

- `PageShell`
- `PageHeader`
- `Breadcrumbs`
- `SectionHeader`
- `StatCard`
- `FilterPanel`
- `DataTable`
- `StatusBadge`
- `ContentPanel`

### 3. Utility classes reference undefined design tokens

Some pages use shadcn-style token names that are not currently defined in `globals.css`.

Examples:

- `text-muted-foreground`
- `bg-muted`
- `text-destructive`
- `border-destructive`

These should either be replaced with existing slate/red classes or formalized as Tailwind v4 theme tokens.

### 4. Typography is sparse on content-heavy screens

- Resource detail uses `prose prose-slate`, but the Tailwind Typography plugin is not listed in `package.json`; the class may not style content.
- Long resource, evaluation, review, and attempt content needs a reusable readable content style: max width, line height, paragraph spacing, callout blocks, examples, and metadata chips.

### 5. Cards and states are too uniform

Current cards are simple white bordered boxes. This is a good base, but inner pages need subtle hierarchy:

- primary action panels
- neutral content panels
- quiet stat cards
- warning/info callouts
- selected/active states
- submitted/locked states

### 6. Learner pages lack polished progression cues

- Dashboard: useful data exists, but cards need hierarchy and a cleaner next-action area.
- Practice and mock test lists: cards are functional but visually plain and inconsistent.
- Active attempt: needs better exam focus, section progress, sticky action area, and clearer question grouping.
- Result/report/evaluation pages: need a polished score summary and structured feedback presentation rather than raw `pre` JSON.

### 7. Admin pages need a minimal operations aesthetic

Admin lists and editors should feel like clean back-office tooling:

- consistent table chrome
- compact filters
- status pills
- predictable page headers
- clear destructive/publish actions
- responsive overflow behavior

### 8. Navigation polish is incomplete

- Sidebar links do not show active route state.
- Mobile learner/admin navigation is missing; inner pages may feel inaccessible on smaller screens.
- Deep pages lack breadcrumbs, making flows feel disconnected.

## Design Direction

### Visual principles

1. **Less decoration, more structure**: use whitespace, type scale, and alignment before color.
2. **One primary color**: keep blue for primary actions/progress; use green/amber/red only for statuses.
3. **Quiet surfaces**: mostly `white`, `slate-50`, `slate-100`, subtle borders, low shadow.
4. **Consistent radius**: use rounded cards and buttons consistently.
5. **Readable content**: long educational text should feel like a lesson page, not a raw text block.
6. **Exam focus**: attempt screens should reduce dashboard chrome and emphasize progress, prompts, answers, and save/submit state.

### Suggested base tokens

Add or formalize these in `src/app/globals.css` / Tailwind v4 theme usage:

- `--surface`: `#ffffff`
- `--surface-muted`: `#f8fafc`
- `--border-subtle`: `#e2e8f0`
- `--text-muted`: `#64748b`
- `--primary`: `#1d4ed8`
- `--primary-soft`: `#eff6ff`
- `--success`: green scale
- `--warning`: amber scale
- `--danger`: red scale

## Implementation Plan

### Phase 0 — Safety and baseline audit

Before code changes:

- Read the relevant Next.js guide in `node_modules/next/dist/docs/` before editing App Router layouts/pages, per repo instructions.
- Capture current screenshots for:
  - `/dashboard`
  - `/resources`
  - `/resources/[id]`
  - `/practice`
  - `/practice/[id]`
  - `/mock-tests`
  - `/mock-tests/[id]`
  - `/attempts/[id]`
  - `/attempts/[id]/report`
  - `/evaluations/[id]`
  - `/profile`
  - `/admin`
  - `/admin/resources`
  - `/admin/tests`
  - `/admin/reviews`
- Run `npm run typecheck` and `npm run lint` to establish a baseline.

Deliverable: screenshot folder or issue notes with before-state references.

### Phase 1 — Design foundations

Files to update/create:

- `src/app/globals.css`
- `src/components/ui/card.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/state.tsx`
- new shared primitives under `src/components/ui/` as needed

Tasks:

1. Define semantic color/text/surface tokens or replace undefined token classes.
2. Add reusable badge variants: `neutral`, `info`, `success`, `warning`, `danger`, `review`.
3. Add card variants: `default`, `muted`, `interactive`, `elevated`, `callout`.
4. Add shared `Select` styling or component because admin filters repeat native select classes.
5. Add minimal `DataTable` styles for admin and attempts.
6. Add `PageHeader`, `Breadcrumbs`, `StatCard`, `FilterPanel`, and `ContentPanel` components.
7. Add a small content typography utility for resources/evaluation feedback if not adding Tailwind Typography.

Acceptance criteria:

- No undefined design-token utility classes remain.
- Shared components reduce one-off border/padding/card patterns.
- Focus states remain visible and accessible.

### Phase 2 — Layout and navigation unification

Files to update:

- `src/components/layout/dashboard-layout.tsx`
- `src/components/layout/admin-layout.tsx`
- `src/app/(learner)/layout.tsx`
- `src/components/layout/learner-header.tsx`

Tasks:

1. Ensure learner route group applies `DashboardLayout` once only. **Implemented.**
2. Ensure all admin pages use `AdminLayout`, including review list/detail. **Implemented via route-group layout.**
3. Add active navigation link styles using the current path in a small client nav component. **Implemented in `LearnerHeader` and `SidebarNav`.**
4. Add mobile navigation for learner/admin routes, at least a compact top bar with menu links. **Implemented.**
5. Normalize main content width: default `max-w-6xl`, reading pages `max-w-3xl`, admin tables `max-w-7xl`.
6. Remove redundant `p-8` / `container py-8` wrappers where layout already provides spacing.

Acceptance criteria:

- No double sidebars or nested app shells.
- Page gutters are consistent across learner pages.
- Admin pages have their own coherent navigation.

### Phase 3 — Learner inner page polish

Files/components to update:

- `src/components/dashboard/dashboard-summary.tsx`
- `src/components/resources/resource-list.tsx`
- `src/components/resources/resource-detail.tsx`
- `src/components/profile/profile-editor.tsx`
- `src/app/(learner)/practice/page.tsx`
- `src/app/(learner)/practice/[id]/page.tsx`
- `src/app/(learner)/mock-tests/page.tsx`
- `src/app/(learner)/mock-tests/[id]/page.tsx`

Tasks:

1. Use `PageHeader` everywhere with title, description, optional metadata, and primary action.
2. Dashboard:
   - turn score cards into quiet stat/progress cards
   - add a clear “recommended next step” panel
   - make recent attempts visually lighter and easier to scan
3. Resources:
   - add search/filter UI if backend supports it, otherwise prepare static filter layout
   - use refined cards with category/difficulty/status chips
   - improve resource detail readability with content typography and a subtle metadata row
4. Practice:
   - unify practice cards with resource cards
   - add type/difficulty chips and more readable previews
   - make attempt page feel like a focused task card instead of a raw form
5. Mock tests:
   - show modules as chips
   - add duration/section count hierarchy
   - make overview page a clear confirmation/instructions screen
6. Profile:
   - place profile fields in well-spaced sections
   - add helper copy for target band/exam date

Acceptance criteria:

- All learner list/detail forms use shared page/card primitives.
- Empty/loading/error states look intentional, not temporary.
- Inner pages visually match the landing page’s calm quality.

### Phase 4 — Exam attempt, score, report, and evaluation polish

Files/components to update:

- `src/app/(learner)/attempts/[id]/page.tsx`
- `src/app/(learner)/attempts/[id]/score/page.tsx`
- `src/app/(learner)/attempts/[id]/report/page.tsx`
- `src/app/(learner)/evaluations/[id]/page.tsx`
- `src/components/ielts/score-badge.tsx`
- `src/components/ielts/evaluation-status-badge.tsx`
- `src/components/ielts/speaking-submission.tsx`

Tasks:

1. Active attempt:
   - create a calm exam header with test title, section progress, save state, and exit action
   - make section navigation look like a progress rail/chip group
   - use question cards with consistent numbering and answer spacing
   - add a sticky bottom action bar on desktop/tablet for save/submit
2. Score/report:
   - replace placeholder score page with actual score summary or redirect logic
   - use a polished score hero with unofficial-estimate disclaimer
   - show module scores in consistent cards
   - format detailed report data instead of raw JSON where possible
3. Evaluation:
   - use `EvaluationStatusBadge`
   - replace raw JSON/pre feedback with structured panels: strengths, weaknesses, next task, criterion bands
   - keep raw JSON only behind a developer/debug details section if needed

Acceptance criteria:

- Active attempt remains keyboard usable.
- Score prediction is always labelled unofficial.
- Evaluation feedback is learner-readable.

### Phase 5 — Admin polish

Files/components to update:

- `src/app/(admin)/admin/page.tsx`
- `src/app/(admin)/admin/resources/page.tsx`
- `src/app/(admin)/admin/resources/new/page.tsx`
- `src/app/(admin)/admin/resources/[id]/page.tsx`
- `src/app/(admin)/admin/tests/page.tsx`
- `src/app/(admin)/admin/tests/new/page.tsx`
- `src/app/(admin)/admin/tests/[id]/page.tsx`
- `src/app/(admin)/admin/reviews/page.tsx`
- `src/app/(admin)/admin/reviews/[id]/page.tsx`
- `src/components/admin/*`

Tasks:

1. Use `AdminLayout` consistently. **Implemented via `src/app/(admin)/layout.tsx`.**
2. Add admin `PageHeader` with breadcrumbs and actions.
3. Replace one-off tables with shared `DataTable` styling.
4. Use status badge variants for draft/review/published/archived/queued/needs-review.
5. Make filter panels compact and aligned.
6. Improve editor forms with grouped sections and clear publish/archive affordances.

Acceptance criteria:

- Admin resources/tests/reviews feel like one product area.
- Tables are readable and responsive via horizontal overflow.
- Destructive or publishing actions are visually distinct but restrained.

### Phase 6 — QA and documentation

Tasks:

1. Run:
   - `npm run typecheck`
   - `npm run lint`
   - `npm run test:p0`
2. Do keyboard-only checks for:
   - profile save
   - practice attempt submit
   - mock attempt section navigation and submit
   - admin filter and table action usage
3. Capture after screenshots and compare with Phase 0.
4. Update docs:
   - `docs/development/frontend/ui-system.md`
   - `docs/development/frontend/screens-and-flows.md`
   - `docs/development/frontend/accessibility-responsive.md`

Acceptance criteria:

- No lint/type regressions.
- No nested layout regressions.
- Minimal aesthetic is documented as the frontend baseline.

## Suggested Build Order

1. Fix layout duplication and wrong admin layout usage.
2. Add design tokens/shared page primitives.
3. Update dashboard/resources/profile as the style reference.
4. Apply the same style to practice/mock lists and details.
5. Redesign attempt/evaluation/report screens.
6. Polish admin tables/forms.
7. Run QA and update screenshots/docs.

## Non-Goals

- Do not redesign the landing page unless needed to align tokens.
- Do not add heavy animation or gamified visuals.
- Do not introduce a large UI framework unless the team explicitly chooses it.
- Do not change business logic or API contracts as part of aesthetic cleanup unless a page cannot be polished without a small data-shape fix.

## Definition of Done

The frontend aesthetic pass is complete when:

- every protected learner/admin page uses a consistent shell and page header pattern;
- all common surfaces use shared UI primitives instead of one-off border boxes;
- long educational/evaluation content is readable;
- active attempt screens feel focused and trustworthy;
- admin pages are clean, compact, and consistent;
- loading, empty, error, pending, submitted, evaluating, failed, and completed states are visually designed;
- `npm run typecheck`, `npm run lint`, and `npm run test:p0` pass.
