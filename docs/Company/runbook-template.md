# Incident Runbook Template

<!-- Last Updated: 2026-05-19 — Populated Redis Outage and Worker Crash runbook instances. -->

Use this template when reviewing operational readiness or generating incident response procedures for DOshomik IELTS. Each incident class should have its own runbook instance.

## Incident Class

- **Name**: [e.g., Redis Outage, Worker Crash, Strapi Down, Database Migration Failure, Queue Backlog]
- **Severity**: [P0 / P1 / P2]
- **Owner**: [Primary role responsible for resolution]
- **Detection**: [How is this incident detected? Health check, alert, user report?]

## Symptoms

- [Observable symptom 1]
- [Observable symptom 2]
- [User-facing impact]

## Immediate Response (First 15 Minutes)

1. [Step 1 — verify the incident]
2. [Step 2 — assess blast radius]
3. [Step 3 — communicate status if user-facing]

## Diagnosis

- **Health check endpoint**: `/api/health` — check `dependencies.redis`, `dependencies.worker`, `dependencies.database`
- **Logs**: Check Sentry for error spikes, application logs for stack traces
- **Queue state**: Run `redis-cli` and inspect `bull:*` keys for stuck jobs
- **Database**: Run `pnpm prisma db pull` to verify schema integrity

## Resolution Steps

1. [Step 1 — primary fix]
2. [Step 2 — verification]
3. [Step 3 — rollback if fix fails]

## Rollback Plan

- **Trigger**: [When to roll back — e.g., fix does not resolve within 10 minutes]
- **Steps**:
  1. [Rollback step 1]
  2. [Rollback step 2]
- **Verification**: [How to confirm rollback succeeded]

## Post-Incident

- [ ] Root cause documented
- [ ] Runbook updated if the incident revealed a gap
- [ ] Monitoring or alerting improved if detection was late
- [ ] Affected learners notified if user-facing impact occurred

## Runbook Instances

### Redis Outage

- **Name**: Redis Outage (BullMQ Broker Unavailable)
- **Severity**: P1
- **Owner**: DevOps/SRE Lead (primary), Lead Backend (secondary)
- **Detection**: Health check `/api/health` returns `dependencies.redis: unhealthy`; BullMQ throws `ECONNREFUSED` errors in Sentry; worker process exits with connection errors.

#### Symptoms
- Writing and speaking evaluation jobs stop processing.
- Learners see "evaluation pending" indefinitely after submission.
- Health check endpoint reports Redis dependency as down.
- Sentry alerts spike with `RedisConnectionError` or `ECONNREFUSED 127.0.0.1:6379`.
- **User-facing impact**: Learners cannot receive writing/speaking feedback. Mock test flow appears stuck after submission.

#### Immediate Response (First 15 Minutes)
1. Verify Redis is down: `docker compose ps redis` — check status is `exited` or `unhealthy`.
2. Check Redis logs: `docker compose logs redis --tail 50` — look for OOM, corruption, or configuration errors.
3. Check if Redis is reachable: `docker compose exec redis redis-cli ping` — expect `PONG`.
4. If Redis is down, restart: `docker compose up -d redis`.
5. Notify learners via status page or in-app banner if outage exceeds 5 minutes.

#### Diagnosis
- **Health check endpoint**: `/api/health` — check `dependencies.redis` status.
- **Logs**: `docker compose logs redis --tail 100` and `docker compose logs worker --tail 100`.
- **Queue state**: After Redis recovery, run `docker compose exec redis redis-cli keys 'bull:*'` to inspect pending jobs.
- **Database**: Verify no jobs were lost — compare `jobs` table status with Redis queue length.

#### Resolution Steps
1. Restart Redis: `docker compose up -d redis`.
2. Verify Redis is healthy: `docker compose exec redis redis-cli ping` → `PONG`.
3. Restart worker to reconnect: `docker compose restart worker`.
4. Verify queue recovery: Check worker logs for `Processing job` messages.
5. Verify health check: `curl http://localhost:3000/api/health` — confirm `dependencies.redis: healthy`.

#### Rollback Plan
- **Trigger**: Redis restart does not resolve within 5 minutes, or data corruption detected.
- **Steps**:
  1. Stop Redis: `docker compose stop redis`.
  2. Remove corrupted data: `docker compose rm -f redis` and `docker volume rm ielts++_redis_data` (or your volume name).
  3. Start fresh Redis: `docker compose up -d redis`.
  4. Re-queue failed jobs from the `jobs` table: Run a script to re-enqueue jobs with status `failed` or `processing` to the BullMQ queue.
