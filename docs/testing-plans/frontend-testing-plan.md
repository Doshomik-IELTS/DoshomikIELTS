# Frontend Testing Plan

## Test Strategy

Use a mix of:

- Component tests for reusable UI and renderers.
- Integration tests for API-connected flows.
- End-to-end tests for core learner/admin journeys.
- Manual accessibility and responsive checks.

## Current Implementation Status

**TypeScript, Lint, Build:** ✅ All passing
**E2E Tests:** ⚠️ Need Supabase environment

### Implemented Pages

| Route | Page | Status |
|-------|------|--------|
| `/` | Landing | ✅ |
| `/login` | Login | ✅ |
| `/register` | Register | ✅ |
| `/reset-password` | Reset Password | ✅ |
| `/dashboard` | Learner Dashboard | ✅ |
| `/profile` | Profile | ✅ |
| `/resources` | Resource List | ✅ |
| `/resources/[id]` | Resource Detail | ✅ |
| `/practice` | Practice List | ✅ |
| `/practice/[id]` | Practice Attempt | ✅ |
| `/practice/[id]/result` | Practice Result | ✅ |
| `/mock-tests` | Mock Test List | ✅ |
| `/mock-tests/[id]` | Mock Test Attempt | ✅ |
| `/attempts/[id]` | Attempt (with SpeakingSubmission) | ✅ |
| `/attempts/[id]/report` | Attempt Report | ✅ |
| `/attempts/[id]/score` | Attempt Score | ✅ |
| `/evaluations/[id]` | Evaluation Detail | ✅ |
| `/admin` | Admin Dashboard | ✅ |
| `/admin/resources` | Admin Resources | ✅ |
| `/admin/resources/[id]` | Admin Resource Edit | ✅ |
| `/admin/resources/new` | Admin Resource Create | ✅ |
| `/admin/tests` | Admin Tests | ✅ |
| `/admin/tests/[id]` | Admin Test Edit | ✅ |
| `/admin/tests/new` | Admin Test Create | ✅ |
| `/admin/reviews` | Admin Reviews | ✅ |
| `/admin/reviews/[id]` | Admin Review Detail | ✅ |

### Implemented Components

| Component | Location | Status |
|-----------|----------|--------|
| Button | `components/ui/button.tsx` | ✅ |
| Input | `components/ui/input.tsx` | ✅ |
| Textarea | `components/ui/textarea.tsx` | ✅ |
| Label | `components/ui/label.tsx` | ✅ |
| Card | `components/ui/card.tsx` | ✅ |
| Badge | `components/ui/badge.tsx` | ✅ |
| Skeleton | `components/ui/skeleton.tsx` | ✅ |
| State | `components/ui/state.tsx` | ✅ |
| PublicHeader | `components/layout/public-header.tsx` | ✅ |
| DashboardLayout | `components/layout/dashboard-layout.tsx` | ✅ |
| AdminLayout | `components/layout/admin-layout.tsx` | ✅ |
| ScoreBadge | `components/ielts/score-badge.tsx` | ✅ |
| EvaluationStatusBadge | `components/ielts/evaluation-status-badge.tsx` | ✅ |
| SpeakingRecorder | `components/ielts/speaking-recorder.tsx` | ✅ |
| SpeakingSubmission | `components/ielts/speaking-submission.tsx` | ✅ |
| AdminResourceList | `components/admin/admin-resource-list.tsx` | ✅ |
| AdminTestList | `components/admin/admin-test-list.tsx` | ✅ |
| ResourceEditor | `components/admin/resource-editor.tsx` | ✅ |
| TestEditorForm | `components/admin/test-editor-form.tsx` | ✅ |
| TestDetailEditor | `components/admin/test-detail-editor.tsx` | ✅ |
| TestSectionEditor | `components/admin/test-section-editor.tsx` | ✅ |
| QuestionEditor | `components/admin/question-editor.tsx` | ✅ |

## P0 Automated Tests

Before browser-level tests, keep `pnpm typecheck` green. ✅ All passing.

### Auth

- Logged-out user visiting `/dashboard` redirects to `/login`. ⚠️ E2E needed
- Logged-out user visiting `/admin` redirects to `/login`. ⚠️ E2E needed
- Logged-in user visiting `/login` redirects to `/dashboard`. ⚠️ E2E needed
- Login errors display correctly. ⚠️ E2E needed

