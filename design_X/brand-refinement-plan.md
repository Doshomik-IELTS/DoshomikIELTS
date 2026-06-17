# DOshomik IELTS — Brand Refinement Plan

**Author**: Frontend design review  
**Scope**: Logo, favicon, metadata, font/typography, and brand-token drift  
**Priority**: High, because these details shape first-impression trust for an ed-tech platform.

---

## Review Context

This plan was refined against the current landing/app snapshots and source code. It keeps the existing product casing, **DOshomik IELTS**, because that casing is already used across the app, docs, metadata, and captured pages.

External baseline:
- Official IELTS/British Council and IDP surfaces rely on consistent wordmarks, favicon presence, and trust-heavy information hierarchy.
- IELTS Advantage foregrounds a clear learner outcome and strong social/share presence.
- Next.js App Router supports static metadata, icon metadata, manifest links, and metadata file conventions such as `robots.ts`.
- Google Search recommends a crawlable square favicon, with larger than 48px preferred for quality on search surfaces.

---

## Current State Summary

### Logo — Fragmented, No Reusable Mark

| Location | Current | Target |
|---|---|---|
| Landing header | `D` in rounded box + "DOshomik IELTS" | Shared `<Logo variant="full" />` |
| Auth pages | GraduationCap icon + "DOshomik IELTS" | Shared `<Logo variant="full" />` |
| Learner header | Text only | Shared `<Logo variant="text" />` |
| Admin header | "DOshomik IELTS Admin" text only | Shared `<Logo variant="text" admin />` |
| Footer | `D` in rounded box + "DOshomik IELTS" | Shared `<Logo variant="full" />` |
| Mobile nav | Plain brand string | ReactNode brand with shared logo |

### Favicon & Share Metadata — Missing

- No favicon or app icon files existed in `public/`.
- No manifest existed.
- No OG/Twitter image existed.
- Root metadata only had title and description.
- `robots.txt` should be provided through an actual file/route convention, not as `metadata.robots`.

### Fonts & Typography — Gaps

- Poppins loaded `400`, `500`, `600`, `700`, while brand badge usage can require `900`.
- `--font-mono` referenced Geist Mono without loading it.
- Landing tokens (`--midnight-text`, `--grey`) and app tokens (`text-slate-*`, semantic CSS vars) overlap.
- CSS typo: `--deep-slte` should be `--deep-slate`.

### Design System Drift

- Textarea focus ring used `ring-blue-600` instead of `ring-primary`.
- Several progress bars used hardcoded `bg-blue-500` where the brand progress color should be `bg-primary`.
- Some blue/green module colors are intentional category/status encoding and should not be blindly migrated.
- Two icon libraries remain: `@iconify/react` on landing/footer and `lucide-react` in the app. This is lower priority because it is broader than brand identity.

---

## Refined Implementation

### Phase 1 — Shared Logo

Deliverables:
- `public/images/brand-mark.svg`
- `public/images/logo.svg`
- `src/components/layout/logo.tsx`

Design rules:
- Keep casing as **DOshomik IELTS**.
- Use primary `#6556ff` for the mark.
- Use one reusable component for public header, auth pages, learner header, admin header, footer, and mobile admin nav.
- Stop using `GraduationCap` as a brand mark.

Status: completed.

### Phase 2 — Favicon, Manifest, OG, Robots

Deliverables:
- `public/favicon.ico`
- `public/favicon.svg`
- `public/apple-touch-icon.png`
- `public/icon-96.png`
- `public/icon-192.png`
- `public/icon-512.png`
- `public/manifest.json`
- `public/og-image.svg`
- `public/og-image.png`
- `src/app/robots.ts`
- Expanded metadata in `src/app/layout.tsx`

Rules:
- Include an SVG favicon and ICO fallback.
- Include a 96px PNG favicon target for higher-quality search/browser surfaces.
- Use 1200x630 for the OG PNG.
- Use `metadataBase` so OG/Twitter image URLs resolve correctly.
- Do not add `robots: "/robots.txt"` to metadata; generate robots through `src/app/robots.ts`.

Status: completed.

### Phase 3 — Fonts & Tokens

Deliverables:
- Add Poppins `900`.
- Load `Geist_Mono`.
- Map `--font-mono` to `--font-geist-mono`.
- Rename `--deep-slte` to `--deep-slate`.
- Keep semantic app text token usage at the root.

Deferred:
- Full landing typography migration from `text-midnight-text` / `text-grey` to a stricter semantic token system. This should be done as a visual QA pass, not a blind replacement, because the landing page currently depends on a softer editorial tone.

Status: partially completed.

### Phase 4 — Visual Consistency Fixes

Completed:
- `src/components/ui/textarea.tsx`: `focus:ring-primary`.
- `src/components/dashboard/dashboard-summary.tsx`: primary progress color.
- `src/components/resources/module-hub.tsx`: primary progress color.
- `src/app/(learner)/progress/page.tsx`: primary progress color for active progress.

Deferred:
- `src/components/resources/module-card.tsx` keeps module-specific colors.
- `src/components/dashboard/score-trend.tsx` keeps multi-series chart colors.
- Full icon-library consolidation remains P3.

---

## Verification Checklist

- [x] `/favicon.ico` asset exists.
- [x] `/favicon.svg` asset exists.
- [x] `/apple-touch-icon.png` asset exists.
- [x] `/icon-96.png`, `/icon-192.png`, `/icon-512.png` assets exist.
- [x] `/manifest.json` exists.
- [x] `/og-image.png` exists at 1200x630.
- [x] Root metadata declares icon, apple icon, manifest, Open Graph, and Twitter image data.
- [x] `src/app/robots.ts` generates crawler rules and sitemap URL.
- [x] Headers/footer/auth surfaces use the shared logo component.
- [x] Auth pages no longer use `GraduationCap` as a brand mark.
- [x] Poppins `900` and Geist Mono are loaded via `next/font`.
- [x] `--deep-slte` typo fixed to `--deep-slate`.
- [x] Textarea focus ring uses `ring-primary`.
- [x] Brand progress bars use `bg-primary` where color is not semantically category-specific.
- [x] `pnpm typecheck` passes.
- [x] `pnpm build` passes.
