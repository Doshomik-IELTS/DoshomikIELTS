import Redis from "ioredis";
import { env } from "process";
import { fail } from "@/lib/api/response";
import { logger } from "@/lib/observability/logger";

interface RateLimitOptions {
  maxRequests: number;
  windowSeconds: number;
  keyPrefix: string;
  failClosed?: boolean;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
  retryAfter?: number;
  degraded?: boolean;
}

// In-process fallback rate limiter
const inProcessStore = new Map<string, { count: number; resetAt: number }>();
let inProcessCleanupScheduled = false;

function scheduleInProcessCleanup() {
  if (!inProcessCleanupScheduled) {
    inProcessCleanupScheduled = true;
    setTimeout(() => {
      const now = Date.now();
      for (const [key, entry] of inProcessStore.entries()) {
        if (entry.resetAt < now) {
          inProcessStore.delete(key);
        }
      }
      inProcessCleanupScheduled = false;
    }, 60_000);
  }
}

function inProcessRateLimit(key: string, maxRequests: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const entry = inProcessStore.get(key);

  if (!entry || entry.resetAt < now) {
    inProcessStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowSeconds };
  }

  entry.count += 1;
  scheduleInProcessCleanup();

  const allowed = entry.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - entry.count);
  const resetIn = Math.ceil((entry.resetAt - now) / 1000);

  return {
    allowed,
    remaining,
    resetIn,
    retryAfter: allowed ? undefined : resetIn,
    degraded: true,
  };
}

function getRedisClient(): Redis | null {
  const url = env.REDIS_URL;
  if (!url) return null;

  try {
    const isTls = url.startsWith("rediss://");
    return new Redis(url, {
      tls: isTls ? {} : undefined,
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
      lazyConnect: true,
    });
  } catch (error) {
    logger.warn("redis rate limiter unavailable", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

const redis = getRedisClient();

export function createRateLimiter(options: RateLimitOptions) {
  return async function rateLimit(identifier: string): Promise<RateLimitResult> {
    const key = `${options.keyPrefix}:${identifier}`;

    if (!redis) {
      if (options.failClosed) {
        return {
          allowed: false,
          remaining: 0,
          resetIn: options.windowSeconds,
          retryAfter: options.windowSeconds,
          degraded: true,
        };
      }
      return inProcessRateLimit(key, options.maxRequests, options.windowSeconds);
    }

    try {
      const multi = redis.multi();
      multi.incr(key);
      multi.ttl(key);
      const results = await multi.exec();

      if (!results) {
        if (options.failClosed) {
          return {
            allowed: false,
            remaining: 0,
            resetIn: options.windowSeconds,
            retryAfter: options.windowSeconds,
            degraded: true,
          };
        }
        return inProcessRateLimit(key, options.maxRequests, options.windowSeconds);
      }

      const [countResult, ttlResult] = results;
      const count = (countResult?.[1] as number) ?? 0;
      const ttl = (ttlResult?.[1] as number) ?? options.windowSeconds;

      if (count === 1) {
        await redis.expire(key, options.windowSeconds);
      }

      const allowed = count <= options.maxRequests;
      const remaining = Math.max(0, options.maxRequests - count);
      const resetIn = ttl > 0 ? ttl : options.windowSeconds;

      return {
        allowed,
        remaining,
        resetIn,
        retryAfter: allowed ? undefined : resetIn,
      };
    } catch (error) {
      logger.warn("redis rate limit check failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      if (options.failClosed) {
        return {
          allowed: false,
          remaining: 0,
          resetIn: options.windowSeconds,
          retryAfter: options.windowSeconds,
          degraded: true,
        };
      }
      return inProcessRateLimit(key, options.maxRequests, options.windowSeconds);
    }
  };
}

export async function checkRateLimitForIdentifier(
  rateLimiter: (id: string) => Promise<RateLimitResult>,
  identifier: string,
): Promise<Response | null> {
  try {
    const result = await rateLimiter(identifier);

    if (result.degraded && !result.allowed) {
      return fail(
        {
          code: "SERVICE_UNAVAILABLE",
          message: "Service temporarily unavailable. Please try again later.",
        },
        503,
        {
          "Retry-After": String(result.retryAfter ?? result.resetIn),
        },
      );
    }

    if (!result.allowed) {
      return fail(
        {
          code: "RATE_LIMITED",
          message: `Too many requests. Please try again in ${result.resetIn} seconds.`,
          details: { retryAfter: result.retryAfter },
        },
        429,
        {
          "X-RateLimit-Remaining": String(result.remaining),
          "X-RateLimit-Reset": String(result.resetIn),
          "Retry-After": String(result.retryAfter ?? result.resetIn),
        },
      );
    }

    return null;
  } catch {
    return null;
  }
}

export function withRateLimit(
  rateLimiter: (id: string) => Promise<RateLimitResult>,
  getIdentifier: (request: Request) => string,
) {
  return async function checkRateLimit(request: Request): Promise<Response | null> {
    return checkRateLimitForIdentifier(rateLimiter, getIdentifier(request));
  };
}

export const authRateLimiter = createRateLimiter({
  maxRequests: 5,
  windowSeconds: 60,
  keyPrefix: "rl:auth",
  failClosed: true,
});

export const submissionRateLimiter = createRateLimiter({
  maxRequests: 30,
  windowSeconds: 60,
  keyPrefix: "rl:submit",
});

export const evaluationRateLimiter = createRateLimiter({
  maxRequests: 10,
  windowSeconds: 60,
  keyPrefix: "rl:eval",
  failClosed: true,
});

export const mediaRateLimiter = createRateLimiter({
  maxRequests: 20,
  windowSeconds: 60,
  keyPrefix: "rl:media",
});

export const predictionRateLimiter = createRateLimiter({
  maxRequests: 5,
  windowSeconds: 60,
  keyPrefix: "rl:pred",
});

export const referralRateLimiter = createRateLimiter({
  maxRequests: 3,
  windowSeconds: 60,
  keyPrefix: "rl:refer",
});

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "unknown";
}
