# DOshomik IELTS MVP Development Workplan — 8 Weeks

## Summary

Build the full DOshomik IELTS learner MVP in 8 weeks as a solo-developer project using the approved full-stack plan.

Core stack:

- Frontend: Next.js App Router, Tailwind CSS, in-house UI primitives, responsive web.
- Backend: Next.js route handlers.
- Auth: Supabase Auth.
- Database: Supabase Postgres with Prisma ORM.
- Storage: Supabase Storage.
- Async jobs: Redis + BullMQ.
- AI: configurable LLM/transcription service layer.
- Content: Strapi-authored original, licensed, public-domain-valid, or internally generated only.

MVP outcome: learners can register/login, browse resources, practice IELTS modules, take a mock test, receive reading/listening scores, submit writing/speaking responses, receive LLM feedback, and get an unofficial overall score prediction after completing all four modules.

Frontend scope includes learner flows plus app admin screens for reviews/operations and Strapi entry panels for resource/test authoring.

---

## Frontend And Backend Documentation Map

This workplan is implemented using the detailed documentation folders:

### Frontend Docs

- [`frontend/README.md`](frontend/README.md) — frontend overview and priorities.
- [`frontend/routes-and-navigation.md`](frontend/routes-and-navigation.md) — route groups, protection, and navigation safety.
- [`frontend/ui-system.md`](frontend/ui-system.md) — Tailwind UI system, in-house primitives, and shared components.
- [`frontend/screens-and-flows.md`](frontend/screens-and-flows.md) — learner/admin screens and flows.
- [`frontend/state-and-api-integration.md`](frontend/state-and-api-integration.md) — API client, state, polling, and sensitive-data rules.
- [`frontend/mock-test-ui.md`](frontend/mock-test-ui.md) — mock test UI, question renderer, draft safety, and score gating.
- [`frontend/writing-speaking-ui.md`](frontend/writing-speaking-ui.md) — Writing/Speaking response, audio, and feedback UI.
- [`frontend/admin-ui.md`](frontend/admin-ui.md) — basic admin screens and content warnings.
- [`frontend/accessibility-responsive.md`](frontend/accessibility-responsive.md) — accessibility and responsive rules.
- [`../testing-plans/frontend-testing-plan.md`](../testing-plans/frontend-testing-plan.md) — frontend QA plan.

### Backend Docs

- [`backend/README.md`](backend/README.md) — backend overview and priorities.
- [`backend/setup-and-env.md`](backend/setup-and-env.md) — services, env vars, Prisma, storage, and deployment.
- [`backend/data-model.md`](backend/data-model.md) — database entities and relationships.
- [`backend/api-spec.md`](backend/api-spec.md) — API contracts.
- [`backend/evaluation-and-scoring.md`](backend/evaluation-and-scoring.md) — scoring and evaluation rules.
- [`backend/storage-and-media.md`](backend/storage-and-media.md) — Supabase Storage and media rules.
- [`backend/background-jobs.md`](backend/background-jobs.md) — BullMQ queues and job lifecycle.
- [`backend/security-and-compliance.md`](backend/security-and-compliance.md) — auth, roles, rate limits, compliance, and audit logs.
- [`../testing-plans/backend-testing-plan.md`](../testing-plans/backend-testing-plan.md) — backend QA plan.

---

## Frontend Route Map

Recommended routes are defined in detail in [`frontend/routes-and-navigation.md`](frontend/routes-and-navigation.md).

Core route groups:

- Public/auth: `/`, `/login`, `/register`, `/reset-password`.
- Learner: `/dashboard`, `/profile`, `/resources`, `/practice`, `/mock-tests`, `/attempts/[id]`, `/evaluations/[id]`.
- Admin: `/admin`, `/admin/resources` and `/admin/tests` Strapi entry panels, `/admin/reviews`.

Use protected layouts for learner/admin sections. Learner screens must never expose answer keys.


