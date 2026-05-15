# Content Strategy

Last updated: 2026-05-16

## Status: ✅ All Core Content Systems Implemented — Production Hardening In Progress

The content CMS, resource admin dashboard, and all major learner-facing content systems are implemented. Production LLM/TTS generation workers and server-side strict audio event enforcement remain the primary hardening tasks.

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

- The CMS supports generation jobs, reviewed output storage, local deterministic draft generation for workflow testing, and import-as-draft.
- Production LLM worker execution is still pending.
- Generated/imported tests still pass through the normal validation, preview, review, and publish workflow.

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

Current CMS enforcement:

- Publish is blocked by server-side validation for missing material, answers, source support, timing, and source-policy checks.
- Admin dashboard surfaces tests with validation blockers.
- Review queue entries are created when tests are submitted for review.
- Version snapshots are written on publish.

Implementation note: the admin CMS must enforce these checks before publishing. The detailed builder, data contract, and validation plan is defined in [`content-management-system-implementation-plan.md`](content-management-system-implementation-plan.md).
