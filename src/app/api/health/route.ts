import Redis from "ioredis";
import { ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { strapiEnabled } from "@/lib/strapi/content";
import { withTimeout } from "@/lib/resilience/circuit-breaker";
import { validateServerEnv } from "@/lib/env/server";

type DependencyHealth = {
  status: "ok" | "degraded";
  detail?: string;
};

const defaultDeps = {
  checkDatabase,
  checkRedis,
  checkStrapi,
  checkSupabaseConfig,
  checkEnvironment,
};

type HealthDeps = typeof defaultDeps;

export async function getHealth(
  deps: HealthDeps = defaultDeps,
) {
  const [database, redis, strapi, supabase, environment] = await Promise.all([
    deps.checkDatabase(),
    deps.checkRedis(),
    deps.checkStrapi(),
    deps.checkSupabaseConfig(),
    deps.checkEnvironment(),
  ]);

  const dependencies = { database, redis, strapi, supabase, environment };
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
  if (!strapiEnabled()) return { status: "degraded", detail: "Strapi is not configured" };
  return { status: "ok" };
}

async function checkSupabaseConfig(): Promise<DependencyHealth> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { status: "degraded", detail: "Supabase public configuration is missing" };
  }
  return { status: "ok" };
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
