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
| `State` | ✅ Implemented | Loading/empty/error states |

## Shared App Components

Located in `src/components/`:

### Layout Components

- `PublicHeader` - Public pages header
- `DashboardLayout` - Learner layout with sidebar
- `AdminLayout` - Admin layout with navigation

### IELTS-Specific Components

Located in `src/components/ielts/`:

- `EvaluationStatusBadge` - Shows evaluation status (queued/processing/succeeded/failed/needs_review)
- `ScoreBadge` - Displays band scores
- `SpeakingRecorder` - Audio recording component
- `SpeakingSubmission` - Speaking submission with text/audio support

### Admin Components

Located in `src/components/admin/`:

- `AdminResourceList` - Resource list with filters
- `AdminTestList` - Test list with status filters
- `ResourceEditor` - Resource create/edit form
- `TestEditorForm` - Test metadata form
- `TestDetailEditor` - Test detail with sections
- `TestSectionEditor` - Section management
- `QuestionEditor` - Question create/edit with answer key

### Profile Components

- `ProfileEditor` - Profile form with RHF+zod validation

### Resource Components

- `ResourceList` - Resource list with filters
- `ResourceDetail` - Resource detail view

### Dashboard Components

- `DashboardSummary` - Dashboard stats and progress

### Auth Components

- `LogoutButton` - Logout action

Reference list:

- Button
- Input
- Textarea
- Label
- Select
- Checkbox
- Radio Group
- Card
- Badge
- Tabs
- Dialog
- Alert
- Table
- Progress
- Skeleton
- Dropdown Menu
- Separator
- Tooltip
- Toast/Sonner

## Shared App Components

### Layout Components

- `PublicHeader`
- `DashboardLayout`
- `AdminLayout`
- `SidebarNav`
- `MobileNav`
- `PageHeader`
- `Breadcrumbs`

### State Components

- `LoadingState`
- `EmptyState`
- `ErrorState`
- `UnauthorizedState`
- `ForbiddenState`
- `EvaluationStatusBadge`
- `ModuleProgressCard`
- `ScoreBadge`

### IELTS-Specific Components

- `BandScoreBadge`
- `ConfidenceBadge`
- `UnofficialScoreDisclaimer`
- `QuestionRenderer`
- `AnswerInputRenderer`
- `AudioPlayer`
- `WritingEditor`
- `WordCount`
- `SpeakingRecorder`
- `EvaluationFeedbackPanel`
- `MockSectionNav`
- `AttemptStatusTimeline`

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
