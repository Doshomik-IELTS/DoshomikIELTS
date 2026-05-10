# Security And Compliance Testing Plan

**Purpose:** Executable checklist for verifying that IELTS++ meets [`../development/backend/security-and-compliance.md`](../development/backend/security-and-compliance.md) and related media rules in [`../development/backend/storage-and-media.md`](../development/backend/storage-and-media.md). Use for manual QA, targeted automation, and periodic security reviews.

**Out of scope here:** Full penetration test report format, SOC2 evidence packs, and vendor questionnaires—this document stays aligned with the MVP spec and testable behaviors.

---

## Current Implementation Status

**TypeScript, Lint, Build:** ✅ All passing
**P0 Tests:** ✅ 12/12 passing

### Verified Security Controls (P0)

| Test ID | Control | Status |
|---------|---------|--------|
| SEC-AUTHZ-06 | Answer keys excluded from learner payloads | ✅ P0 Verified |
| SEC-MEDIA-06 | Media download requires ownership | ✅ P0 Verified |
| SEC-SCORE-01 | Score gating (all modules required) | ✅ P0 Verified |
| SEC-SCORE-02 | Disclaimer in prediction response | ✅ P0 Verified |

---

## How to use this plan

| Layer | Suggested approach |
|--------|-------------------|
| **CI / automated** | API tests with valid/invalid tokens, role fixtures, and response assertions (`401` / `403` / `429`). |
| **Manual / staging** | Walk through sections in order before releases; record pass/fail in your tracker. |
| **Periodic** | Re-run §Rate limiting, §Media, and §Dependency & config after major dependency upgrades or infra changes. |

**Normative references:** [`security-and-compliance.md`](../development/backend/security-and-compliance.md), [`storage-and-media.md`](../development/backend/storage-and-media.md), [`content-strategy.md`](../content-strategy.md) (copyright and content rules).

---

## 1. Authentication

| ID | Test | Expected | Status |
|----|------|----------|--------|
| SEC-AUTH-01 | Call a protected learner API with no `Authorization` / session cookie (per app pattern). | `401`; no body fields that leak internal errors or stack traces. | ⚠️ Needs manual/E2E |
| SEC-AUTH-02 | Call with expired or malformed token. | `401`; consistent error envelope per API spec. | ⚠️ Needs manual/E2E |
| SEC-AUTH-03 | Call with valid session after user deleted or disabled (if applicable). | `401` or `403` per product rules; no partial data. | ⚠️ Needs manual/E2E |
| SEC-AUTH-04 | Dev-auth bypass (if any) is **disabled** in staging/production. | No login without real Supabase session in non-dev environments. | ⚠️ Config check |

**Implementation Note:** Supabase Auth used; dev-auth available in development only.

---

## 2. Authorization and IDOR

| ID | Test | Expected | Status |
|----|------|----------|--------|
| SEC-AUTHZ-01 | Learner A reads learner B's profile (`GET` / `PATCH` paths). | `403` or `404` (consistent policy); no other user's PII. | ✅ API implemented |
| SEC-AUTHZ-02 | Learner A accesses attempt, draft answers, or score for attempt owned by B. | `403` / `404`; never return B's answers or keys. | ✅ API implemented |
| SEC-AUTHZ-03 | Learner A requests signed download URL for B's `mediaAssetId`. | Denied; no URL issued. | ✅ P0 Verified |
| SEC-AUTHZ-04 | Learner calls admin-only API (resource publish, user role change, review queue). | `403`. | ✅ API implemented |
| SEC-AUTHZ-05 | Reviewer without `admin` accesses admin-only destructive action (if split). | `403` unless spec allows. | ✅ API implemented |
| SEC-AUTHZ-06 | **Answer keys:** learner test payload, practice result, and evaluation "correct answer" fields never include key material. | Automated grep / contract test on sample payloads; manual spot-check new endpoints. | ✅ P0 Verified |

