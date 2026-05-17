# Frontend UI System

## Design Direction

The IELTS++ MVP should feel clean, educational, trustworthy, and focused. Avoid over-gamified visuals in the first version.

Recommended style:

- Light default theme.
- High contrast text.
- Calm primary color.
- Clear status colors for progress, errors, warnings, and success.
- Card-based layouts for dashboard/resources/practice.
- Exam-focused layouts for mock tests.

## UI Stack

Use:

- Tailwind CSS for layout and styling.
- In-house component primitives in `src/components/ui/`, following shadcn-style accessibility and API patterns where useful.
- Lucide or similar icon set if needed.
- Sonner for mutation feedback.

## UI Components Implemented

Located in `src/components/ui/`:

| Component | Status | Notes |
|-----------|--------|-------|
| `Button` | ✅ Implemented | Native button, supports variant prop |
| `Input` | ✅ Implemented | Standard input |
| `Textarea` | ✅ Implemented | Multi-line text |
| `Label` | ✅ Implemented | Form labels |
| `Card` | ✅ Implemented | Card container |
| `Badge` | ✅ Implemented | Status badges, supports variant |
| `Skeleton` | ✅ Implemented | Loading placeholders |
| `State` | ✅ Implemented | Loading/empty/error states (LoadingState, EmptyState, ErrorState) |
| `StatCard` | ✅ Implemented | Stat display with label, value, icon (added 2026-05-15) |
| `ContentPanel` | ✅ Implemented | Content container with header/body (added 2026-05-15) |
| `PageHeader` | ✅ Implemented | Page title with optional subtitle/actions (added 2026-05-15) |
| `Breadcrumbs` | ✅ Implemented | Navigation breadcrumbs (added 2026-05-15) |

## Shared App Components

Located in `src/components/`:

### Layout Components

- `PublicHeader` - Public pages header
- `LearnerHeader` - Authenticated learner top navigation with desktop links and mobile menu
- `DashboardLayout` - Learner layout shell using `LearnerHeader`
- `AdminLayout` - Admin layout with desktop sidebar and mobile navigation
- `SidebarNav` - Admin/sidebar navigation helper
- `MobileNav` - Mobile navigation drawer used by admin shell
- `PageHeader` - Page header with title/subtitle/actions
- `Breadcrumbs` - Navigation breadcrumbs

### Dashboard Components

- `DashboardSummary` - Dashboard stats and progress
- `StreakBadge` - Flame icon with current/longest streak
- `AchievementsPanel` - Grid of earned/locked achievement badges

### Resource Components

- `ResourceList` - Resource list with filters
- `ResourceDetail` - Resource detail view
- `ResourceSaveButton` - Bookmark toggle (icon + button variants)

### Profile Components

- `ProfileEditor` - Profile form with RHF+zod validation

### Feedback Components

- `BetaFeedback` - Beta feedback submission form (added 2026-05-15)

### Auth Components

- `LogoutButton` - Logout action

## Status Colors

Recommended semantic statuses:

- Draft: gray
- In progress: blue
- Submitted: indigo
- Evaluating/processing: amber
- Completed/succeeded: green
- Failed: red
- Needs review: orange
- Archived: muted gray

## Content Formatting

Resources should support:

- Headings.
- Paragraphs.
- Examples.
- Lists.
- Tables where needed.
- Callouts for common mistakes.
- Tags and difficulty badges.

Keep long-form resource content readable:

- Max-width content column.
- Comfortable line height.
- Clear examples.
- Mobile-friendly spacing.

## Score Display Rules

Every score UI should include:

- Module name.
- Estimated band.
- Confidence where available.
- Unofficial estimate disclaimer for predicted score.

Never imply an official IELTS result.

## Component Acceptance Criteria

- Components are keyboard accessible.
- Focus states are visible.
- Form controls have labels.
- Error messages are placed near fields.
- Loading and empty states are designed, not blank pages.
- Status badges use text plus color, not color alone.
