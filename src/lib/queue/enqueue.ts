import { Queue } from "bullmq";
import { createRedisConnection } from "@/lib/queue/connection";
import { queueNames } from "@/lib/queue/names";

export async function enqueueLlmJob(type: string, llmJobId: string) {
  if (!process.env.REDIS_URL) {
    return false;
  }

  const queueName =
    type === "writing_evaluation" ? queueNames.writingEvaluation : queueNames.speakingEvaluation;
  const connection = createRedisConnection();
  const queue = new Queue(queueName, { connection });

  try {
    await queue.add(type, { llmJobId }, { attempts: 3, backoff: { type: "exponential", delay: 5000 } });
    return true;
  } finally {
    await queue.close();
    await connection.quit();
  }
}
