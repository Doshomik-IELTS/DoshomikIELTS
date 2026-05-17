import Redis from "ioredis";
import { env } from "process";

interface RateLimitOptions {
  maxRequests: number;
  windowSeconds: number;
  keyPrefix: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
  retryAfter?: number;
}

function getRedisClient(): Redis | null {
  const url = env.REDIS_URL;
  if (!url) return null;

  try {
    const isTls = url.startsWith("rediss://");
    return new Redis(url, {
      tls: isTls ? {} : undefined,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  } catch {
    // Fail-open: if Redis connection fails, don't block legitimate requests
    return null;
  }
}

const redis = getRedisClient();

export function createRateLimiter(options: RateLimitOptions) {
  return async function rateLimit(identifier: string): Promise<RateLimitResult> {
    if (!redis) {
      return { allowed: true, remaining: options.maxRequests, resetIn: options.windowSeconds };
    }

    const key = `${options.keyPrefix}:${identifier}`;

    try {
      const multi = redis.multi();
      multi.incr(key);
      multi.ttl(key);
      const results = await multi.exec();

      if (!results) {
        return { allowed: true, remaining: options.maxRequests, resetIn: options.windowSeconds };
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
  } catch {
    // Fail-open: Redis failure shouldn't block requests
    return { allowed: true, remaining: options.maxRequests, resetIn: options.windowSeconds };
    }
  };
}

export function withRateLimit(
  rateLimiter: (id: string) => Promise<RateLimitResult>,
  getIdentifier: (request: Request) => string,
) {
  return async function checkRateLimit(request: Request): Promise<Response | null> {
    try {
      const identifier = getIdentifier(request);
      const result = await rateLimiter(identifier);

      if (!result.allowed) {
        return new Response(
          JSON.stringify({
            code: "RATE_LIMITED",
            message: `Too many requests. Please try again in ${result.resetIn} seconds.`,
            retryAfter: result.retryAfter,
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "X-RateLimit-Remaining": String(result.remaining),
              "X-RateLimit-Reset": String(result.resetIn),
              "Retry-After": String(result.retryAfter ?? result.resetIn),
            },
          },
        );
      }

      return null;
    } catch {
      return null;
    }
  };
}

export const authRateLimiter = createRateLimiter({
  maxRequests: 5,
  windowSeconds: 60,
  keyPrefix: "rl:auth",
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