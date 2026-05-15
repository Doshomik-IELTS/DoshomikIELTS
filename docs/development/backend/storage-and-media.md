# Storage And Media

## Provider

Use Supabase Storage for V1 media storage.

## Current Implementation Status

- **Implemented:**
  - `/api/media/upload-url` - Creates signed upload URL and MediaAsset record
  - `/api/media/[assetId]/download-url` - Creates signed download URL with access checks
  - Private bucket support via signed URLs
  - File type validation for audio uploads
  - Owner/admin/reviewer/evaluator access checks
  - Admin media CRUD: `/api/admin/media` (GET, POST), `/api/admin/media/[id]` (PATCH)

- **API Endpoints:**
  - `POST /api/media/upload-url` - Request signed upload URL (learner)
  - `GET /api/media/:assetId/download-url` - Get signed download URL (learner)
  - `GET /api/admin/media` - List media assets with search/filter (admin)
  - `POST /api/admin/media` - Create media asset record (admin)
  - `PATCH /api/admin/media/:id` - Update media metadata (admin)

- **Supported Purposes:**
  - `speaking_recording` - Learner audio uploads
  - `listening_audio` - Admin/reviewer audio with license metadata
  - `generated_audio` - TTS generated content
  - `reports` - Generated PDF exports

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

- `id` (UUID)
- `profileId` — owner (nullable for system-owned media)
- `title` — human-readable name
- `altText` — accessibility description
- `transcriptText` — audio transcript text
- `bucket` — Supabase Storage bucket name
- `path` — file path within bucket
- `purpose` — speaking_recording, listening_audio, generated_audio, reports
- `contentType` — MIME type
- `sizeBytes` — file size
- `durationSeconds` — audio duration where applicable
- `licenseMetadataJson` — license/source metadata where applicable
- `createdAt` — creation timestamp

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