**Roles under test:** `learner`, `admin`, `reviewer`, `evaluator` as defined in the security doc.

---

## 3. Rate limiting and abuse resistance

| ID | Test | Expected | Status |
|----|------|----------|--------|
| SEC-RATE-01 | Burst requests to auth-sensitive endpoint (login, password reset request, session refresh if applicable). | `429` after threshold; `Retry-After` or documented header if implemented. | ⚠️ Not implemented |
| SEC-RATE-02 | Burst submissions to practice/mock answer or section submit endpoints. | `429`; no duplicate scoring side effects beyond idempotent design. | ⚠️ Not implemented |
| SEC-RATE-03 | Burst signed **upload** URL minting. | `429`; no unbounded storage path creation. | ⚠️ Not implemented |
| SEC-RATE-04 | Burst LLM evaluation or transcription **creation** requests. | Stricter limit hits `429`; cost-heavy path protected. | ⚠️ Not implemented |
| SEC-RATE-05 | Burst score prediction refresh. | `429`. | ⚠️ Not implemented |

**Edge cases:** same user from two clients; verify limits apply per identity (and IP if documented).

**Implementation Note:** Rate limiting not currently implemented. Consider adding via Upstash Redis or similar.

---

## 4. Media and storage security

| ID | Test | Expected | Status |
|----|------|----------|--------|
| SEC-MEDIA-01 | Buckets for learner content are **not** public-read in Supabase dashboard/config. | Private; access only via signed URLs. | ⚠️ Config check |
| SEC-MEDIA-02 | Signed upload URL: reject wrong content type for speaking (e.g. `application/pdf` when only audio allowed). | `400` / `422`; no upload path leaked for wrong type. | ✅ API implemented |
| SEC-MEDIA-03 | Signed upload URL: reject oversize file per env max. | Rejected at API or storage policy; error is clear, no internal path exposure. | ✅ API implemented |
| SEC-MEDIA-04 | Signed upload URL: reject over-duration audio if enforced. | Rejected per spec. | ⚠️ Not implemented |
| SEC-MEDIA-05 | Download URL: TTL is short-lived; URL expires and cannot be reused indefinitely. | After expiry, access fails. | ✅ API implemented |
| SEC-MEDIA-06 | Request download for asset not owned by caller (and not admin). | `403` / `404`. | ✅ P0 Verified |
| SEC-MEDIA-07 | **No permanent public URLs** for learner recordings in API responses or emails. | Audit responses and templates. | ✅ API returns signed URLs |
| SEC-MEDIA-08 | Abandoned / orphaned upload records (if cleanup job exists). | Documented behavior; PII-minimal metadata. | ⚠️ Not implemented |

---

## 5. Content compliance

| ID | Test | Expected | Status |
|----|------|----------|--------|
| SEC-CONTENT-01 | Attempt to store or attach forbidden material (Cambridge/commercial book scans, copied passages) via admin or import path. | Rejected by process or review; not in learner-visible tables. | ✅ Admin review workflow |
| SEC-CONTENT-02 | Listening audio without required **license/source metadata** in DB. | API or admin validation rejects publish. | ⚠️ Not validated |
| SEC-CONTENT-03 | Learner-visible resource payload never includes internal "draft" or copyright-sensitive notes. | Contract check on `GET /api/resources` and detail. | ✅ API filters status |
| SEC-CONTENT-04 | External study progress labels (e.g. "Book 5 completed") contain **labels only**—no pasted passages. | Manual review of profile or progress fields. | ✅ Profile is simple |

Reference: [`content-strategy.md`](../content-strategy.md) and forbidden/allowed lists in [`security-and-compliance.md`](../development/backend/security-and-compliance.md).

---

## 6. Audit logging

