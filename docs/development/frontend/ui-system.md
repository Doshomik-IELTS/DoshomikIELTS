# Frontend UI System

**Last updated:** 2026-06-17 — Design system finalized with purple-indigo primary (`#6556ff`), Poppins font, and `@theme inline` CSS variable tokens.

## Design Direction

The DOshomik IELTS frontend follows a **calm, educational, trustworthy** aesthetic — a minimal, modern educational SaaS look with restrained color, generous whitespace, clear hierarchy, and strong content readability.

### Visual Principles

1. **Less decoration, more structure**: whitespace, type scale, and alignment before color.
2. **One primary color**: indigo-purple `#6556ff` for primary actions and accents; green/amber/red only for statuses.
3. **Quiet surfaces**: mostly white (`#ffffff`), muted (`#f6faff`), subtle borders (`#e2e8f0`), low shadows.
4. **Consistent radius**: `rounded-lg` for cards and containers, `rounded-full` for buttons.
5. **Readable content**: long educational text uses generous line height, max-width columns, and clear examples.
6. **Exam focus**: attempt screens reduce chrome and emphasize progress, prompts, answers, and save/submit state.

## Design Tokens

Defined in `src/app/globals.css` via CSS custom properties and mapped through Tailwind v4 `@theme inline`:

| Token | Value | Usage |
|---|---|---|
| `--primary` | `#6556ff` | Primary buttons, links, active states, focus rings |
| `--primary-soft` | `#f0eeff` | Soft primary backgrounds, selected states |
| `--primary-hover` | `#4a3df0` | Button/action hover states |
| `--secondary` | `#1a21bc` | Secondary accent |
| `--background` | `#f8fafc` | Page background |
| `--foreground` | `#0f172a` | Primary text |
| `--surface` | `#ffffff` | Card/surface backgrounds |
| `--surface-muted` | `#f6faff` | Muted/alternate backgrounds |
| `--border-subtle` | `#e2e8f0` | Subtle borders |
| `--border-default` | `#cbd5e1` | Standard borders |
| `--text-primary` | `#0f172a` | Primary text |
| `--text-muted` | `#64748b` | Secondary/helper text |
| `--text-placeholder` | `#94a3b8` | Placeholder text |
| `--success` | `#43c639` | Success states |
| `--success-soft` | `#f0fdf4` | Success backgrounds |
| `--warning` | `#d97706` | Warning states |
| `--warning-soft` | `#fffbeb` | Warning backgrounds |
| `--danger` | `#dc2626` | Error/destructive states |
| `--danger-soft` | `#fef2f2` | Error backgrounds |
| `--info` | `#0284c7` | Info states |
| `--info-soft` | `#f0f9ff` | Info backgrounds |
| `--midnight-text` | `#222c44` | Dark text variant |
| `--grey` | `#57595f` | Grey text |
| `--slate-gray` | `#f6faff` | Slate gray surface |
| `--font-sans` | Poppins | Primary typeface |
| `--font-mono` | Geist Mono | Code/monospace typeface |

Custom shadows defined as tokens:
- `--shadow-input-shadow`: `0 63px 59px rgba(101, 86, 255, 0.1)`
- `--shadow-course-shadow`: `0 40px 20px rgba(0, 0, 0, 0.15)`
- `--shadow-testimonial-shadow1`: `0 5.54348px 11.087px rgba(89, 104, 118, 0.05)`
- `--shadow-testimonial-shadow2`: `5.54348px 38.8043px 110.87px rgba(89, 104, 118, 0.15)`

## Typography

- **Primary font:** Poppins (variable, loaded via next/font)
- **Monospace font:** Geist Mono
- **Scale:** Tailwind default type scale with adjusted leadings for readability
- **Content max-width:** `max-w-6xl` for learner pages, `max-w-7xl` for landing page, `max-w-3xl` for reading/content pages

## UI Stack

- **Tailwind CSS v4** for all layout and styling via `@import "tailwindcss"`
- **CVA** (`class-variance-authority`) for component variant management
- **`cn()`** utility (`clsx` + `twMerge`) for class merging
- **Lucide React** for icons
- **Sonner** for toast/mutation feedback

## UI Primitives (`src/components/ui/`)

All primitives use CVA variants + `cn()`:

