import "dotenv/config";
import { Worker } from "bullmq";
import { processLlmJob } from "@/lib/evaluation/processors";
import { logger } from "@/lib/observability/logger";
import { createRedisConnection } from "@/lib/queue/connection";
import { queueNames } from "@/lib/queue/names";

const connection = createRedisConnection();

const WORKER_ATTEMPTS = Number(process.env.WORKER_MAX_ATTEMPTS || 3);

const workers = Object.values(queueNames).map((queueName) => {
  const worker = new Worker(
      queueName,
      async (job) => {
        logger.info("worker received job", { queueName, jobId: job.id, jobName: job.name });
        if (
          queueName === queueNames.writingEvaluation ||
          queueName === queueNames.speakingEvaluation
        ) {
          const llmJobId = job.data?.llmJobId;
          if (typeof llmJobId !== "string") {
            throw new Error("Missing llmJobId");
          }
          await processLlmJob(llmJobId);
        }
        return { ok: true, queueName, jobId: job.id };
      },
      {
        connection,
        concurrency: Number(process.env.WORKER_CONCURRENCY || 2),
      },
    );

  worker.on("completed", (job) => {
    logger.info("worker completed job", { queueName, jobId: job.id, jobName: job.name });
  });

  worker.on("failed", (job, error) => {
    const attemptsMade = job?.attemptsMade ?? 0;
    logger.error("worker job failed", {
      queueName,
      jobId: job?.id,
      jobName: job?.name,
      attemptsMade,
      error: error.message,
    });

    if (attemptsMade >= WORKER_ATTEMPTS) {
      logger.error("job moved to dead-letter queue", {
        queueName,
        jobId: job?.id,
        attemptsMade,
      });
    }
  });

  worker.on("error", (error) => {
    logger.error("worker runtime error", { queueName, error: error.message });
  });

  worker.on("stalled", (jobId) => {
    logger.warn("worker job stalled", { queueName, jobId });
  });

  return worker;
});

process.on("SIGTERM", async () => {
  await Promise.all(workers.map((worker) => worker.close()));
  await connection.quit();
  process.exit(0);
});

logger.info("started workers", { count: workers.length });