| ID | Test | Expected | Status |
|----|------|----------|--------|
| SEC-AUDIT-01 | Publish, archive, or unpublish resource (admin). | Audit row: actor, action, entity type/id, timestamp. | ⚠️ Not implemented |
| SEC-AUDIT-02 | Evaluation override or manual score adjustment (if implemented). | Audit row with metadata. | ⚠️ Not implemented |
| SEC-AUDIT-03 | Role change for a user. | Audit row. | ⚠️ Not implemented |
| SEC-AUDIT-04 | Media deletion (admin or system). | Audit row. | ⚠️ Not implemented |
| SEC-AUDIT-05 | Audit records are **not** writable or readable by learners via public APIs. | Only privileged routes or ops tools. | ✅ No learner API |

**Implementation Note:** Audit logging to be added in future iterations.

---

## 7. Score prediction and disclaimers (compliance UX)

| ID | Test | Expected | Status |
|----|------|----------|--------|
| SEC-SCORE-01 | API returns full overall prediction before all four modules complete. | Must **not** return final gated prediction; contract test. | ✅ P0 Verified |
| SEC-SCORE-02 | When prediction exists, response or paired UI copy includes **unofficial / practice estimate** semantics per spec. | Match wording in [`security-and-compliance.md`](../development/backend/security-and-compliance.md) §Score Disclaimer. | ✅ P0 Verified |
| SEC-SCORE-03 | Frontend score pages: visible disclaimer; no "official IELTS result" implication. | Manual + snapshot/E2E on key routes. | ⚠️ E2E needed |

---

## 8. Data leakage and sensitive fields

| ID | Test | Expected | Status |
|----|------|----------|--------|
| SEC-LEAK-01 | Error responses for validation do not include stack traces, SQL, or secret config. | Generic client message; details server-side only. | ✅ API uses fail() helper |
| SEC-LEAK-02 | Logs (app/worker) redact tokens, passwords, full signed URLs with tokens. | Spot-check logging config. | ⚠️ Manual check needed |
| SEC-LEAK-03 | `GET /api/me` and similar never return service role or internal-only flags to learners. | Field allowlist test. | ✅ API implemented |

---

## 9. Background jobs and evaluation pipeline

| ID | Test | Expected | Status |
|----|------|----------|--------|
| SEC-JOB-01 | Job enqueue endpoint cannot be triggered unauthenticated or cross-tenant for another user's attempt. | `401` / `403`. | ✅ API requires auth |
| SEC-JOB-02 | Failed provider responses do not write partial keys or other learners' data into wrong rows. | Idempotency / transaction tests per complexity doc. | ⚠️ Needs testing |
| SEC-JOB-03 | Retry cap: after max retries, job marked failed; no infinite cost loop. | Covered in backend testing plan; re-verify when changing worker. | ⚠️ Worker scaffold exists |

---

## 10. Dependency, headers, and configuration (periodic)

| ID | Test | Expected | Status |
|----|------|----------|--------|
| SEC-CONFIG-01 | `SUPABASE_SERVICE_ROLE_KEY` and DB URLs not exposed to browser bundle or `NEXT_PUBLIC_*`. | Build output / env audit. | ✅ env vars configured |
| SEC-CONFIG-02 | Run `pnpm audit` / `npm audit` (or org equivalent); triage critical/high. | Document exceptions. | ⚠️ Not run recently |
| SEC-CONFIG-03 | Security-related HTTP headers (CSP, frame options, etc.) per hosting guidance—if not applicable, document "N/A" and rationale. | Once per major deploy target. | ⚠️ Not configured |

**Implementation Note:** Run `pnpm audit` periodically and configure security headers for production.

---

## Traceability to backend functional tests

Many behaviors overlap [`backend-testing-plan.md`](backend-testing-plan.md) (§Security And Compliance, §Media). Use this document for **focused security reviews**; keep **feature regression** tests in the backend plan to avoid duplicate automation without value.

---

## Sign-off (optional template)

| Date | Environment | Reviewer | Scope (sections) | Notes |
|------|-------------|----------|------------------|-------|
| | | | e.g. 1–7 | |
