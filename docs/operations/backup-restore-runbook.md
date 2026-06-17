# Backup and Restore Runbook

## Scope
This runbook covers the minimum launch operations for DOshomik IELTS data stores:

- Supabase/Postgres application database.
- Supabase storage buckets for learner recordings and admin media.
- Strapi CMS database and uploaded assets.
- Redis/BullMQ queues, which are treated as recoverable processing state, not the source of truth.

## Backup Policy
- Enable managed Postgres daily backups with point-in-time recovery before paid beta.
- Retain daily backups for at least 7 days and weekly backups for at least 4 weeks.
- Enable storage bucket versioning or scheduled bucket exports where the hosting provider supports it.
- Export Strapi content before schema/content model changes.

## Restore Drill
Run this before closed beta and once per month after launch.

1. Create an isolated staging database.
2. Restore the latest production-like backup into staging.
3. Set staging environment variables to the restored database and non-production Supabase/Strapi services.
4. Run `pnpm db:deploy` against staging.
5. Start the app and verify `/api/health` returns `ok` or an expected documented degraded dependency.
6. Verify a learner can log in, load resources, start a mock test, and view prior attempts.
7. Verify an admin can load content lists and media metadata.
8. Record actual RPO and RTO in the incident log.

## Rollback Notes
- App deploy rollback: redeploy the previous known-good application artifact.
- Prisma migration rollback: prefer forward-fix migrations. If data loss is possible, restore backup into staging first and validate the recovery path.
- Strapi content rollback: restore content export or database backup, then run learner-facing smoke tests.
- Worker rollback: stop workers first, deploy previous worker code, then restart workers. Failed LLM jobs can be retried from persisted `LlmJob` rows.

## Incident Triggers
- `/api/health` reports database or Redis degraded for more than 5 minutes.
- LLM queue failures exceed 5% over 15 minutes.
- Authentication or storage signed URL creation fails for multiple users.
- Content sync/import from Strapi fails repeatedly.