- **Verification**: Worker processes re-enqueued jobs; health check passes.

#### Post-Incident
- [ ] Root cause documented (OOM, corruption, misconfiguration, or external factor).
- [ ] Runbook updated if the incident revealed a gap.
- [ ] Monitoring or alerting improved if detection was late.
- [ ] Affected learners notified if user-facing impact occurred.
- [ ] Verify no jobs were permanently lost — reconcile `jobs` table with processed evaluations.

---

### Worker Crash

- **Name**: BullMQ Worker Crash (Evaluation Processor Down)
- **Severity**: P1
- **Owner**: Lead Backend (primary), DevOps/SRE Lead (secondary)
- **Detection**: Worker container exits unexpectedly; Sentry reports unhandled exceptions in evaluation pipeline; jobs stuck in `active` or `waiting` state; health check `/api/health` may still pass if it only checks Redis connectivity, not worker processing.

#### Symptoms
- Evaluation jobs remain in `waiting` or `active` state indefinitely.
- Learners submit writing/speaking tasks but never receive feedback.
- Worker container shows `exited` status in `docker compose ps`.
- Sentry reports unhandled exceptions in `src/workers` or evaluation provider calls.
- **User-facing impact**: No writing or speaking feedback. Mock test flow incomplete. Learner trust degrades.

#### Immediate Response (First 15 Minutes)
1. Check worker status: `docker compose ps worker` — confirm if exited or restarting.
2. Check worker logs: `docker compose logs worker --tail 100` — look for stack traces, OOM kills, or provider errors.
3. Check if the crash is reproducible: Restart worker and monitor: `docker compose up -d worker`.
4. If crash repeats, check for poison job: Inspect BullMQ queue for jobs that consistently fail.
5. Notify learners if outage exceeds 10 minutes.

#### Diagnosis
- **Health check endpoint**: `/api/health` — may not detect worker crash if only checking Redis. Consider adding worker liveness check.
- **Logs**: `docker compose logs worker --tail 200` — look for evaluation provider errors, timeout issues, or unhandled exceptions.
- **Queue state**: `docker compose exec redis redis-cli keys 'bull:*'` — check for stuck `active` jobs.
- **Database**: Run `pnpm prisma db pull` to verify schema integrity. Check `jobs` table for jobs stuck in `processing` state.

#### Resolution Steps
1. Restart worker: `docker compose up -d worker`.
2. Monitor worker logs for 2 minutes: `docker compose logs worker --follow`.
3. If worker crashes again, identify poison job:
   - Check Redis for active jobs: `docker compose exec redis redis-cli lrange bull:evaluations:active 0 -1`.
   - Move poison job to failed: Use BullMQ admin or manually remove the job from the active list.
4. If crash is due to provider error (LLM/transcription API down), enable degradation mode:
   - Set evaluation jobs to `failed` with a user-facing message: "Evaluation temporarily unavailable. Please retry later."
   - Do not retry indefinitely — set max retries to 3 with exponential backoff.
5. Verify recovery: Submit a test writing/speaking response and confirm evaluation completes.

#### Rollback Plan
- **Trigger**: Worker crash is caused by a recent deployment or code change.
- **Steps**:
  1. Roll back to previous image: `docker compose up -d --force-recreate worker` with the previous tag.
  2. If no previous image, revert the code change and rebuild: `git revert <commit>` → `docker compose build worker` → `docker compose up -d worker`.
  3. Re-queue failed jobs from the `jobs` table.
- **Verification**: Worker processes jobs without crashing; health check passes.

#### Post-Incident
- [ ] Root cause documented (poison job, provider error, OOM, code bug, or dependency issue).
- [ ] Runbook updated if the incident revealed a gap.
- [ ] Monitoring or alerting improved — consider adding worker liveness health check.
- [ ] Affected learners notified with status update and retry instructions.
- [ ] Review BullMQ retry configuration — ensure max retries, backoff, and dead-letter queue are properly configured.
- [ ] Add worker crash alerting to Sentry or monitoring system.

---

| Incident Class | File | Last Tested |
|---|---|---|
| Redis Outage | _runbook-template.md (above)_ | — |
| Worker Crash | _runbook-template.md (above)_ | — |
| Strapi Down | _to be created_ | — |
| Database Migration Failure | _to be created_ | — |
| Queue Backlog | _to be created_ | — |
