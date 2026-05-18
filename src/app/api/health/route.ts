import Redis from "ioredis";
import { ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { withTimeout } from "@/lib/resilience/circuit-breaker";
import { validateServerEnv } from "@/lib/env/server";
import { queueNames } from "@/lib/queue/names";

type DependencyHealth = {
  status: "ok" | "degraded";
  detail?: string;
};

const defaultDeps = {
  checkDatabase,
  checkRedis,
  checkStrapi,
  checkSupabaseConfig,
  checkWorkerLiveness,
  checkEnvironment,
};

type HealthDeps = typeof defaultDeps;

export async function getHealth(
  deps: HealthDeps = defaultDeps,
) {
  const [database, redis, strapi, supabase, worker, environment] = await Promise.all([
    deps.checkDatabase(),
    deps.checkRedis(),
    deps.checkStrapi(),
    deps.checkSupabaseConfig(),
    deps.checkWorkerLiveness(),
    deps.checkEnvironment(),
  ]);

  const dependencies = { database, redis, strapi, supabase, worker, environment };
  const degraded = Object.values(dependencies).some((dependency) => dependency.status !== "ok");

  return ok(
    {
      status: degraded ? "degraded" : "ok",
      service: "ielts-plus-plus",
      timestamp: new Date().toISOString(),
      dependencies,
    },
    { status: degraded ? 503 : 200 },
  );
}

export async function GET() {
  return getHealth();
}

async function checkDatabase(): Promise<DependencyHealth> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ok" };
  } catch (error) {
    return { status: "degraded", detail: error instanceof Error ? error.message : "database check failed" };
  }
}

async function checkRedis(): Promise<DependencyHealth> {
  const url = process.env.REDIS_URL;
  if (!url) return { status: "degraded", detail: "REDIS_URL is not configured" };

  const client = new Redis(url, { maxRetriesPerRequest: 1, enableOfflineQueue: false, lazyConnect: true });
  try {
    await withTimeout(async () => {
      await client.connect();
      await client.ping();
    }, 1500, "Redis health check timed out");
    return { status: "ok" };
  } catch (error) {
    return { status: "degraded", detail: error instanceof Error ? error.message : "redis check failed" };
  } finally {
    client.disconnect();
  }
}

async function checkStrapi(): Promise<DependencyHealth> {
  const baseUrl = process.env.STRAPI_BASE_URL;
  if (!baseUrl) return { status: "degraded", detail: "Strapi is not configured" };

  try {
    await withTimeout(async () => {
      const response = await fetch(`${baseUrl}/_health`, {
        method: "GET",
        signal: AbortSignal.timeout(3000),
      });
      if (!response.ok) {
        throw new Error(`Strapi returned ${response.status}`);
      }
    }, 5000, "Strapi health check timed out");
    return { status: "ok" };
  } catch (error) {
    return { status: "degraded", detail: error instanceof Error ? error.message : "strapi unreachable" };
  }
}

async function checkSupabaseConfig(): Promise<DependencyHealth> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return { status: "degraded", detail: "Supabase public configuration is missing" };
  }

  try {
    await withTimeout(async () => {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: "HEAD",
        headers: {
          apikey: supabaseKey,
        },
        signal: AbortSignal.timeout(3000),
      });
      if (response.status !== 200 && response.status !== 401 && response.status !== 404) {
        throw new Error(`Supabase returned ${response.status}`);
      }
    }, 5000, "Supabase health check timed out");
    return { status: "ok" };
  } catch (error) {
    return { status: "degraded", detail: error instanceof Error ? error.message : "supabase unreachable" };
  }
}

async function checkWorkerLiveness(): Promise<DependencyHealth> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return { status: "degraded", detail: "Redis unavailable for worker check" };

  const client = new Redis(redisUrl, { maxRetriesPerRequest: 1, enableOfflineQueue: false, lazyConnect: true });
  try {
    await withTimeout(async () => {
      await client.connect();
      const evalQueues = [queueNames.writingEvaluation, queueNames.speakingEvaluation];
      let hasActiveWorker = false;
      for (const queueName of evalQueues) {
        const activeConsumers = await client.smembers(`bull:${queueName}:workers`);
        if (activeConsumers.length > 0) {
          hasActiveWorker = true;
          break;
        }
      }
      if (!hasActiveWorker) {
        throw new Error("No active workers detected for evaluation queues");
      }
    }, 3000, "Worker liveness check timed out");
    return { status: "ok" };
  } catch (error) {
    return { status: "degraded", detail: error instanceof Error ? error.message : "worker unreachable" };
  } finally {
    client.disconnect();
  }
}

async function checkEnvironment(): Promise<DependencyHealth> {
  const result = validateServerEnv();
  if (result.success) return { status: "ok" };
  return {
    status: "degraded",
    detail: Object.keys(zodFieldErrors(result.error)).join(", ") || "environment validation failed",
  };
}

function zodFieldErrors(error: { flatten(): { fieldErrors: Record<string, string[] | undefined> } }) {
  return error.flatten().fieldErrors;
}