## Shared Frontend UI Foundation

Use Tailwind CSS plus the repo's in-house UI primitives for:

- Buttons, inputs, textareas, cards, badges, skeletons, and state components; add selects, dialogs, tabs, and tables as needed.
- Progress indicators, toasts, skeletons, alerts, empty states, and error states.

Shared components:

- `PublicHeader`
- `LearnerHeader`
- `DashboardLayout`
- `AdminLayout`
- `SidebarNav`
- `PageHeader`
- `LoadingState`
- `EmptyState`
- `ErrorState`
- `ScoreBadge`
- `ModuleProgressCard`
- `EvaluationStatusBadge`

Responsive rules:

- Mock test pages are desktop/tablet optimized.
- Resources and practice pages work well on mobile.
- Long test pages use sticky navigation.
- Audio controls, forms, and status messages must be keyboard accessible.

---

## Week 1 — Project Foundation + Infrastructure

### Goals

Set up the full-stack app foundation, database, auth, storage, UI system, and local development workflow.

Reference docs: [`backend/setup-and-env.md`](backend/setup-and-env.md), [`frontend/routes-and-navigation.md`](frontend/routes-and-navigation.md), [`frontend/ui-system.md`](frontend/ui-system.md).

### Backend Tasks

- Initialize Next.js project structure with route handlers.
- Configure TypeScript, linting, formatting, environment handling, and app routing.
- Set up Supabase project:
  - Auth
  - Postgres
  - Storage buckets
- Configure Prisma:
  - Database connection
  - Initial schema
  - Migration workflow
- Set up Redis and BullMQ worker process.
- Create backend utilities:
  - Supabase server client
  - Auth/session resolver
  - Role guard
  - API response envelope
  - Error helper
  - Rate-limit helper placeholder
- Add `/api/health`.

### Frontend Tasks

- Configure Tailwind CSS and the repo's in-house UI primitives.
- Create base layouts:
  - Public layout
  - Learner dashboard layout
  - Admin layout placeholder
- Create shared UI components:
  - Page header
  - Loading state
  - Empty state
  - Error state
  - Toast/message pattern
- Build page skeletons:
  - Landing page placeholder
  - Login/register placeholders
  - Dashboard shell

### Content Tasks

- Define seed content format for resources, questions, answer keys, and explanations.
- Prepare initial content checklist with copyright-safe rules.

### Deliverables

- Running local app.
- Connected Supabase Auth/Postgres/Storage.
- Prisma migration working.
- Redis worker starts successfully.
- Tailwind plus in-house UI primitives ready.
- Base layouts and health route working.

### Acceptance Criteria

- Developer can run app locally.
- Developer can run Prisma migration.
- Developer can start worker process.
- `/api/health` returns success.
- Public, learner header, and admin shells render.

---

## Week 2 — Auth, Profile, Roles, and Dashboard Base

### Goals

Complete learner authentication, route protection, profile management, and dashboard foundation.

Reference docs: [`backend/api-spec.md`](backend/api-spec.md), [`backend/security-and-compliance.md`](backend/security-and-compliance.md), [`frontend/screens-and-flows.md`](frontend/screens-and-flows.md), [`frontend/state-and-api-integration.md`](frontend/state-and-api-integration.md).

### Backend Tasks

- Implement Supabase Auth session validation.
- Implement profile model and APIs:
  - `GET /api/me`
  - `PATCH /api/profile`
  - `GET /api/profile/progress`
  - `GET /api/profile/attempts`
- Add role model:
  - `learner`
  - `admin`
  - `reviewer`
  - `evaluator`
- Add audit log foundation for role/content-sensitive actions.

### Frontend Tasks

- Complete auth pages:
  - Register
  - Login
  - Logout
  - Reset password/magic link if supported
- Add protected route behavior:
  - Logged-out users redirected from learner/admin pages.
  - Logged-in users redirected away from login/register.
