# UI/UX Review

Last updated: 2026-05-17

## Implementation Update

The main issues from this review have been addressed:

- Learner desktop navigation now uses a sticky top header instead of a fixed sidebar.
- Active attempt pages suppress global learner navigation so the test UI can focus on timer/progress/save state.
- Admin shell is centralized at the admin route-group layout, so admin navigation is consistent across admin pages.
- Admin labels and overview copy now make Strapi authoring explicit.
- Resource, practice, and mock-test cards use human-readable labels.
- Resource save/bookmark controls now use lucide icons.
- Dashboard includes a "Next best action" strip to guide learners.

## Summary

The learner app has a solid functional foundation. The authenticated experience has now moved to a header-first learner shell, which makes normal learner pages feel lighter and closer to the public landing-page experience.

The sidebar remains useful for dense admin/operations screens. For normal learner routes, the header-first layout is now the default. Active mock-test attempts suppress global learner navigation so the exam UI can stay focused.

## Priority Findings

### P0 - Desktop Learner Navigation Feels Too Heavy

Previous desktop learner layout used a fixed 256px sidebar in `DashboardLayout`. This made post-login pages feel like an admin console:

- `Dashboard`
- `Resources`
- `Practice`
- `Mock Tests`
- `Referrals`
- `Profile`

Implemented:

- `LearnerHeader` provides sticky top navigation.
- Brand is on the left, primary links are inline on desktop, and account/logout actions are on the right.
- Active route state uses quiet pill styling.
- Mobile and desktop navigation are now one component.

Suggested desktop header items:

| Area | Header Item |
|------|-------------|
| Home/progress | Dashboard |
| Study library | Resources |
| Focused work | Practice |
| Exam simulation | Mock Tests |
| Growth/account | Referrals, Profile |

### P0 - Admin Overview Still Sounds Like Old In-App Content Authoring

The admin overview previously said "Create content" and had "New resource" / "New test" actions. Those now explicitly say "Open Strapi Resources" and "Open Strapi Mock Tests."

Implemented:

- Change admin copy to "Open Strapi authoring" / "Manage app operations."
- Rename buttons:
  - "New resource" -> "Open Strapi Resources"
  - "New test" -> "Open Strapi Mock Tests"
- Keep review/flashcard/referral/admin operations inside DOshomik IELTS.

### P1 - Sidebar Can Remain For Admin, But It Should Be More Operational

Admin screens can keep a sidebar because admins repeat operational workflows and need dense navigation. But the admin sidebar should clearly distinguish:

- Strapi authoring entry points
- App operations
- Reviews
- Flashcards
- Learner dashboard back-link

Recommendation:

- Keep admin sidebar on desktop.
- Use small section labels such as "Content", "Operations", "Account" if the nav grows.
- Avoid "Resources" and "Tests" labels alone because those now mean Strapi entry panels, not in-app editors.

### P1 - Learner Cards Use Raw Enum Labels

Resource cards display values such as `basic_english`, `reading_strategy`, and `short_mock` style strings when data comes from APIs. This makes the product feel unfinished.

Recommendation:

- Use existing label helpers for resource category and difficulty labels.
- Add label helpers for mock-test type and module labels.
- Show human text like "Basic English", "Reading Strategy", "Short Mock", "Full Mock".

### P1 - Resource Save Icon Appears Risky

The save icon in `ResourceSaveButton` uses a `viewBox="0 0 24 24"` with path coordinates extending to `y=29`. That can clip or distort the bookmark shape.

Recommendation:

- Replace the manual SVG with `Bookmark` / `BookmarkCheck` from `lucide-react`.
- Add a tooltip/accessible label.

### P1 - Main Content Spacing Is Uniform But Not Context-Aware

All learner pages use the same max width and top padding. This is serviceable, but some screens need different density:

- Dashboard benefits from wider scan-friendly grids.
- Resource detail should use a narrower reading column.
- Mock-test attempt screens need more usable horizontal space and less decorative chrome.

Recommendation:

- Add layout variants:
  - `standard` for lists/dashboard.
  - `reading` for articles/resources.
  - `exam` for attempts.
- Keep attempt UI focused and avoid global nav distractions while a test is active.

### P2 - Dashboard Has Good Data But Weak Study Direction

The dashboard shows scores, stats, streaks, achievements, progress, and attempts. It does not yet strongly answer "what should I do next?"

Recommendation:

- Add a compact "Next best action" strip under the header.
- Examples:
  - Continue in-progress mock test.
  - Review weak module.
  - Study next resource.
  - Start a short mock.

### P2 - Header Actions Should Reflect IELTS User Intent

After login, a learner's most common actions are not all equal. The top-level UI should emphasize:

- Continue
- Practice
- Start mock
- Review feedback

Recommendation:

- Put one primary CTA in the header, such as "Start mock" or "Continue".
- Keep secondary navigation quieter.

## Recommended Layout Direction

### Learner Desktop

Use a sticky top header:

- Left: DOshomik IELTS brand.
- Center: Dashboard, Resources, Practice, Mock Tests.
- Right: Referrals, Profile/avatar, Logout/menu.
- Optional primary CTA: Start mock / Continue.

Use a page-level header inside the content for page title, description, and local actions.

### Learner Mobile

Keep the current sticky mobile header, but improve the menu trigger:

- Use a menu icon instead of text-only "Menu".
- Keep active route states.
- Put logout/profile at the bottom of the drawer.

### Admin Desktop

Keep sidebar, but update naming:

- Overview
- Strapi Resources
- Strapi Mock Tests
- Flashcards
- Reviews
- Learner app

### Exam Attempt

Use a dedicated exam layout:

- No broad learner navigation.
- Top bar with test title, section progress, timer, save status, and exit.
- Keep content/questions as the primary focus.

## Implementation Plan

1. Create a `LearnerHeader` component. **Implemented.**
2. Update `DashboardLayout` to use desktop header instead of desktop sidebar. **Implemented.**
3. Keep mobile navigation aligned with desktop header labels/states. **Implemented in `LearnerHeader`.**
4. Create a focused route-level attempt shell for `/attempts/[id]`. **Implemented by suppressing global learner nav on active attempt route.**
5. Update admin copy and nav labels to make Strapi authoring explicit. **Implemented.**
6. Replace raw enum labels in resource/test/practice cards. **Implemented.**
7. Replace manual bookmark SVG with lucide icons. **Implemented.**

## Acceptance Criteria

- Desktop learner pages use a top header, not a fixed left sidebar.
- Mobile learner navigation remains usable and visually aligned with desktop navigation.
- Admin content routes clearly say they open Strapi.
- Test-taking pages minimize global navigation and prioritize timer/progress/save state.
- Resource/test cards use human-readable labels.
- Save/bookmark icon renders correctly and has accessible labels.
