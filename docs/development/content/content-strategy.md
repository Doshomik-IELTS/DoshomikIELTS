# Content Strategy

Last updated: 2026-05-17

## Status: ✅ Strapi Authoring Integrated — Production Hardening In Progress

Strapi is now the authoring system for resources, IELTS information pages, FAQs, and mock-test definitions. The app keeps learner runtime state, attempts, scoring, saved resources, reports, and review/operations workflows. Production LLM/TTS generation workers, Strapi editorial validation guidance, and server-side strict audio event enforcement remain the primary hardening tasks.

## Copyright Position

Cambridge IELTS books and similar commercial test-prep books should not be copied into the platform. Avoid uploading:

- Book PDFs
- Scans
- Exact passages
- Exact questions
- Audio from commercial books
- Answer explanations copied from books

Safe use:

- Mention book names as external recommendations.
- Let users record that they studied a book externally.
- Create original IELTS-style material that does not copy protected expression.

## Original Resource Plan

Initial resource sets:

- 100 basic English lessons.
- 500 core IELTS words with examples.
- 300 synonym groups with register notes.
- 75 grammar rules with short drills.
- 30 reading passages.
- 30 listening scripts with generated or recorded audio.
- 20 writing task 1 prompts.
- 40 writing task 2 prompts.
- 60 speaking part 1 questions.
- 30 speaking cue cards.
- 60 speaking part 3 questions.

## LLM-Generated Content Rules

Every generated resource/test should require:

- Original wording.
- No named copyrighted source imitation.
- Clear difficulty target.
- Answer key.
- Explanation.
- Human review before publishing.

Prompt requirements:

- Ask for original IELTS-style practice, not Cambridge-style copied content.
- Request structured JSON output for import.
- Include validation fields: difficulty, answer, explanation, estimated time, tags.

Current implementation status:

- Strapi is the authoring target for new generated or manually created content.
- Legacy app generation/import tooling may still support local deterministic draft generation for workflow testing and Prisma fallback content.
- Production LLM worker execution is still pending.
- Generated/imported tests should pass through Strapi draft/publish plus app-side review and validation before learner exposure.

## Listening Content

Safe listening options:

- Write original scripts and generate TTS audio.
- Hire voice actors and record in-house.
- Use public-domain source text only when license is verified.
- Use Creative Commons audio only when the license allows the planned use and attribution is stored.

Metadata to store:

- Audio source
- License
- Attribution
- Speaker/accent
- Duration
- Transcript
- Review status

Current implementation status:

- Listening sections can store script/transcript content in `TestSection.contentJson`.
- Listening audio can be uploaded or selected through media metadata and attached by `mediaAssetId`.
- Learner attempts request signed media URLs and use a strict one-play simulation UI for attached audio.
- Server-side playback events are still future hardening.

## Quality Control

Before publishing any test:

- Validate that each question has one correct answer or accepted alternatives.
- Confirm reading answers are supported by the passage.
- Confirm listening answers are supported by the transcript.
- Check that distractors are plausible but not misleading.
- Run plagiarism similarity checks where possible.
- Human-review high-value mock tests.
- Confirm every objective answer has a structured scoring rule or default scoring behavior.
- Confirm source support stores a human reference and, where available, offsets for learner highlighting.

Current authoring/review enforcement:

- Strapi draft/publish is the editorial gate for new resources and mock tests.
- App learner APIs expose only published Strapi content, or published Prisma fallback content when Strapi is not configured.
- Starting a Strapi-authored mock test materializes a stable Prisma runtime snapshot before learner attempts/scoring.
- App review screens and manual QA should catch missing material, answers, source support, timing, and source-policy issues before publication.
- Legacy Prisma builder validation remains fallback/local context, not the primary authoring path.

Implementation note: Strapi is the active authoring path. The old custom builder plan is retained only as historical/fallback context in [`content-management-system-implementation-plan.md`](content-management-system-implementation-plan.md). The current architecture is defined in [`../../features_x/content_management.md`](../../features_x/content_management.md).
