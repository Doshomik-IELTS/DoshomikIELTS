# Frontend Accessibility And Responsive Requirements

## Implemented Accessibility Features

The codebase implements accessibility through:

- **UI Components** - All in-house components in `src/components/ui/` follow accessible patterns with proper labels, focus states, and semantic HTML.
- **State Components** - `src/components/ui/state.tsx` provides LoadingState, EmptyState, ErrorState with accessible text.
- **Evaluation Status** - `EvaluationStatusBadge` displays status with text + color (not color alone).
- **Score Display** - `ScoreBadge` shows band scores with clear labels and unofficial disclaimer.
- **Forms** - Profile form uses RHF+zod with proper validation messages.
- **Speaking Recorder** - Has accessible controls and status display.
- **Writing Editor** - Live word count with visible progress bar and clear task-type labels.
- **Test Timer** - Visible countdown with text status updates.
- **Breadcrumbs** - Navigation breadcrumbs for deep page context.
- **Page Headers** - Clear page titles with optional subtitles.
- **Beta Feedback** - Accessible form with proper labels and validation.
- **Question Renderers** - `ObjectiveQuestionRenderer` and `IeltsSectionRenderer` use semantic HTML with proper labels for all inputs.

## Accessibility Baseline

The MVP should be usable with keyboard navigation and screen readers for core flows.

Required checks:

- All interactive elements are keyboard reachable.
- Focus state is visible.
- Form fields have labels.
- Validation errors are associated with fields.
- Status changes are communicated in text.
- Color is not the only status indicator.
- Buttons and links have descriptive text.
- Audio controls are keyboard accessible.

## Screen Reader Considerations

Use clear text for:

- Evaluation status.
- Attempt status.
- Score disclaimer.
- Upload progress.
- Error messages.
- Required fields.

Avoid relying only on icons or colors.

## Responsive Strategy

### Mobile Priority

Optimize mobile for:

- Landing page.
- Changelog.
- Auth.
- Welcome/onboarding.
- Dashboard.
- Profile.
- Resources.
- Short practice.
- Evaluation feedback review.
- Referrals.

### Tablet/Desktop Priority

Optimize tablet/desktop for:

- Full mock test.
- Reading passage + question layout.
- Long writing tasks.
- Admin screens.

## Mock Test Responsive Rules

- Desktop/tablet can use split layouts.
- Mobile should stack content vertically.
- Keep section navigation accessible.
- Avoid tiny answer inputs.
- Show warning if full mock test is better on larger screen if needed.

## Writing Responsive Rules

- Textarea should be comfortable on mobile.
- Word count should remain visible.
- Submit buttons should not hide behind keyboard on mobile where possible.

## Speaking Responsive Rules

- Recording controls should be large enough for touch.
- Timer and upload progress should be visible.
- Playback controls should be accessible.

## Admin Responsive Rules

Admin does not need to be mobile-perfect in MVP.

Minimum:

- Usable on laptop/desktop.
- Not broken on tablet.
- Mobile can show simplified stacked layout if easy.

## Accessibility Acceptance Criteria

- User can complete login with keyboard.
- User can update profile with keyboard.
- User can submit objective practice with keyboard.
- User can navigate mock test sections with keyboard.
- User can submit writing response with keyboard.
- Audio controls have accessible labels.
- Status badges include readable text.
- Score disclaimer is visible and readable.