| Component | Variants | Notes |
|---|---|---|
| `Button` | default/secondary/outline/ghost/destructive × default/sm/lg | `rounded-full` by default; uses primary/success/danger tokens |
| `Card` | default/muted/interactive/elevated/callout | Composed: Card.Header, Card.Title, Card.Content, Card.Footer |
| `Badge` | default/neutral/success/warning/danger/info/review | Rounded pill with ring |
| `Input` | Standard HTML with CVA styling | Focus ring uses `--primary`, error state via `--danger` |
| `Textarea` | Standard textarea with CVA styling | Consistent with Input |
| `Label` | Ref-forwarding with CVA | Form label styling |
| `Skeleton` | Animated pulse placeholder | Loading states |
| `State` | loading/empty/error | Full-page state messages with optional action button |
| `PageHeader` | Title + description + optional actions | Unified page heading pattern |
| `Breadcrumbs` | Responsive breadcrumb trail | Navigation hierarchy |
| `ContentPanel` | Themed content container | Content sections with header/body |
| `SkipNav` | Accessibility skip-to-content link | |

## Status Colors

| Status | Color Token |
|---|---|
| Draft | neutral/grey |
| In progress | primary |
| Submitted | secondary |
| Evaluating/processing | warning |
| Completed/succeeded | success |
| Failed | danger |
| Needs review | review/warning |
| Archived | muted grey |

## Shared App Components (`src/components/`)

### Layout Components

- `PublicHeader` — Public/landing page header with navigation
- `LearnerHeader` — Authenticated learner sticky top header with desktop links and mobile menu
- `DashboardLayout` — Learner layout shell using `LearnerHeader` + `BetaFeedback`
- `AdminLayout` — Admin layout with desktop sidebar and mobile navigation
- `SidebarNav` — Admin sidebar navigation helper
- `MobileNav` — Mobile navigation drawer

### Landing Page Components (`src/components/home/`)

- `Hero` — Hero section with value proposition and CTA
- `Courses` — Course/module showcase grid
- `Mentor` — Mentor/instructor section
- `Testimonials` — Social proof/testimonial cards
- `Newsletter` — Newsletter/CTA signup section
- `Companies` — Trusted by / company logos

### Dashboard Components

- `DashboardSummary` — Stats and progress overview
- `StreakBadge` — Flame icon with current/longest streak
- `AchievementsPanel` — Grid of earned/locked achievement badges

### Resource Components

- `ResourceList` — Resource list with search/filter
- `ResourceDetail` — Resource detail view
- `ResourceSaveButton` — Bookmark toggle (icon + button variants)

### IELTS Components

- `IeltsSectionRenderer` — Renders test sections per module
- `ObjectiveQuestionRenderer` — MC, T/F/NG, matching, short-answer
- `WritingEditor` — Rich text editor with live word count, auto-save
- `SpeakingRecorder` — MediaRecorder audio recording UI
- `SpeakingSubmission` — Speaking response submission (text or audio)
- `TestTimer` — Per-section countdown timer with auto-submit
- `ScoreBadge` — Band score display
- `EvaluationStatusBadge` — Evaluation status (queued/processing/completed)
- `FeedbackDisplay` — Criteria-level feedback rendering

### Profile Components

- `ProfileEditor` — Profile form with RHF + Zod validation + Sonner toast

### Auth Components

- `LogoutButton` — Logout action
- Auth Modal — Modal-based login/register/reset flow

### Feedback Components

- `BetaFeedback` — Beta feedback submission form

## Content Formatting

Resources and evaluation feedback support:

- Headings with hierarchy
- Paragraphs with comfortable line height
- Examples with visual distinction
- Lists (ordered and unordered)
- Tables where needed
- Callouts for common mistakes, tips, warnings
- Tags and difficulty badges
- Max-width content columns for readability

## Score Display Rules

Every score UI includes:

- Module name
- Estimated band score
- Confidence level (low/medium/high) where available
- Unofficial estimate disclaimer for predicted scores

**Never imply an official IELTS result.**

## Component Acceptance Criteria

- Components are keyboard accessible
- Focus states are visible (focus-visible ring in primary color)
- Form controls have associated labels
- Error messages are placed near relevant fields
- Loading, empty, and error states are designed — no blank screens
- Status badges use text plus color, not color alone
- Buttons show loading state during async operations