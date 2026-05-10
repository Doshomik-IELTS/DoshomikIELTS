import "dotenv/config";
import { Worker } from "bullmq";
import { processLlmJob } from "@/lib/evaluation/processors";
import { createRedisConnection } from "@/lib/queue/connection";
import { queueNames } from "@/lib/queue/names";

const connection = createRedisConnection();

const workers = Object.values(queueNames).map(
  (queueName) =>
    new Worker(
      queueName,
      async (job) => {
        console.log(`[worker:${queueName}] received job`, job.id, job.name);
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
      { connection },
    ),
);

process.on("SIGTERM", async () => {
  await Promise.all(workers.map((worker) => worker.close()));
  await connection.quit();
  process.exit(0);
});

console.log(`Started ${workers.length} IELTS++ workers`);
