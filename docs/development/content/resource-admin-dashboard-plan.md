# Plan: Add Resources From The Admin Dashboard (All Categories)

Last updated: 2026-05-17

## Status: Retired

This plan described the old custom Next.js resource CMS. Resource authoring has moved to Strapi Free. `/admin/resources`, `/admin/resources/new`, and `/admin/resources/[id]` now show Strapi entry panels, and editors should create/publish resources in the Strapi Resource collection.

Keep this document only as historical context for the original custom-admin implementation. The active content architecture is [`../../features_x/content_management.md`](../../features_x/content_management.md).

**Purpose:** Define how staff (`admin` / `reviewer` / `evaluator` roles) create and manage **every** learner-facing resource type from the **admin dashboard**, aligned with the Prisma `Resource` model, [`frontend/admin-ui.md`](../frontend/admin-ui.md), and [`content-strategy.md`](content-strategy.md).

**Scope note:** “Dashboard” here means the **admin app** rooted at [`/admin`](../frontend/admin-ui.md#admin-dashboard) (`/admin/resources`, `/admin/resources/new`, `/admin/resources/[id]`), not the learner `/dashboard`. Learners only **consume** published resources via existing learner APIs.

---

## 1. Resource types in the product (categories)

Historical note: this plan treated the database enum `ResourceCategory` as the authoring source of truth. New authoring uses the matching Strapi Resource `category` enum; Prisma remains fallback/runtime data.

| Enum value | Suggested UI label | Notes |
|------------|-------------------|--------|
| `basic_english` | Basic English | Short lessons, foundations. |
| `words` | Vocabulary / words | Word lists, usage examples. |
| `synonyms` | Synonyms | Register / collocation notes in body or examples. |
| `grammar` | Grammar | Rules + examples; optional mini-drills in body. |
| `reading_strategy` | Reading strategy | Skills, not full timed passages (passages may be separate content policy). |
| `listening_strategy` | Listening strategy | Scripts may later link to [`storage-and-media.md`](../backend/storage-and-media.md) assets; v1 can be text-only in `body`. |
| `writing_strategy` | Writing strategy | Task tips; task **prompts** may use same model or future `Test` content—keep prompts copyright-safe. |
| `speaking_strategy` | Speaking strategy | Cue cards / part questions as structured text or `examplesJson`. |

**Difficulty** (`basic` | `intermediate` | `advanced`) and **tags** apply to **all** categories.

**Status workflow** (all categories): `draft` → `review` → `published` (and `archived`). Only `published` appears on learner `GET /api/resources` per [`api-spec.md`](../backend/api-spec.md).

---

## 2. Target UX (admin dashboard)

### 2.1 Admin home (`/admin`)

- Summary cards: counts by **status** for resources (draft / review / published / archived), with deep links to **filtered** `/admin/resources?status=…`. **Implemented.**
- Test status cards, review queue count, validation blocker count, and recent tests/resources. **Implemented.**
- Clear entries: **“New resource”** → `/admin/resources/new`, **“New test”** → `/admin/tests/new`, all resources, tests, reviews, and learner dashboard. **Implemented.**

### 2.2 Resource list (`/admin/resources`)

- Filters: **status**, **category**, **difficulty**, **search** (title/slug).
- Columns: title, category, difficulty, status, updatedAt, actions (edit).
- Align list data with a future **`GET /api/admin/resources`** (or server-only Prisma in RSC—see §4).

### 2.3 Create / edit (`/admin/resources/new`, `/admin/resources/[id]`)

Single **category-aware** form (one page, not nine separate apps):

- **Core fields (all types):** title, slug (auto from title with manual override), category (required `<select>` with all enum values), difficulty, tags (comma-separated or chip input), body (markdown or rich text—pick one MVP convention and document it), status.
- **Examples:** structured **examples** editor backed by `examplesJson` (array of `{ label?, text }` or agreed schema); validate JSON server-side.
- **Actions:** Save draft, Submit for review, Publish, Archive—mapped to `ContentStatus` with role rules (see §5).
- **Preview (optional P1):** read-only preview matching learner detail layout (max-width, typography).

### 2.4 Category-specific help (inline)

Optional collapsible hints per category (e.g. listening: “no commercial book audio”; words: “original definitions only”) linking to [`content-strategy.md`](content-strategy.md).

Status: copyright safety warning is present on the admin home and content-strategy guidance is documented. Category-specific inline help remains optional polish.

---

## 3. Compliance and content rules (non-negotiable)

Before exposing “Publish” widely:

- Enforce **copyright policy** in copy and optional checklist acknowledgment on publish ([`content-strategy.md`](content-strategy.md), [`security-and-compliance.md`](../backend/security-and-compliance.md)).
- **LLM-assisted** content: if generated, record provenance in body or metadata when you add fields; until then, use **review** status and human review queue ([`admin-ui.md`](../frontend/admin-ui.md#review-queue)).
- **Listening** resources: when audio is added later, require **license/source metadata** on the related `MediaAsset` per [`storage-and-media.md`](../backend/storage-and-media.md)—this plan’s v1 can stay **text-only** in `Resource.body`.

---

## 4. Backend plan (admin APIs)

Today, learner routes expose only **published** resources. Admin CRUD must be **separate** and **role-protected**.

### 4.1 Recommended endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/admin/resources` | List with filters (`status`, `category`, `difficulty`, `search`, pagination). |
| `POST` | `/api/admin/resources` | Historical fallback/local create draft (return `id`, `slug`). New content is created in Strapi. |
| `GET` | `/api/admin/resources/:id` | Full resource for edit (any status). |
| `PATCH` | `/api/admin/resources/:id` | Update fields + status transitions. |
| `POST` | `/api/admin/resources/:id/publish` | Optional explicit publish with extra validation. |

**Authorization:** reuse patterns from [`security-and-compliance.md`](../backend/security-and-compliance.md)—only `admin`, `reviewer`, or `evaluator` as appropriate; narrow permissions if needed (e.g. only `admin` publishes).

**Validation:** Zod schemas mirroring Prisma types; **slug** uniqueness; **category** enum exhaustive; **examplesJson** shape validated.

### 4.2 Versioning and audit (P1 alignment)

- On meaningful updates, append **`ResourceVersion`** snapshot per [`data-model.md`](../backend/data-model.md) when stable.
- Write **`AuditLog`** entries on create/update/publish/archive per security doc.

### 4.3 Slug strategy

- Generate from title (`slugify` + uniqueness check); allow manual edit with **409** on conflict.

---

## 5. Role and workflow rules

| Action | Suggested roles |
|--------|-----------------|
| Create / edit draft | `admin`, `reviewer` (optionally `evaluator` if they author strategy content) |
| Move to `review` | Author roles |
| Approve / `publish` | `admin` or `reviewer` per product policy |
| `archive` | `admin` |

Document the matrix in code (shared constant) and in [`admin-ui.md`](../frontend/admin-ui.md).

---

## 6. Frontend implementation plan

1. **Admin layout shell** — optional shared nav (Resources / Tests / Reviews) consistent with [`admin-ui.md`](../frontend/admin-ui.md).
2. **Resource list page** — fetch admin list (RSC + server fetch to internal API or Prisma **only if** you keep queries server-side; prefer `/api/admin/resources` for one pattern with the rest of the app).
3. **Resource form** — `react-hook-form` + Zod, **`apiFetch`** + **`useMutation`**, Sonner toasts (same pattern as profile editor).
4. **Category `<select>`** — options generated from a single `RESOURCE_CATEGORIES` constant shared with the API schema so new enum values never drift.
5. **Examples editor** — start with JSON textarea + client-side validation; upgrade to structured UI later.
6. **Dashboard counts** — `GET /api/admin/stats` or include aggregate query in `/admin` server component.

---

## 7. Phased rollout

| Phase | Outcome |
|-------|---------|
| **A** | `POST/PATCH/GET` admin resource APIs + Zod + role checks; seed or manual test with admin profile. **Implemented** (`src/app/api/admin/resources/…`, `src/lib/auth/admin-api.ts`, `src/lib/validators/admin-resource.ts`). |
| **B** | `/admin/resources` list + filters + link to edit. **Implemented** (`AdminResourceList`). |
| **C** | `/admin/resources/new` + `/admin/resources/[id]` full form; all **eight** `ResourceCategory` values selectable; status transition actions. **Implemented** (`ResourceEditor`, `resource-form` validator). |
| **D** | `/admin` dashboard cards with live resource/test counts, review queue, validation blockers, recent updates, “New resource” CTA, and “New test” CTA. **Implemented** (Prisma aggregate queries on admin home + `GET /api/admin/stats` for future use). |
| **E** | ResourceVersion + AuditLog on publish/update (P1). **Implemented** for update, publish, and archive transitions. |
| **F** | Media attachment for listening-related resources (separate plan tied to storage doc). **Implemented for test Listening sections through media upload/search/attach; resource-specific media attachment remains future polish.** |

---

## 8. Testing

- **Backend:** [`../../testing-plans/backend-testing-plan.md`](../../testing-plans/backend-testing-plan.md) resources + admin sections; add cases for `403` for learner, draft hidden from learner GET, slug conflict.
- **Frontend:** [`../../testing-plans/frontend-testing-plan.md`](../../testing-plans/frontend-testing-plan.md) admin flows; **security:** [`../../testing-plans/security-and-compliance-testing-plan.md`](../../testing-plans/security-and-compliance-testing-plan.md) role gates.
- **Manual:** create one resource per **category**, run through draft → review → publish, confirm learner library shows only published.

---

## 9. Doc updates after implementation

- [`development-plan.md`](../development-plan.md) — mark resource admin / APIs done.
- [`backend/README.md`](../backend/README.md) — extend “Implemented HTTP APIs” table.
- [`api-spec.md`](../backend/api-spec.md) — promote admin resource endpoints from “later” to concrete contracts.

---

## 10. Out of scope (for this plan)

- **Tests** and **mock exams** as `Test` entities (covered by test admin routes).
- Test CMS status note: mock-test authoring now includes wizard setup, Reading/Listening quick authoring, groups, structured scoring, source highlighting, validation, preview, review, publish, version snapshots, and duplicate-as-draft. See [`content-management-system-implementation-plan.md`](content-management-system-implementation-plan.md).
- **Learner “saved resources”** (`POST /api/resources/:id/save`) — separate persistence; can proceed in parallel once a join model exists.
- Full **WYSIWYG** or **MDX** pipeline—pick minimal MVP in Phase C and iterate.
