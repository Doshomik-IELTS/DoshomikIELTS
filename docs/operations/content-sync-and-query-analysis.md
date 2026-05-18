# Content Sync and Query Analysis Notes

## Strapi Sync Health
- Treat Strapi as an external dependency. Learner routes should continue serving local Prisma content when Strapi is unavailable.
- Track Strapi sync failures with structured log fields: `service=strapi`, route path, circuit state, and response status.
- Before publishing imported content, validate modules, test type, difficulty, section order, and question count.
- For content rollback, restore the prior Strapi export or re-import the previous local `TestVersion` / `ResourceVersion` snapshot.

## Query Analysis Before Scaling
Run `EXPLAIN ANALYZE` on these query families before closed beta load testing:

```sql
EXPLAIN ANALYZE
SELECT id, title, category, difficulty
FROM "Resource"
WHERE status = 'published'
ORDER BY "createdAt" DESC
LIMIT 20;

EXPLAIN ANALYZE
SELECT id, title, type, status
FROM "Test"
WHERE status = 'published'
ORDER BY "createdAt" DESC
LIMIT 20;

EXPLAIN ANALYZE
SELECT *
FROM "MockTestAttempt"
WHERE "profileId" = '<profile-id>'
ORDER BY "startedAt" DESC
LIMIT 20;

EXPLAIN ANALYZE
SELECT *
FROM "LlmJob"
WHERE status IN ('queued', 'processing')
ORDER BY "createdAt" ASC
LIMIT 50;
```

Record whether the new operational indexes are used. If the planner chooses sequential scans at expected data volumes, add narrower indexes based on actual query predicates.