- Build profile page with fields:
  - Name
  - Email readonly if auth-managed
  - Target band
  - Exam date
  - Native language
  - Study goal
- Build dashboard with:
  - Profile summary
  - Target band
  - Exam date
  - Latest score placeholder
  - Module cards placeholder
  - Recent attempts placeholder
  - Saved resources placeholder
- Add loading, empty, and error states.

### Content Tasks

- Draft first Basic English/resource entries.
- Draft vocabulary/synonym/grammar seed data.

### Deliverables

- User can register, login, logout.
- User can view and update profile.
- Protected frontend routes work.
- Dashboard shell shows real profile/progress data where available.

### Acceptance Criteria

- Unauthenticated user cannot access dashboard or admin.
- Authenticated user can update profile fields.
- User cannot access another user’s profile data.
- Roles are stored and enforceable.
- Auth and profile errors are displayed clearly.

---

## Week 3 — Resource Library + Basic Admin Resource Screens

### Goals

Build the text resource library and basic admin screens for resource creation/review.

Reference docs: [`backend/data-model.md`](backend/data-model.md), [`backend/api-spec.md`](backend/api-spec.md), [`frontend/screens-and-flows.md`](frontend/screens-and-flows.md), [`frontend/admin-ui.md`](frontend/admin-ui.md).

### Backend Tasks

- Implement resource data models:
  - `Resource`
  - `ResourceVersion`
  - `VocabularyEntry`
  - `SynonymGroup`
  - `GrammarRule`
- Implement learner resource APIs:
  - `GET /api/resources`
  - `GET /api/resources/:id`
  - `POST /api/resources/:id/save`
- Configure Strapi resource authoring:
  - Resource content type
  - publish/unpublish workflow
  - app read token

### Frontend Tasks

- Build resource list page:
  - Category filter
  - Difficulty filter
  - Search
  - Tags
  - Saved state
- Build resource detail page:
  - Formatted long text
  - Examples
  - Tags
  - Save/unsave action
  - Related practice CTA
- Build app admin resource entry panel:
  - Open Strapi Resource collection
  - Explain Strapi is the authoring source
  - Keep copyright/content safety guidance visible in Strapi/editor process docs

### Content Tasks

Create and seed:

- 10 Basic English lessons
- 30 vocabulary entries
- 20 synonym groups
- 10 grammar rules

### Deliverables

- Learners can browse, filter, view, and save resources.
- Admin can manage basic resources or use temporary seeded/static resource workflow if admin APIs are not ready.
- Seed resources are available.

### Acceptance Criteria

- Published resources appear in learner UI.
- Draft/review/archived resources do not appear in learner UI.
- Saved resources appear in dashboard/profile progress.
- Admin resource forms validate required fields.
- No copyrighted Cambridge/commercial content is stored.

---

## Week 4 — Practice Engine: Vocabulary, Grammar, Reading, Listening

### Goals

Implement focused practice attempts, objective scoring, and practice UI.

Reference docs: [`backend/evaluation-and-scoring.md`](backend/evaluation-and-scoring.md), [`frontend/screens-and-flows.md`](frontend/screens-and-flows.md), [`frontend/state-and-api-integration.md`](frontend/state-and-api-integration.md).

### Backend Tasks

- Implement practice-related models:
  - `PracticeAttempt`
  - `Question`
  - `AnswerKey`
  - `AttemptAnswer`
- Implement practice APIs:
  - `GET /api/practice`
  - `POST /api/practice/:id/attempt`
  - `GET /api/practice/attempts`
- Build answer normalization utility:
  - Trim whitespace
  - Lowercase where appropriate
  - Collapse repeated spaces
  - Match accepted alternatives
- Implement objective scoring for:
  - Vocabulary quiz
  - Synonym matching
  - Grammar correction
  - Reading question set
  - Listening question set
- Add Supabase Storage metadata support for listening audio.

### Frontend Tasks

- Build practice list page:
  - Type filter
  - Category filter
  - Difficulty filter
