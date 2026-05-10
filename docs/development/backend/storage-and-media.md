# Storage And Media

## Provider

Use Supabase Storage for V1 media storage.

## Buckets

Create these buckets:

- `listening-audio`
- `speaking-recordings`
- `generated-audio`
- `reports`

Recommended visibility:

- Keep buckets private.
- Use signed URLs for upload and download.
- Never expose permanent public URLs for learner recordings.

## Media Asset Metadata

Every stored file should have a `MediaAsset` record with:

- Bucket
- Path
- Purpose
- Owner profile where applicable
- Content type
- Size
- Duration where applicable
- License metadata where applicable
- Created timestamp

## Upload Flow

1. Client requests signed upload URL.
2. Backend validates requested purpose, file type, size, and expected bucket.
3. Backend creates storage path and media asset draft/record.
4. Client uploads directly to Supabase Storage.
5. Client confirms upload if needed.
6. Backend marks media as ready or attaches it to an attempt/evaluation.

## Download Flow

1. Client requests download URL for `mediaAssetId`.
2. Backend checks session and permission.
3. Backend creates short-lived signed download URL.
4. Client streams/downloads from Supabase Storage.

## File Validation

Speaking recordings:

- Allowed types: `audio/webm`, `audio/mpeg`, `audio/mp4`, `audio/wav`.
- Enforce max size.
- Enforce max duration.
- Reject empty or unsupported files.

Listening audio:

- Must have source/license metadata.
- Must be original, licensed, public-domain-valid, TTS-generated with commercial use allowed, or in-house recorded.

Reports:

- Store generated PDFs or exports if needed.
- Keep private unless intentionally shared by the learner.

## Copyright Rules

Do not upload or store:

- Cambridge IELTS audio.
- Commercial book audio.
- Copied book scans or PDFs.
- Copied test passages or questions.
- Copied answer explanations.

Allowed:

- In-house recorded audio.
- Commercial-use TTS audio from original scripts.
- Properly licensed audio with attribution metadata.
- Public-domain material only when the license is verified and stored.
