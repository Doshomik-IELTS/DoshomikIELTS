# Incident Runbook Template

Use this template when reviewing operational readiness or generating incident response procedures for IELTS++. Each incident class should have its own runbook instance.

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

| Incident Class | File | Last Tested |
|---|---|---|
| Redis Outage | _to be created_ | — |
| Worker Crash | _to be created_ | — |
| Strapi Down | _to be created_ | — |
| Database Migration Failure | _to be created_ | — |
| Queue Backlog | _to be created_ | — |
