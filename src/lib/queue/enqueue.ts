import { Queue } from "bullmq";
import { createRedisConnection } from "@/lib/queue/connection";
import { queueNames } from "@/lib/queue/names";
import { logger } from "@/lib/observability/logger";

const globalForQueues = globalThis as unknown as {
  llmQueues?: Partial<Record<string, { queue: Queue; connection: ReturnType<typeof createRedisConnection> }>>;
};

function getQueue(queueName: string) {
  globalForQueues.llmQueues ??= {};
  const existing = globalForQueues.llmQueues[queueName];
  if (existing) return existing.queue;

  const connection = createRedisConnection();
  const queue = new Queue(queueName, { connection });
  globalForQueues.llmQueues[queueName] = { queue, connection };
  return queue;
}

export async function enqueueLlmJob(type: string, llmJobId: string) {
  if (!process.env.REDIS_URL) {
    return false;
  }

  const queueName =
    type === "writing_evaluation" ? queueNames.writingEvaluation : queueNames.speakingEvaluation;
  const queue = getQueue(queueName);

  try {
    await queue.add(
      type,
      { llmJobId },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { age: 60 * 60 * 24, count: 1000 },
        removeOnFail: { age: 60 * 60 * 24 * 7, count: 1000 },
      },
    );
    return true;
  } catch (error) {
    logger.error("failed to enqueue llm job", {
      queueName,
      llmJobId,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

export async function closeQueues() {
  const entries = Object.values(globalForQueues.llmQueues ?? {}).filter(
    (entry): entry is { queue: Queue; connection: ReturnType<typeof createRedisConnection> } => Boolean(entry),
  );
  await Promise.all(entries.map(async ({ queue, connection }) => {
    await queue.close();
    await connection.quit();
  }));
  globalForQueues.llmQueues = {};
}