- Build objective practice attempt renderer for:
  - Multiple choice
  - Matching
  - Short answer
  - Grammar correction
  - Reading question set
  - Listening question set with audio controls
- Build practice result page:
  - Correct/incorrect answers
  - Score
  - Explanations
  - Retry/next practice CTA
- Save answer state locally while attempting.
- Show async evaluation status placeholder for future writing/speaking practice.

### Content Tasks

Create and seed:

- 20 vocabulary questions
- 20 grammar questions
- 2 original reading passages
- 2 original listening scripts with safe audio metadata

### Deliverables

- Learners can complete objective practice.
- Reading/listening practice is scored.
- Feedback and explanations are shown.

### Acceptance Criteria

- Correct answers are scored accurately.
- Accepted alternatives work.
- Practice attempts are stored.
- Learner can view practice history.
- Listening content has source/license metadata.
- Audio controls are keyboard accessible.

---

## Week 5 — Mock Test Engine + Mock Test UI

### Goals

Build the mock test flow across listening, reading, writing, and speaking.

Reference docs: [`backend/api-spec.md`](backend/api-spec.md), [`backend/evaluation-and-scoring.md`](backend/evaluation-and-scoring.md), [`frontend/mock-test-ui.md`](frontend/mock-test-ui.md).

### Backend Tasks

- Implement mock test models:
  - `Test`
  - `TestSection`
  - `Passage`
  - `ListeningScript`
  - `MockTestAttempt`
  - `ModuleScore`
- Implement mock test APIs:
  - `GET /api/mock-tests`
  - `GET /api/mock-tests/:id`
  - `POST /api/mock-tests/:id/start`
  - `POST /api/attempts/:attemptId/answers`
  - `POST /api/attempts/:attemptId/submit-section`
  - `GET /api/attempts/:attemptId`
- Implement immediate scoring for listening and reading sections.
- Ensure learner APIs never expose answer keys.

### Frontend Tasks

- Build mock test list page.
- Build mock test overview page:
  - Sections
  - Duration
  - Instructions
  - Start CTA
- Build active attempt page:
  - Section navigation
  - Instructions
  - Draft saving
  - Submit section
  - Unsaved-answer navigation warning
  - Submitted/evaluating/completed status display
- Build section UIs:
  - Listening with audio controls and questions
  - Reading with passage + questions layout
  - Writing Task 1/Task 2 prompt + textarea placeholder
  - Speaking Part 1/2/3 prompt placeholder
- Build attempt status page.
- Build reading/listening result display after submission.

### Content Tasks

Create one short mock test seed:

- Listening section
- Reading section
- Writing Task 1
- Writing Task 2
- Speaking Part 1
- Speaking Part 2
- Speaking Part 3

### Deliverables

- Learner can start and complete mock test sections.
- Reading/listening mock sections are scored.
- Writing/speaking submissions are stored for evaluation.

### Acceptance Criteria

- User cannot access another user’s attempt.
- Answer keys are not returned to frontend.
- Attempt status accurately tracks incomplete/submitted/evaluating/completed sections.
- Full score prediction is blocked while any module is incomplete.
- Frontend does not show final score before all module bands exist.

---

## Week 6 — Writing/Speaking Evaluation + Media Upload UI

### Goals

Add async LLM evaluation for writing/speaking and speaking audio upload/recording support.

Reference docs: [`backend/background-jobs.md`](backend/background-jobs.md), [`backend/storage-and-media.md`](backend/storage-and-media.md), [`frontend/writing-speaking-ui.md`](frontend/writing-speaking-ui.md), [`frontend/state-and-api-integration.md`](frontend/state-and-api-integration.md).

### Backend Tasks

- Implement media models and APIs:
  - `MediaAsset`
  - `POST /api/media/upload-url`
  - `GET /api/media/:assetId/download-url`