**Current Status:** E2E tests exist (`tests/e2e/auth-guard.spec.ts`, `tests/e2e/login.spec.ts`), need environment.

### Profile

- Profile form renders current values. ⚠️ E2E needed
- Required validation works. ⚠️ E2E needed
- Successful save shows confirmation. ⚠️ E2E needed
- Failed save preserves input and shows error. ⚠️ E2E needed

### Resources

- Resource list loads. ⚠️ E2E needed
- Filters update results. ⚠️ E2E needed
- Empty search shows empty state. ⚠️ E2E needed
- Resource detail renders body/examples/tags. ⚠️ E2E needed
- Save/unsave action updates UI. ⚠️ E2E needed

### Practice

- Practice list loads. ⚠️ E2E needed
- Objective question renderer works for key question types. ⚠️ E2E needed
- Answer submission displays result. ⚠️ E2E needed
- Correct/incorrect states render. ⚠️ E2E needed
- Explanations render. ⚠️ E2E needed

### Mock Test

- Mock test list loads. ⚠️ E2E needed
- Start test creates/opens attempt. ⚠️ E2E needed
- Draft answer state is preserved during active attempt. ✅ Verified via P0
- Section submit shows loading and result/status. ⚠️ E2E needed
- Final score page hides overall score if incomplete. ✅ Verified via P0
- Final score page shows score only when backend returns complete prediction. ✅ Verified via P0

### Evaluation

- Queued/processing statuses render. ⚠️ E2E needed
- Polling stops on succeeded/failed/needs_review. ⚠️ E2E needed
- Writing feedback renders criteria and disclaimer. ✅ Verified via P0
- Speaking feedback renders transcript/pronunciation unavailable message when applicable. ✅ Verified via P0

### Admin

- Learner cannot access admin pages. ⚠️ E2E needed
- Admin can view resource list. ⚠️ E2E needed
- Resource form validates required fields. ⚠️ E2E needed
- Admin can view review list/detail. ⚠️ E2E needed
- Review warning is visible. ⚠️ E2E needed

## Manual E2E Scenarios

### Completed Scenarios
- Landing page (`tests/e2e/landing.spec.ts`) ✅ Exists
- Login page (`tests/e2e/login.spec.ts`) ✅ Exists
- Auth guard (`tests/e2e/auth-guard.spec.ts`) ✅ Exists

### Pending Scenarios (Need Environment)
1. Register → profile setup → dashboard.
2. Login → browse resources → save resource.
3. Complete vocabulary/grammar practice.
4. Complete reading/listening practice.
5. Start mock test → submit Listening/Reading.
6. Submit Writing → wait for feedback.
7. Submit Speaking text → wait for feedback.
8. Submit Speaking audio/upload if supported.
9. View final predicted score after all modules complete.
10. Admin creates/reviews/publishes a resource.
11. Learner confirms published resource appears.

## Accessibility Manual Checks

- Tab through auth forms.
- Tab through resource filters.
- Complete practice with keyboard.
- Navigate mock test sections with keyboard.
- Submit writing with keyboard.
- Start/stop speaking recording with keyboard if available.
- Confirm focus states are visible.
- Confirm color contrast is acceptable.
- Confirm status badges have text labels.

**Current Status:** Manual testing not yet performed.

## Responsive Manual Checks

Screen sizes:

- Mobile narrow.
- Mobile wide.
- Tablet.
- Laptop.
- Desktop.

Check:

- Landing page.
- Auth pages.
- Dashboard.
- Resource list/detail.
- Practice attempt.
- Reading passage layout.
- Writing textarea.
- Speaking controls.
- Score page.
- Admin resource list/form.

**Current Status:** Manual testing not yet performed.

## Regression Risks To Test Frequently

- Answer keys accidentally appearing in learner data. ✅ Verified (P0)
- Final score appearing before all modules complete. ✅ Verified (P0)
- Draft answers lost on navigation. ✅ Verified (P0)
- Audio upload failure with unclear error. ⚠️ E2E needed
- Evaluation polling running forever. ⚠️ E2E needed
- Admin pages accessible to learners. ⚠️ E2E needed
