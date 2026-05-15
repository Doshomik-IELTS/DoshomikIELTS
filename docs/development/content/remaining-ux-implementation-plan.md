# Completed UX Implementation Checklist

Last updated: 2026-05-16

## Status: ✅ All Planned UX Items Implemented

All P0, P1, and P2 UX items from this plan have been shipped. Remaining work is production hardening: server-side attempt events for strict audio, production LLM/TTS workers, richer analytics, and optional dedicated full-screen question editors.

## Purpose

This document records the usability improvements completed after the content CMS and IELTS learner rendering work. It is intentionally implementation-oriented so future gaps can be compared against the shipped behavior.

## Current Completed Baseline

- Admin test creation wizard.
- Resource CMS actions and status workflow.
- Reading quick authoring without JSON.
- Listening quick authoring without JSON.
- Question groups and answer keys.
- Reading/Listening source support.
- Listening media upload/selection.
- Admin validation, preview, duplicate, review, publish, and version snapshots.
- Learner attempt rendering for Reading passages, Listening audio, question groups, options, and typed objective controls.
- Shared IELTS renderers between learner attempts and admin preview.
- Admin advanced tools collapsed on Tests page.
- Builder completion chips for Material, Questions, Answers, and Sources.

## Research Notes For This Pass

- IELTS objective authoring needs structured, repeatable inputs: question stem, options where relevant, answer key, accepted alternatives, word-limit rules, source support, and explanation. Free-form JSON remains useful only as an advanced fallback.
- Admins should be able to paste externally drafted question rows, but the CMS should immediately convert them into first-class questions so the builder, validation, preview, and scoring pipeline stay consistent.
- Reading and Listening source support is most useful when it stores both a human reference and machine offsets. Offsets allow passage/transcript highlighting; the excerpt remains a fallback when offsets are unavailable.
- Learner submission should not block unanswered questions outright, because real exam candidates can leave blanks, but it should force an explicit review step before locking a section.
- Strict Listening playback is implemented at the simulation UI level: the learner gets one play action and no replay controls. Full anti-tamper enforcement would require server-side attempt events and is a later hardening task.

## Completed Work Checklist

### P0 - Navigation And Mobile Access

- [x] Add learner mobile navigation.
- [x] Add admin mobile navigation.
- [x] Ensure active route state is visible on mobile.
- [x] Keep logout and learner/admin switch reachable on mobile.

### P1 - Admin Authoring Depth

- [x] Add dedicated admin guidance for common IELTS question subtypes:
  - True / False / Not Given.
  - Yes / No / Not Given.
  - Multiple choice.
  - Sentence, summary, note, table, and form completion.
  - Matching headings / matching information.
  - Map and diagram labeling.
- [x] Keep the existing generic editor as an Advanced fallback.
- [x] Add per-question scoring rule controls instead of free-text scoring rules.
- [x] Add reusable row-based bulk paste for question sets.

### P1 - Admin Analytics And Work Queue

- [x] Expand Admin home beyond resource counts.
- [x] Show test counts by status.
- [x] Show review queue count.
- [x] Show tests with validation blockers.
- [x] Show recent content updates.
- [x] Add quick links to New test, Tests in review, Draft tests, and Review queue.

### P2 - Source Span And Reordering Polish

- [x] Add true text-range highlighting for Reading passage source spans.
- [x] Add true text-range highlighting for Listening transcript source spans.
- [x] Store offsets when source text is selected.
- [x] Replace up/down reordering with drag-and-drop for sections, groups, and questions.

### P2 - Learner Attempt Polish

- [x] Add unanswered-count warning before section submit.
- [x] Add section-level review screen before final submission.
- [x] Add stricter Listening play-once behavior for strict simulation.
- [x] Improve map/diagram labeling UI when visual media exists.

## Implementation Notes

- Scoring rules are stored in `AnswerKey.scoringRuleJson` with structured fields such as `mode`, `maxWords`, `caseSensitive`, `ignorePunctuation`, `allowNumber`, and `partialCredit`.
- Objective answer marking now reads `scoringRuleJson` and accepted alternatives when saving answers.
- Bulk paste uses tab-separated rows: `prompt<TAB>answer<TAB>type<TAB>A:Option|B:Option`.
- Source selections now store `reference`, `excerpt`, `startOffset`, and `endOffset` where source text is available.
- Reading passages and Listening transcripts highlight source spans in the learner renderer.
- Listening strict mode currently uses browser-local completion state. Add server-side attempt events before treating it as anti-cheat enforcement.

## Completed Implementation Order

1. Mobile navigation for learner/admin shells.
2. Admin home analytics.
3. Dedicated question subtype authoring controls.
4. Submit warnings and learner attempt polish.
5. True source-span highlighting.
6. Drag-and-drop ordering.

## Notes

- Production LLM generation and TTS are provider-bound integrations, not pure UX tasks.
- The current local deterministic generation path is useful for testing the CMS workflow but should not be treated as production content generation.