- Configure Supabase Storage buckets:
  - `listening-audio`
  - `speaking-recordings`
  - `generated-audio`
  - `reports`
- Validate uploads:
  - File type
  - File size
  - Duration metadata where possible
- Implement job models and queues:
  - `LlmJob`
  - `writing-evaluation`
  - `speaking-transcription`
  - `speaking-evaluation`
- Implement writing evaluation:
  - Word count validation
  - Prompt relevance check
  - LLM rubric evaluation
  - Structured JSON result storage
- Implement speaking evaluation:
  - Text response path
  - Audio upload path
  - Optional transcription path
  - LLM rubric evaluation
  - Pronunciation marked unavailable unless audio analysis exists

### Frontend Tasks

- Build writing UI:
  - Prompt display
  - Task type label
  - Textarea
  - Live word count
  - Save draft
  - Submit
  - Evaluation status
- Build speaking UI:
  - Prompt display
  - Text response option
  - Audio recording/upload option
  - Recording timer
  - Playback before submit
  - Upload progress
- Implement signed media upload flow.
- Build evaluation polling:
  - Pending
  - Processing
  - Completed
  - Failed
  - Needs review
- Build feedback UI:
  - Estimated band
  - Criterion scores
  - Strengths
  - Weaknesses/issues
  - Improved examples/sample answer
  - Transcript if available
  - Pronunciation unavailable notice when not scored
  - Next improvement task/drill
  - Unofficial estimate disclaimer

### Content Tasks

- Add 5 writing prompts.
- Add 10 speaking questions/cue cards.
- Review mock writing/speaking prompts for IELTS-style originality.

### Deliverables

- Writing submissions receive async feedback.
- Speaking text/audio submissions receive async feedback.
- Media uploads use signed URLs.
- Evaluation results are stored and visible.

### Acceptance Criteria

- Long-running LLM calls do not block submission response.
- Failed jobs are visible and retryable by backend logic.
- Learner recordings are private.
- Empty writing/speaking responses cannot be submitted.
- Pronunciation score is not shown unless supported.
- LLM provider is configurable, not hardcoded into route logic.

---

## Week 7 — Score Prediction, Progress, Strapi Test Authoring, Review Screens, and Polish

### Goals

Complete full score prediction, learner progress, Strapi test authoring entry points, basic review screens, and compliance safeguards.

Reference docs: [`backend/evaluation-and-scoring.md`](backend/evaluation-and-scoring.md), [`backend/security-and-compliance.md`](backend/security-and-compliance.md), [`frontend/admin-ui.md`](frontend/admin-ui.md), [`frontend/mock-test-ui.md`](frontend/mock-test-ui.md).

### Backend Tasks

- Implement score prediction model and logic:
  - `ScorePrediction`
  - Average four module bands
  - Round to nearest 0.5
  - Confidence: low/medium/high
  - Unofficial score disclaimer
- Implement score APIs:
  - `POST /api/attempts/:attemptId/predict-score`
  - `GET /api/attempts/:attemptId/score`
- Add basic admin/reviewer protection foundation:
  - Role guard
  - Audit logs
  - Admin route/API placeholders or minimal CRUD
- Add content safety checks:
  - Require source/license metadata for listening audio
  - Prevent learner-visible draft content
  - Add external study record support without storing copied material

### Frontend Tasks

- Build score result page:
  - Listening band
  - Reading band
  - Writing band
  - Speaking band
  - Overall predicted band
  - Confidence
  - Disclaimer
  - Module feedback links
  - Suggested next actions
- Update dashboard:
  - Latest predicted score
  - Module band history/cards
  - Attempt history
  - Saved resources
  - Continue practice/start mock CTA
- Configure Strapi mock-test authoring:
  - Mock Test, Section, Question Group, and Question content types
  - answer keys and explanations
  - media attachment
  - publish/unpublish workflow
- Build basic review queue:
  - Items in review
  - Detail view
  - Approve/publish
  - Reject/archive with note
  - Copyright/content safety warning
