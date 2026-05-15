# Frontend Routes And Navigation

## Route Groups

Recommended Next.js App Router route groups:

```text
app/
  (public)/
  (auth)/
  (learner)/
  (admin)/
```

Purpose:

- `(public)` contains marketing/public pages.
- `(auth)` contains login/register/reset pages.
- `(learner)` contains protected learner app pages.
- `(admin)` contains protected role-based admin pages.

## Public Routes

| Route | Purpose |
|---|---|
| `/` | Landing page and product CTA. |
| `/changelog` | Product changelog and update history. |
| `/login` | Login page. |
| `/register` | Registration page. |
| `/reset-password` | Password reset or magic-link flow. |

## Learner Routes

| Route | Purpose |
|---|---|
| `/welcome` | Onboarding/welcome page for new users. |
| `/dashboard` | Learner overview, progress, saved resources, recent attempts, streak, achievements. |
| `/profile` | Learner profile settings. |
| `/resources` | Resource library with filters/search and save button. |
| `/resources/[id]` | Resource detail page. |
| `/flashcards` | Flashcard deck list with category filters. |
| `/flashcards/[id]` | Flashcard deck detail. |
| `/flashcards/[id]/study` | SM-2 study session with flip cards and quality rating. |
| `/practice` | Practice list. |
| `/practice/[id]` | Practice attempt page. |
| `/practice/[id]/result` | Practice result page. |
| `/mock-tests` | Published mock test list. |
| `/mock-tests/[id]` | Mock test overview/start page. |
| `/attempts/[id]` | Active or submitted mock attempt page with per-section timer and writing editor. |
| `/attempts/[id]/score` | Module scores and final prediction page. |
| `/attempts/[id]/report` | Detailed attempt report with section results. |
| `/evaluations/[id]` | Writing/Speaking evaluation status and result detail. |
| `/referrals` | Referral program with code generation and credit balance. |

## Admin Routes

| Route | Purpose |
|---|---|
| `/admin` | Admin dashboard with stats. |
| `/admin/resources` | Resource list and status filters. |
| `/admin/resources/new` | Create resource. |
| `/admin/resources/[id]` | Edit resource. |
| `/admin/tests` | Test list. |
| `/admin/tests/new` | Create test metadata. |
| `/admin/tests/[id]` | Edit test metadata and sections. |
| `/admin/tests/[id]/builder` | Visual test builder with section editors, question groups, media picker. |
| `/admin/tests/[id]/preview` | Preview test as learner would see it. |
| `/admin/flashcards` | Flashcard deck list with create/delete. |
| `/admin/flashcards/[id]` | Deck editor with inline card CRUD. |
| `/admin/reviews` | Review queue (content, writing, speaking). |
| `/admin/reviews/[id]` | Review detail and actions. |

## Route Protection

Learner routes require:

- Authenticated Supabase session.
- Existing app profile.

Admin routes require:

- Authenticated Supabase session.
- Role: `admin`, `reviewer`, or relevant allowed role.

**Implementation note (current repo):** `middleware.ts` enforces **authentication** for `/admin` prefixes (and other learner prefixes). **`src/app/(admin)/layout.tsx`** enforces **authorization**: only profiles whose `Role` rows include `admin`, `reviewer`, or `evaluator` may render admin UI; others are redirected to `/dashboard`. Unauthenticated users hitting `/admin` are redirected to `/login?next=/admin`.

Redirect rules:

- Logged-out user visiting learner/admin pages → `/login`.
- Logged-in user visiting `/login` or `/register` → `/dashboard`.
- Authenticated learner without admin role visiting `/admin/*` → dashboard or forbidden page.

## Navigation Structure

### Public Navigation

- Home
- Changelog
- Resources preview or features
- Login
- Register/Get started

### Learner Sidebar / Header

- Dashboard
- Resources
- Flash Cards
- Practice
- Mock Tests
- Attempts/History
- Referrals
- Profile
- Logout

### Admin Sidebar

- Admin Dashboard
- Resources
- Tests
- Flash Cards
- Reviews
- Back to learner app

## Breadcrumbs

Use breadcrumbs for deep pages:

- Resources → Resource title
- Practice → Practice title
- Mock Tests → Test title → Attempt
- Admin → Resources → Edit resource
- Admin → Tests → Edit test

## Navigation Safety

Active attempt pages must warn before leaving if there are unsaved answers.

Recommended behavior:

- Autosave draft if backend supports it.
- Keep local draft state while the page is open.
- Show browser navigation warning for unsaved changes.
- Show clear submitted/locked state after section submission.