- Add responsive polish to resource, practice, mock test, and feedback screens.

### Content Tasks

Add MVP content volume:

- 20 more vocabulary items
- 10 more grammar drills
- 1 additional reading practice
- 1 additional listening practice
- 5 more writing prompts
- 10 more speaking prompts

### Deliverables

- Full mock test generates score prediction after all modules complete.
- Dashboard shows meaningful learner progress.
- Strapi test authoring and app review screens exist.
- Copyright/compliance rules are visible in admin and enforced in backend where possible.

### Acceptance Criteria

- Score prediction does not appear before all modules are complete.
- Overall score is rounded to nearest half band.
- Disclaimer is always shown.
- Learner progress page reflects latest attempts and scores.
- Admin/reviewer routes are protected.
- External Cambridge/book progress can be stored only as a label/note, not content.

---

## Week 8 — QA, Accessibility, Bug Fixes, Deployment, and MVP Launch Prep

### Goals

Stabilize the MVP and prepare for staging/production launch.

Reference docs: [`../testing-plans/backend-testing-plan.md`](../testing-plans/backend-testing-plan.md), [`../testing-plans/frontend-testing-plan.md`](../testing-plans/frontend-testing-plan.md), [`frontend/accessibility-responsive.md`](frontend/accessibility-responsive.md).

### Backend Tasks

- Complete test coverage for:
  - Auth/session protection
  - Profile APIs
  - Resource visibility
  - Practice scoring
  - Mock test attempt flow
  - Reading/listening answer normalization
  - Writing/speaking job creation
  - Score prediction blocking/completion
  - Media signed URLs
  - Role protection
- Configure staging environment:
  - Supabase staging project
  - Redis
  - Storage buckets
  - LLM/transcription keys
  - Environment variables
- Configure production checklist:
  - Database backups
  - Private storage buckets
  - Rate limits
  - Error logging
  - Basic monitoring

### Frontend Tasks

- Complete UI test coverage for:
  - Auth redirects
  - Profile form validation
  - Resource filtering and saved state
  - Practice answer submission
  - Objective result display
  - Mock test start and section submit
  - Evaluation pending/completed/failed states
  - Score hidden until full completion
  - Admin route protection
- Run responsive pass:
  - Mobile resource/practice pages
  - Tablet/desktop mock test pages
  - Audio controls
  - Long feedback pages
- Run accessibility pass:
  - Keyboard navigation
  - Focus states
  - Form labels/errors
  - Color contrast
  - Screen-reader friendly status messages
- Fix critical and high-priority bugs.
- Validate staging deployment.

### Content Tasks

- Create final seed dataset for launch.
- Review all content for originality, answer keys, explanations, difficulty, and status.
- Confirm no copied Cambridge/commercial IELTS content exists.

### Documentation Tasks

- Update README with run/deploy instructions.
- Confirm backend, frontend, and MVP docs match final implementation choices.

### Deliverables

- MVP deployed to staging.
- Production deployment checklist complete.
- Critical learner/admin flows tested.
- Launch-ready seed content loaded.

### Acceptance Criteria

- New learner can complete the full MVP journey.
- Admin can create/review/publish basic resource/test content in Strapi and access it from the learner app.
- No answer keys leak to frontend.
- Private media is not publicly accessible.
- Async evaluation works end-to-end.
- Score prediction works only after full completion.
- App contains no copied copyrighted IELTS book content.

---

## Cross-Week Content Work

Because the product depends on original content, content creation should run every week.

### Minimum MVP Seed Target

- 30 Basic English/resource lessons
- 50 vocabulary entries
- 30 synonym groups
- 20 grammar rules/drills
- 3 reading passages
- 3 listening scripts with safe audio metadata
- 10 writing prompts
- 20 speaking questions/cue cards
- 1 complete short mock test
- 1 complete full mock test if time permits

### Content Rules

- Must be original or properly licensed.
- Must include answer keys where applicable.
- Must include explanations.
- Must include difficulty level.
- Must include review status.
- Must not copy Cambridge/commercial book passages, questions, audio, scans, PDFs, or explanations.

---

## API Integration Checklist For Frontend

Detailed API/state rules are in [`frontend/state-and-api-integration.md`](frontend/state-and-api-integration.md) and backend endpoint contracts are in [`backend/api-spec.md`](backend/api-spec.md).


Frontend should integrate the following backend APIs through a shared API client:

- `GET /api/me`
- `PATCH /api/profile`
- `GET /api/profile/progress`
- `GET /api/profile/attempts`
- `GET /api/resources`
- `GET /api/resources/:id`
- `POST /api/resources/:id/save`
- `GET /api/practice`
- `POST /api/practice/:id/attempt`
- `GET /api/practice/attempts`
- `GET /api/mock-tests`
- `GET /api/mock-tests/:id`
- `POST /api/mock-tests/:id/start`
- `POST /api/attempts/:attemptId/answers`
- `POST /api/attempts/:attemptId/submit-section`
- `GET /api/attempts/:attemptId`
- `GET /api/attempts/:attemptId/score`
- `GET /api/evaluations/:jobId`
- `POST /api/media/upload-url`
- `GET /api/media/:assetId/download-url`

API client responsibilities:

- Auth/session-aware requests
- Response envelope handling
- Error normalization
- Toast/error display
- Loading states
- Polling for async evaluation status

---

## Testing Plan

Use detailed QA checklists in [`../testing-plans/backend-testing-plan.md`](../testing-plans/backend-testing-plan.md) and [`../testing-plans/frontend-testing-plan.md`](../testing-plans/frontend-testing-plan.md).


### Automated Backend Tests

- Authenticated/unauthenticated API access.
- Profile update and ownership checks.
- Published-only resource visibility.
- Practice scoring and accepted answers.
- Mock test section submission.
- Reading/listening scoring.
- Writing/speaking job creation.
- Score prediction completion rules.
- Signed media URL permission checks.
- Role-based route protection.

### Automated Frontend/UI Tests

- Auth redirects.
- Profile form validation.
- Resource filtering and saved state.
- Practice answer submission.
- Objective result display.
- Mock test start and section submit.
- Evaluation pending/completed/failed states.
- Score hidden until full completion.
- Admin route protection.

### Manual End-to-End Tests

- Register → profile setup → dashboard.
- Browse resources → save resource.
- Complete vocabulary/grammar practice.
- Complete reading/listening practice.
- Start mock test → submit all sections.
- Submit writing → wait for feedback.
- Submit speaking text/audio → wait for feedback.
- View final predicted score.
- Admin creates/reviews/publishes a resource in Strapi.
- Learner confirms published Strapi resource appears.
- Failed evaluation job behavior.

### Accessibility Checks

- Keyboard navigation.
- Visible focus states.
- Form labels and errors.
- Sufficient color contrast.
- Screen-reader friendly status messages.
- Audio controls accessible by keyboard.

---

## Assumptions

- Timeline is 8 weeks.
- Team is one solo developer.
- Scope is full MVP product, not backend-only.
- Frontend uses Next.js App Router.
- UI stack is Tailwind CSS plus in-house primitives.
- MVP is responsive web, not native mobile.
- Learner frontend plus basic admin screens are included.
- Admin CRUD is minimal for V1; seeded/manual content remains acceptable if needed.
- Payment/subscription is out of scope.
- Live human examiner marketplace is out of scope.
- Official IELTS score guarantee is out of scope.
- Supabase is used for Auth, Postgres, and Storage.
- Prisma is used for database schema and migrations.
- BullMQ + Redis handles async jobs.
- LLM and transcription providers remain configurable.
- Async evaluation uses polling in MVP.
- All score displays must clearly say they are unofficial estimates.
- Frontend must never expose answer keys in learner screens.
